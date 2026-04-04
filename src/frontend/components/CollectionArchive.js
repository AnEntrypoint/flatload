import { renderCard } from './Card.js'

export function renderCollectionArchive(posts) {
  if (!posts.length) return '<p class="text-muted-foreground">No posts found.</p>'
  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${posts.map(renderCard).join('')}</div>`
}
