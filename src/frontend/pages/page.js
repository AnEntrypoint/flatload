import { payload } from '../../utils/getPayload.js'
import { getHeader, getFooter } from '../../utils/getGlobals.js'
import { renderLayout } from '../layout.js'
import { renderHero } from '../heros/renderHero.js'
import { renderBlocks } from '../blocks/renderBlocks.js'
import { renderAdminBar } from '../components/AdminBar.js'
import { isPreview } from '../../utils/preview.js'

export async function pagePage(req, { slug }) {
  const draft = isPreview(req)

  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    depth: 3,
    limit: 1,
    draft,
  })

  const page = result.docs?.[0]
  if (!page) return null

  const [header, footer] = await Promise.all([getHeader(), getFooter()])

  const hero = renderHero(page.hero)
  const blocks = await renderBlocks(page.layout || [])
  const adminBar = draft ? renderAdminBar('pages', page.id) : ''

  const title = page.meta?.title || page.title
  const description = page.meta?.description || ''
  const ogImage = page.meta?.image?.filename ? `/media/${page.meta.image.filename}?preset=og` : ''

  return new Response(
    renderLayout({ title, description, ogImage, body: hero + blocks, header, footer, adminBar }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
