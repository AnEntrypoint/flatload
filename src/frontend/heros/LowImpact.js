import { renderRichText } from '../components/RichText.js'

export function renderLowImpact(hero) {
  return `
<section class="container py-8 md:py-12">
  <div class="prose max-w-none">${renderRichText(hero.richText)}</div>
</section>`
}
