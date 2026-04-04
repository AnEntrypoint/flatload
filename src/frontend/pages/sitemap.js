import { payload } from '../../utils/getPayload.js'

const serverURL = process.env.SERVER_URL || 'http://localhost:3000'

function xmlEsc(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

function sitemapXml(urls) {
  const items = urls.map(({ loc, lastmod, changefreq = 'weekly', priority = '0.7' }) =>
    `  <url>
    <loc>${xmlEsc(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`
}

export async function pagesSitemap() {
  const result = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })
  const urls = result.docs.map((doc) => ({
    loc: `${serverURL}/${doc.slug === 'home' ? '' : doc.slug}`,
    lastmod: doc.updatedAt?.split('T')[0],
    priority: doc.slug === 'home' ? '1.0' : '0.8',
  }))
  return new Response(sitemapXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}

export async function postsSitemap() {
  const result = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })
  const urls = result.docs.map((doc) => ({
    loc: `${serverURL}/posts/${doc.slug}`,
    lastmod: doc.updatedAt?.split('T')[0],
    changefreq: 'monthly',
    priority: '0.6',
  }))
  return new Response(sitemapXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
