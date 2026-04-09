import { dashboardView } from './views/dashboard.js'
import { listView } from './views/list.js'
import { editView, createView, blockTemplateHtml } from './views/edit.js'
import { globalView } from './views/globals.js'
import { mediaView, mediaUploadView } from './views/media.js'
import { versionsView } from './views/versions.js'
import { updateHandler, createHandler, deleteHandler, updateGlobalHandler, mediaUploadHandler } from './api/crud.js'
import { fileURLToPath } from 'url'
import nodePath from 'path'

const ADMIN_PUBLIC = fileURLToPath(new URL('../../public', import.meta.url))

const html = body => new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

export async function adminRouter(req) {
  const url = new URL(req.url)
  const p = url.pathname
  const method = req.method

  if (p === '/admin' || p === '/admin/') return html(await dashboardView())

  if (p === '/admin/collections/media') {
    return html(await mediaView({ page: url.searchParams.get('page') || 1, search: url.searchParams.get('search') || '' }))
  }
  if (p === '/admin/collections/media/upload') {
    if (method === 'POST') return mediaUploadHandler(req)
    return html(mediaUploadView())
  }

  const apiDelete = p.match(/^\/admin\/api\/collections\/([^/]+)\/([^/]+)$/)
  if (apiDelete && method === 'DELETE') return deleteHandler(apiDelete[1], apiDelete[2])

  if (p === '/admin/api/block-template') {
    const collection = url.searchParams.get('collection') || ''
    const field = url.searchParams.get('field') || ''
    const blockType = url.searchParams.get('blockType') || ''
    const idx = parseInt(url.searchParams.get('idx') || '0', 10)
    const inner = await blockTemplateHtml(collection, field, blockType, idx)
    return new Response(inner, { headers: { 'Content-Type': 'text/html' } })
  }

  if (p === '/admin/api/versions/restore' && method === 'POST') {
    const collection = url.searchParams.get('collection')
    const docId = url.searchParams.get('id')
    const hash = url.searchParams.get('hash')
    if (!collection || !docId || !hash) return Response.json({ error: 'missing params' }, { status: 400 })
    try {
      const { execSync } = await import('child_process')
      const { resolve, join } = await import('path')
      const filePath = join('content', collection, docId + '.yaml')
      execSync(`git checkout ${hash} -- "${filePath}"`, { cwd: resolve('.') })
      execSync(`git add "${filePath}" && git commit -m "restore ${collection}/${docId} to ${hash.slice(0, 8)}"`, { cwd: resolve('.') })
      return Response.json({ ok: true })
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 })
    }
  }

  const versionsMatch = p.match(/^\/admin\/collections\/([^/]+)\/([^/]+)\/versions$/)
  if (versionsMatch) return html(await versionsView(versionsMatch[1], versionsMatch[2], { diff: url.searchParams.get('diff') || '' }))

  const listMatch = p.match(/^\/admin\/collections\/([^/]+)$/)
  if (listMatch) {
    return html(await listView(listMatch[1], { page: url.searchParams.get('page') || 1, search: url.searchParams.get('search') || '', sort: url.searchParams.get('sort') || '' }))
  }

  const createMatch = p.match(/^\/admin\/collections\/([^/]+)\/create$/)
  if (createMatch) {
    if (method === 'POST') return createHandler(req, createMatch[1])
    return html(await createView(createMatch[1]))
  }

  const editMatch = p.match(/^\/admin\/collections\/([^/]+)\/([^/]+)$/)
  if (editMatch) {
    if (method === 'POST') return updateHandler(req, editMatch[1], editMatch[2])
    return html(await editView(editMatch[1], editMatch[2]))
  }

  const globalMatch = p.match(/^\/admin\/globals\/([^/]+)$/)
  if (globalMatch) {
    if (method === 'POST') return updateGlobalHandler(req, globalMatch[1])
    return html(await globalView(globalMatch[1]))
  }

  if (p === '/admin/client.js') {
    const file = Bun.file(nodePath.join(ADMIN_PUBLIC, 'admin-client.js'))
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  if (p === '/admin/drawer.js') {
    const file = Bun.file(nodePath.join(ADMIN_PUBLIC, 'admin-drawer.js'))
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  if (p === '/admin/preview.js') {
    const file = Bun.file(nodePath.join(ADMIN_PUBLIC, 'admin-preview.js'))
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  if (p === '/admin/search.js') {
    const file = Bun.file(nodePath.join(ADMIN_PUBLIC, 'admin-search.js'))
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  if (p === '/admin/richtext.js') {
    const file = Bun.file(nodePath.join(ADMIN_PUBLIC, 'admin-richtext.js'))
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  return new Response('Not found', { status: 404 })
}
