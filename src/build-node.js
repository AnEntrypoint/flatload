import { mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, statSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { pathToFileURL } from 'url'
import { execSync } from 'child_process'
import yaml from 'js-yaml'
import { find, setContentDir } from './store/index.js'

const log = (...a) => console.log('[flatspace]', ...a)

function readFile(p) { return readFileSync(p, 'utf8') }
function writeFile(p, data) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, data) }
function copyIfExists(src, dest) {
  if (!existsSync(src)) return false
  mkdirSync(dirname(dest), { recursive: true })
  if (statSync(src).isDirectory()) cpSync(src, dest, { recursive: true })
  else cpSync(src, dest)
  return true
}

async function loadConfig(cwd) {
  const candidates = ['flatspace.config.mjs', 'flatspace.config.js']
  for (const name of candidates) {
    const p = join(cwd, name)
    if (existsSync(p)) {
      const mod = await import(pathToFileURL(p).href)
      return { ...(mod.default || mod), __path: p }
    }
  }
  return null
}

function runTailwind(input, output, cwd) {
  if (!existsSync(input)) { log('tailwind: no input at', input, '— skipping'); return false }
  try {
    execSync(`npx --yes @tailwindcss/cli@latest -i "${input}" -o "${output}" --minify`, {
      cwd, stdio: 'inherit', encoding: 'utf8',
    })
    return true
  } catch (e) {
    log('tailwind build failed:', e.message)
    return false
  }
}

function copyTheme(theme, outDir) {
  if (!theme) return
  const assets = theme.assets || {}
  for (const [src, dest] of Object.entries(assets)) {
    const absSrc = resolve(theme.__dir || '.', src)
    const absDest = join(outDir, dest.replace(/^\//, ''))
    const ok = copyIfExists(absSrc, absDest)
    log(ok ? 'asset' : 'skip', src, '→', dest)
  }
}

async function buildThemeMode(config) {
  const cwd = process.cwd()
  const outDir = resolve(config.outDir || 'docs')
  const contentDir = resolve(config.contentDir || 'content')
  setContentDir(contentDir)

  log('theme build')
  log('  content:', contentDir)
  log('  out:    ', outDir)
  mkdirSync(outDir, { recursive: true })

  let theme = null
  if (config.theme) {
    const themePath = resolve(config.theme)
    theme = await import(pathToFileURL(themePath).href)
    theme = theme.default || theme
    theme.__dir = dirname(themePath)
  }

  if (!theme || typeof theme.render !== 'function') {
    throw new Error('config.theme must resolve to a module exporting { render(ctx), assets? }')
  }

  copyTheme(theme, outDir)

  if (config.tailwind) {
    const input = resolve(config.tailwind.input)
    const output = resolve(outDir, config.tailwind.output.replace(/^\//, ''))
    runTailwind(input, output, cwd)
  }

  const ctx = {
    config,
    find,
    basePath: config.basePath || '',
    site: config.site || {},
    read: (collection, opts = {}) => find({ collection, ...opts }),
    readGlobal: (slug) => {
      const p = join(contentDir, 'globals', `${slug}.yaml`)
      if (!existsSync(p)) return null
      return yaml.load(readFile(p))
    },
    writeFile: (rel, data) => writeFile(join(outDir, rel), data),
  }

  const outputs = await theme.render(ctx)
  if (!Array.isArray(outputs)) throw new Error('theme.render must return Array<{path,html}>')
  for (const { path: rel, html } of outputs) {
    writeFile(join(outDir, rel), html)
    log('wrote', rel)
  }

  writeFile(join(outDir, '.nojekyll'), '')
  log('build complete →', outDir)
}

export async function buildCli(argv = []) {
  const cwd = process.cwd()
  const config = await loadConfig(cwd)
  if (config) return buildThemeMode(config)
  log('no flatspace.config found — falling back to legacy bun build')
  try {
    execSync('bun run src/build.js', { cwd, stdio: 'inherit' })
  } catch (e) {
    console.error('legacy build requires Bun. install Bun or provide flatspace.config.mjs.')
    process.exitCode = 1
  }
}
