import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'

const COLLECTION_META = {
  pages:      { label: 'Pages',      columns: ['title', 'slug', 'updatedAt'], defaultSort: '-updatedAt' },
  posts:      { label: 'Posts',      columns: ['title', 'slug', 'publishedAt', 'updatedAt'], defaultSort: '-updatedAt' },
  media:      { label: 'Media',      columns: ['filename', 'mimeType', 'updatedAt'], defaultSort: '-updatedAt' },
  categories: { label: 'Categories', columns: ['title', 'slug', 'updatedAt'], defaultSort: 'title' },
  users:      { label: 'Users',      columns: ['name', 'email', 'updatedAt'], defaultSort: '-updatedAt' },
  forms:      { label: 'Forms',      columns: ['title', 'updatedAt'], defaultSort: '-updatedAt' },
  redirects:  { label: 'Redirects',  columns: ['from', 'to', 'updatedAt'], defaultSort: '-updatedAt' },
  search:     { label: 'Search',     columns: ['title', 'slug', 'updatedAt'], defaultSort: '-updatedAt' },
}

function cellValue(doc, col) {
  const val = doc[col]
  if (!val && val !== 0) return '<span class="text-muted-foreground">—</span>'
  if (col.includes('At') && typeof val === 'string') {
    return new Date(val).toLocaleDateString()
  }
  if (col === 'filename' && doc.mimeType?.startsWith('image/')) {
    return `<img src="/media/${val}?w=40&h=40" alt="" class="w-10 h-10 object-cover rounded inline-block mr-2" />${val}`
  }
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 50)
  return String(val)
}

export async function listView(collectionSlug, user, { page = 1, search = '' } = {}) {
  const meta = COLLECTION_META[collectionSlug] || { label: collectionSlug, columns: ['id', 'updatedAt'], defaultSort: '-updatedAt' }
  const LIMIT = 20

  const where = search
    ? { or: [{ title: { like: search } }, { filename: { like: search } }, { email: { like: search } }] }
    : {}

  const result = await payload.find({
    collection: collectionSlug,
    where,
    sort: meta.defaultSort,
    limit: LIMIT,
    page: parseInt(page, 10),
    depth: 0,
  })

  const { docs, totalDocs, totalPages, page: currentPage } = result

  const headers = meta.columns.map((c) => `<th class="table-head px-3 py-2 text-left text-xs font-medium uppercase tracking-wide">${c}</th>`).join('')

  const rows = docs.map((doc) => {
    const cells = meta.columns.map((col) => `<td class="table-cell px-3 py-2 text-sm">${cellValue(doc, col)}</td>`).join('')
    return `<tr class="table-row hover:bg-muted/50 cursor-pointer" onclick="location.href='/admin/collections/${collectionSlug}/${doc.id}'">${cells}</tr>`
  }).join('')

  const emptyRow = !docs.length ? `<tr><td colspan="${meta.columns.length}" class="table-cell px-3 py-8 text-center text-muted-foreground">No ${meta.label} found</td></tr>` : ''

  const pagination = totalPages > 1 ? `
<div class="flex items-center justify-between mt-4 text-sm">
  <span class="text-muted-foreground">${totalDocs} total</span>
  <div class="flex gap-2">
    ${currentPage > 1 ? `<a href="?page=${currentPage - 1}${search ? `&search=${search}` : ''}" class="btn btn-ghost btn-sm">&larr; Prev</a>` : ''}
    <span class="px-3 py-1">Page ${currentPage} of ${totalPages}</span>
    ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}${search ? `&search=${search}` : ''}" class="btn btn-ghost btn-sm">Next &rarr;</a>` : ''}
  </div>
</div>` : ''

  const body = `
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">${meta.label}</h1>
  <a href="/admin/collections/${collectionSlug}/create" class="btn btn-primary btn-sm">+ New ${meta.label.replace(/s$/, '')}</a>
</div>
<form method="get" class="mb-4 flex gap-2 max-w-sm">
  <input name="search" value="${search}" placeholder="Search..." class="input input-solid flex-1" />
  <button type="submit" class="btn btn-ghost btn-sm">Search</button>
</form>
<div class="card bg-card border border-border">
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead class="table-header"><tr>${headers}</tr></thead>
      <tbody>${rows}${emptyRow}</tbody>
    </table>
  </div>
</div>
${pagination}`

  return adminLayout({ title: meta.label, body, user, breadcrumb: meta.label })
}
