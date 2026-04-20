;(function () {
  const btn = document.getElementById('admin-theme-toggle')
  function applyTheme(t) {
    const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme:dark)').matches)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    document.querySelector('.dark-icon')?.classList.toggle('hidden', !dark)
    document.querySelector('.light-icon')?.classList.toggle('hidden', dark)
  }
  const stored = localStorage.getItem('admin-theme') || 'system'
  applyTheme(stored)
  btn?.addEventListener('click', () => {
    const next = localStorage.getItem('admin-theme') === 'dark' ? 'light' : 'dark'
    localStorage.setItem('admin-theme', next)
    applyTheme(next)
  })
})()

window.adminSwitchTab = function (btn, idx) {
  const wrap = btn.closest('[role="tablist"]')?.parentElement || btn.parentElement.parentElement
  wrap.querySelectorAll('[role="tab"]').forEach((t, i) => {
    t.classList.toggle('border-primary', i === idx)
    t.classList.toggle('font-medium', i === idx)
    t.classList.toggle('border-transparent', i !== idx)
    t.classList.toggle('text-muted-foreground', i !== idx)
  })
  wrap.querySelectorAll('[role="tabpanel"]').forEach((p, i) => p.classList.toggle('hidden', i !== idx))
}

window.adminAddArrayRow = function (name) {
  const container = document.querySelector(`[data-array-field="${name}"] [data-array-rows]`)
  const template = document.querySelector(`[data-array-template="${name}"]`)
  if (!container || !template) return
  const idx = container.querySelectorAll('[data-array-row]').length
  const div = document.createElement('div')
  div.setAttribute('data-array-row', '')
  div.className = 'border border-border rounded p-3 mb-2'
  div.innerHTML = `<div class="flex justify-end mb-2"><button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-array-row]').remove()">Remove</button></div>${template.innerHTML.replaceAll('__IDX__', String(idx))}`
  container.appendChild(div)
  div.querySelectorAll('[data-rte]').forEach(el => window.initRichEditor?.(el.dataset.rte))
}

window.adminAddBlock = async function (name, blockType) {
  const container = document.querySelector(`[data-blocks-field="${name}"] [data-block-rows]`)
  if (!container) return
  const idx = container.querySelectorAll('[data-block-row]').length
  const collection = document.querySelector('form[data-collection]')?.dataset.collection || ''
  let inner = ''
  try {
    const r = await fetch(`/admin/api/block-template?collection=${encodeURIComponent(collection)}&field=${encodeURIComponent(name)}&blockType=${encodeURIComponent(blockType)}&idx=${idx}`)
    inner = await r.text()
  } catch {}
  const div = document.createElement('div')
  div.setAttribute('data-block-row', '')
  div.className = 'border border-border rounded p-3 mb-2'
  div.innerHTML = `<div class="flex items-center justify-between mb-3"><span class="badge badge-outline">${blockType}</span><button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-block-row]').remove()">Remove</button></div><input type="hidden" name="${name}[${idx}].blockType" value="${blockType}" />${inner}`
  container.appendChild(div)
  div.querySelectorAll('[data-rte]').forEach(el => window.initRichEditor?.(el.dataset.rte))
}

window.adminOpenRelPicker = function (fieldName, collections, multiple) {
  const col = collections.split(',')[0]
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
  modal.innerHTML = `<div class="bg-card border border-border rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col"><div class="flex items-center justify-between p-4 border-b border-border"><h2 class="font-semibold">Select ${col}</h2><button type="button" onclick="this.closest('.fixed').remove()" class="btn btn-ghost btn-sm">✕</button></div><div class="p-3 border-b border-border"><input type="text" id="rel-search" placeholder="Search..." class="input input-solid input-block" /></div><div id="rel-results" class="overflow-y-auto flex-1 p-2"></div></div>`
  document.body.appendChild(modal)
  const input = document.querySelector(`[data-rel-field="${fieldName}"] input[type="hidden"]`)
  const display = document.querySelector(`[data-rel-field="${fieldName}"] [data-rel-display]`)
  async function search(q) {
    const r = await fetch(`/api/${col}?where[or][0][title][like]=${encodeURIComponent(q)}&where[or][1][name][like]=${encodeURIComponent(q)}&where[or][2][filename][like]=${encodeURIComponent(q)}&where[or][3][email][like]=${encodeURIComponent(q)}&limit=20&depth=0`)
    const data = await r.json()
    const el = document.getElementById('rel-results')
    if (!el) return
    el.innerHTML = (data.docs || []).map(doc => `<button type="button" class="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm" data-id="${doc.id}" data-label="${doc.title||doc.name||doc.filename||doc.email||doc.id}">${doc.title||doc.name||doc.filename||doc.email||doc.id}</button>`).join('') || '<div class="text-muted-foreground text-sm p-3">No results</div>'
    el.querySelectorAll('button[data-id]').forEach(b => b.addEventListener('click', () => {
      if (!multiple) {
        if (input) input.value = b.dataset.id
        if (display) display.innerHTML = `<span class="badge badge-outline">${b.dataset.label}</span>`
        modal.remove()
      } else {
        const cur = input?.value ? input.value.split(',').filter(Boolean) : []
        if (!cur.includes(b.dataset.id)) {
          cur.push(b.dataset.id)
          if (input) input.value = cur.join(',')
          if (display) display.innerHTML += `<span class="badge badge-outline mr-1">${b.dataset.label} <button type="button" data-remove-rel="${fieldName}" data-id="${b.dataset.id}" class="ml-1 hover:text-error">&times;</button></span>`
        }
      }
    }))
  }
  let timer
  modal.querySelector('#rel-search')?.addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => search(e.target.value), 300) })
  search('')
}

