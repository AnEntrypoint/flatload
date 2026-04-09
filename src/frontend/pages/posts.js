import { payload } from '../../utils/getPayload.js'
import { getHeader, getFooter } from '../../utils/getGlobals.js'
import { renderLayout } from '../layout.js'
import { renderCollectionArchive } from '../components/CollectionArchive.js'
import { renderPagination, renderPageRange } from '../components/Pagination.js'

const LIMIT = 12

export async function postsPage(req, { page: pageNum = 1 } = {}) {
  const page = parseInt(pageNum, 10) || 1

  const [result, header, footer] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      depth: 1,
      limit: LIMIT,
      page,
    }),
    getHeader(),
    getFooter(),
  ])

  const { docs: posts, totalDocs, totalPages } = result
  const pageRange = renderPageRange({ page, limit: LIMIT, total: totalDocs })
  const pagination = renderPagination({ page, totalPages, baseUrl: '/posts' })

  const body = `
<div class="container py-12">
  <div class="flex items-center justify-between mb-8">
    <h1 class="text-3xl font-bold">Posts</h1>
    ${pageRange}
  </div>
  ${renderCollectionArchive(posts)}
  ${pagination}
</div>`

  return new Response(
    renderLayout({ title: 'Posts | Flatspace', body, header, footer }),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
