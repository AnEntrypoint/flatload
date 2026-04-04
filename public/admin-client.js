// Admin client — theme, array rows, block rows, rel picker

// Theme
;(function () {
  const btn = document.getElementById('admin-theme-toggle')
  const darkIcon = document.querySelector('.dark-icon')
  const lightIcon = document.querySelector('.light-icon')

  function applyTheme(t) {
    const mq = window.matchMedia('(prefers-color-scheme:dark)').matches
    const dark = t === 'dark' || (t === 'system' && mq)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    if (darkIcon) darkIcon.classList.toggle('hidden', !dark)
    if (lightIcon) lightIcon.classList.toggle('hidden', dark)
  }

  const stored = localStorage.getItem('admin-theme') || 'system'
  applyTheme(stored)

  if (btn) {
    btn.addEventListener('click', () => {
      const cur = localStorage.getItem('admin-theme') || 'system'
      const next = cur === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme', next)
      applyTheme(next)
    })
  }
})()

// Tab switcher
window.adminSwitchTab = function (btn, idx) {
  const container = btn.closest('[role="tablist"]')?.parentElement || btn.parentElement.parentElement
  container.querySelectorAll('[role="tab"]').forEach((t, i) => {
    t.classList.toggle('border-primary', i === idx)
    t.classList.toggle('font-medium', i === idx)
    t.classList.toggle('border-transparent', i !== idx)
    t.classList.toggle('text-muted-foreground', i !== idx)
  })
  container.querySelectorAll('[role="tabpanel"]').forEach((p, i) => {
    p.classList.toggle('hidden', i !== idx)
  })
}

// Array row add
window.adminAddArrayRow = function (name) {
  const container = document.querySelector(`[data-array-field="${name}"] [data-array-rows]`)
  const template = document.querySelector(`[data-array-template="${name}"]`)
  if (!container || !template) return
  const idx = container.querySelectorAll('[data-array-row]').length
  const html = template.innerHTML.replaceAll('__IDX__', String(idx))
  const div = document.createElement('div')
  div.setAttribute('data-array-row', '')
  div.className = 'border border-border rounded p-3 mb-2'
  div.innerHTML = `<div class="flex justify-end mb-2"><button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-array-row]').remove()">Remove</button></div>${html}`
  container.appendChild(div)
}

// Block add (simplified — no template, page reload after add would be nicer)
window.adminAddBlock = function (name, blockType) {
  const container = document.querySelector(`[data-blocks-field="${name}"] [data-block-rows]`)
  if (!container) return
  const idx = container.querySelectorAll('[data-block-row]').length
  const div = document.createElement('div')
  div.setAttribute('data-block-row', '')
  div.className = 'border border-border rounded p-3 mb-2'
  div.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <span class="badge badge-outline">${blockType}</span>
      <button type="button" class="btn btn-ghost btn-sm text-error" onclick="this.closest('[data-block-row]').remove()">Remove</button>
    </div>
    <input type="hidden" name="${name}[${idx}].blockType" value="${blockType}" />
    <div class="form-group">
      <label class="form-label">Content</label>
      <textarea name="${name}[${idx}].content" class="input input-solid input-block h-24"></textarea>
    </div>`
  container.appendChild(div)
}

// Relationship picker (simple modal)
window.adminOpenRelPicker = function (fieldName, collections, multiple) {
  const existing = document.querySelector(`[data-rel-field="${fieldName}"] input[type="hidden"]`)
  const col = collections.split(',')[0]
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
  modal.innerHTML = `
    <div class="bg-card border border-border rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="font-semibold">Select ${col}</h2>
        <button type="button" onclick="this.closest('.fixed').remove()" class="btn btn-ghost btn-sm">✕</button>
      </div>
      <div class="p-3 border-b border-border">
        <input type="text" id="rel-search" placeholder="Search..." class="input input-solid input-block" />
      </div>
      <div id="rel-results" class="overflow-y-auto flex-1 p-2"></div>
    </div>`
  document.body.appendChild(modal)

  async function search(q) {
    const r = await fetch(`/api/${col}?where[or][0][title][like]=${encodeURIComponent(q)}&where[or][1][name][like]=${encodeURIComponent(q)}&where[or][2][filename][like]=${encodeURIComponent(q)}&where[or][3][email][like]=${encodeURIComponent(q)}&limit=20&depth=0`)
    const data = await r.json()
    const results = document.getElementById('rel-results')
    if (!results) return
    results.innerHTML = (data.docs || []).map(doc => {
      const label = doc.title || doc.name || doc.filename || doc.email || doc.id
      return `<button type="button" class="w-full text-left px-3 py-2 hover:bg-muted rounded text-sm" data-id="${doc.id}" data-label="${label}">${label}</button>`
    }).join('') || '<div class="text-muted-foreground text-sm p-3">No results</div>'

    results.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id
        const label = btn.dataset.label
        if (!multiple) {
          existing.value = id
          // Update displayed badges
          const display = document.querySelector(`[data-rel-field="${fieldName}"] div:first-of-type`)
          if (display) display.innerHTML = `<span class="badge badge-outline">${label}</span>`
          modal.remove()
        } else {
          const cur = existing.value ? existing.value.split(',').filter(Boolean) : []
          if (!cur.includes(id)) {
            cur.push(id)
            existing.value = cur.join(',')
            const display = document.querySelector(`[data-rel-field="${fieldName}"] div:first-of-type`)
            if (display) display.innerHTML += `<span class="badge badge-outline mr-1">${label}</span>`
          }
        }
      })
    })
  }

  const searchInput = modal.querySelector('#rel-search')
  let timer
  searchInput?.addEventListener('input', e => {
    clearTimeout(timer)
    timer = setTimeout(() => search(e.target.value), 300)
  })
  search('')
}

// Saved flash
;(function () {
  const params = new URLSearchParams(location.search)
  if (params.get('saved') || params.get('created')) {
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 z-50 bg-success text-success-content px-4 py-2 rounded shadow text-sm'
    toast.textContent = params.get('created') ? 'Created successfully' : 'Saved successfully'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }
})()
