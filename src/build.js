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

function buildAdminShowcase() {
  const themeInit = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin — Flatload</title>
  <link rel="stylesheet" href="../app.css" />
  <script>${themeInit}</script>
</head>
<body class="bg-background text-foreground min-h-screen flex flex-col">
  <header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
    <div class="container flex h-16 items-center justify-between">
      <a href="${BASE}/" class="font-bold text-xl tracking-tight text-primary">Flatload</a>
      <nav class="flex items-center gap-6">
        <a href="${BASE}/posts" class="text-sm font-medium hover:text-primary transition-colors">Posts</a>
        <a href="${BASE}/contact" class="text-sm font-medium hover:text-primary transition-colors">Contact</a>
      </nav>
    </div>
  </header>
  <main class="flex-1 container py-16 max-w-2xl">
    <div class="mb-8">
      <span class="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">Admin Panel</span>
      <h1 class="text-4xl font-bold mt-4 mb-3">Flatload Admin</h1>
      <p class="text-muted-foreground text-lg">The admin panel runs locally and lets you manage all content through a clean UI — no database required.</p>
    </div>
    <div class="bg-card border border-border rounded-xl p-6 mb-6">
      <h2 class="text-lg font-semibold mb-1">Run locally to edit content</h2>
      <p class="text-muted-foreground text-sm mb-4">All data is stored as YAML files in <code class="bg-muted px-1 rounded text-xs">content/</code>. Run the dev server to access the full admin UI.</p>
      <pre class="bg-muted rounded-lg px-4 py-3 text-sm overflow-x-auto"><code>git clone https://github.com/AnEntrypoint/flatload
cd flatload
bun install
bun run --hot src/server.js</code></pre>
      <p class="text-xs text-muted-foreground mt-3">Then open <strong>http://localhost:3000/admin</strong></p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-2xl mb-2">📝</div>
        <h3 class="font-semibold mb-1">Posts</h3>
        <p class="text-sm text-muted-foreground">Create, edit and publish posts with a rich-text editor and media uploads.</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-2xl mb-2">📄</div>
        <h3 class="font-semibold mb-1">Pages</h3>
        <p class="text-sm text-muted-foreground">Build pages with hero sections and flexible content blocks.</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-2xl mb-2">🖼️</div>
        <h3 class="font-semibold mb-1">Media</h3>
        <p class="text-sm text-muted-foreground">Upload and manage images served directly from the flat-file store.</p>
      </div>
      <div class="bg-card border border-border rounded-lg p-4">
        <div class="text-2xl mb-2">⚙️</div>
        <h3 class="font-semibold mb-1">Globals</h3>
        <p class="text-sm text-muted-foreground">Edit site-wide settings like header nav and footer links.</p>
      </div>
    </div>
  </main>
  <footer class="border-t border-border mt-auto bg-background">
    <div class="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <p class="text-sm text-muted-foreground">&copy; ${new Date().getFullYear()} Flatload</p>
      <a href="https://github.com/AnEntrypoint/flatload" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Source Code</a>
    </div>
  </footer>
  <script type="module" src="../client.js"></script>
</body>
</html>`
}

async function main() {
  await mkdir(DOCS, { recursive: true })
  await mkdir(path.join(DOCS, 'posts'), { recursive: true })
  await mkdir(path.join(DOCS, 'media'), { recursive: true })
  await mkdir(path.join(DOCS, 'admin'), { recursive: true })

  const pages = await Promise.allSettled([
    renderToHtml(homePage(makeReq('/')), 0).then(h => h && writePage('', h)),
    renderToHtml(postsPage(makeReq('/posts')), 1).then(h => h && writePage('posts', h)),
    renderToHtml(pagePage(makeReq('/contact'), { slug: 'contact' }), 1).then(h => h && writePage('contact', h)),
    Bun.write(path.join(DOCS, 'admin', 'index.html'), buildAdminShowcase()).then(() => console.log('wrote admin')),
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
