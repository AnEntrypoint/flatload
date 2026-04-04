import { renderRichText } from '../components/RichText.js'
import { resolveLink } from '../components/Link.js'

const sizeMap = {
  oneThird:  'lg:col-span-4',
  half:      'lg:col-span-6',
  twoThirds: 'lg:col-span-8',
  full:      'lg:col-span-12',
}

export function renderContent(block) {
  const columns = (block.columns || []).map((col) => {
    const span = sizeMap[col.size] || sizeMap.full
    const richText = `<div class="prose max-w-none">${renderRichText(col.richText)}</div>`
    let linkHtml = ''
    if (col.enableLink && col.link) {
      const { href, label, newTab } = resolveLink(col.link)
      const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      const cls = col.link.appearance === 'outline'
        ? 'inline-flex border border-primary text-primary px-4 py-2 rounded mt-4 hover:bg-primary hover:text-primary-foreground'
        : 'inline-flex bg-primary text-primary-foreground px-4 py-2 rounded mt-4 hover:opacity-90'
      linkHtml = `<a href="${href}"${target} class="${cls}">${label}</a>`
    }
    return `<div class="col-span-12 ${span}">${richText}${linkHtml}</div>`
  }).join('')

  return `<div class="grid grid-cols-12 gap-8 my-8">${columns}</div>`
}
