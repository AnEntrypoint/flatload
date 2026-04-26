import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { escapeHtml } from '../../utils/safe.js'

export async function mediaView({ page = 1, search = '' } = {}) {
  const LIMIT = 24
  const where = search ? { filename: { like: search } } : {}

  const result = await payload.find({
    collection: 'media',
    where,
    sort: '-updatedAt',
    limit: LIMIT,
    page: parseInt(page, 10),
    depth: 0,
  })

  const { docs, totalDocs, totalPages, page: currentPage } = result

  const cards = docs.map(doc => {
    const isImage = doc.mimeType?.startsWith('image/')
    const fn = escapeHtml(doc.filename)
    const thumb = isImage
      ? `<img src="/media/${encodeURIComponent(doc.filename)}?preset=thumbnail" alt="${escapeHtml(doc.alt || doc.filename)}" loading="lazy" style="width:100%;height:120px;object-fit:cover;display:block" />`
      : `<div style="width:100%;height:120px;display:flex;align-items:center;justify-content:center;background:var(--panel-2);font-family:var(--ff-mono);font-size:11px;color:var(--panel-text-2)">${escapeHtml(doc.mimeType || 'file')}</div>`
    return `<a href="/admin/collections/media/${encodeURIComponent(doc.id)}" class="card-item" style="grid-template-columns:1fr;padding:0;overflow:hidden">
      ${thumb}
      <div style="padding:8px 10px">
        <div class="name" style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${fn}</div>
        <div class="t-meta">${escapeHtml(doc.mimeType || '—')}</div>
      </div>
    </a>`
  }).join('')

  const empty = !docs.length
    ? `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--panel-text-3)">no media found</div>`
    : ''

  const pagination = totalPages > 1 ? `
<div style="display:flex;align-items:center;justify-content:space-between;margin-top:16px;">
  <span class="t-meta">${totalDocs} files</span>
  <div style="display:flex;gap:8px;align-items:center">
    ${currentPage > 1 ? `<a href="?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ''}" class="btn-ghost">← prev</a>` : ''}
    <span class="t-meta">page ${currentPage} of ${totalPages}</span>
    ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ''}" class="btn-ghost">next →</a>` : ''}
  </div>
</div>` : ''

  const body = `
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap">
  <div>
    <h1>media</h1>
    <p class="t-meta">${totalDocs} file${totalDocs === 1 ? '' : 's'}</p>
  </div>
  <a href="/admin/collections/media/upload" class="btn-primary">+ upload</a>
</div>

<form method="get" style="display:flex;gap:8px;max-width:480px;margin-bottom:16px">
  <input name="search" value="${escapeHtml(search)}" placeholder="search files…" class="input" style="flex:1" />
  <button type="submit" class="btn">search</button>
</form>

<div class="cards" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">
  ${cards}${empty}
</div>
${pagination}`

  return adminLayout({
    title: 'media',
    body,
    breadcrumb: `<a href="/admin">dashboard</a> <span class="sep">/</span> <span class="leaf">media</span>`,
    path: '/admin/collections/media',
  })
}

export function mediaUploadView() {
  const body = `
<div style="margin-bottom:16px">
  <a href="/admin/collections/media" class="t-meta" style="text-decoration:none">← media</a>
  <h1 style="margin-top:4px">upload media</h1>
</div>

<div class="panel" style="max-width:560px">
  <div class="panel-head">new file</div>
  <div class="panel-body" style="padding:16px">
    <form method="POST" action="/admin/collections/media/upload" enctype="multipart/form-data">
      <div class="form-group">
        <label class="form-label" for="file">file</label>
        <input id="file" name="file" type="file" accept="image/*,video/*,application/pdf" required class="input" />
      </div>
      <div class="form-group">
        <label class="form-label" for="alt">alt text</label>
        <input id="alt" name="alt" type="text" placeholder="describe the image…" class="input" />
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button type="submit" class="btn-primary">upload</button>
        <a href="/admin/collections/media" class="btn-ghost">cancel</a>
      </div>
    </form>
  </div>
</div>`

  return adminLayout({
    title: 'upload media',
    body,
    breadcrumb: `<a href="/admin">dashboard</a> <span class="sep">/</span> <a href="/admin/collections/media">media</a> <span class="sep">/</span> <span class="leaf">upload</span>`,
    path: '/admin/collections/media',
  })
}
