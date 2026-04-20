import { dashboardView } from './views/dashboard.js'
import { listView } from './views/list.js'
import { editView, createView, blockTemplateHtml } from './views/edit.js'
import { globalView } from './views/globals.js'
import { mediaView, mediaUploadView } from './views/media.js'
import { versionsView } from './views/versions.js'
import { updateHandler, createHandler, deleteHandler, updateGlobalHandler, mediaUploadHandler } from './api/crud.js'
import { requireSlug, requireId, requireGitHash } from '../utils/safe.js'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import nodePath from 'path'
import { resolve, join } from 'path'

const ADMIN_PUBLIC = fileURLToPath(new URL('../../public', import.meta.url))

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'self'; object-src 'none'"

const html = body => new Response(body, {
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
})

const adminScript = new Set(['/admin/client.js', '/admin/drawer.js', '/admin/preview.js', '/admin/search.js', '/admin/richtext.js'])
const scriptFile = { '/admin/client.js': 'admin-client.js', '/admin/drawer.js': 'admin-drawer.js', '/admin/preview.js': 'admin-preview.js', '/admin/search.js': 'admin-search.js', '/admin/richtext.js': 'admin-richtext.js' }

async function restoreVersion(collection, id, hash) {
  requireSlug(collection, 'collection')
  requireId(id, 'id')
  requireGitHash(hash)
  const filePath = join('content', collection, id + '.yaml')
  const cwd = resolve('.')
  const co = spawnSync('git', ['checkout', hash, '--', filePath], { cwd, encoding: 'utf8', timeout: 5000 })
  if (co.status !== 0) throw new Error(`git checkout failed: ${(co.stderr || '').trim()}`)
  const add = spawnSync('git', ['add', filePath], { cwd, encoding: 'utf8', timeout: 5000 })
  if (add.status !== 0) throw new Error(`git add failed: ${(add.stderr || '').trim()}`)
  const msg = `restore ${collection}/${id} to ${hash.slice(0, 8)}`
  const commit = spawnSync('git', ['commit', '-m', msg], { cwd, encoding: 'utf8', timeout: 5000 })
  if (commit.status !== 0) throw new Error(`git commit failed: ${(commit.stderr || '').trim()}`)
}

export async function adminRouter(req) {
  try { return await routeAdmin(req) }
  catch (err) {
    if (/invalid (slug|id|git hash|collection|global|filename)/.test(err.message)) {
      return new Response(`Bad request: ${err.message}`, { status: 400, headers: { 'Content-Type': 'text/plain' } })
    }
    throw err
  }
}

async function routeAdmin(req) {
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
    return new Response(inner, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': CSP } })
  }

  if (p === '/admin/api/versions/restore' && method === 'POST') {
    try {
      await restoreVersion(url.searchParams.get('collection'), url.searchParams.get('id'), url.searchParams.get('hash'))
      return Response.json({ ok: true })
    } catch (err) {
      return Response.json({ error: err.message }, { status: 400 })
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

  if (adminScript.has(p)) {
    const file = Bun.file(nodePath.join(ADMIN_PUBLIC, scriptFile[p]))
    return new Response(await file.exists() ? file : '', { headers: { 'Content-Type': 'application/javascript' } })
  }

  return new Response('Not found', { status: 404 })
}
