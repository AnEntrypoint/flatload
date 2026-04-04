import { renderRichText } from '../components/RichText.js'
import { renderMedia } from '../components/Media.js'
import { resolveLink } from '../components/Link.js'

export function renderHighImpact(hero) {
  const links = (hero.links || []).map(({ link: l }) => {
    const { href, label, newTab } = resolveLink(l)
    const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
    const cls = l.appearance === 'outline'
      ? 'inline-flex items-center border-2 border-white/80 text-white px-6 py-3 rounded-lg hover:bg-white hover:text-foreground transition-colors font-medium'
      : 'inline-flex items-center bg-white text-foreground px-6 py-3 rounded-lg hover:bg-white/90 transition-opacity font-medium shadow-sm'
    return `<a href="${href}"${target} class="${cls}">${label}</a>`
  }).join('')

  const image = hero.media ? renderMedia(hero.media, { size: 'xlarge', className: 'absolute inset-0 w-full h-full object-cover', eager: true }) : ''

  return `
<section class="relative min-h-[70vh] md:min-h-[80vh] flex items-end bg-foreground text-background overflow-hidden">
  ${image ? `<div class="absolute inset-0 opacity-50">${image}</div>` : ''}
  <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
  <div class="relative container py-12 md:py-20 lg:py-28">
    <div class="max-w-3xl [&_h1]:text-3xl [&_h1]:md:text-5xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:md:text-4xl [&_h2]:font-semibold [&_p]:text-lg [&_p]:md:text-xl [&_p]:text-white/90 [&_p]:leading-relaxed">
      ${renderRichText(hero.richText)}
    </div>
    ${links ? `<div class="flex flex-wrap gap-3 mt-8">${links}</div>` : ''}
  </div>
</section>`
}
