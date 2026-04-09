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
<a href="/admin/collections/${slug}" class="card bg-backgroundSecondary border border-border/30 hover:shadow-md transition-shadow">
  <div class="card-body">
    <p class="text-content2 text-sm">${label}</p>
    <p class="text-3xl font-bold mt-1 text-content1">${count}</p>
  </div>
</a>`).join('')

  const body = `
<div class="mb-6">
  <h1 class="text-2xl font-bold text-content1">Dashboard</h1>
</div>
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  ${cards}
</div>
<div class="mt-8 card bg-backgroundSecondary border border-border/30">
  <div class="card-body">
    <h2 class="font-semibold text-base mb-3 text-content1">Quick Links</h2>
    <div class="flex flex-wrap gap-2">
      <a href="/admin/collections/posts/create" class="btn btn-primary btn-sm">New Post</a>
      <a href="/admin/collections/pages/create" class="btn btn-outline btn-sm">New Page</a>
      <a href="/admin/globals/header" class="btn btn-outline btn-sm">Edit Header</a>
      <a href="/admin/globals/footer" class="btn btn-outline btn-sm">Edit Footer</a>
    </div>
  </div>
</div>`

  return adminLayout({ title: 'Dashboard', body, breadcrumb: '<a href="/admin" class="hover:text-content1">Dashboard</a>', path: '/admin' })
}
