import { resolve, sep, basename, extname } from 'path'

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/i
const ID_RE = /^[a-z0-9][a-z0-9._-]{0,199}$/i
const HASH_RE = /^[a-f0-9]{7,40}$/i
const FILENAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,254}$/

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => HTML_ENTITIES[c])
}

export function escapeAttr(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => HTML_ENTITIES[c])
}

export function escapeJs(str) {
  return String(str ?? '').replace(/[\\'"<>&\r\n\u2028\u2029]/g, c => {
    const code = c.charCodeAt(0).toString(16).padStart(4, '0')
    return '\\u' + code
  })
}

export function validSlug(s) { return typeof s === 'string' && SLUG_RE.test(s) }
export function validId(s) { return typeof s === 'string' && ID_RE.test(s) }
export function validGitHash(s) { return typeof s === 'string' && HASH_RE.test(s) }
export function validFilename(s) { return typeof s === 'string' && FILENAME_RE.test(s) && !s.includes('..') }

export function requireSlug(s, label = 'slug') {
  if (!validSlug(s)) throw new Error(`invalid ${label}: ${JSON.stringify(s)}`)
  return s
}

export function requireId(s, label = 'id') {
  if (!validId(s)) throw new Error(`invalid ${label}: ${JSON.stringify(s)}`)
  return s
}

export function requireGitHash(s) {
  if (!validGitHash(s)) throw new Error(`invalid git hash: ${JSON.stringify(s)}`)
  return s
}

export function safeJoin(root, ...segments) {
  const absRoot = resolve(root)
  const target = resolve(absRoot, ...segments)
  if (target !== absRoot && !target.startsWith(absRoot + sep)) {
    throw new Error(`path traversal blocked: ${target}`)
  }
  return target
}

export function safeFilename(name) {
  const base = basename(String(name || ''))
  const ext = extname(base).toLowerCase()
  const stem = base.slice(0, base.length - ext.length).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
  const cleaned = (stem || 'file') + ext.replace(/[^a-zA-Z0-9.]/g, '')
  if (!validFilename(cleaned)) throw new Error(`invalid filename: ${JSON.stringify(name)}`)
  return cleaned
}
