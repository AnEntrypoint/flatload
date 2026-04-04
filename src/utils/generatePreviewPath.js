const collectionPrefixMap = { posts: '/posts', pages: '' }

export const generatePreviewPath = ({ collection, slug }) => {
  if (slug === undefined || slug === null) return null
  const encodedSlug = encodeURIComponent(slug)
  const params = new URLSearchParams({
    slug: encodedSlug,
    collection,
    path: `${collectionPrefixMap[collection]}/${encodedSlug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })
  return `/next/preview?${params}`
}
