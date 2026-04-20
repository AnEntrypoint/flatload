import { homePage } from './pages/home.js'
import { pagePage } from './pages/page.js'
import { postsPage } from './pages/posts.js'
import { postPage } from './pages/post.js'
import { searchPage } from './pages/search.js'
import { pagesSitemap, postsSitemap } from './pages/sitemap.js'
import { getHeader, getFooter } from '../utils/getGlobals.js'
import { renderLayout } from './layout.js'
import { checkRedirect } from '../utils/redirects.js'

const routes = [
  { pattern: new URLPattern({ pathname: '/' }),                         handler: (req) => homePage(req) },
  { pattern: new URLPattern({ pathname: '/posts' }),                    handler: (req) => postsPage(req) },
  { pattern: new URLPattern({ pathname: '/posts/page/:n' }),            handler: (req, m) => postsPage(req, { page: m.pathname.groups.n }) },
  { pattern: new URLPattern({ pathname: '/posts/:slug' }),              handler: (req, m) => postPage(req, m.pathname.groups) },
  { pattern: new URLPattern({ pathname: '/search' }),                   handler: (req) => searchPage(req) },
  { pattern: new URLPattern({ pathname: '/pages-sitemap.xml' }),        handler: () => pagesSitemap() },
  { pattern: new URLPattern({ pathname: '/posts-sitemap.xml' }),        handler: () => postsSitemap() },
  { pattern: new URLPattern({ pathname: '/:slug' }),                    handler: (req, m) => pagePage(req, m.pathname.groups) },
]

const notFoundHtml = (header, footer) => `
<div class="container py-24 text-center">
  <h1 class="text-6xl font-bold mb-4">404</h1>
  <p class="text-muted-foreground text-lg mb-8">This page could not be found.</p>
  <a href="/" class="bg-primary text-primary-foreground px-6 py-3 rounded hover:opacity-90">Go Home</a>
</div>`

export async function frontendRouter(req) {
  const url = new URL(req.url)

  for (const { pattern, handler } of routes) {
    const match = pattern.exec(url)
    if (match) {
      try {
        const result = await handler(req, match)
        if (result) return result
      } catch (err) {
        console.error('[router] Error handling', url.pathname, err)
        return new Response('Internal Server Error', { status: 500 })
      }
    }
  }

  const redirect = await checkRedirect(url.pathname)
  if (redirect) {
    return new Response(null, {
      status: redirect.statusCode || 301,
      headers: { Location: redirect.url },
    })
  }

  const [header, footer] = await Promise.all([getHeader(), getFooter()])
  return new Response(
    renderLayout({ title: '404 | Zero-Hop', body: notFoundHtml(), header, footer }),
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
