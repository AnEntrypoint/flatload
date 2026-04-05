;(function () {
  function serializeInline(node, fmt) {
    if (node.nodeType === 3) {
      const text = node.textContent || ''
      return text ? [{ type: 'text', version: 1, text, format: fmt }] : []
    }
    if (node.nodeType !== 1) return []
    const tag = node.tagName.toLowerCase()
    if (tag === 'br') return [{ type: 'linebreak', version: 1 }]
    if (tag === 'a') {
      const ch = [...node.childNodes].flatMap(n => serializeInline(n, fmt))
      return [{ type: 'link', version: 1, url: node.getAttribute('href') || '', rel: null, target: null, title: null, children: ch }]
    }
    let f = fmt
    if (tag === 'strong' || tag === 'b') f |= 1
    if (tag === 'em' || tag === 'i') f |= 2
    if (tag === 'u') f |= 8
    if (tag === 's' || tag === 'del' || tag === 'strike') f |= 16
    if (tag === 'code') f |= 32
    return [...node.childNodes].flatMap(n => serializeInline(n, f))
  }

  function serializeBlock(node) {
    if (node.nodeType === 3) {
      const text = (node.textContent || '').trim()
      return text ? { type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text, format: 0 }] } : null
    }
    if (node.nodeType !== 1) return null
    const tag = node.tagName.toLowerCase()
    const ch = [...node.childNodes].flatMap(n => serializeInline(n, 0))
    const children = ch.length ? ch : [{ type: 'text', version: 1, text: '', format: 0 }]
    if (/^h[1-6]$/.test(tag)) return { type: 'heading', tag, version: 1, children }
    if (tag === 'blockquote') return { type: 'quote', version: 1, children }
    if (tag === 'pre') return { type: 'code', version: 1, children: [{ type: 'text', version: 1, text: node.innerText || '', format: 0 }] }
    if (tag === 'ul' || tag === 'ol') {
      const items = [...node.children].map((li, i) => {
        const lic = [...li.childNodes].flatMap(n => serializeInline(n, 0))
        return { type: 'listitem', version: 1, value: i + 1, children: lic.length ? lic : [{ type: 'text', version: 1, text: '', format: 0 }] }
      })
      return { type: 'list', listType: tag === 'ol' ? 'number' : 'bullet', version: 1, start: 1, children: items }
    }
    return { type: 'paragraph', version: 1, children }
  }

  function domToLexical(el) {
    const children = [...el.childNodes].map(serializeBlock).filter(Boolean)
    return { root: { type: 'root', version: 1, children } }
  }

  window.initRichEditor = function (name) {
    const editor = document.getElementById(name + '-editor')
    const input = document.getElementById(name + '-value')
    if (!editor || !input) return
    const toolbar = editor.closest('.rte-wrap')?.querySelector('.rte-toolbar')
    if (toolbar) {
      toolbar.addEventListener('mousedown', e => {
        const btn = e.target.closest('[data-cmd]')
        if (!btn) return
        e.preventDefault()
        editor.focus()
        const cmd = btn.dataset.cmd
        if (cmd === 'link') {
          const url = prompt('URL:')
          if (url) document.execCommand('createLink', false, url)
        } else if (cmd === 'code') {
          const sel = document.getSelection()
          const selText = sel && sel.rangeCount ? sel.toString() : ''
          document.execCommand('insertHTML', false, '<code>' + (selText || '​') + '</code>')
        } else if (['h1', 'h2', 'h3', 'p', 'blockquote'].includes(cmd)) {
          document.execCommand('formatBlock', false, cmd)
        } else {
          document.execCommand(cmd, false, null)
        }
        input.value = JSON.stringify(domToLexical(editor))
      })
    }
    const sync = () => { input.value = JSON.stringify(domToLexical(editor)) }
    editor.addEventListener('input', sync)
    editor.addEventListener('paste', () => setTimeout(sync, 0))
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-rte]').forEach(el => window.initRichEditor(el.dataset.rte))
  })
})()
