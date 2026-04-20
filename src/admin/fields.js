export function fieldLabel(field) {
  return field.label || field.name?.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()) || field.name
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function lexicalToHtml(node) {
  if (!node) return ''
  if (node.type === 'text') {
    let t = escapeHtml(node.text || '')
    if (node.format & 1) t = `<strong>${t}</strong>`
    if (node.format & 2) t = `<em>${t}</em>`
    if (node.format & 8) t = `<u>${t}</u>`
    if (node.format & 16) t = `<s>${t}</s>`
    if (node.format & 32) t = `<code>${t}</code>`
    return t
  }
  const children = (node.children || []).map(lexicalToHtml).join('')
  switch (node.type) {
    case 'root':      return children
    case 'paragraph': return `<p class="mb-2">${children || '<br>'}</p>`
    case 'heading':   return `<${node.tag} class="font-bold mb-2">${children}</${node.tag}>`
    case 'list':      return node.listType === 'number' ? `<ol class="list-decimal ml-4 mb-2">${children}</ol>` : `<ul class="list-disc ml-4 mb-2">${children}</ul>`
    case 'listitem':  return `<li>${children}</li>`
    case 'link':      return `<a href="${escapeHtml(node.url || '')}" class="underline text-primary">${children}</a>`
    case 'quote':     return `<blockquote class="border-l-4 border-border pl-4 italic mb-2">${children}</blockquote>`
    case 'code':      return `<pre class="bg-muted p-2 rounded text-sm mb-2"><code>${children}</code></pre>`
    default:          return children
  }
}

export function renderTextField(field, value = '', prefix = '') {
  const name = `${prefix}${field.name}`
  const val = String(value ?? '')
  if (field.textarea || field.type === 'textarea') {
    return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)}</label><textarea id="${name}" name="${name}" class="input input-solid input-block h-32 resize-y">${val.replace(/</g, '&lt;')}</textarea></div>`
  }
  return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)}</label><input id="${name}" name="${name}" type="text" value="${val.replace(/"/g, '&quot;')}" class="input input-solid input-block" ${field.admin?.readOnly ? 'readonly' : ''} /></div>`
}

function renderNumberField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)}</label><input id="${name}" name="${name}" type="number" value="${value ?? ''}" class="input input-solid" ${field.admin?.readOnly ? 'readonly' : ''} /></div>`
}

function renderEmailField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)}</label><input id="${name}" name="${name}" type="email" value="${String(value ?? '').replace(/"/g, '&quot;')}" class="input input-solid input-block" /></div>`
}

function renderPasswordField(field, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)} <span class="text-xs text-muted-foreground">(leave blank to keep)</span></label><input id="${name}" name="${name}" type="password" autocomplete="new-password" class="input input-solid input-block" /></div>`
}

function renderCheckboxField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  return `<div class="my-4" style="display:flex;flex-direction:row;align-items:center;gap:0.75rem"><input type="hidden" name="${name}" value="false" /><input id="${name}" name="${name}" type="checkbox" value="true" ${value ? 'checked' : ''} class="checkbox" style="width:1.125rem;height:1.125rem" /><label for="${name}" style="margin:0;font-size:0.875rem;cursor:pointer">${fieldLabel(field)}</label></div>`
}

function renderSelectField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const opts = (field.options || []).map(o => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : (o.label || o.value); return `<option value="${v}" ${String(value) === v ? 'selected' : ''}>${l}</option>` }).join('')
  return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)}</label><select id="${name}" name="${name}" class="select select-solid input-block"><option value="">— Select —</option>${opts}</select></div>`
}

function renderDateField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const val = value ? new Date(value).toISOString().slice(0, 16) : ''
  return `<div class="form-group"><label class="form-label" for="${name}">${fieldLabel(field)}</label><input id="${name}" name="${name}" type="datetime-local" value="${val}" class="input input-solid" /></div>`
}

