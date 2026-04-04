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

  const presets = {
    thumbnail: { w: 300 },
    square: { w: 500, h: 500 },
    small: { w: 600 },
    medium: { w: 900 },
    large: { w: 1400 },
    xlarge: { w: 1920 },
    og: { w: 1200, h: 630 },
  }

  const filename = resolved.filename
  const mimeType = resolved.mimeType || ''
  const altText = alt ?? resolved.alt ?? ''
  const loading = eager ? 'eager' : 'lazy'

  if (!filename) return ''

  const src = `/media/${encodeURIComponent(filename)}`
  const cls = className ? ` class="${className}"` : ''

  if (mimeType.startsWith('video/')) {
    return `<video src="${src}" autoplay muted loop playsinline${cls}></video>`
  }

  let imgSrc = src
  if (size && presets[size]) {
    const p = presets[size]
    imgSrc += `?w=${p.w}${p.h ? `&h=${p.h}` : ''}`
  }

  const widths = [300, 600, 900, 1400]
  const srcset = widths.map((w) => `/media/${encodeURIComponent(filename)}?w=${w} ${w}w`).join(', ')

  return `<img src="${imgSrc}" srcset="${srcset}" sizes="(max-width:640px) 100vw, (max-width:1024px) 75vw, 50vw" alt="${altText}"${cls} loading="${loading}" />`
}
