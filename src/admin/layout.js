const COLLECTIONS = [
  { slug: 'pages', label: 'Pages' },
  { slug: 'posts', label: 'Posts' },
  { slug: 'media', label: 'Media' },
  { slug: 'categories', label: 'Categories' },
  { slug: 'users', label: 'Users' },
  { slug: 'forms', label: 'Forms' },
  { slug: 'redirects', label: 'Redirects' },
  { slug: 'search', label: 'Search' },
]

const GLOBALS = [
  { slug: 'header', label: 'Header' },
  { slug: 'footer', label: 'Footer' },
]

const themeScript = `(function(){try{var t=localStorage.getItem('admin-theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`

function navLink(href, label, currentPath) {
  const active = currentPath === href || (href !== '/admin' && currentPath?.startsWith(href))
  return `<li class="menu-item${active ? ' active' : ''}"><a href="${href}" class="w-full${active ? ' font-medium text-primary' : ''}">${label}</a></li>`
}

export function adminLayout({ title = 'Admin', body, user = null, breadcrumb = '', path = '' }) {
  const collectionLinks = COLLECTIONS.map(c => navLink('/admin/collections/' + c.slug, c.label, path)).join('')
  const globalLinks = GLOBALS.map(g => navLink('/admin/globals/' + g.slug, g.label, path)).join('')

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Admin</title>
  <link rel="stylesheet" href="/app.css" />
  <script>${themeScript}</script>
</head>
<body class="min-h-screen flex">
  <div class="sidebar sidebar-sticky w-64 shrink-0 border-r border-border/30">
    <div class="p-4 border-b border-border/30">
      <a href="/admin" class="font-semibold text-base text-content1">Flatload Admin</a>
    </div>
    <nav class="menu p-3 flex-1 overflow-y-auto">
      <ul class="menu-items">
        ${navLink('/admin', 'Dashboard', path)}
        <li><span class="menu-title px-2 mt-3">Collections</span></li>
        ${collectionLinks}
        <li><span class="menu-title px-2 mt-3">Globals</span></li>
        ${globalLinks}
      </ul>
    </nav>
    <div class="p-4 border-t border-border/30 text-xs text-content3">
      ${user ? `<div class="mb-2 truncate">${user.email}</div>` : ''}
      <a href="/admin/logout" class="hover:text-content1 transition-colors">Sign out</a>
    </div>
  </div>
  <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
    <header class="navbar bg-backgroundSecondary border-b border-border/30 h-14 px-6 shrink-0">
      <div class="navbar-start">
        <span class="text-sm text-content2">${breadcrumb}</span>
      </div>
      <div class="navbar-end gap-4">
        <a href="/" target="_blank" class="text-sm text-content2 hover:text-content1 transition-colors">View Site ↗</a>
        <button id="admin-theme-toggle" class="btn btn-ghost btn-sm">
          <svg class="dark-icon hidden" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          <svg class="light-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-y-auto p-6">
      ${body}
    </main>
  </div>
  <script defer src="/admin/richtext.js"></script>
  <script type="module" src="/admin/client.js"></script>
</body>
</html>`
}

export function adminLoginLayout({ body, error = '' }) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login — Admin</title>
  <link rel="stylesheet" href="/app.css" />
  <script>${themeScript}</script>
</head>
<body class="min-h-screen flex items-center justify-center">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold">Flatload Admin</h1>
      <p class="text-content2 text-sm mt-1">Sign in to continue</p>
    </div>
    ${error ? `<div class="alert alert-error mb-4">${error}</div>` : ''}
    ${body}
  </div>
</body>
</html>`
}
