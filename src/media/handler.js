import path from 'path'
import fs from 'fs'

let MEDIA_DIR = path.resolve('public/media')

export function setMediaDir(dir) { MEDIA_DIR = path.resolve(dir) }

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

export async function mediaHandler(req) {
  const url = new URL(req.url)
  const filename = decodeURIComponent(url.pathname.replace(/^\/media\//, ''))
  const original = path.resolve(MEDIA_DIR, filename)
  if (!original.startsWith(MEDIA_DIR)) return new Response('Forbidden', { status: 403 })
  if (!fs.existsSync(original)) return new Response('Not found', { status: 404 })
  const ext = path.extname(filename).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  return new Response(Bun.file(original), {
    headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
  })
}
