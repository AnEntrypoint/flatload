export const Posts = {
  slug: 'posts',
  fields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'slug', type: 'text', label: 'Slug' },
    { name: 'heroImage', type: 'upload', label: 'Hero Image', relationTo: 'media' },
    { name: 'content', type: 'richText', label: 'Content' },
    { name: 'relatedPosts', type: 'relationship', label: 'Related Posts', relationTo: 'posts', hasMany: true },
    { name: 'categories', type: 'relationship', label: 'Categories', relationTo: 'categories', hasMany: true },
    { name: 'publishedAt', type: 'date', label: 'Published At' },
    {"name":"meta","type":"group","label":"SEO","fields":[{"name":"title","type":"text","label":"Meta Title"},{"name":"description","type":"textarea","label":"Meta Description"},{"name":"image","type":"upload","label":"Meta Image","relationTo":"media"}]},
  ]
}
