;(function () {
  window.openDocDrawer = async function (collection, id) {
    if (document.getElementById('doc-drawer')) document.getElementById('doc-drawer').remove()
    const overlay = document.createElement('div')
    overlay.id = 'doc-drawer'
    overlay.className = 'fixed inset-0 z-50 flex justify-end'
    overlay.innerHTML = `<div class="bg-black/40 absolute inset-0" onclick="document.getElementById('doc-drawer').remove()"></div><div class="relative bg-card w-full max-w-2xl h-full overflow-y-auto shadow-xl border-l border-border flex flex-col"><div class="flex items-center justify-between p-4 border-b border-border shrink-0"><h2 class="font-semibold text-sm">Edit Document</h2><button onclick="document.getElementById('doc-drawer').remove()" class="btn btn-ghost btn-sm">✕</button></div><div id="drawer-content" class="flex-1 p-4 overflow-y-auto"><div class="text-center text-content3 py-8">Loading...</div></div></div>`
    document.body.appendChild(overlay)
    try {
      const r = await fetch(`/admin/collections/${collection}/${id}`)
      const html = await r.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const main = doc.querySelector('main')
      if (main) document.getElementById('drawer-content').innerHTML = main.innerHTML
      document.getElementById('drawer-content').querySelectorAll('form').forEach(f => {
        f.addEventListener('submit', async e => {
          e.preventDefault()
          const fd = new FormData(f)
          await fetch(f.action || `/admin/collections/${collection}/${id}`, { method: 'POST', body: fd })
          document.getElementById('doc-drawer')?.remove()
          const toast = document.createElement('div')
          toast.className = 'fixed top-4 right-4 z-[60] bg-success text-success-content px-4 py-2 rounded shadow text-sm'
          toast.textContent = 'Saved'
          document.body.appendChild(toast)
          setTimeout(() => toast.remove(), 3000)
        })
      })
      document.getElementById('drawer-content').querySelectorAll('[data-rte]').forEach(el => window.initRichEditor?.(el.dataset.rte))
    } catch (err) {
      document.getElementById('drawer-content').innerHTML = '<div class="text-error p-4">Failed to load document</div>'
    }
  }

  document.addEventListener('click', e => {
    const badge = e.target.closest('[data-rel-field] .badge[data-doc-collection]')
    if (badge) {
      e.preventDefault()
      window.openDocDrawer(badge.dataset.docCollection, badge.dataset.docId)
    }
  })
})()
