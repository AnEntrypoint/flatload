import { payload } from '../../utils/getPayload.js'
import { getHeader, getFooter } from '../../utils/getGlobals.js'
import { renderLayout } from '../layout.js'
import { renderPostHero } from '../heros/PostHero.js'
import { renderRichText } from '../components/RichText.js'
import { renderCard } from '../components/Card.js'
import { renderAdminBar } from '../components/AdminBar.js'
import { isPreview } from '../../utils/preview.js'

export async function postPage(req, { slug }) {
  const draft = isPreview(req)

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    depth: 3,
    limit: 1,
    draft,
  })

  const post = result.docs?.[0]
  if (!post) return null

  const [header, footer] = await Promise.all([getHeader(), getFooter()])

  const hero = renderPostHero(post)
  const content = `<div class="container py-8"><article class="prose max-w-3xl mx-auto">${renderRichText(post.content)}</article></div>`

  // Related posts
  let relatedHtml = ''
  if (post.relatedPosts?.length) {
    const related = post.relatedPosts
      .map((p) => (typeof p === 'object' ? p : null))
      .filter(Boolean)
      .slice(0, 3)
    if (related.length) {
      relatedHtml = `
<section class="container py-12 border-t border-border">
  <h2 class="text-2xl font-semibold mb-6">Related Posts</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">${related.map(renderCard).join('')}</div>
</section>`
    }
  }

  const adminBar = draft ? renderAdminBar('posts', post.id) : ''
  const title = post.meta?.title || post.title
  const description = post.meta?.description || ''
  const ogImage = post.meta?.image?.filename ? `/media/${post.meta.image.filename}?preset=og` : ''

  return new Response(
    renderLayout({ title, description, ogImage, body: hero + content + relatedHtml, header, footer, adminBar }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
