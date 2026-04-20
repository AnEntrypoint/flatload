import { homePage } from './frontend/pages/home.js'
import { pagePage } from './frontend/pages/page.js'
import { postsPage } from './frontend/pages/posts.js'
import { postPage } from './frontend/pages/post.js'
import { dashboardView } from './admin/views/dashboard.js'
import { listView } from './admin/views/list.js'
import { editView } from './admin/views/edit.js'
import { mediaView } from './admin/views/media.js'
import { find } from './store/index.js'
import { cp, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const BASE = '/flatspace'
const DOCS = path.resolve('docs')
const DEMO_USER = { email: 'demo@flatspace.dev', name: 'Demo' }
const ADMIN_COLLECTIONS = ['posts', 'pages', 'media', 'categories', 'forms', 'redirects']

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
    .replace(/src="\/media\/([^"?]+)([^"]*)"/g, (m, f) => `src="${prefix}media/${f}"`)
    .replace(/srcset="([^"]*)"/g, (m, ss) =>
      `srcset="${ss.replace(/\/media\/([^?\s"]+)[^,\s"]*/g, (_, f) => `${prefix}media/${f}`)}"`
    )
    .replace(/action="\/search"/g, `action="${BASE}/search"`)
}

function patchAdminHtml(html, cssDepth) {
  const cssPrefix = '../'.repeat(cssDepth)
  const banner = `<div style="background:#f59e0b;color:#1c1917;padding:0.4rem 1rem;font-size:0.8rem;font-weight:600;text-align:center;">Read-only preview — <a href="https://github.com/AnEntrypoint/flatspace" style="text-decoration:underline;">run locally</a> to edit content</div>`
  return html
    .replace(/src="\/media\/([^"]+)"/g, (m, raw) => {
      const [pathPart] = raw.split('?')
      const decoded = decodeURIComponent(pathPart)
      if (/^https?:\/\//i.test(decoded)) return `src="${decoded}"`
      return `src="${cssPrefix}media/${raw}"`
    })
    .replace('href="/app.css"', `href="${cssPrefix}app.css"`)
    .replace(/<script[^>]*src="\/admin\/client\.js"[^>]*><\/script>/, '')
    .replace(/\s+onclick="[^"]*"/g, '')
    .replace(/<a\s[^>]*href="[^"]*\/(create|edit|logout)[^"]*"[^>]*>[^<]*<\/a>/g, '')
    .replace(/href="\/admin\/collections\/([^"]+)"/g, (m, slug) => `href="${BASE}/admin/collections/${slug}/"`)
    .replace(/href="\/admin((?:\/[^"]*)?)"(?!.*collections)/g, (m, p) => `href="${BASE}/admin${p || ''}/"`)
    .replace(/href="\/" target="_blank"/g, `href="${BASE}/" target="_blank"`)
    .replace(/<li[^>]*><a href="[^"]*\/globals\/[^"]*"[^>]*>[^<]*<\/a><\/li>/g, '')
    .replace(/<li[^>]*><a href="[^"]*\/collections\/(forms|redirects|search)\/"[^>]*>[^<]*<\/a><\/li>/g, '')
    .replace(/<li><span class="menu-title[^"]*"[^>]*>Globals<\/span><\/li>\s*/g, '')
    .replace(/<li><span class="menu-title[^"]*"[^>]*>Plugins<\/span><\/li>\s*/g, '')
    .replace(/<a[^>]*href="[^"]*\/(globals|forms|redirects)[^"]*"[^>]*>[^<]*<\/a>\s*/g, '')
    .replace(/<main([^>]*)>/, `<main$1>\n  ${banner}`)
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

async function buildStaticAdmin() {
  await mkdir(path.join(DOCS, 'admin'), { recursive: true })
  const dashboard = await dashboardView()
  await Bun.write(path.join(DOCS, 'admin', 'index.html'), patchAdminHtml(dashboard, 1))
  console.log('wrote admin/')

  await Promise.all(
    ADMIN_COLLECTIONS.map(async (slug) => {
      try {
        await mkdir(path.join(DOCS, 'admin', 'collections', slug), { recursive: true })
        const html = slug === 'media' ? await mediaView() : await listView(slug)
        await Bun.write(path.join(DOCS, 'admin', 'collections', slug, 'index.html'), patchAdminHtml(html, 3))
        console.log('wrote admin/collections/' + slug)

        const result = find({ collection: slug, limit: 100 })
        await Promise.all(result.docs.map(async (doc) => {
          try {
            await mkdir(path.join(DOCS, 'admin', 'collections', slug, doc.id), { recursive: true })
            const itemHtml = await editView(slug, doc.id)
            await Bun.write(path.join(DOCS, 'admin', 'collections', slug, doc.id, 'index.html'), patchAdminHtml(itemHtml, 4))
            console.log('wrote admin/collections/' + slug + '/' + doc.id)
          } catch (e) { console.error('admin item error', slug, doc.id, e.message) }
        }))
      } catch (e) { console.error('admin list error', slug, e.message) }
    })
  )
}

async function main() {
  await mkdir(DOCS, { recursive: true })
  await mkdir(path.join(DOCS, 'posts'), { recursive: true })
  await mkdir(path.join(DOCS, 'media'), { recursive: true })

  const pages = await Promise.allSettled([
    renderToHtml(homePage(makeReq('/')), 0).then(h => h && writePage('', h)),
    renderToHtml(postsPage(makeReq('/posts')), 1).then(h => h && writePage('posts', h)),
    renderToHtml(pagePage(makeReq('/contact'), { slug: 'contact' }), 1).then(h => h && writePage('contact', h)),
    buildStaticAdmin(),
  ])

  for (const r of pages) {
    if (r.status === 'rejected') console.error('page error:', r.reason)
  }

  const posts = find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: 100 })

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
