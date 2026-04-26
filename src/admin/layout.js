import { getCollections, getGlobalConfigs } from './registry.js'

function getNav() {
  const collections = getCollections().map(c => ({ slug: c.slug, label: c.labels?.plural || c.slug.charAt(0).toUpperCase() + c.slug.slice(1) }))
  const globals = getGlobalConfigs().map(g => ({ slug: g.slug, label: g.slug.charAt(0).toUpperCase() + g.slug.slice(1) }))
  return { collections, globals }
}

const themeScript = `(function(){try{var t=localStorage.getItem('admin-theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`

function sideLink(href, label, currentPath, glyph = '·') {
  const active = currentPath === href || (href !== '/admin' && currentPath?.startsWith(href))
  return `<a href="${href}"${active ? ' class="active"' : ''}><span class="glyph">${glyph}</span>${label}</a>`
}

export function adminLayout({ title = 'admin', body, breadcrumb = '', path = '' }) {
  const { collections, globals } = getNav()
  const collectionLinks = collections.map(c => sideLink('/admin/collections/' + c.slug, c.label, path, '//')).join('')
  const globalLinks = globals.map(g => sideLink('/admin/globals/' + g.slug, g.label, path, '§')).join('')

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — flatspace</title>
  <meta name="theme-color" content="#247420" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#92CEAC" media="(prefers-color-scheme: dark)">
  <meta name="color-scheme" content="light dark">
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500;600;700&display=swap">
  <link rel="stylesheet" href="/app.css" />
  <link rel="stylesheet" href="/admin-brand.css" />
  <script>${themeScript}</script>
</head>
<body>
  <div class="app">
    <header class="app-topbar">
      <a href="/admin" class="brand">flatspace<span class="slash"> // </span><span class="mono-dim">admin</span></a>
      <nav>
        <a href="/admin"${path === '/admin' ? ' class="active"' : ''}>dashboard</a>
        <a href="/" target="_blank">view site ↗</a>
        <a href="#" id="admin-theme-toggle" title="toggle theme">◐</a>
      </nav>
    </header>
    ${breadcrumb ? `<div class="app-crumb">${breadcrumb}</div>` : ''}
    <div class="app-body">
      <aside class="app-side">
        <div class="group">collections</div>
        ${collectionLinks}
        ${globals.length ? `<div class="group">globals</div>${globalLinks}` : ''}
      </aside>
      <main class="app-main">
        ${body}
      </main>
    </div>
    <div class="app-status">
      <span class="item">247420 // flatspace</span>
      <span class="spread"></span>
      <span class="item">probably emerging 🌀</span>
    </div>
  </div>
  <script defer src="/admin/richtext.js"></script>
  <script type="module" src="/admin/client.js"></script>
  <script defer src="/admin/search.js"></script>
  <script defer src="/admin/drawer.js"></script>
  <script defer src="/admin/preview.js"></script>
</body>
</html>`
}
