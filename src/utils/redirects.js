import { find } from '../store/index.js'

export async function checkRedirect(pathname) {
  try {
    const result = find({ collection: 'redirects', where: { from: { equals: pathname } }, limit: 1 })
    const doc = result.docs?.[0]
    if (!doc) return null
    const to = doc.to
    if (!to) return null
    if (typeof to === 'string') return { url: to, statusCode: doc.type || 301 }
    if (to.type === 'reference' && to.reference?.value?.slug) {
      const prefix = to.reference.relationTo === 'posts' ? '/posts' : ''
      return { url: `${prefix}/${to.reference.value.slug}`, statusCode: doc.type || 301 }
    }
    if (to.url) return { url: to.url, statusCode: doc.type || 301 }
    return null
  } catch (err) { console.error('redirect check failed:', err.message); return null }
}
