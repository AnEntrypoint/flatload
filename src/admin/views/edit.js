import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'

// Field renderers: each returns an HTML string
function fieldLabel(field) {
  return field.label || field.name?.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) || field.name
}

function renderTextField(field, value = '', prefix = '') {
  const name = `${prefix}${field.name}`
  const val = String(value ?? '')
  if (field.textarea || field.type === 'textarea') {
    return `<div class="form-group">
      <label class="form-label" for="${name}">${fieldLabel(field)}</label>
      <textarea id="${name}" name="${name}" class="input input-solid input-block h-32 resize-y">${val.replace(/</g, '&lt;')}</textarea>
    </div>`
  }
  return `<div class="form-group">
    <label class="form-label" for="${name}">${fieldLabel(field)}</label>
    <input id="${name}" name="${name}" type="text" value="${val.replace(/"/g, '&quot;')}" class="input input-solid input-block" />
  </div>`
}

function renderNumberField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="form-group">
    <label class="form-label" for="${name}">${fieldLabel(field)}</label>
    <input id="${name}" name="${name}" type="number" value="${value ?? ''}" class="input input-solid" />
  </div>`
}

function renderEmailField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="form-group">
    <label class="form-label" for="${name}">${fieldLabel(field)}</label>
    <input id="${name}" name="${name}" type="email" value="${String(value ?? '').replace(/"/g, '&quot;')}" class="input input-solid input-block" />
  </div>`
}

