import { adminRouter } from './admin/router.js'
import { mediaHandler } from './media/handler.js'
import { frontendRouter } from './frontend/router.js'
import { find, create } from './store/index.js'

function serveStatic(req) {
  const url = new URL(req.url)
  const file = Bun.file(`public${url.pathname}`)
  return new Response(file)
}

async function apiHandler(req) {
  const url = new URL(req.url)
  const parts = url.pathname.replace('/api/', '').split('/')
  const collection = parts[0]
  const id = parts[1]

  if (req.method === 'GET') {
    if (id) {
      const { findByID } = await import('./store/index.js')
      const doc = findByID({ collection, id })
      if (!doc) return new Response('Not found', { status: 404 })
      return Response.json(doc)
    }
    const where = {}
    for (const [k, v] of url.searchParams.entries()) {
      const m = k.match(/^where\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?/)
      if (m) {
        const field = m[2] || m[1]
        const op = m[3] || 'equals'
        where[field] = { [op]: v }
      }
    }
    const limit = parseInt(url.searchParams.get('limit') || '100', 10)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const sort = url.searchParams.get('sort') || undefined
    return Response.json(find({ collection, where: Object.keys(where).length ? where : undefined, sort, limit, page }))
  }

  if (req.method === 'POST' && collection === 'form-submissions') {
    const body = await req.json()
    create({ collection: 'form-submissions', data: { ...body, submittedAt: new Date().toISOString() } })
    return Response.json({ ok: true })
  }

  return new Response('Method not allowed', { status: 405 })
}

async function masterFetch(req) {
  const url = new URL(req.url)
  const p = url.pathname

  if (p.startsWith('/app.css') || p.startsWith('/client.js') || p.startsWith('/admin-client.js') || p.startsWith('/favicon')) {
    return serveStatic(req)
  }
  if (p.startsWith('/media/')) return mediaHandler(req)
  if (p.startsWith('/api/')) return apiHandler(req)
  if (p.startsWith('/admin')) return adminRouter(req)
  return frontendRouter(req)
}

const PORT = parseInt(process.env.PORT || '3000', 10)
const server = Bun.serve({ port: PORT, fetch: masterFetch })
console.log(`flatload running at http://localhost:${PORT}`)
