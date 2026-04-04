// Lexical JSON → HTML string walker
// Handles all node types used by ghpl's editor config

const FORMAT_MAP = {
  1: 'bold', 2: 'italic', 4: 'strikethrough', 8: 'underline',
  16: 'code', 32: 'subscript', 64: 'superscript',
}

function applyFormat(text, format) {
  if (!format) return escHtml(text)
  let result = escHtml(text)
  // format is a bitmask
  if (format & 1)  result = `<strong>${result}</strong>`
  if (format & 2)  result = `<em>${result}</em>`
  if (format & 4)  result = `<s>${result}</s>`
  if (format & 8)  result = `<u>${result}</u>`
  if (format & 16) result = `<code>${result}</code>`
  if (format & 32) result = `<sub>${result}</sub>`
  if (format & 64) result = `<sup>${result}</sup>`
  return result
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function renderLink(node) {
  const fields = node.fields ?? {}
  let href = '#'
  if (fields.linkType === 'internal' && fields.doc?.value?.slug) {
    const prefix = fields.doc.relationTo === 'posts' ? '/posts' : ''
    href = `${prefix}/${fields.doc.value.slug}`
  } else if (fields.url) {
    href = fields.url
  }
  const target = fields.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
  const children = (node.children || []).map(renderNode).join('')
  return `<a href="${escHtml(href)}"${target}>${children}</a>`
}

function renderListItem(node) {
  const children = (node.children || []).map(renderNode).join('')
  return `<li>${children}</li>`
}

function renderList(node) {
  const tag = node.listType === 'number' ? 'ol' : 'ul'
  const items = (node.children || []).map(renderListItem).join('')
  return `<${tag}>${items}</${tag}>`
}

function renderBlock(node) {
  // Inline blocks embedded in rich text (banner, code, mediaBlock, cta)
  const fields = node.fields || {}
  const blockType = fields.blockType

  if (blockType === 'banner') {
    const styleMap = { info: 'bg-blue-50 border-blue-300', warning: 'bg-yellow-50 border-yellow-300', error: 'bg-red-50 border-red-300', success: 'bg-green-50 border-green-300' }
    const cls = styleMap[fields.style] || styleMap.info
    return `<div class="border-l-4 p-4 my-4 ${cls}">${renderRichText(fields.content)}</div>`
  }
  if (blockType === 'code') {
    return `<pre class="bg-card rounded p-4 overflow-x-auto my-4"><code class="language-${escHtml(fields.language || 'text')}">${escHtml(fields.code || '')}</code></pre>`
  }
  if (blockType === 'mediaBlock') {
    const media = fields.media
    if (!media) return ''
    const src = `/media/${media.filename}`
    const alt = escHtml(media.alt || '')
    return `<figure class="my-4"><img src="${src}" alt="${alt}" class="w-full rounded" loading="lazy" /></figure>`
  }
  if (blockType === 'cta') {
    const text = renderRichText(fields.richText)
    const links = (fields.links || []).map(({ link: l }) => {
      const href = l.type === 'reference' && l.reference?.value?.slug
        ? (l.reference.relationTo === 'posts' ? `/posts/${l.reference.value.slug}` : `/${l.reference.value.slug}`)
        : (l.url || '#')
      const cls = l.appearance === 'outline'
        ? 'border border-primary text-primary px-4 py-2 rounded hover:bg-primary hover:text-primary-foreground'
        : 'bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90'
      return `<a href="${escHtml(href)}" class="${cls}">${escHtml(l.label || '')}</a>`
    }).join('')
    return `<div class="my-6 p-6 bg-card rounded-lg">${text}<div class="flex gap-4 mt-4">${links}</div></div>`
  }
  return ''
}

function renderUpload(node) {
  const value = node.value
  if (!value) return ''
  if (value.mimeType?.startsWith('image/')) {
    return `<figure class="my-4"><img src="/media/${escHtml(value.filename)}" alt="${escHtml(value.alt || '')}" class="w-full rounded" loading="lazy" /></figure>`
  }
  return `<a href="/media/${escHtml(value.filename)}">${escHtml(value.filename)}</a>`
}

function renderNode(node) {
  if (!node) return ''
  switch (node.type) {
    case 'root':
      return (node.children || []).map(renderNode).join('')
    case 'paragraph': {
      const children = (node.children || []).map(renderNode).join('')
      return children ? `<p>${children}</p>` : '<br>'
    }
    case 'heading': {
      const tag = node.tag || 'h2'
      const children = (node.children || []).map(renderNode).join('')
      return `<${tag}>${children}</${tag}>`
    }
    case 'text':
      return applyFormat(node.text ?? '', node.format)
    case 'linebreak':
      return '<br>'
    case 'link':
    case 'autolink':
      return renderLink(node)
    case 'list':
      return renderList(node)
    case 'listitem':
      return renderListItem(node)
    case 'quote': {
      const children = (node.children || []).map(renderNode).join('')
      return `<blockquote class="border-l-4 border-border pl-4 italic my-4">${children}</blockquote>`
    }
    case 'horizontalrule':
      return '<hr class="border-border my-6">'
    case 'block':
      return renderBlock(node)
    case 'upload':
      return renderUpload(node)
    default:
      // Unknown node: render children if present, otherwise empty
      if (node.children) return (node.children || []).map(renderNode).join('')
      return ''
  }
}

export function renderRichText(content) {
  if (!content) return ''
  // content may be a Lexical JSON object or a stringified version
  const data = typeof content === 'string' ? JSON.parse(content) : content
  if (!data?.root) return ''
  return renderNode(data.root)
}
