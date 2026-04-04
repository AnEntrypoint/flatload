import { resolveLink } from './components/Link.js'

function renderHeader(header) {
  const navItems = (header?.navItems || []).map(({ link: l }) => {
    const { href, label } = resolveLink(l)
    return `<a href="${href}" class="text-sm font-medium hover:text-primary transition-colors">${label}</a>`
  }).join('')
  return `
<header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
  <div class="container flex h-16 items-center justify-between">
    <a href="/" class="font-semibold text-lg">Zero-Hop</a>
    <nav class="flex items-center gap-6">
      ${navItems}
      <a href="/search" aria-label="Search" class="hover:text-primary transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </a>
      <button id="theme-toggle" aria-label="Toggle theme" class="hover:text-primary transition-colors">
        <svg class="dark-icon hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        <svg class="light-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>
    </nav>
  </div>
</header>`
}

function renderFooter(footer) {
  const navItems = (footer?.navItems || []).map(({ link: l }) => {
    const { href, label } = resolveLink(l)
    return `<a href="${href}" class="text-sm text-muted-foreground hover:text-foreground transition-colors">${label}</a>`
  }).join('')
  return `
<footer class="border-t border-border mt-auto">
  <div class="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
    <p class="text-sm text-muted-foreground">&copy; ${new Date().getFullYear()} Zero-Hop</p>
    ${navItems ? `<nav class="flex flex-wrap gap-6">${navItems}</nav>` : ''}
  </div>
</footer>`
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');var di=document.querySelector('.dark-icon');var li=document.querySelector('.light-icon');if(dark){if(di)di.classList.remove('hidden');if(li)li.classList.add('hidden');}else{if(di)di.classList.add('hidden');if(li)li.classList.remove('hidden');}}catch(e){}})();`

export function renderLayout({ title, description, ogImage, canonical, body, header, footer, adminBar = '' }) {
  const serverUrl = process.env.SERVER_URL || ''
  const metaDesc = description ? `<meta name="description" content="${description}" />` : ''
  const absImage = ogImage ? (ogImage.startsWith('http') ? ogImage : `${serverUrl}${ogImage}`) : ''
  const absCanonical = canonical ? (canonical.startsWith('http') ? canonical : `${serverUrl}${canonical}`) : ''
  const ogImg = absImage ? `<meta property="og:image" content="${absImage}" /><meta name="twitter:image" content="${absImage}" />` : ''
  const canonicalTag = absCanonical ? `<link rel="canonical" href="${absCanonical}" />` : ''

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title || 'Zero-Hop'}</title>
  ${metaDesc}
  ${canonicalTag}
  <meta property="og:title" content="${title || 'Zero-Hop'}" />
  <meta property="og:type" content="website" />
  ${absCanonical ? `<meta property="og:url" content="${absCanonical}" />` : ''}
  ${ogImg}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title || 'Zero-Hop'}" />
  ${metaDesc ? `<meta name="twitter:description" content="${description}" />` : ''}
  <link rel="stylesheet" href="/app.css" />
  <script>${themeInitScript}</script>
</head>
<body class="bg-background text-foreground min-h-screen flex flex-col">
  ${adminBar}
  ${renderHeader(header)}
  <main class="flex-1">
    ${body}
  </main>
  ${renderFooter(footer)}
  <script type="module" src="/client.js"></script>
</body>
</html>`
}

export { renderHeader, renderFooter }
