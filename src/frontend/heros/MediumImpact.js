import { renderRichText } from '../components/RichText.js'
import { renderMedia } from '../components/Media.js'
import { resolveLink } from '../components/Link.js'

export function renderMediumImpact(hero) {
  const links = (hero.links || []).map(({ link: l }) => {
    const { href, label, newTab } = resolveLink(l)
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    const cls = l.appearance === 'outline'
      ? 'inline-flex border border-primary text-primary px-6 py-2 rounded hover:bg-primary hover:text-primary-foreground transition-colors'
      : 'inline-flex bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90 transition-opacity'
    return `<a href="${href}"${target} class="${cls}">${label}</a>`
  }).join('')

  const image = hero.media ? `<div class="lg:w-1/2">${renderMedia(hero.media, { size: 'large', className: 'w-full rounded-lg', eager: true })}</div>` : ''

  return `
<section class="container py-12 md:py-20 flex flex-col lg:flex-row gap-8 items-center">
  <div class="flex-1">
    <div class="prose max-w-none">${renderRichText(hero.richText)}</div>
    ${links ? `<div class="flex flex-wrap gap-4 mt-6">${links}</div>` : ''}
  </div>
  ${image}
</section>`
}
