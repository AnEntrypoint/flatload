import { renderMedia } from '../components/Media.js'
import { formatDateTime } from '../../utils/formatDateTime.js'
import { formatAuthors } from '../../utils/formatAuthors.js'

export function renderPostHero(post) {
  const publishedAt = post.publishedAt ? formatDateTime(post.publishedAt) : ''
  const authors = formatAuthors(post.populatedAuthors || [])
  const categories = (post.categories || []).map((c) => {
    const name = typeof c === 'object' ? c.title : c
    return `<span class="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">${name}</span>`
  }).join(' ')

  const image = post.heroImage
    ? `<div class="mt-8">${renderMedia(post.heroImage, { size: 'large', className: 'w-full rounded-lg max-h-[60vh] object-cover', eager: true })}</div>`
    : ''

  return `
<section class="container pt-12 pb-6">
  ${categories ? `<div class="flex flex-wrap gap-2 mb-4">${categories}</div>` : ''}
  <h1 class="text-4xl md:text-5xl font-bold mb-4">${post.title || ''}</h1>
  <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
    ${authors ? `<span>${authors}</span>` : ''}
    ${publishedAt ? `<time>${publishedAt}</time>` : ''}
  </div>
  ${image}
</section>`
}