function renderPasswordField(field, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="form-group">
    <label class="form-label" for="${name}">${fieldLabel(field)} <span class="text-muted-foreground text-xs">(leave blank to keep current)</span></label>
    <input id="${name}" name="${name}" type="password" autocomplete="new-password" class="input input-solid input-block" />
  </div>`
}

function renderCheckboxField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const checked = value ? 'checked' : ''
  return `<div class="form-group flex items-center gap-3">
    <input id="${name}" name="${name}" type="checkbox" value="true" ${checked} class="checkbox" />
    <label class="form-label mb-0" for="${name}">${fieldLabel(field)}</label>
  </div>`
}

function renderSelectField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const options = (field.options || []).map(opt => {
    const v = typeof opt === 'string' ? opt : opt.value
    const l = typeof opt === 'string' ? opt : (opt.label || opt.value)
    const sel = String(value) === v ? 'selected' : ''
    return `<option value="${v}" ${sel}>${l}</option>`
  }).join('')
  return `<div class="form-group">
    <label class="form-label" for="${name}">${fieldLabel(field)}</label>
    <select id="${name}" name="${name}" class="select select-solid input-block">
      <option value="">— Select —</option>
      ${options}
    </select>
  </div>`
}

function renderDateField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const val = value ? new Date(value).toISOString().slice(0, 16) : ''
  return `<div class="form-group">
    <label class="form-label" for="${name}">${fieldLabel(field)}</label>
    <input id="${name}" name="${name}" type="datetime-local" value="${val}" class="input input-solid" />
  </div>`
}

function renderUploadField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const preview = value?.filename
    ? `<img src="/media/${value.filename}?preset=thumbnail" alt="" class="w-20 h-20 object-cover rounded mb-2" /><div class="text-sm">${value.filename}</div>`
    : '<div class="text-muted-foreground text-sm">No file selected</div>'
  return `<div class="form-group">
    <label class="form-label">${fieldLabel(field)}</label>
    <div class="p-3 border border-border rounded mb-2">${preview}</div>
    <input name="${name}" type="hidden" value="${value?.id || ''}" />
    <a href="/admin/collections/media" class="btn btn-ghost btn-sm" target="_blank">Browse Media</a>
  </div>`
}

function renderRelationshipField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const current = Array.isArray(value) ? value : (value ? [value] : [])
  const labels = current.map(v => {
    const id = typeof v === 'object' ? v.id : v
    const label = typeof v === 'object' ? (v.title || v.name || v.filename || v.email || id) : id
    return `<span class="badge badge-outline mr-1">${label} <button type="button" data-remove-rel="${name}" data-id="${id}" class="ml-1 text-muted-foreground hover:text-error">×</button></span>`
  }).join('')
  const multiple = field.hasMany ? `multiple` : ''
  const collections = Array.isArray(field.relationTo) ? field.relationTo.join(',') : (field.relationTo || '')
  return `<div class="form-group" data-rel-field="${name}">
    <label class="form-label">${fieldLabel(field)}</label>
    <div class="mb-2">${labels || '<span class="text-muted-foreground text-sm">None</span>'}</div>
    <input name="${name}" type="hidden" value="${current.map(v => typeof v === 'object' ? v.id : v).join(',')}" />
    <button type="button" class="btn btn-ghost btn-sm" onclick="adminOpenRelPicker('${name}','${collections}',${field.hasMany ? 'true' : 'false'})">+ Add ${fieldLabel(field)}</button>
  </div>`
}

function renderRichTextField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const json = JSON.stringify(value || { root: { children: [], type: 'root', version: 1 } })
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  return `<div class="form-group">
    <label class="form-label">${fieldLabel(field)}</label>
    <div id="${name}-editor" class="border border-border rounded min-h-48 p-3 prose max-w-none" contenteditable="true" data-richtext="${name}"></div>
    <input type="hidden" name="${name}" id="${name}-value" value='${json.replace(/'/g, "&#39;")}' />
    <script>
    (function(){
      var el=document.getElementById('${name}-editor');
      var inp=document.getElementById('${name}-value');
      var data=${json};
      if(el&&data?.root?.children){
        el.textContent=data.root.children.map(function(n){return n.children?.map(function(c){return c.text||''}).join('')||''}).join('\\n\\n');
      }
      if(el) el.addEventListener('input',function(){
        inp.value=JSON.stringify({root:{type:'root',version:1,children:[{type:'paragraph',version:1,children:[{type:'text',version:1,text:el.textContent,format:0}]}]}});
      });
    })();
    </script>
  </div>`
}

function renderGroupField(field, value, prefix = '') {
  const fields = (field.fields || []).map(f => renderField(f, (value || {})[f.name], `${prefix}${field.name}.`)).join('')
  return `<fieldset class="border border-border rounded p-4 mb-4">
    <legend class="text-sm font-medium px-2">${fieldLabel(field)}</legend>
    ${fields}
  </fieldset>`
}

function renderArrayField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const items = Array.isArray(value) ? value : []
  const rowsHtml = items.map((item, i) => {
    const fieldsHtml = (field.fields || []).map(f => renderField(f, item[f.name], `${name}[${i}].`)).join('')
    return `<div class="border border-border rounded p-3 mb-2" data-array-row>
      <div class="flex justify-end mb-2"><button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-array-row]').remove()">Remove</button></div>
      ${fieldsHtml}
    </div>`
  }).join('')

  const templateFields = (field.fields || []).map(f => renderField(f, '', `${name}[__IDX__].`)).join('')

  return `<div class="form-group" data-array-field="${name}">
    <label class="form-label">${fieldLabel(field)}</label>
    <div data-array-rows>${rowsHtml}</div>
    <button type="button" class="btn btn-ghost btn-sm mt-2" onclick="adminAddArrayRow('${name}')">+ Add Row</button>
    <template data-array-template="${name}">${templateFields}</template>
  </div>`
}

function renderTabsField(field, value, prefix = '') {
  const tabs = field.tabs || []
  if (!tabs.length) return ''
  const tabBtns = tabs.map((tab, i) =>
    `<button type="button" role="tab" class="px-4 py-2 text-sm border-b-2 ${i === 0 ? 'border-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}" data-tab="${i}" onclick="adminSwitchTab(this,${i})">${tab.label || `Tab ${i + 1}`}</button>`
  ).join('')
  const tabPanels = tabs.map((tab, i) => {
    const fields = (tab.fields || []).map(f => renderField(f, (value || {})[f.name], prefix)).join('')
    return `<div role="tabpanel" data-panel="${i}" class="${i === 0 ? '' : 'hidden'}">${fields}</div>`
  }).join('')
  return `<div class="mb-4">
    <div class="flex border-b border-border mb-4">${tabBtns}</div>
    ${tabPanels}
  </div>`
}

function renderRowField(field, value, prefix = '') {
  const fields = (field.fields || []).map(f => renderField(f, (value || {})[f.name], prefix)).join('')
  return `<div class="flex gap-4 flex-wrap">${fields}</div>`
}

function renderCollapsibleField(field, value, prefix = '') {
  const fields = (field.fields || []).map(f => renderField(f, (value || {})[f.name], prefix)).join('')
  return `<details class="border border-border rounded mb-4">
    <summary class="px-4 py-2 cursor-pointer font-medium text-sm">${fieldLabel(field)}</summary>
    <div class="p-4">${fields}</div>
  </details>`
}

function renderField(field, value, prefix = '') {
  if (field.admin?.hidden) return ''
  switch (field.type) {
    case 'text':        return renderTextField(field, value, prefix)
    case 'textarea':    return renderTextField({ ...field, textarea: true }, value, prefix)
    case 'number':      return renderNumberField(field, value, prefix)
    case 'email':       return renderEmailField(field, value, prefix)
    case 'password':    return renderPasswordField(field, prefix)
    case 'checkbox':    return renderCheckboxField(field, value, prefix)
    case 'select':      return renderSelectField(field, value, prefix)
    case 'date':        return renderDateField(field, value, prefix)
    case 'upload':      return renderUploadField(field, value, prefix)
    case 'relationship':return renderRelationshipField(field, value, prefix)
    case 'richText':    return renderRichTextField(field, value, prefix)
    case 'group':       return renderGroupField(field, value, prefix)
    case 'array':       return renderArrayField(field, value, prefix)
    case 'tabs':        return renderTabsField(field, value, prefix)
    case 'row':         return renderRowField(field, value, prefix)
    case 'collapsible': return renderCollapsibleField(field, value, prefix)
    case 'blocks':      return renderBlocksField(field, value, prefix)
    case 'ui':          return '' // decorative only
    default:            return renderTextField(field, value, prefix)
  }
}

function renderBlocksField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const items = Array.isArray(value) ? value : []
  const blockTypes = (field.blocks || [])
  const blockOptions = blockTypes.map(b => `<option value="${b.slug}">${b.labels?.singular || b.slug}</option>`).join('')

  const rowsHtml = items.map((item, i) => {
    const blockDef = blockTypes.find(b => b.slug === item.blockType)
    const fieldsHtml = blockDef
      ? (blockDef.fields || []).map(f => renderField(f, item[f.name], `${name}[${i}].`)).join('')
      : `<pre class="text-xs">${JSON.stringify(item, null, 2).slice(0, 200)}</pre>`
    return `<div class="border border-border rounded p-3 mb-2" data-block-row>
      <div class="flex items-center justify-between mb-3">
        <span class="badge badge-outline">${item.blockType || 'block'}</span>
        <button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-block-row]').remove()">Remove</button>
      </div>
      <input type="hidden" name="${name}[${i}].blockType" value="${item.blockType || ''}" />
      ${fieldsHtml}
    </div>`
  }).join('')

  return `<div class="form-group" data-blocks-field="${name}">
    <label class="form-label">${fieldLabel(field)}</label>
    <div data-block-rows>${rowsHtml}</div>
    <div class="flex gap-2 mt-2">
      <select id="${name}-block-type" class="select select-solid">${blockOptions}</select>
      <button type="button" class="btn btn-ghost btn-sm" onclick="adminAddBlock('${name}',document.getElementById('${name}-block-type').value)">+ Add Block</button>
    </div>
  </div>`
}

// Load collection config fields by slug
const COLLECTION_FIELDS = {
  pages:      () => import('../../payload/collections/Pages.js').then(m => m.Pages.fields),
  posts:      () => import('../../payload/collections/Posts.js').then(m => m.Posts.fields),
  media:      () => import('../../payload/collections/Media.js').then(m => m.Media.fields),
  categories: () => import('../../payload/collections/Categories.js').then(m => m.Categories.fields),
  users:      () => import('../../payload/collections/Users.js').then(m => m.Users.fields),
  forms:      () => Promise.resolve([{ name: 'title', type: 'text', label: 'Title' }]),
  redirects:  () => Promise.resolve([{ name: 'from', type: 'text' }, { name: 'to', type: 'text' }]),
  search:     () => Promise.resolve([{ name: 'title', type: 'text' }, { name: 'slug', type: 'text' }]),
}

export async function editView(collectionSlug, id, user) {
  const doc = await payload.findByID({ collection: collectionSlug, id, depth: 1 })
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)

  let fieldsHtml = ''
  try {
    const getFields = COLLECTION_FIELDS[collectionSlug]
    if (getFields) {
      const fields = await getFields()
      fieldsHtml = fields.map(f => renderField(f, doc[f.name])).join('')
    }
  } catch {
    fieldsHtml = Object.entries(doc)
      .filter(([k]) => !['id', 'createdAt', 'updatedAt', '__v'].includes(k))
      .map(([k, v]) => renderField({ name: k, type: typeof v === 'object' ? 'textarea' : 'text', label: k }, typeof v === 'object' ? JSON.stringify(v, null, 2) : v))
      .join('')
  }

  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const statusField = hasVersions ? `
  <div class="form-group">
    <label class="form-label">Status</label>
    <select name="_status" class="select select-solid">
      <option value="draft" ${doc._status === 'draft' ? 'selected' : ''}>Draft</option>
      <option value="published" ${doc._status === 'published' ? 'selected' : ''}>Published</option>
    </select>
  </div>` : ''

  const metaSection = `
  <div class="text-xs text-muted-foreground mt-4 pt-4 border-t border-border space-y-1">
    <div>ID: <span class="font-mono">${doc.id}</span></div>
    <div>Created: ${doc.createdAt ? new Date(doc.createdAt).toLocaleString() : '—'}</div>
    <div>Updated: ${doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '—'}</div>
  </div>`

  const body = `
