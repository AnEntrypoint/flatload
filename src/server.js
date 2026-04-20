import { adminRouter } from './admin/router.js'
import { mediaHandler, setMediaDir } from './media/handler.js'
import { frontendRouter } from './frontend/router.js'
import { find, create, setContentDir } from './store/index.js'

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

export function createServer(config = {}) {
  const {
    port = parseInt(process.env.PORT || '3000', 10),
    contentDir = 'content',
    publicDir = 'public',
    frontendHandler = null,
  } = config

  setContentDir(contentDir)
  setMediaDir(`${publicDir}/media`)

  function serveStatic(req) {
    const url = new URL(req.url)
    return new Response(Bun.file(`${publicDir}${url.pathname}`))
  }

  async function apiHandler(req) {
    try { return await apiRoute(req) }
    catch (err) {
      if (/invalid (slug|id|git hash|collection|global|filename)/.test(err.message)) {
        return Response.json({ error: err.message }, { status: 400 })
      }
      return Response.json({ error: err.message }, { status: 500 })
    }
  }

  async function apiRoute(req) {
    const url = new URL(req.url)
    const parts = url.pathname.replace('/api/', '').split('/')
    const collection = parts[0]
    const id = parts[1]

    if (collection === 'globals' && parts[1]) {
      const slug = parts[1]
      if (req.method === 'GET') {
        const { findGlobal } = await import('./store/index.js')
        const doc = findGlobal({ slug })
        return doc ? Response.json(doc) : new Response('Not found', { status: 404 })
      }
      if (req.method === 'PATCH') {
        const { updateGlobal } = await import('./store/index.js')
        const data = await req.json()
        updateGlobal({ slug, data })
        return Response.json({ ok: true })
      }
      return new Response('Method not allowed', { status: 405 })
    }

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

    if (req.method === 'POST') {
      const data = await req.json()
      const doc = create({ collection, data })
      return Response.json(doc, { status: 201 })
    }

    if (req.method === 'PATCH' && id) {
      const { update } = await import('./store/index.js')
      const data = await req.json()
      update({ collection, id, data })
      return Response.json({ ok: true })
    }

    if (req.method === 'DELETE' && id) {
      const { del } = await import('./store/index.js')
      del({ collection, id })
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
    if (frontendHandler) return frontendHandler(req)
    return frontendRouter(req)
  }

  const server = Bun.serve({ port, fetch: masterFetch })
  console.log(`flatspace running at http://localhost:${port}`)
  return server
}

if (import.meta.main) createServer()
