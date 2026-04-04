import { renderRichText } from '../components/RichText.js'
import { renderMedia } from '../components/Media.js'
import { resolveLink } from '../components/Link.js'

export function renderHighImpact(hero) {
  const links = (hero.links || []).map(({ link: l }) => {
    const { href, label, newTab } = resolveLink(l)
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    const cls = l.appearance === 'outline'
      ? 'inline-flex items-center border-2 border-white/80 text-white px-6 py-3 rounded-lg hover:bg-white/10 transition-colors font-medium'
      : 'inline-flex items-center bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-white/90 transition-opacity font-medium shadow-sm'
    return `<a href="${href}"${target} class="${cls}">${label}</a>`
  }).join('')

  const image = hero.media ? renderMedia(hero.media, { size: 'xlarge', className: 'absolute inset-0 w-full h-full object-cover', eager: true }) : ''

  return `
<section class="hero-section relative min-h-[70vh] md:min-h-[80vh] flex items-end overflow-hidden">
  <div class="absolute inset-0 bg-slate-900"></div>
  ${image ? `<div class="absolute inset-0 opacity-50">${image}</div>` : ''}
  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
  <div class="relative container py-12 md:py-20 lg:py-28">
    <div class="hero-content max-w-3xl text-white">
      ${renderRichText(hero.richText)}
    </div>
    ${links ? `<div class="flex flex-wrap gap-3 mt-8">${links}</div>` : ''}
  </div>
</section>`
}
