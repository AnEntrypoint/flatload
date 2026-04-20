import { find, findByID, create, update, del, updateGlobal } from '../../store/index.js'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { spawnSync } from 'child_process'
import { safeJoin, safeFilename, requireSlug, requireId } from '../../utils/safe.js'

function setDeep(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const next = parts[i + 1]
    if (!cur[part]) cur[part] = /^\d+$/.test(next) ? [] : {}
    cur = cur[part]
  }
  const last = parts[parts.length - 1]
  if (value === 'true') value = true
  else if (value === 'false') value = false
  else if (value === '') value = null
  else if (typeof value === 'string' && (value[0] === '{' || value[0] === '[')) {
    try { value = JSON.parse(value) } catch {}
  }
  cur[last] = value
}

function parseFormData(formData) {
  const flat = {}
  for (const [key, val] of formData.entries()) flat[key] = val
  const result = {}
  for (const [key, val] of Object.entries(flat)) {
    if (key.startsWith('_') && key !== '_status' && key !== '_action') continue
    setDeep(result, key, val)
  }
  if (flat._action === 'publish') result._status = 'published'
  else if (flat._action === 'draft') result._status = 'draft'
  else if (flat._status) result._status = flat._status
  return result
}

function git(args, opts = {}) {
  return spawnSync('git', args, { encoding: 'utf8', timeout: 10000, ...opts })
}

function gitCommit(msg) {
  try {
    const add = git(['add', '-A', 'content/'])
    if (add.status !== 0) { console.error('git add failed:', add.stderr); return }
    const diff = git(['diff', '--cached', '--quiet'])
    if (diff.status === 0) return
    const r = git(['commit', '-m', String(msg)])
    if (r.status !== 0) console.error('git commit failed:', r.stderr)
  } catch (err) { console.error('git commit failed:', err.message) }
}

export async function updateHandler(req, collection, id) {
  try { requireSlug(collection, 'collection'); requireId(id, 'id') }
  catch (err) { return new Response(`Error: ${err.message}`, { status: 400 }) }
  const form = await req.formData()
  const data = parseFormData(form)
  if (data.password == null) delete data.password
  try {
    update({ collection, id, data })
    gitCommit(`update ${collection}/${id}`)
    return new Response(null, { status: 302, headers: { Location: `/admin/collections/${encodeURIComponent(collection)}/${encodeURIComponent(id)}?saved=1` } })
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}

export async function createHandler(req, collection) {
  try { requireSlug(collection, 'collection') }
  catch (err) { return new Response(`Error: ${err.message}`, { status: 400 }) }
  const form = await req.formData()
  const data = parseFormData(form)
  try {
    const doc = create({ collection, data })
    gitCommit(`create ${collection}/${doc.id}`)
    return new Response(null, { status: 302, headers: { Location: `/admin/collections/${encodeURIComponent(collection)}/${encodeURIComponent(doc.id)}?created=1` } })
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}

export async function deleteHandler(collection, id) {
  try { requireSlug(collection, 'collection'); requireId(id, 'id') }
  catch (err) { return Response.json({ error: err.message }, { status: 400 }) }
  try {
    del({ collection, id })
    gitCommit(`delete ${collection}/${id}`)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function updateGlobalHandler(req, slug) {
  try { requireSlug(slug, 'global') }
  catch (err) { return new Response(`Error: ${err.message}`, { status: 400 }) }
  const form = await req.formData()
  const data = parseFormData(form)
  try {
    updateGlobal({ slug, data })
    gitCommit(`update global ${slug}`)
    return new Response(null, { status: 302, headers: { Location: `/admin/globals/${encodeURIComponent(slug)}?saved=1` } })
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}

export async function mediaUploadHandler(req) {
  const form = await req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') return new Response('No file', { status: 400 })
  try {
    const cleanName = safeFilename(file.name)
    const buf = Buffer.from(await file.arrayBuffer())
    const mediaRoot = resolve('public/media')
    mkdirSync(mediaRoot, { recursive: true })
    const target = safeJoin(mediaRoot, cleanName)
    writeFileSync(target, buf)
    const doc = create({ collection: 'media', data: { alt: form.get('alt') || cleanName, filename: cleanName, mimeType: file.type, filesize: file.size } })
    gitCommit(`upload media ${cleanName}`)
    return new Response(null, { status: 302, headers: { Location: `/admin/collections/media/${encodeURIComponent(doc.id)}?created=1` } })
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500, headers: { 'Content-Type': 'text/plain' } })
  }
}
