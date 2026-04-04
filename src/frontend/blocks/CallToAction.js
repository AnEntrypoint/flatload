import { renderRichText } from '../components/RichText.js'
import { resolveLink } from '../components/Link.js'

export function renderCallToAction(block) {
  const links = (block.links || []).map(({ link: l }) => {
    const { href, label, newTab } = resolveLink(l)
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    const cls = l.appearance === 'outline'
      ? 'inline-flex items-center border border-primary text-primary px-6 py-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors'
      : 'inline-flex items-center bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90 transition-opacity'
    return `<a href="${href}"${target} class="${cls}">${label}</a>`
  }).join('')

  return `
<div class="bg-card border border-border rounded-lg p-8 my-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
  <div class="prose max-w-none">${renderRichText(block.richText)}</div>
  ${links ? `<div class="flex flex-wrap gap-4 shrink-0">${links}</div>` : ''}
</div>`
}
