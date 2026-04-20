;(function () {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openGlobalSearch()
    }
  })

  window.openGlobalSearch = function () {
    if (document.getElementById('global-search-modal')) return
    const collections = ['pages','posts','media','categories','forms','redirects']
    const modal = document.createElement('div')
    modal.id = 'global-search-modal'
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[15vh]'
    modal.innerHTML = `<div class="bg-card border border-border rounded-lg w-full max-w-lg shadow-lg"><div class="p-3 border-b border-border"><input type="text" id="gs-input" placeholder="Search all collections..." class="input input-solid input-block" autofocus /></div><div id="gs-results" class="max-h-[50vh] overflow-y-auto p-2"></div><div class="p-2 border-t border-border text-xs text-content3 text-center">ESC to close · ⌘K to toggle</div></div>`
    document.body.appendChild(modal)
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc) } })
    const input = document.getElementById('gs-input')
    let timer
    input?.addEventListener('input', () => {
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const q = input.value.trim()
        if (!q) { document.getElementById('gs-results').innerHTML = ''; return }
        const results = await Promise.all(collections.map(async col => {
          try {
            const r = await fetch(`/api/${col}?where[or][0][title][like]=${encodeURIComponent(q)}&where[or][1][name][like]=${encodeURIComponent(q)}&where[or][2][filename][like]=${encodeURIComponent(q)}&limit=5`)
            const data = await r.json()
            return { col, docs: data.docs || [] }
          } catch { return { col, docs: [] } }
        }))
        const el = document.getElementById('gs-results')
        if (!el) return
        const html = results.filter(r => r.docs.length).map(r => `<div class="mb-2"><div class="text-xs font-semibold text-content2 px-2 py-1 uppercase">${r.col}</div>${r.docs.map(d => `<a href="/admin/collections/${r.col}/${d.id}" class="block px-3 py-2 hover:bg-muted rounded text-sm">${d.title||d.name||d.filename||d.id}</a>`).join('')}</div>`).join('')
        el.innerHTML = html || '<div class="text-sm text-content3 p-3 text-center">No results</div>'
      }, 300)
    })
    input?.focus()
  }
})()
