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
  return `<div class="form-group"><label class="form-label">status</label><select name="_status" class="input"><option value="draft" ${current === 'draft' ? 'selected' : ''}>draft</option><option value="published" ${current === 'published' ? 'selected' : ''}>published</option></select></div>`
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
  const heading = doc.title || doc.filename || doc.email || doc.name || 'edit ' + label
  const safeHeading = escapeHtml(heading)
  const safeLabel = escapeHtml(label.toLowerCase())
  const safeCol = escapeHtml(collectionSlug)
  const safeId = escapeHtml(doc.id)

  const metaTable = `
<table class="kv">
  <tr><td>id</td><td><code>${safeId}</code></td></tr>
  <tr><td>created</td><td>${escapeHtml(doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—')}</td></tr>
  <tr><td>updated</td><td>${escapeHtml(doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '—')}</td></tr>
</table>`

  const body = `
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap">
  <div>
    <a href="/admin/collections/${encCol}" class="t-meta" style="text-decoration:none">← ${safeCol}</a>
    <h1 style="margin-top:4px">${safeHeading}</h1>
  </div>
  <div style="display:flex;gap:8px">
    ${hasVersions ? `<a href="/admin/collections/${encCol}/${encId}/versions" class="btn">versions</a>` : ''}
    <button form="edit-form" type="submit" class="btn-primary">save</button>
  </div>
</div>

<div style="display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:24px;align-items:start">
  <form id="edit-form" method="POST" action="/admin/collections/${encCol}/${encId}" data-collection="${safeCol}">
    ${fieldsHtml}
    <div style="margin-top:24px;display:flex;gap:8px">
      <button type="submit" class="btn-primary">save changes</button>
    </div>
  </form>

  <aside style="display:flex;flex-direction:column;gap:12px;position:sticky;top:64px">
    <div class="panel">
      <div class="panel-head">document</div>
      <div class="panel-body" style="padding:14px">
        ${hasVersions ? statusSelect(doc._status) : ''}
        ${metaTable}
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:12px">
          ${hasVersions ? `<button form="edit-form" type="submit" name="_action" value="draft" class="btn">save draft</button>
          <button form="edit-form" type="submit" name="_action" value="publish" class="btn-primary">publish</button>` : ''}
          ${doc.slug ? `<a href="/${encodeURIComponent(doc.slug)}" target="_blank" class="btn-ghost">view ↗</a>` : ''}
          <button type="button" data-delete-doc data-collection="${encCol}" data-id="${encId}" class="btn-ghost" style="color:var(--warn)">delete</button>
        </div>
      </div>
    </div>
  </aside>
</div>`

  return adminLayout({
    title: heading,
    body,
    breadcrumb: `<a href="/admin">dashboard</a> <span class="sep">/</span> <a href="/admin/collections/${encCol}">${safeLabel}</a> <span class="sep">/</span> <span class="leaf">${safeHeading}</span>`,
    path: '/admin/collections/' + collectionSlug,
  })
}

export async function createView(collectionSlug) {
  requireSlug(collectionSlug, 'collection')
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)
  let fieldsHtml
  try { fieldsHtml = await getFieldsHtml(collectionSlug, {}) } catch { fieldsHtml = renderTextField({ name: 'title', label: 'Title' }, '') }
  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const encCol = encodeURIComponent(collectionSlug)
  const safeLabel = escapeHtml(label.toLowerCase())
  const safeCol = escapeHtml(collectionSlug)
  const body = `
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap">
  <div>
    <a href="/admin/collections/${encCol}" class="t-meta" style="text-decoration:none">← ${safeCol}</a>
    <h1 style="margin-top:4px">new ${safeLabel}</h1>
  </div>
  <button form="create-form" type="submit" class="btn-primary">create</button>
</div>

<div style="display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:24px;align-items:start">
  <form id="create-form" method="POST" action="/admin/collections/${encCol}/create" data-collection="${safeCol}">
    ${fieldsHtml}
    <div style="margin-top:24px"><button type="submit" class="btn-primary">create ${safeLabel}</button></div>
  </form>
  <aside>
    <div class="panel">
      <div class="panel-head">new document</div>
      <div class="panel-body" style="padding:14px">
        ${hasVersions ? statusSelect('draft') : ''}
        <button form="create-form" type="submit" class="btn-primary" style="width:100%;margin-top:8px;justify-content:center">create</button>
      </div>
    </div>
  </aside>
</div>`
  return adminLayout({
    title: 'new ' + label,
    body,
    breadcrumb: `<a href="/admin">dashboard</a> <span class="sep">/</span> <a href="/admin/collections/${encCol}">${safeLabel}</a> <span class="sep">/</span> <span class="leaf">new</span>`,
    path: '/admin/collections/' + collectionSlug,
  })
}
