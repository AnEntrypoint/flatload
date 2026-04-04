import { renderMedia } from '../components/Media.js'
import { renderRichText } from '../components/RichText.js'

export function renderMediaBlock(block) {
  const media = block.media
  if (!media) return ''
  const isVideo = media.mimeType?.startsWith('video/')
  let mediaHtml
  if (isVideo) {
    mediaHtml = `<video src="/media/${media.filename}" controls class="w-full rounded"></video>`
  } else {
    mediaHtml = renderMedia(media, { size: 'large', className: 'w-full rounded' })
  }
  const caption = media.caption ? `<figcaption class="text-sm text-muted-foreground mt-2 text-center">${renderRichText(media.caption)}</figcaption>` : ''
  return `<figure class="my-8">${mediaHtml}${caption}</figure>`
}
