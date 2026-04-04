import { payload } from '../../utils/getPayload.js'
import { renderRichText } from '../components/RichText.js'
import { renderCollectionArchive } from '../components/CollectionArchive.js'

export async function renderArchiveBlock(block) {
  let posts = []

  if (block.populateBy === 'selection' && block.selectedDocs?.length) {
    posts = block.selectedDocs.map((d) => (typeof d === 'object' ? d : null)).filter(Boolean)
  } else {
    const where = {}
    if (block.categories?.length) {
      where.categories = { in: block.categories.map((c) => (typeof c === 'object' ? c.id : c)) }
    }
    const result = await payload.find({
      collection: block.relationTo || 'posts',
      where: { ...where, _status: { equals: 'published' } },
      limit: block.limit || 10,
      depth: 1,
    })
    posts = result.docs
  }

  const intro = block.introContent ? `<div class="prose max-w-none mb-8">${renderRichText(block.introContent)}</div>` : ''
  return `<section class="my-8">${intro}${renderCollectionArchive(posts)}</section>`
}
