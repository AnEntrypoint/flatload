import { adminLayout } from '../layout.js'
import { getCollectionBySlug } from '../registry.js'
import { payload } from '../../utils/getPayload.js'
import { renderField, renderTextField } from '../fields.js'
import { escapeHtml, requireSlug, requireId } from '../../utils/safe.js'

export { renderField }

function getFieldsForCollection(slug) {
  const col = getCollectionBySlug(slug)
  return col?.fields || [{ name: 'title', type: 'text', label: 'Title' }, { name: 'slug', type: 'text', label: 'Slug' }]
}

const COMPUTED_FIELDS = new Set(['populatedAuthors', 'populatedDocs', 'hash', 'salt', '__v'])

async function resolveDocDepth1(collectionSlug, doc) {
  if (!doc) return doc
  const resolved = { ...doc }
  const fields = getFieldsForCollection(collectionSlug)
  if (!fields.length) return resolved
  await Promise.all(fields.map(async field => {
    const val = resolved[field.name]
    if (!val) return
    if (field.type === 'upload' && typeof val === 'string') {
      try {
        const media = payload.findByID({ collection: field.relationTo || 'media', id: val })
        if (media) resolved[field.name] = media
      } catch (err) { console.error("edit field resolve error:", err.message) }
    } else if (field.type === 'relationship') {
      const col = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo
      if (!col) return
      const ids = Array.isArray(val) ? val.filter(v => typeof v === 'string') : (typeof val === 'string' ? [val] : [])
      if (!ids.length) return
      const docs = ids.map(id => { try { return payload.findByID({ collection: col, id }) || { id } } catch { return { id } } })
      const byId = Object.fromEntries(docs.filter(Boolean).map(d => [d.id, d]))
      const origArr = Array.isArray(val) ? val : [val]
      resolved[field.name] = field.hasMany ? origArr.map(v => (typeof v === 'string' ? (byId[v] || { id: v }) : v)) : (origArr.map(v => (typeof v === 'string' ? (byId[v] || { id: v }) : v))[0])
    }
  }))
  return resolved
}

async function getFieldsHtml(collectionSlug, doc) {
  const fields = getFieldsForCollection(collectionSlug)
  if (!fields.length) throw new Error('no schema')
  return fields.map(f => renderField(f, doc[f.name])).join('')
}

function fallbackFieldsHtml(doc) {
  return Object.entries(doc)
    .filter(([k]) => !['id', 'createdAt', 'updatedAt', '__v'].includes(k) && !COMPUTED_FIELDS.has(k))
    .map(([k, v]) => typeof v === 'object' && v !== null
      ? renderTextField({ name: k, label: k, textarea: true }, JSON.stringify(v, null, 2))
      : renderTextField({ name: k, label: k }, v))
    .join('')
}

function statusSelect(current) {
  return `<div class="form-group"><label class="form-label">Status</label><select name="_status" class="select select-solid"><option value="draft" ${current === 'draft' ? 'selected' : ''}>Draft</option><option value="published" ${current === 'published' ? 'selected' : ''}>Published</option></select></div>`
}

function findBlocksField(fields, name) {
  for (const f of fields) {
    if (f.name === name && f.type === 'blocks') return f
    const sub = f.fields ? findBlocksField(f.fields, name) : null
    if (sub) return sub
    if (f.tabs) { for (const t of f.tabs) { const s2 = findBlocksField(t.fields || [], name); if (s2) return s2 } }
  }
  return null
}

export async function blockTemplateHtml(collectionSlug, fieldName, blockType, idx) {
  requireSlug(collectionSlug, 'collection')
  const fields = getFieldsForCollection(collectionSlug)
  if (!fields.length) return ''
  const blocksField = findBlocksField(fields, fieldName)
  if (!blocksField) return ''
  const block = (blocksField.blocks || []).find(b => b.slug === blockType)
  if (!block) return ''
  const prefix = `${fieldName}[${idx}].`
  return (block.fields || []).map(f => renderField(f, '', prefix)).join('')
}

