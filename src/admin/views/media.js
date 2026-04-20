import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'

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
    const thumb = isImage
      ? `<img src="/media/${doc.filename}?preset=thumbnail" alt="${doc.alt || doc.filename}" class="w-full h-32 object-cover" loading="lazy" />`
      : `<div class="w-full h-32 flex items-center justify-center bg-muted text-muted-foreground text-xs">${doc.mimeType || 'file'}</div>`
    return `<a href="/admin/collections/media/${doc.id}" class="card bg-card border border-border hover:shadow-md transition-shadow overflow-hidden">
      ${thumb}
      <div class="p-2">
        <div class="text-xs truncate">${doc.filename}</div>
        <div class="text-xs text-muted-foreground">${doc.mimeType || '—'}</div>
      </div>
    </a>`
  }).join('')

  const empty = !docs.length
    ? `<div class="col-span-full text-center py-12 text-muted-foreground">No media found</div>`
    : ''

  const pagination = totalPages > 1 ? `
<div class="flex items-center justify-between mt-4 text-sm">
  <span class="text-muted-foreground">${totalDocs} files</span>
  <div class="flex gap-2">
    ${currentPage > 1 ? `<a href="?page=${currentPage - 1}${search ? `&search=${search}` : ''}" class="btn btn-ghost btn-sm">&larr; Prev</a>` : ''}
    <span class="px-3 py-1">Page ${currentPage} of ${totalPages}</span>
    ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}${search ? `&search=${search}` : ''}" class="btn btn-ghost btn-sm">Next &rarr;</a>` : ''}
  </div>
</div>` : ''

  const body = `
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">Media</h1>
  <a href="/admin/collections/media/upload" class="btn btn-primary btn-sm">+ Upload</a>
</div>
<form method="get" class="mb-4 flex gap-2 max-w-sm">
  <input name="search" value="${search}" placeholder="Search files..." class="input input-solid flex-1" />
  <button type="submit" class="btn btn-ghost btn-sm">Search</button>
</form>
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
  ${cards}${empty}
</div>
${pagination}`

  return adminLayout({ title: 'Media', body, breadcrumb: '<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> Media', path: '/admin/collections/media' })
}

export function mediaUploadView() {
  const body = `
<div class="flex items-center justify-between mb-6">
  <div>
    <a href="/admin/collections/media" class="text-sm text-muted-foreground hover:text-foreground">&larr; Media</a>
    <h1 class="text-2xl font-bold mt-1">Upload Media</h1>
  </div>
</div>
<div class="max-w-lg">
  <form method="POST" action="/admin/collections/media/upload" enctype="multipart/form-data" class="card bg-card border border-border">
    <div class="card-body gap-4">
      <div class="form-group">
        <label class="form-label" for="file">File</label>
        <input id="file" name="file" type="file" accept="image/*,video/*,application/pdf" required class="input input-solid input-block" />
      </div>
      <div class="form-group">
        <label class="form-label" for="alt">Alt Text</label>
        <input id="alt" name="alt" type="text" placeholder="Describe the image..." class="input input-solid input-block" />
      </div>
      <div class="flex gap-3">
        <button type="submit" class="btn btn-primary">Upload</button>
        <a href="/admin/collections/media" class="btn btn-ghost">Cancel</a>
      </div>
    </div>
  </form>
</div>`

  return adminLayout({ title: 'Upload Media', body, breadcrumb: '<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> <a href="/admin/collections/media" class="hover:text-content1">Media</a> <span class="text-content3">/</span> Upload', path: '/admin/collections/media' })
}
