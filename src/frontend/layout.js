import { resolveLink } from './components/Link.js'

function renderHeader(header) {
  const navItems = (header?.navItems || []).map(({ link: l }) => {
    const { href, label } = resolveLink(l)
    return `<a href="${href}" class="text-sm font-medium hover:text-primary transition-colors">${label}</a>`
  }).join('')
  return `
<header class="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="container flex h-16 items-center justify-between gap-4">
    <a href="/" class="font-bold text-xl tracking-tight text-primary">Flatspace</a>
    <nav class="hidden md:flex items-center gap-6">
      ${navItems}
      <button id="theme-toggle" aria-label="Toggle theme" class="hover:text-primary transition-colors">
        <svg class="dark-icon hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        <svg class="light-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>
    </nav>
    <div class="flex md:hidden items-center gap-3">
      <button id="theme-toggle-mobile" aria-label="Toggle theme" class="hover:text-primary transition-colors">
        <svg class="dark-icon hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        <svg class="light-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </button>
      <button id="mobile-menu-toggle" aria-label="Open menu" class="hover:text-primary transition-colors">
        <svg class="menu-open-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        <svg class="menu-close-icon hidden" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="hidden md:hidden border-t border-border bg-background">
    <nav class="container flex flex-col py-4 gap-4">
      ${navItems}
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
<footer class="border-t border-border mt-auto bg-background">
  <div class="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
    <p class="text-sm text-muted-foreground">&copy; ${new Date().getFullYear()} Flatspace</p>
    ${navItems ? `<nav class="flex flex-wrap gap-6">${navItems}</nav>` : ''}
  </div>
</footer>`
}

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');var di=document.querySelectorAll('.dark-icon');var li=document.querySelectorAll('.light-icon');di.forEach(function(el){if(dark)el.classList.remove('hidden');else el.classList.add('hidden');});li.forEach(function(el){if(dark)el.classList.add('hidden');else el.classList.remove('hidden');});}catch(e){}})();`

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
  <title>${title || 'Flatspace'}</title>
  ${metaDesc}
  ${canonicalTag}
  <meta property="og:title" content="${title || 'Flatspace'}" />
  <meta property="og:type" content="website" />
  ${absCanonical ? `<meta property="og:url" content="${absCanonical}" />` : ''}
  ${ogImg}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title || 'Flatspace'}" />
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
