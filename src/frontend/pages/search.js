import { payload } from '../../utils/getPayload.js'
import { getHeader, getFooter } from '../../utils/getGlobals.js'
import { renderLayout } from '../layout.js'
import { renderCard } from '../components/Card.js'

export async function searchPage(req) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''

  const [header, footer] = await Promise.all([getHeader(), getFooter()])

  let resultsHtml = ''
  let countHtml = ''

  if (q) {
    const result = await payload.find({
      collection: 'search',
      where: {
        or: [
          { title: { like: q } },
          { 'meta.title': { like: q } },
          { 'meta.description': { like: q } },
          { slug: { like: q } },
        ],
      },
      depth: 1,
      limit: 20,
    })

    const docs = result.docs || []
    countHtml = `<p class="text-muted-foreground text-sm mb-6">${docs.length} result${docs.length !== 1 ? 's' : ''} for &ldquo;${q}&rdquo;</p>`

    if (docs.length) {
      resultsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${
        docs.map((doc) => {
          return renderCard({
            slug: doc.slug,
            title: doc.meta?.title || doc.slug,
            meta: { description: doc.meta?.description },
            heroImage: doc.meta?.image,
            categories: doc.categories,
          })
        }).join('')
      }</div>`
    } else {
      resultsHtml = '<p class="text-muted-foreground">No results found.</p>'
    }
  }

  const body = `
<div class="container py-12">
  <h1 class="text-3xl font-bold mb-6">Search</h1>
  <form action="/search" method="get" class="mb-8">
    <div class="flex gap-2 max-w-xl">
      <input
        type="search"
        name="q"
        value="${q.replace(/"/g, '&quot;')}"
        placeholder="Search posts..."
        autofocus
        class="flex-1 border border-input rounded px-4 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="submit" class="bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90">Search</button>
    </div>
  </form>
  ${countHtml}
  ${resultsHtml}
</div>`

  return new Response(
    renderLayout({ title: q ? `Search: ${q} | Zero-Hop` : 'Search | Zero-Hop', body, header, footer }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