function renderUploadField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const id = typeof value === 'object' ? value?.id : value
  const filename = value?.filename
  const preview = filename
    ? `<img src="/media/${filename}?preset=thumbnail" alt="" class="w-20 h-20 object-cover rounded mb-2" /><div class="text-sm">${filename}</div>`
    : id ? `<div class="text-sm text-content2">ID: ${id}</div>` : '<div class="text-sm text-content3">No file selected</div>'
  const esc = name.replace(/'/g, "\\'")
  return `<div class="form-group" data-upload-field="${name}"><label class="form-label">${fieldLabel(field)}</label><div class="p-3 border border-border rounded mb-2" id="${name}-preview">${preview}</div><input name="${name}" type="hidden" id="${name}-upload-id" value="${id || ''}" /><div class="flex gap-2"><button type="button" class="btn btn-ghost btn-sm" data-media-picker="${name}">Choose</button>${id ? `<button type="button" class="btn btn-ghost btn-sm text-error" data-clear-upload="${name}">Clear</button>` : ''}</div></div>`
}

function renderRelationshipField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const current = Array.isArray(value) ? value : (value ? [value] : [])
  const labels = current.map(v => { const id = typeof v === 'object' ? v.id : v; const l = typeof v === 'object' ? (v.title || v.name || v.filename || v.email || id) : id; return `<span class="badge badge-outline mr-1">${l} <button type="button" data-remove-rel="${name}" data-id="${id}" class="ml-1 hover:text-error">&times;</button></span>` }).join('')
  const cols = Array.isArray(field.relationTo) ? field.relationTo.join(',') : (field.relationTo || '')
  return `<div class="form-group" data-rel-field="${name}"><label class="form-label">${fieldLabel(field)}</label><div class="mb-2 flex flex-wrap gap-1" data-rel-display>${labels || '<span class="text-sm text-muted-foreground">None</span>'}</div><input name="${name}" type="hidden" value="${current.map(v => typeof v === 'object' ? v.id : v).join(',')}" /><button type="button" class="btn btn-ghost btn-sm" onclick="adminOpenRelPicker('${name}','${cols}',${field.hasMany ? 'true' : 'false'})">+ Add ${fieldLabel(field)}</button></div>`
}

function renderRichTextField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  let data = value
  if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = null } }
  data = data || { root: { children: [], type: 'root', version: 1 } }
  const prerendered = lexicalToHtml(data.root || data)
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/'/g, '\\u0027')
  return `<div class="form-group" data-rte="${name}"><label class="form-label">${fieldLabel(field)}</label><div class="rte-wrap border border-border rounded overflow-hidden"><div class="rte-toolbar flex flex-wrap items-center gap-1 p-2 bg-muted border-b border-border text-xs select-none"><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background font-bold" data-cmd="bold">B</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background italic" data-cmd="italic">I</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background underline" data-cmd="underline">U</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background line-through" data-cmd="strikeThrough">S</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background font-mono" data-cmd="code">{ }</button><span class="mx-1 text-border">|</span><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background font-bold" data-cmd="h1">H1</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background font-bold" data-cmd="h2">H2</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background font-bold" data-cmd="h3">H3</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background" data-cmd="p">¶</button><span class="mx-1 text-border">|</span><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background" data-cmd="insertOrderedList">OL</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background" data-cmd="insertUnorderedList">UL</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background" data-cmd="blockquote">"</button><button type="button" class="rte-btn px-2 py-1 rounded hover:bg-background" data-cmd="link">&#128279;</button></div><div id="${name}-editor" class="rte-editor min-h-48 p-3 prose max-w-none outline-none" contenteditable="true">${prerendered}</div></div><input type="hidden" name="${name}" id="${name}-value" value='${json}' /></div>`
}

function renderGroupField(field, value, prefix = '') {
  const inner = (field.fields || []).map(f => renderField(f, (value || {})[f.name], `${prefix}${field.name}.`)).join('')
  return `<fieldset class="border border-border rounded p-4 mb-4"><legend class="text-sm font-medium px-2">${fieldLabel(field)}</legend>${inner}</fieldset>`
}

function renderArrayField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const items = Array.isArray(value) ? value : []
  const rows = items.map((item, i) => `<div class="border border-border rounded p-3 mb-2" data-array-row><div class="flex justify-end mb-2"><button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-array-row]').remove()">Remove</button></div>${(field.fields||[]).map(f=>renderField(f,item[f.name],`${name}[${i}].`)).join('')}</div>`).join('')
  const tmpl = (field.fields||[]).map(f=>renderField(f,'',`${name}[__IDX__].`)).join('')
  return `<div class="form-group" data-array-field="${name}"><label class="form-label">${fieldLabel(field)}</label><div data-array-rows>${rows}</div><button type="button" class="btn btn-ghost btn-sm mt-2" onclick="adminAddArrayRow('${name}')">+ Add Row</button><template data-array-template="${name}">${tmpl}</template></div>`
}

