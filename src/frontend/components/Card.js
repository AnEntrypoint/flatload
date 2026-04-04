import { renderMedia } from './Media.js'
import { formatDateTime } from '../../utils/formatDateTime.js'

export function renderCard(post) {
  const slug = post.slug || ''
  const title = post.title || 'Untitled'
  const publishedAt = post.publishedAt ? formatDateTime(post.publishedAt) : ''
  const categories = (post.categories || []).map((c) => {
    const name = typeof c === 'object' ? c.title : c
    return `<span class="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">${name}</span>`
  }).join(' ')

  const image = post.heroImage
    ? `<a href="/posts/${slug}" class="block overflow-hidden rounded-t-lg">${renderMedia(post.heroImage, { size: 'medium', className: 'w-full aspect-video object-cover hover:scale-105 transition-transform duration-300' })}</a>`
    : ''

  return `
<article class="bg-card border border-border rounded-lg overflow-hidden flex flex-col hover:shadow-md transition-shadow">
  ${image}
  <div class="p-4 flex flex-col gap-2 flex-1">
    ${categories ? `<div class="flex flex-wrap gap-1">${categories}</div>` : ''}
    <h3 class="font-semibold text-lg leading-tight">
      <a href="/posts/${slug}" class="hover:underline">${title}</a>
    </h3>
    ${post.meta?.description ? `<p class="text-muted-foreground text-sm line-clamp-2">${post.meta.description}</p>` : ''}
    ${publishedAt ? `<time class="text-xs text-muted-foreground mt-auto pt-2">${publishedAt}</time>` : ''}
  </div>
</article>`
}
