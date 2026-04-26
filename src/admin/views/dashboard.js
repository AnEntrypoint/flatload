import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { getCollections } from '../registry.js'

export async function dashboardView() {
  const COLLECTIONS = getCollections().map(c => ({ slug: c.slug, label: c.labels?.plural || c.slug.charAt(0).toUpperCase() + c.slug.slice(1) }))
  const counts = await Promise.all(
    COLLECTIONS.map(async ({ slug, label }) => {
      try {
        const r = await payload.find({ collection: slug, limit: 0, depth: 0 })
        return { slug, label, count: r.totalDocs }
      } catch { return { slug, label, count: '—' } }
    }),
  )

  const cards = counts.map(({ slug, label, count }) => `
<a href="/admin/collections/${slug}" class="card-item">
  <span class="code">${String(count)}</span>
  <span class="name">${label}</span>
</a>`).join('')

  const body = `
<h1>dashboard</h1>
<p class="lede">flat-file CMS // yaml content // git as version history</p>

<h3>collections</h3>
<div class="cards">
  ${cards}
</div>

<h3>quick actions</h3>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 24px 0;">
  <a href="/admin/collections/posts/create" class="btn-primary">+ new post</a>
  <a href="/admin/collections/pages/create" class="btn">+ new page</a>
  <a href="/admin/globals/header" class="btn-ghost">edit header</a>
  <a href="/admin/globals/footer" class="btn-ghost">edit footer</a>
</div>`

  return adminLayout({
    title: 'dashboard',
    body,
    breadcrumb: '<span class="leaf">dashboard</span>',
    path: '/admin',
  })
}