window.adminOpenMediaPicker = function (fieldName) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
  modal.innerHTML = `<div class="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"><div class="flex items-center justify-between p-4 border-b border-border"><h2 class="font-semibold">Choose Media</h2><button type="button" onclick="this.closest('.fixed').remove()" class="btn btn-ghost btn-sm">✕</button></div><div class="p-3 border-b border-border"><input type="text" id="media-search" placeholder="Search..." class="input input-solid input-block" /></div><div id="media-results" class="overflow-y-auto flex-1 p-3 grid grid-cols-3 gap-2"></div></div>`
  document.body.appendChild(modal)
  async function search(q) {
    const r = await fetch(`/api/media?where[or][0][filename][like]=${encodeURIComponent(q)}&limit=30&depth=0`)
    const data = await r.json()
    const el = document.getElementById('media-results')
    if (!el) return
    el.innerHTML = (data.docs || []).map(doc => `<button type="button" class="rounded border border-border overflow-hidden hover:border-primary transition-colors text-left" data-id="${doc.id}" data-filename="${doc.filename||''}"><img src="/media/${doc.filename}?preset=thumbnail" alt="" class="w-full h-24 object-cover" onerror="this.style.display='none'" /><div class="text-xs p-1 truncate">${doc.filename||doc.id}</div></button>`).join('') || '<div class="col-span-3 text-sm text-muted-foreground p-3 text-center">No media found</div>'
    el.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => {
      const idEl = document.getElementById(fieldName + '-upload-id')
      const preview = document.getElementById(fieldName + '-preview')
      if (idEl) idEl.value = b.dataset.id
      if (preview) preview.innerHTML = `<img src="/media/${b.dataset.filename}?preset=thumbnail" alt="" class="w-20 h-20 object-cover rounded mb-2" /><div class="text-sm">${b.dataset.filename}</div>`
      modal.remove()
    }))
  }
  let timer
  modal.querySelector('#media-search')?.addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => search(e.target.value), 300) })
  search('')
}

window.adminClearUpload = function (fieldName) {
  const idEl = document.getElementById(fieldName + '-upload-id')
  const preview = document.getElementById(fieldName + '-preview')
  if (idEl) idEl.value = ''
  if (preview) preview.innerHTML = '<div class="text-sm text-content3">No file selected</div>'
}

document.addEventListener('click', e => {
  const rem = e.target.closest('[data-remove-rel]')
  if (rem) {
    const fn = rem.dataset.removeRel
    const id = rem.dataset.id
    const inp = document.querySelector(`[data-rel-field="${fn}"] input[type="hidden"]`)
    if (inp) inp.value = inp.value.split(',').filter(v => v && v !== id).join(',')
    rem.closest('span.badge')?.remove()
    return
  }
  const mp = e.target.closest('[data-media-picker]')
  if (mp) { window.adminOpenMediaPicker(mp.dataset.mediaPicker); return }
  const cu = e.target.closest('[data-clear-upload]')
  if (cu) { window.adminClearUpload(cu.dataset.clearUpload); return }
  const bd = e.target.closest('[data-bulk-delete]')
  if (bd) {
    if (!confirm('Delete selected?')) return
    const col = bd.dataset.collection
    const ids = [...document.querySelectorAll('.row-check:checked')].map(c => c.value)
    Promise.all(ids.map(id => fetch(`/admin/api/collections/${encodeURIComponent(col)}/${encodeURIComponent(id)}`, { method: 'DELETE' })))
      .finally(() => setTimeout(() => location.reload(), 300))
    return
  }
  const dd = e.target.closest('[data-delete-doc]')
  if (dd) {
    if (!confirm('Delete?')) return
    const col = dd.dataset.collection
    const id = dd.dataset.id
    fetch(`/admin/api/collections/${col}/${id}`, { method: 'DELETE' })
      .then(() => location.href = `/admin/collections/${col}`)
    return
  }
})

;(function () {
  const form = document.querySelector('form#edit-form, form#global-form')
  if (!form) return
  const snapshot = () => [...new FormData(form).entries()].map(([k,v])=>k+'='+String(v)).sort().join('&')
  const init = snapshot()
  let submitted = false
  form.addEventListener('submit', () => { submitted = true })
  window.addEventListener('beforeunload', e => {
    if (submitted || snapshot() === init) return
    e.preventDefault()
    return (e.returnValue = '')
  })
})()

;(function () {
  const params = new URLSearchParams(location.search)
  if (!params.get('saved') && !params.get('created')) return
  const toast = document.createElement('div')
  toast.className = 'fixed top-4 right-4 z-50 bg-success text-success-content px-4 py-2 rounded shadow text-sm'
  toast.textContent = params.get('created') ? 'Created successfully' : 'Saved successfully'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
})()

window.__debug = {
  get theme() { return localStorage.getItem('admin-theme') || 'system' },
  get sidebar() { return localStorage.getItem('admin-sidebar') || 'open' },
  get formDirty() { const f = document.querySelector('form#edit-form, form#global-form'); return f ? 'check beforeunload' : 'no form' }
}
