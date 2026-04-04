import { find } from '../../store/index.js'
import bcrypt from 'bcryptjs'

export async function loginHandler(req) {
  const form = await req.formData()
  const email = form.get('email')
  const password = form.get('password')

  try {
    const result = find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    const user = result.docs?.[0]
    if (!user || !user.hash) throw new Error('Invalid credentials')
    const valid = await bcrypt.compare(password, user.hash)
    if (!valid) throw new Error('Invalid credentials')
    const token = Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 604800000 })).toString('base64')
    const headers = new Headers({ Location: '/admin' })
    headers.append('Set-Cookie', `payload-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`)
    return new Response(null, { status: 302, headers })
  } catch {
    const { loginView } = await import('../views/login.js')
    return new Response(loginView({ error: 'Invalid email or password' }), {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

export function logoutHandler() {
  const headers = new Headers({ Location: '/admin/login' })
  headers.append('Set-Cookie', 'payload-token=; Path=/; HttpOnly; Max-Age=0')
  return new Response(null, { status: 302, headers })
}

export async function getUser(req) {
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/payload-token=([^;]+)/)
  if (!match) return null
  try {
    const payload = JSON.parse(Buffer.from(match[1], 'base64').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch { return null }
}
