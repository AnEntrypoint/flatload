import { findByID } from '../../store/index.js'

function resolveMedia(media) {
  if (!media) return null
  if (typeof media === 'object') return media
  const doc = findByID({ collection: 'media', id: media })
  return doc || { filename: media }
}

export function renderMedia(media, { size, className = '', alt, eager = false } = {}) {
  const resolved = resolveMedia(media)
  if (!resolved) return ''

  const filename = resolved.filename
  const mimeType = resolved.mimeType || ''
  const altText = alt ?? resolved.alt ?? ''
  const loading = eager ? 'eager' : 'lazy'

  if (!filename) return ''

  const cls = className ? ` class="${className}"` : ''
  const isExternal = filename.startsWith('http')

  if (mimeType.startsWith('video/')) {
    const src = isExternal ? filename : `/media/${encodeURIComponent(filename)}`
    return `<video src="${src}" autoplay muted loop playsinline${cls}></video>`
  }

  if (isExternal) {
    return `<img src="${filename}" alt="${altText}"${cls} loading="${loading}" />`
  }

  const src = `/media/${encodeURIComponent(filename)}`
  const widths = [300, 600, 900, 1400]
  const srcset = widths.map((w) => `/media/${encodeURIComponent(filename)}?w=${w} ${w}w`).join(', ')

  return `<img src="${src}" srcset="${srcset}" sizes="(max-width:640px) 100vw, (max-width:1024px) 75vw, 50vw" alt="${altText}"${cls} loading="${loading}" />`
}
