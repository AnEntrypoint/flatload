import { homePage } from './frontend/pages/home.js'
import { pagePage } from './frontend/pages/page.js'
import { postsPage } from './frontend/pages/posts.js'
import { postPage } from './frontend/pages/post.js'
import { find } from './store/index.js'
import { cp, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const BASE = '/flatload'
const DOCS = path.resolve('docs')

function makeReq(url) {
  return new Request(`http://localhost:3000${url}`)
}

function rewritePaths(html, depth) {
  const prefix = '../'.repeat(depth) || './'
  return html
    .replace(/href="\/app\.css"/g, `href="${prefix}app.css"`)
    .replace(/src="\/client\.js"/g, `src="${prefix}client.js"`)
    .replace(/href="\/([^"]*)"/g, (m, p) => {
      if (p.startsWith('http') || p.startsWith('//') || p.startsWith('#')) return m
      return `href="${BASE}/${p || ''}"`
    })
    .replace(/src="\/media\/([^"?]+)([^"]*)"/g, (m, f, q) => `src="${prefix}media/${f}"`)
    .replace(/srcset="([^"]*)"/g, (m, ss) =>
      `srcset="${ss.replace(/\/media\/([^?\s"]+)[^,\s"]*/g, (_, f) => `${prefix}media/${f}`)}"`
    )
    .replace(/action="\/search"/g, `action="${BASE}/search"`)
}

async function writePage(relPath, html) {
  const outPath = path.join(DOCS, relPath, 'index.html')
  await Bun.write(outPath, html)
  console.log('wrote', relPath || '/')
}

async function renderToHtml(responseProm, depth) {
  const res = await responseProm
  if (!res) return null
  const html = await res.text()
  return rewritePaths(html, depth)
}

async function copyDir(src, dest) {
  if (!existsSync(src)) return
  await mkdir(dest, { recursive: true })
  await cp(src, dest, { recursive: true })
}

async function main() {
  await mkdir(DOCS, { recursive: true })
  await mkdir(path.join(DOCS, 'posts'), { recursive: true })
  await mkdir(path.join(DOCS, 'media'), { recursive: true })

  const pages = await Promise.allSettled([
    renderToHtml(homePage(makeReq('/')), 0).then(h => h && writePage('', h)),
    renderToHtml(postsPage(makeReq('/posts')), 1).then(h => h && writePage('posts', h)),
    renderToHtml(pagePage(makeReq('/contact'), { slug: 'contact' }), 1).then(h => h && writePage('contact', h)),
    renderToHtml(pagePage(makeReq('/search'), { slug: null }).catch(() => null), 1),
  ])

  for (const r of pages) {
    if (r.status === 'rejected') console.error('page error:', r.reason)
  }

  const posts = find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 100,
  })

  await Promise.all(
    posts.docs.map(async (post) => {
      await mkdir(path.join(DOCS, 'posts', post.slug), { recursive: true })
      const html = await renderToHtml(postPage(makeReq(`/posts/${post.slug}`), { slug: post.slug }), 2)
      if (html) await writePage(`posts/${post.slug}`, html)
    })
  )

  await copyDir('public/media', path.join(DOCS, 'media'))

  if (existsSync('public/app.css')) await Bun.write(path.join(DOCS, 'app.css'), Bun.file('public/app.css'))
  if (existsSync('public/client.js')) await Bun.write(path.join(DOCS, 'client.js'), Bun.file('public/client.js'))

  await Bun.write(path.join(DOCS, '.nojekyll'), '')

  console.log('build complete →', DOCS)
}

main().catch(e => { console.error(e); process.exit(1) })
