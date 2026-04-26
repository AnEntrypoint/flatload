import { adminLayout } from '../layout.js'
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
      ? '<span class="chip accent">published</span>'
      : '<span class="chip dim">draft</span>'
  }
  if (!val && val !== 0) return '<span class="mono-dim">—</span>'
  if (col.includes('At') && typeof val === 'string') return escapeHtml(new Date(val).toLocaleDateString())
  if (col === 'filename' && doc.mimeType?.startsWith('image/')) {
    const safe = escapeHtml(val)
    return `<img src="/media/${encodeURIComponent(val)}?w=40&h=40" alt="" style="width:32px;height:32px;object-fit:cover;display:inline-block;margin-right:8px;vertical-align:middle;border-radius:4px" />${safe}`
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
  const headerCells = meta.columns.map(c => {
    const active = currentSort === c || currentSort === '-' + c
    const next = currentSort === c ? '-' + c : c
    const arrow = active ? (currentSort.startsWith('-') ? ' ↓' : ' ↑') : ''
    return `<th><a href="?sort=${encodeURIComponent(next)}${searchQs}">${escapeHtml(colLabel(c))}${arrow}</a></th>`
  }).join('')
  const headers = `<th style="width:32px"><input type="checkbox" id="select-all" onchange="document.querySelectorAll('.row-check').forEach(c=>{c.checked=this.checked});document.getElementById('bulk-bar').style.display=this.checked?'flex':'none'" /></th>${headerCells}`

  const rows = docs.map(doc => {
    const encId = encodeURIComponent(doc.id)
    const cells = meta.columns.map((col, i) => {
      const val = cellValue(doc, col)
      const content = i === 0
        ? `<a href="/admin/collections/${encCol}/${encId}" style="color:inherit;text-decoration:none;display:block">${val}</a>`
        : val
      return `<td>${content}</td>`
    }).join('')
    return `<tr><td><input type="checkbox" class="row-check" value="${escapeHtml(doc.id)}" onchange="var c=document.querySelectorAll('.row-check:checked').length;document.getElementById('bulk-bar').style.display=c?'flex':'none';document.getElementById('bulk-count').textContent=c" /></td>${cells}</tr>`
  }).join('')

  const emptyRow = !docs.length
    ? `<tr><td colspan="${meta.columns.length + 1}" style="text-align:center;padding:48px;color:var(--panel-text-3)">no ${safeLabel.toLowerCase()} found</td></tr>`
    : ''

  const pagination = totalPages > 1 ? `
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;">
  <span class="t-meta">${totalDocs} total</span>
  <div style="display:flex;gap:8px;align-items:center;">
    ${currentPage > 1 ? `<a href="?page=${currentPage - 1}${searchQs}${sortQs}" class="btn-ghost">← prev</a>` : ''}
    <span class="t-meta">page ${currentPage} of ${totalPages}</span>
    ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}${searchQs}${sortQs}" class="btn-ghost">next →</a>` : ''}
  </div>
</div>` : ''

  const body = `
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
  <div>
    <h1>${safeLabel.toLowerCase()}</h1>
    <p class="t-meta">${totalDocs} record${totalDocs === 1 ? '' : 's'}</p>
  </div>
  <a href="/admin/collections/${encCol}/create" class="btn-primary">+ new ${escapeHtml(meta.label.toLowerCase().replace(/s$/, ''))}</a>
</div>

<form method="get" style="display:flex;gap:8px;max-width:480px;margin:8px 0 16px 0;">
  <input name="search" value="${escapeHtml(search)}" placeholder="search…" class="input" style="flex:1" />
  <button type="submit" class="btn">search</button>
</form>

<div id="bulk-bar" style="display:none;align-items:center;gap:12px;padding:10px 14px;background:var(--panel-2);border-radius:8px;margin-bottom:12px">
  <span class="t-meta"><span id="bulk-count">0</span> selected</span>
  <button type="button" class="btn" data-bulk-delete data-collection="${encCol}" style="color:var(--warn)">delete selected</button>
</div>

<div class="panel">
  <div class="panel-head">
    <span>${safeLabel.toLowerCase()}</span>
    <span>${docs.length} of ${totalDocs}</span>
  </div>
  <div class="panel-body">
    <table class="kv" style="max-width:none;width:100%;margin:0;border-radius:0">
      <thead style="background:var(--panel-2)"><tr>${headers}</tr></thead>
      <tbody>${rows}${emptyRow}</tbody>
    </table>
  </div>
</div>
${pagination}`

  return adminLayout({
    title: meta.label,
    body,
    breadcrumb: `<a href="/admin">dashboard</a> <span class="sep">/</span> <span class="leaf">${safeLabel.toLowerCase()}</span>`,
    path: `/admin/collections/${collectionSlug}`,
  })
}
