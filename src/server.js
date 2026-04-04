import { adminRouter } from './admin/router.js'
import { mediaHandler } from './media/handler.js'
import { frontendRouter } from './frontend/router.js'
import { find, create } from './store/index.js'

function serveStatic(req) {
  const url = new URL(req.url)
  return new Response(Bun.file(`public${url.pathname}`))
}

function parseWhereParams(searchParams) {
  const raw = {}
  for (const [k, v] of searchParams.entries()) {
    if (k.startsWith('where')) raw[k] = v
  }
  if (!Object.keys(raw).length) return undefined

  const root = {}
  for (const [key, val] of Object.entries(raw)) {
    const segs = [...key.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
    if (!segs.length) continue
    let cur = root
    for (let i = 0; i < segs.length - 1; i++) {
      const s = segs[i]
      const next = segs[i + 1]
      if (cur[s] === undefined) cur[s] = /^\d+$/.test(next) ? [] : {}
      cur = cur[s]
    }
    const last = segs[segs.length - 1]
    if (Array.isArray(cur)) cur.push(val)
    else cur[last] = val
  }

  function normalize(node) {
    if (typeof node !== 'object' || node === null) return node
    if (Array.isArray(node)) return node.map(normalize)
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      out[k] = normalize(v)
    }
    return out
  }

  return normalize(root.where || root)
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
    const where = parseWhereParams(url.searchParams)
    const limit = parseInt(url.searchParams.get('limit') || '100', 10)
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const sort = url.searchParams.get('sort') || undefined
    return Response.json(find({ collection, where, sort, limit, page }))
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
  if (p.startsWith('/app.css') || p.startsWith('/client.js') || p.startsWith('/admin-client.js') || p.startsWith('/favicon')) return serveStatic(req)
  if (p.startsWith('/media/')) return mediaHandler(req)
  if (p.startsWith('/api/')) return apiHandler(req)
  if (p.startsWith('/admin')) return adminRouter(req)
  return frontendRouter(req)
}

const PORT = parseInt(process.env.PORT || '3000', 10)
const server = Bun.serve({ port: PORT, fetch: masterFetch })
console.log(`flatload running at http://localhost:${PORT}`)
