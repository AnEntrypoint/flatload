import { loginView } from './views/login.js'
import { dashboardView } from './views/dashboard.js'
import { listView } from './views/list.js'
import { editView, createView } from './views/edit.js'
import { globalView } from './views/globals.js'
import { mediaView, mediaUploadView } from './views/media.js'
import { loginHandler, logoutHandler, getUser } from './api/auth.js'
import { updateHandler, createHandler, deleteHandler, updateGlobalHandler, mediaUploadHandler } from './api/crud.js'

const html = (body) => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
const redirect = (url) => new Response(null, { status: 302, headers: { Location: url } })

function requireAuth(user) {
  if (!user) return redirect('/admin/login')
  return null
}

export async function adminRouter(req) {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  // Auth routes (no auth required)
  if (path === '/admin/login') {
    if (method === 'POST') return loginHandler(req)
    return html(loginView())
  }
  if (path === '/admin/logout') return logoutHandler()

  // All other routes require auth
  const user = await getUser(req)
  const authError = requireAuth(user)
  if (authError) return authError

  // Dashboard
  if (path === '/admin' || path === '/admin/') {
    return html(await dashboardView(user))
  }

  // Media special routes (before generic collection routes)
  if (path === '/admin/collections/media') {
    const page = url.searchParams.get('page') || 1
    const search = url.searchParams.get('search') || ''
    return html(await mediaView(user, { page, search }))
  }
  if (path === '/admin/collections/media/upload') {
    if (method === 'POST') return mediaUploadHandler(req)
    return html(mediaUploadView(user))
  }

  // Collection API (JSON)
  const apiDelete = path.match(/^\/admin\/api\/collections\/([^/]+)\/([^/]+)$/)
  if (apiDelete && method === 'DELETE') {
    const [, slug, id] = apiDelete
    return deleteHandler(slug, id)
  }

  // Collection list
  const listMatch = path.match(/^\/admin\/collections\/([^/]+)$/)
  if (listMatch) {
    const [, slug] = listMatch
    const page = url.searchParams.get('page') || 1
    const search = url.searchParams.get('search') || ''
    return html(await listView(slug, user, { page, search }))
  }

  // Collection create
  const createMatch = path.match(/^\/admin\/collections\/([^/]+)\/create$/)
  if (createMatch) {
    const [, slug] = createMatch
    if (method === 'POST') return createHandler(req, slug)
    return html(await createView(slug, user))
  }

  // Collection edit
  const editMatch = path.match(/^\/admin\/collections\/([^/]+)\/([^/]+)$/)
  if (editMatch) {
    const [, slug, id] = editMatch
    if (method === 'POST') return updateHandler(req, slug, id)
    return html(await editView(slug, id, user))
  }

  // Globals
  const globalMatch = path.match(/^\/admin\/globals\/([^/]+)$/)
  if (globalMatch) {
    const [, slug] = globalMatch
    if (method === 'POST') return updateGlobalHandler(req, slug)
    return html(await globalView(slug, user))
  }

  // Admin client JS (served statically from public/)
  if (path === '/admin/client.js') {
    const file = Bun.file('public/admin-client.js')
    if (await file.exists()) {
      return new Response(file, { headers: { 'Content-Type': 'application/javascript' } })
    }
    return new Response('// admin client', { headers: { 'Content-Type': 'application/javascript' } })
  }

  return new Response('Not found', { status: 404 })
}