export async function editView(collectionSlug, id) {
  requireSlug(collectionSlug, 'collection')
  requireId(id, 'id')
  const rawDoc = await payload.findByID({ collection: collectionSlug, id, depth: 1 })
  const doc = await resolveDocDepth1(collectionSlug, rawDoc)
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)
  let fieldsHtml
  try { fieldsHtml = await getFieldsHtml(collectionSlug, doc) } catch { fieldsHtml = fallbackFieldsHtml(doc) }
  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const encCol = encodeURIComponent(collectionSlug)
  const encId = encodeURIComponent(id)
  const heading = doc.title || doc.filename || doc.email || doc.name || 'Edit ' + label
  const safeHeading = escapeHtml(heading)
  const safeLabel = escapeHtml(label)
  const safeCol = escapeHtml(collectionSlug)
  const safeId = escapeHtml(doc.id)
  const metaSection = `<div class="text-xs text-muted-foreground mt-4 pt-4 border-t border-border space-y-1"><div>ID: <span class="font-mono">${safeId}</span></div><div>Created: ${escapeHtml(doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—')}</div><div>Updated: ${escapeHtml(doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '—')}</div></div>`
  let body = `
<div class="flex items-center justify-between mb-6">
  <div><a href="/admin/collections/${encCol}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${safeCol}</a><h1 class="text-2xl font-bold mt-1">${safeHeading}</h1></div>
  <div class="flex gap-2">${hasVersions ? `<a href="/admin/collections/${encCol}/${encId}/versions" class="btn btn-ghost btn-sm">Versions</a>` : ''}<button form="edit-form" type="submit" class="btn btn-primary btn-sm">Save</button></div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <form id="edit-form" method="POST" action="/admin/collections/${encCol}/${encId}" data-collection="${safeCol}" class="lg:col-span-2 space-y-4">
    ${fieldsHtml}
    <button type="submit" class="btn btn-primary">Save Changes</button>
  </form>
  <aside class="space-y-4">
    <div class="card bg-card border border-border"><div class="card-body gap-3">
      <h3 class="font-medium text-sm">Document</h3>
      ${hasVersions ? statusSelect(doc._status) : ''}
      ${metaSection}
      <div class="flex flex-col gap-2 mt-4">
        <button type="button" id="toggle-preview" class="btn btn-ghost btn-sm btn-block mb-2">Preview ↗</button>
         <button form="edit-form" type="submit" name="_action" value="draft" class="btn btn-outline btn-sm btn-block">Save Draft</button>
         <button form="edit-form" type="submit" name="_action" value="publish" class="btn btn-primary btn-sm btn-block">Publish</button>
        ${doc.slug ? `<a href="/${encodeURIComponent(doc.slug)}" target="_blank" class="btn btn-ghost btn-sm btn-block">View ↗</a>` : ''}
        <button type="button" data-delete-doc data-collection="${encCol}" data-id="${encId}" class="btn btn-ghost btn-sm btn-block text-error">Delete</button>
      </div>
    </div></div>
    ${hasVersions ? `<div class="card bg-card border border-border"><div class="card-body"><h3 class="font-medium text-sm mb-2">Live Preview</h3><a href="/${encodeURIComponent(doc.slug||'')}" target="preview-frame" class="btn btn-ghost btn-sm btn-block">Open Preview ↗</a></div></div>` : ''}
  </aside>
</div>`
  body += '<div class="hidden lg:w-1/2"><iframe id="preview-frame" class="w-full h-full border-l border-border" style="min-height:80vh"></iframe></div>'
  return adminLayout({ title: heading, body, breadcrumb: `<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> <a href="/admin/collections/${encCol}" class="hover:text-content1">${safeLabel}</a> <span class="text-content3">/</span> ${safeHeading}`, path: '/admin/collections/' + collectionSlug })
}

export async function createView(collectionSlug) {
  requireSlug(collectionSlug, 'collection')
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)
  let fieldsHtml
  try { fieldsHtml = await getFieldsHtml(collectionSlug, {}) } catch { fieldsHtml = renderTextField({ name: 'title', label: 'Title' }, '') }
  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const encCol = encodeURIComponent(collectionSlug)
  const safeLabel = escapeHtml(label)
  const safeCol = escapeHtml(collectionSlug)
  const body = `
<div class="flex items-center justify-between mb-6">
  <div><a href="/admin/collections/${encCol}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${safeCol}</a><h1 class="text-2xl font-bold mt-1">New ${safeLabel}</h1></div>
  <button form="create-form" type="submit" class="btn btn-primary btn-sm">Create</button>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <form id="create-form" method="POST" action="/admin/collections/${encCol}/create" data-collection="${safeCol}" class="lg:col-span-2 space-y-4">
    ${fieldsHtml}
    <button type="submit" class="btn btn-primary">Create ${safeLabel}</button>
  </form>
  <aside><div class="card bg-card border border-border"><div class="card-body gap-3">
    <h3 class="font-medium text-sm">Document</h3>
    ${hasVersions ? statusSelect('draft') : ''}
    <button form="create-form" type="submit" class="btn btn-primary btn-sm btn-block mt-4">Create</button>
  </div></div></aside>
</div>`
  return adminLayout({ title: 'New ' + label, body, breadcrumb: `<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> <a href="/admin/collections/${encCol}" class="hover:text-content1">${safeLabel}</a> <span class="text-content3">/</span> New`, path: '/admin/collections/' + collectionSlug })
}
