import { renderRichText } from '../components/RichText.js'
import { renderMedia } from '../components/Media.js'
import { resolveLink } from '../components/Link.js'

export function renderHighImpact(hero) {
  const links = (hero.links || []).map(({ link: l }) => {
    const { href, label, newTab } = resolveLink(l)
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    const cls = l.appearance === 'outline'
      ? 'border border-white text-white px-6 py-3 rounded hover:bg-white hover:text-foreground transition-colors'
      : 'bg-white text-foreground px-6 py-3 rounded hover:opacity-90 transition-opacity'
    return `<a href="${href}"${target} class="${cls}">${label}</a>`
  }).join('')

  const image = hero.media ? renderMedia(hero.media, { size: 'xlarge', className: 'absolute inset-0 w-full h-full object-cover', eager: true }) : ''

  return `
<section class="relative min-h-[80vh] flex items-end bg-foreground text-background overflow-hidden">
  ${image ? `<div class="absolute inset-0 opacity-60">${image}</div>` : ''}
  <div class="relative container py-16 md:py-24">
    <div class="max-w-3xl prose prose-invert">
      ${renderRichText(hero.richText)}
    </div>
    ${links ? `<div class="flex flex-wrap gap-4 mt-8">${links}</div>` : ''}
  </div>
</section>`
}
