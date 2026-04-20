import { adminLayout } from '../layout.js'
import { getCollectionBySlug } from '../registry.js'
import { payload } from '../../utils/getPayload.js'
import { escapeHtml, requireSlug } from '../../utils/safe.js'

const COLLECTION_META = {
  pages:      { label: 'Pages',      columns: ['title', 'slug', '_status', 'updatedAt'], defaultSort: '-updatedAt' },
  posts:      { label: 'Posts',      columns: ['title', 'slug', '_status', 'publishedAt', 'updatedAt'], defaultSort: '-updatedAt' },
  media:      { label: 'Media',      columns: ['filename', 'mimeType', 'updatedAt'], defaultSort: '-updatedAt' },
  categories: { label: 'Categories', columns: ['title', 'slug', 'updatedAt'], defaultSort: 'title' },
  forms:      { label: 'Forms',      columns: ['title', 'updatedAt'], defaultSort: '-updatedAt' },
  redirects:  { label: 'Redirects',  columns: ['from', 'to', 'updatedAt'], defaultSort: '-updatedAt' },
  search:     { label: 'Search',     columns: ['title', 'slug', 'updatedAt'], defaultSort: '-updatedAt' },
}

function colLabel(col) {
  if (col === '_status') return 'Status'
  return col.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

function cellValue(doc, col) {
  const val = doc[col]
  if (col === '_status') {
    const s = val || 'draft'
    return s === 'published'
      ? '<span class="badge badge-success text-xs">Published</span>'
      : '<span class="badge badge-outline text-xs text-content3">Draft</span>'
  }
  if (!val && val !== 0) return '<span class="text-content3">—</span>'
  if (col.includes('At') && typeof val === 'string') return escapeHtml(new Date(val).toLocaleDateString())
  if (col === 'filename' && doc.mimeType?.startsWith('image/')) {
    const safe = escapeHtml(val)
    return `<img src="/media/${encodeURIComponent(val)}?w=40&h=40" alt="" class="w-10 h-10 object-cover rounded inline-block mr-2" />${safe}`
  }
  if (Array.isArray(val)) return escapeHtml(val.map(v => typeof v === 'object' ? (v.title || v.name || v.email || v.id || '?') : v).join(', '))
  if (typeof val === 'object') return escapeHtml(val.title || val.name || val.email || val.id || JSON.stringify(val).slice(0, 40))
  return escapeHtml(String(val))
}

export async function listView(collectionSlug, { page = 1, search = '', sort = '' } = {}) {
  requireSlug(collectionSlug, 'collection')
  const meta = COLLECTION_META[collectionSlug] || { label: collectionSlug, columns: ['id', 'updatedAt'], defaultSort: '-updatedAt' }
  const LIMIT = 20

  const where = search
    ? { or: [{ title: { like: search } }, { filename: { like: search } }, { email: { like: search } }] }
    : {}

  const result = await payload.find({
    collection: collectionSlug, where, sort: sort || meta.defaultSort,
    limit: LIMIT, page: parseInt(page, 10), depth: 0,
  })

  const { docs, totalDocs, totalPages, page: currentPage } = result
  const encCol = encodeURIComponent(collectionSlug)
  const safeLabel = escapeHtml(meta.label)
  const searchQs = search ? '&search=' + encodeURIComponent(search) : ''
  const sortQs = sort ? '&sort=' + encodeURIComponent(sort) : ''

  const currentSort = sort || meta.defaultSort
  const headers = meta.columns.map(c => {
    const active = currentSort === c || currentSort === '-' + c
    const next = currentSort === c ? '-' + c : c
    const arrow = active ? (currentSort.startsWith('-') ? ' ↓' : ' ↑') : ''
    return `<th class="w-10 px-3 py-3"><input type="checkbox" class="checkbox checkbox-sm" id="select-all" onchange="document.querySelectorAll('.row-check').forEach(c=>{c.checked=this.checked});document.getElementById('bulk-bar').classList.toggle('hidden',!this.checked)" /></th><th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2"><a href="?sort=${encodeURIComponent(next)}${searchQs}" class="hover:text-content1${active ? ' text-primary' : ''}">${escapeHtml(colLabel(c))}${arrow}</a></th>`
  }).join('')

  const rows = docs.map(doc => {
    const encId = encodeURIComponent(doc.id)
    const cells = meta.columns.map((col, i) => {
      const val = cellValue(doc, col)
      const content = i === 0
        ? `<a href="/admin/collections/${encCol}/${encId}" class="block -mx-4 -my-3 px-4 py-3 hover:text-primary">${val}</a>`
        : val
      return `<td class="px-4 py-3 text-sm text-content1">${content}</td>`
    }).join('')
    return `<tr class="border-b border-border/20 hover:bg-backgroundSecondary transition-colors"><td class="w-10 px-3 py-3"><input type="checkbox" class="checkbox checkbox-sm row-check" value="${escapeHtml(doc.id)}" onchange="var c=document.querySelectorAll('.row-check:checked').length;document.getElementById('bulk-bar').classList.toggle('hidden',!c);document.getElementById('bulk-count').textContent=c" /></td>${cells}</tr>`
  }).join('')

  const emptyRow = !docs.length
    ? `<tr><td colspan="${meta.columns.length + 1}" class="px-4 py-10 text-center text-content3">No ${safeLabel} found</td></tr>`
    : ''

  const pagination = totalPages > 1 ? `
<div class="flex items-center justify-between mt-4 text-sm text-content2">
  <span>${totalDocs} total</span>
  <div class="flex gap-2 items-center">
    ${currentPage > 1 ? `<a href="?page=${currentPage - 1}${searchQs}${sortQs}" class="btn btn-outline btn-sm">&larr; Prev</a>` : ''}
    <span>Page ${currentPage} of ${totalPages}</span>
    ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}${searchQs}${sortQs}" class="btn btn-outline btn-sm">Next &rarr;</a>` : ''}
  </div>
</div>` : ''

  const body = `
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold text-content1">${safeLabel}</h1>
  <a href="/admin/collections/${encCol}/create" class="btn btn-primary btn-sm">+ New ${escapeHtml(meta.label.replace(/s$/, ''))}</a>
</div>
<form method="get" class="mb-4 flex gap-2 max-w-sm">
  <input name="search" value="${escapeHtml(search)}" placeholder="Search..." class="input input-solid input-sm flex-1" />
  <button type="submit" class="btn btn-outline btn-sm">Search</button>
</form>
<div id="bulk-bar" class="hidden flex items-center gap-3 mb-3 p-3 bg-backgroundSecondary border border-border/30 rounded">
  <span class="text-sm"><span id="bulk-count">0</span> selected</span>
  <button type="button" class="btn btn-error btn-sm" data-bulk-delete data-collection="${encCol}">Delete Selected</button>
</div>
<div class="card bg-backgroundSecondary border border-border/30 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead class="bg-backgroundPrimary"><tr>${headers}</tr></thead>
      <tbody>${rows}${emptyRow}</tbody>
    </table>
  </div>
</div>
${pagination}`

  return adminLayout({ title: meta.label, body, breadcrumb: `<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> ${safeLabel}`, path: `/admin/collections/${collectionSlug}` })
}
