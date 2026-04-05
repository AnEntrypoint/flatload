import { loginView } from './views/login.js'
import { dashboardView } from './views/dashboard.js'
import { listView } from './views/list.js'
import { editView, createView, blockTemplateHtml } from './views/edit.js'
import { globalView } from './views/globals.js'
import { mediaView, mediaUploadView } from './views/media.js'
import { versionsView } from './views/versions.js'
import { loginHandler, logoutHandler, getUser } from './api/auth.js'
import { updateHandler, createHandler, deleteHandler, updateGlobalHandler, mediaUploadHandler } from './api/crud.js'

const html = body => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
const redirect = url => new Response(null, { status: 302, headers: { Location: url } })

export async function adminRouter(req) {
  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  if (path === '/admin/login') {
    if (method === 'POST') return loginHandler(req)
    return html(loginView())
  }
  if (path === '/admin/logout') return logoutHandler()

  const user = await getUser(req)
  if (!user) return redirect('/admin/login')

  if (path === '/admin' || path === '/admin/') return html(await dashboardView(user))

  if (path === '/admin/collections/media') {
    return html(await mediaView(user, { page: url.searchParams.get('page') || 1, search: url.searchParams.get('search') || '' }))
  }
  if (path === '/admin/collections/media/upload') {
    if (method === 'POST') return mediaUploadHandler(req)
    return html(mediaUploadView(user))
  }

  const apiDelete = path.match(/^\/admin\/api\/collections\/([^/]+)\/([^/]+)$/)
  if (apiDelete && method === 'DELETE') return deleteHandler(apiDelete[1], apiDelete[2])

  if (path === '/admin/api/block-template') {
    const collection = url.searchParams.get('collection') || ''
    const field = url.searchParams.get('field') || ''
    const blockType = url.searchParams.get('blockType') || ''
    const idx = parseInt(url.searchParams.get('idx') || '0', 10)
    const inner = await blockTemplateHtml(collection, field, blockType, idx)
    return new Response(inner, { headers: { 'Content-Type': 'text/html' } })
  }

  const versionsMatch = path.match(/^\/admin\/collections\/([^/]+)\/([^/]+)\/versions$/)
  if (versionsMatch) return html(await versionsView(versionsMatch[1], versionsMatch[2], user))

  const listMatch = path.match(/^\/admin\/collections\/([^/]+)$/)
  if (listMatch) {
    return html(await listView(listMatch[1], user, { page: url.searchParams.get('page') || 1, search: url.searchParams.get('search') || '' }))
  }

  const createMatch = path.match(/^\/admin\/collections\/([^/]+)\/create$/)
  if (createMatch) {
    if (method === 'POST') return createHandler(req, createMatch[1])
    return html(await createView(createMatch[1], user))
  }

  const editMatch = path.match(/^\/admin\/collections\/([^/]+)\/([^/]+)$/)
  if (editMatch) {
    if (method === 'POST') return updateHandler(req, editMatch[1], editMatch[2])
    return html(await editView(editMatch[1], editMatch[2], user))
  }

  const globalMatch = path.match(/^\/admin\/globals\/([^/]+)$/)
  if (globalMatch) {
    if (method === 'POST') return updateGlobalHandler(req, globalMatch[1])
    return html(await globalView(globalMatch[1], user))
  }

  if (path === '/admin/client.js') {
    const file = Bun.file('public/admin-client.js')
    return new Response(await file.exists() ? file : '// admin client', { headers: { 'Content-Type': 'application/javascript' } })
  }

  if (path === '/admin/richtext.js') {
    const file = Bun.file('public/admin-richtext.js')
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  return new Response('Not found', { status: 404 })
}
