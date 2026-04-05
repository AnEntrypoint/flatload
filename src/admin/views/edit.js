import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { renderField, renderTextField } from '../fields.js'

export { renderField }

const COLLECTION_FIELDS = {
  pages:      () => import('../../payload/collections/Pages.js').then(m => m.Pages.fields),
  posts:      () => import('../../payload/collections/Posts.js').then(m => m.Posts.fields),
  media:      () => import('../../payload/collections/Media.js').then(m => m.Media.fields),
  categories: () => import('../../payload/collections/Categories.js').then(m => m.Categories.fields),
  users:      () => import('../../payload/collections/Users.js').then(m => m.Users.fields),
  forms:      () => import('../../payload/collections/Forms.js').then(m => m.Forms.fields),
  redirects:  () => import('../../payload/collections/Redirects.js').then(m => m.Redirects.fields),
  search:     () => Promise.resolve([{ name: 'title', type: 'text', label: 'Title' }, { name: 'slug', type: 'text', label: 'Slug' }]),
}

async function getFieldsHtml(collectionSlug, doc) {
  const getFields = COLLECTION_FIELDS[collectionSlug]
  if (!getFields) throw new Error('no schema')
  const fields = await getFields()
  return fields.map(f => renderField(f, doc[f.name])).join('')
}

function fallbackFieldsHtml(doc) {
  return Object.entries(doc)
    .filter(([k]) => !['id', 'createdAt', 'updatedAt', '__v'].includes(k))
    .map(([k, v]) => renderTextField({ name: k, label: k }, typeof v === 'object' ? JSON.stringify(v, null, 2) : v))
    .join('')
}

function statusSelect(current) {
  return `<div class="form-group"><label class="form-label">Status</label><select name="_status" class="select select-solid"><option value="draft" ${current === 'draft' ? 'selected' : ''}>Draft</option><option value="published" ${current === 'published' ? 'selected' : ''}>Published</option></select></div>`
}

export async function editView(collectionSlug, id, user) {
  const doc = await payload.findByID({ collection: collectionSlug, id, depth: 1 })
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)
  let fieldsHtml
  try { fieldsHtml = await getFieldsHtml(collectionSlug, doc) } catch { fieldsHtml = fallbackFieldsHtml(doc) }

  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const metaSection = `<div class="text-xs text-muted-foreground mt-4 pt-4 border-t border-border space-y-1"><div>ID: <span class="font-mono">${doc.id}</span></div><div>Created: ${doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}</div><div>Updated: ${doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '—'}</div></div>`

  const body = `
<div class="flex items-center justify-between mb-6">
  <div>
    <a href="/admin/collections/${collectionSlug}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${collectionSlug}</a>
    <h1 class="text-2xl font-bold mt-1">${doc.title || doc.filename || doc.email || doc.name || 'Edit ' + label}</h1>
  </div>
  <div class="flex gap-2">
    ${hasVersions ? `<a href="/admin/collections/${collectionSlug}/${id}/versions" class="btn btn-ghost btn-sm">Versions</a>` : ''}
    <button form="edit-form" type="submit" class="btn btn-primary btn-sm">Save</button>
  </div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <form id="edit-form" method="POST" action="/admin/collections/${collectionSlug}/${id}" class="lg:col-span-2 space-y-4">
    ${fieldsHtml}
    <button type="submit" class="btn btn-primary">Save Changes</button>
  </form>
  <aside class="space-y-4">
    <div class="card bg-card border border-border">
      <div class="card-body gap-3">
        <h3 class="font-medium text-sm">Document</h3>
        ${hasVersions ? statusSelect(doc._status) : ''}
        ${metaSection}
        <div class="flex flex-col gap-2 mt-4">
          <button form="edit-form" type="submit" class="btn btn-primary btn-sm btn-block">Save</button>
          ${doc.slug ? `<a href="/${doc.slug}" target="_blank" class="btn btn-ghost btn-sm btn-block">View ↗</a>` : ''}
          <button type="button" onclick="if(confirm('Delete?')) fetch('/admin/api/collections/${collectionSlug}/${id}',{method:'DELETE'}).then(()=>location.href='/admin/collections/${collectionSlug}')" class="btn btn-ghost btn-sm btn-block text-error">Delete</button>
        </div>
      </div>
    </div>
    ${hasVersions ? `<div class="card bg-card border border-border"><div class="card-body"><h3 class="font-medium text-sm mb-2">Live Preview</h3><a href="/${doc.slug||''}" target="preview-frame" class="btn btn-ghost btn-sm btn-block">Open Preview ↗</a></div></div>` : ''}
  </aside>
</div>`

  return adminLayout({ title: doc.title || doc.filename || 'Edit ' + label, body, user, breadcrumb: collectionSlug + ' / edit', path: '/admin/collections/' + collectionSlug })
}

export async function createView(collectionSlug, user) {
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)
  let fieldsHtml
  try { fieldsHtml = await getFieldsHtml(collectionSlug, {}) } catch { fieldsHtml = renderTextField({ name: 'title', label: 'Title' }, '') }

  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const body = `
<div class="flex items-center justify-between mb-6">
  <div>
    <a href="/admin/collections/${collectionSlug}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${collectionSlug}</a>
    <h1 class="text-2xl font-bold mt-1">New ${label}</h1>
  </div>
  <button form="create-form" type="submit" class="btn btn-primary btn-sm">Create</button>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <form id="create-form" method="POST" action="/admin/collections/${collectionSlug}/create" class="lg:col-span-2 space-y-4">
    ${fieldsHtml}
    <button type="submit" class="btn btn-primary">Create ${label}</button>
  </form>
  <aside>
    <div class="card bg-card border border-border">
      <div class="card-body gap-3">
        <h3 class="font-medium text-sm">Document</h3>
        ${hasVersions ? statusSelect('draft') : ''}
        <button form="create-form" type="submit" class="btn btn-primary btn-sm btn-block mt-4">Create</button>
      </div>
    </div>
  </aside>
</div>`

  return adminLayout({ title: 'New ' + label, body, user, breadcrumb: collectionSlug + ' / new', path: '/admin/collections/' + collectionSlug })
}