function renderTabsField(field, value, prefix = '') {
  const tabs = field.tabs || []
  if (!tabs.length) return ''
  const btns = tabs.map((t, i) => `<button type="button" role="tab" class="px-4 py-2 text-sm border-b-2 ${i===0?'border-primary font-medium':'border-transparent text-muted-foreground'}" onclick="adminSwitchTab(this,${i})">${t.label||'Tab '+(i+1)}</button>`).join('')
  const panels = tabs.map((t, i) => `<div role="tabpanel" class="${i===0?'':'hidden'}">${(t.fields||[]).map(f=>renderField(f,(value||{})[f.name],prefix)).join('')}</div>`).join('')
  return `<div class="mb-4"><div class="flex border-b border-border mb-4">${btns}</div>${panels}</div>`
}

function renderBlocksField(field, value, prefix = '') {
  const name = `${prefix}${field.name}`
  const items = Array.isArray(value) ? value : []
  const bts = (field.blocks || [])
  const opts = bts.map(b => `<option value="${b.slug}">${b.labels?.singular||b.slug}</option>`).join('')
  const rows = items.map((item, i) => { const bd = bts.find(b=>b.slug===item.blockType); const inner = bd ? (bd.fields||[]).map(f=>renderField(f,item[f.name],`${name}[${i}].`)).join('') : `<pre class="text-xs">${JSON.stringify(item).slice(0,200)}</pre>`; return `<div class="border border-border rounded p-3 mb-2" data-block-row><div class="flex items-center justify-between mb-3"><span class="badge badge-outline">${item.blockType||'block'}</span><button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-block-row]').remove()">Remove</button></div><input type="hidden" name="${name}[${i}].blockType" value="${item.blockType||''}" />${inner}</div>` }).join('')
  return `<div class="form-group" data-blocks-field="${name}"><label class="form-label">${fieldLabel(field)}</label><div data-block-rows>${rows}</div><div class="flex gap-2 mt-2"><select id="${name}-block-type" class="select select-solid">${opts}</select><button type="button" class="btn btn-ghost btn-sm" onclick="adminAddBlock('${name}',document.getElementById('${name}-block-type').value)">+ Add Block</button></div></div>`
}

export function renderField(field, value, prefix = '') {
  if (field.admin?.hidden) return ''
  switch (field.type) {
    case 'text':         return renderTextField(field, value, prefix)
    case 'textarea':     return renderTextField({ ...field, textarea: true }, value, prefix)
    case 'number':       return renderNumberField(field, value, prefix)
    case 'email':        return renderEmailField(field, value, prefix)
    case 'password':     return renderPasswordField(field, prefix)
    case 'checkbox':     return renderCheckboxField(field, value, prefix)
    case 'select':       return renderSelectField(field, value, prefix)
    case 'date':         return renderDateField(field, value, prefix)
    case 'upload':       return renderUploadField(field, value, prefix)
    case 'relationship': return renderRelationshipField(field, value, prefix)
    case 'richText':     return renderRichTextField(field, value, prefix)
    case 'group':        return renderGroupField(field, value, prefix)
    case 'array':        return renderArrayField(field, value, prefix)
    case 'tabs':         return renderTabsField(field, value, prefix)
    case 'row':          return (field.fields||[]).map(f=>renderField(f,(value||{})[f.name],prefix)).join('')
    case 'collapsible':  return `<details class="border border-border rounded mb-4"><summary class="px-4 py-2 cursor-pointer font-medium text-sm">${fieldLabel(field)}</summary><div class="p-4">${(field.fields||[]).map(f=>renderField(f,(value||{})[f.name],prefix)).join('')}</div></details>`
    case 'blocks':       return renderBlocksField(field, value, prefix)
    case 'ui':           return ''
    default:             return renderTextField(field, value, prefix)
  }
}