<div class="flex items-center justify-between mb-6">
  <div>
    <a href="/admin/collections/${collectionSlug}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${collectionSlug}</a>
    <h1 class="text-2xl font-bold mt-1">${doc.title || doc.filename || doc.email || doc.name || `Edit ${label}`}</h1>
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
        ${statusField}
        ${metaSection}
        <div class="flex flex-col gap-2 mt-4">
          <button form="edit-form" type="submit" class="btn btn-primary btn-sm btn-block">Save</button>
          ${doc.slug ? `<a href="/${doc.slug}" target="_blank" class="btn btn-ghost btn-sm btn-block">View ↗</a>` : ''}
          <button type="button" onclick="if(confirm('Delete this document?')) fetch('/admin/api/collections/${collectionSlug}/${id}',{method:'DELETE'}).then(()=>location.href='/admin/collections/${collectionSlug}')" class="btn btn-ghost btn-sm btn-block text-error">Delete</button>
        </div>
      </div>
    </div>
    ${hasVersions ? `<div class="card bg-card border border-border"><div class="card-body"><h3 class="font-medium text-sm mb-2">Live Preview</h3><a href="/${doc.slug || ''}" target="preview-frame" class="btn btn-ghost btn-sm btn-block">Open Preview ↗</a></div></div>` : ''}
  </aside>
</div>`

  return adminLayout({ title: doc.title || doc.filename || `Edit ${label}`, body, user, breadcrumb: `${collectionSlug} / edit` })
}

export async function createView(collectionSlug, user) {
  const label = collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1, -1)

  let fieldsHtml = ''
  try {
    const getFields = COLLECTION_FIELDS[collectionSlug]
    if (getFields) {
      const fields = await getFields()
      fieldsHtml = fields.map(f => renderField(f, '')).join('')
    }
  } catch {
    fieldsHtml = renderTextField({ name: 'title', type: 'text', label: 'Title' }, '')
  }

  const hasVersions = ['pages', 'posts'].includes(collectionSlug)
  const statusField = hasVersions ? `
  <div class="form-group">
    <label class="form-label">Status</label>
    <select name="_status" class="select select-solid">
      <option value="draft">Draft</option>
      <option value="published">Published</option>
    </select>
  </div>` : ''

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
        ${statusField}
        <button form="create-form" type="submit" class="btn btn-primary btn-sm btn-block mt-4">Create</button>
      </div>
    </div>
  </aside>
</div>`

  return adminLayout({ title: `New ${label}`, body, user, breadcrumb: `${collectionSlug} / new` })
}
