export function previewHandler(req) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('previewSecret')
  const path = url.searchParams.get('path') || '/'

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 401 })
  }

  const headers = new Headers()
  headers.set('Set-Cookie', `payload-preview=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`)
  headers.set('Location', path)
  return new Response(null, { status: 307, headers })
}

export function exitPreviewHandler() {
  const headers = new Headers()
  headers.set('Set-Cookie', `payload-preview=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
  headers.set('Location', '/')
  return new Response(null, { status: 307, headers })
}

export function isPreview(req) {
  const cookie = req.headers.get('cookie') || ''
  return cookie.includes('payload-preview=1')
}
