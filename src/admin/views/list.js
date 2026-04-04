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
  if (!val && val !== 0) return '<span class="text-content3">—</span>'
  if (col.includes('At') && typeof val === 'string') return new Date(val).toLocaleDateString()
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
    collection: collectionSlug, where, sort: meta.defaultSort,
    limit: LIMIT, page: parseInt(page, 10), depth: 0,
  })

  const { docs, totalDocs, totalPages, page: currentPage } = result

  const headers = meta.columns.map(c =>
    `<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">${c}</th>`
  ).join('')

  const rows = docs.map(doc => {
    const cells = meta.columns.map((col, i) => {
      const val = cellValue(doc, col)
      const content = i === 0
        ? `<a href="/admin/collections/${collectionSlug}/${doc.id}" class="block -mx-4 -my-3 px-4 py-3 hover:text-primary">${val}</a>`
        : val
      return `<td class="px-4 py-3 text-sm text-content1">${content}</td>`
    }).join('')
    return `<tr class="border-b border-border/20 hover:bg-backgroundSecondary transition-colors">${cells}</tr>`
  }).join('')

  const emptyRow = !docs.length
    ? `<tr><td colspan="${meta.columns.length}" class="px-4 py-10 text-center text-content3">No ${meta.label} found</td></tr>`
    : ''

  const pagination = totalPages > 1 ? `
<div class="flex items-center justify-between mt-4 text-sm text-content2">
  <span>${totalDocs} total</span>
  <div class="flex gap-2 items-center">
    ${currentPage > 1 ? `<a href="?page=${currentPage - 1}${search ? `&search=${search}` : ''}" class="btn btn-outline btn-sm">&larr; Prev</a>` : ''}
    <span>Page ${currentPage} of ${totalPages}</span>
    ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}${search ? `&search=${search}` : ''}" class="btn btn-outline btn-sm">Next &rarr;</a>` : ''}
  </div>
</div>` : ''

  const body = `
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-content1">${meta.label}</h1>
  <a href="/admin/collections/${collectionSlug}/create" class="btn btn-primary btn-sm">+ New ${meta.label.replace(/s$/, '')}</a>
</div>
<form method="get" class="mb-4 flex gap-2 max-w-sm">
  <input name="search" value="${search}" placeholder="Search..." class="input input-solid input-sm flex-1" />
  <button type="submit" class="btn btn-outline btn-sm">Search</button>
</form>
<div class="card bg-backgroundSecondary border border-border/30 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead class="bg-backgroundPrimary"><tr>${headers}</tr></thead>
      <tbody>${rows}${emptyRow}</tbody>
    </table>
  </div>
</div>
${pagination}`

  return adminLayout({ title: meta.label, body, user, breadcrumb: meta.label })
}
