export const Pages = {
  slug: 'pages',
  fields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'slug', type: 'text', label: 'Slug' },
    {
      name: 'hero', type: 'group', label: 'Hero',
      fields: [
        { name: 'type', type: 'select', label: 'Hero Type', options: ['none','highImpact','mediumImpact','lowImpact'] },
        { name: 'richText', type: 'richText', label: 'Rich Text' },
        { name: 'media', type: 'upload', label: 'Media', relationTo: 'media' },
        { name: 'links', type: 'array', label: 'Links', fields: [{"name":"link","type":"group","fields":[{"name":"type","type":"select","label":"Type","options":["custom","reference"],"defaultValue":"custom"},{"name":"label","type":"text","label":"Label"},{"name":"url","type":"text","label":"URL"},{"name":"newTab","type":"checkbox","label":"Open in new tab"},{"name":"appearance","type":"select","label":"Appearance","options":["default","outline"]}]}] },
      ]
    },
    {"name":"meta","type":"group","label":"SEO","fields":[{"name":"title","type":"text","label":"Meta Title"},{"name":"description","type":"textarea","label":"Meta Description"},{"name":"image","type":"upload","label":"Meta Image","relationTo":"media"}]},
    { name: 'layout', type: 'blocks', label: 'Layout', blocks: [
      { slug: 'content', labels: { singular: 'Content' }, fields: [{ name: 'richText', type: 'richText', label: 'Rich Text' }] },
      { slug: 'cta', labels: { singular: 'Call to Action' }, fields: [{ name: 'richText', type: 'richText', label: 'Rich Text' }, { name: 'links', type: 'array', label: 'Links', fields: [{"name":"link","type":"group","fields":[{"name":"type","type":"select","label":"Type","options":["custom","reference"],"defaultValue":"custom"},{"name":"label","type":"text","label":"Label"},{"name":"url","type":"text","label":"URL"},{"name":"newTab","type":"checkbox","label":"Open in new tab"},{"name":"appearance","type":"select","label":"Appearance","options":["default","outline"]}]}] }] },
      { slug: 'archive', labels: { singular: 'Archive' }, fields: [{ name: 'introContent', type: 'richText', label: 'Intro Content' }, { name: 'relationTo', type: 'select', label: 'Relation To', options: ['posts'] }] },
      { slug: 'formBlock', labels: { singular: 'Form' }, fields: [{ name: 'form', type: 'relationship', label: 'Form', relationTo: 'forms' }] },
      { slug: 'banner', labels: { singular: 'Banner' }, fields: [{ name: 'style', type: 'select', label: 'Style', options: ['info','warning','error','success'] }, { name: 'content', type: 'richText', label: 'Content' }] },
      { slug: 'code', labels: { singular: 'Code' }, fields: [{ name: 'language', type: 'select', label: 'Language', options: ['typescript','javascript','css','html'] }, { name: 'code', type: 'textarea', label: 'Code' }] },
      { slug: 'mediaBlock', labels: { singular: 'Media Block' }, fields: [{ name: 'media', type: 'upload', label: 'Media', relationTo: 'media' }, { name: 'position', type: 'select', label: 'Position', options: ['default','fullscreen'] }] },
    ] },
  ]
}
