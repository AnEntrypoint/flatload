// Admin layout shell — same CSS variables, dark/light theme, sidebar nav

export function adminLayout({ title = 'Admin', body, user = null, breadcrumb = '' }) {
  const nav = `
<aside class="w-64 border-r border-border bg-card flex flex-col min-h-screen shrink-0">
  <div class="p-4 border-b border-border">
    <a href="/admin" class="font-semibold text-lg">Zero-Hop Admin</a>
  </div>
  <nav class="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
    <a href="/admin" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Dashboard</a>
    <div class="text-xs text-muted-foreground px-3 py-1 mt-2 uppercase tracking-wide">Collections</div>
    <a href="/admin/collections/pages" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Pages</a>
    <a href="/admin/collections/posts" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Posts</a>
    <a href="/admin/collections/media" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Media</a>
    <a href="/admin/collections/categories" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Categories</a>
    <a href="/admin/collections/users" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Users</a>
    <div class="text-xs text-muted-foreground px-3 py-1 mt-2 uppercase tracking-wide">Globals</div>
    <a href="/admin/globals/header" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Header</a>
    <a href="/admin/globals/footer" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Footer</a>
    <div class="text-xs text-muted-foreground px-3 py-1 mt-2 uppercase tracking-wide">Plugins</div>
    <a href="/admin/collections/forms" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Forms</a>
    <a href="/admin/collections/redirects" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Redirects</a>
    <a href="/admin/collections/search" class="px-3 py-2 rounded text-sm hover:bg-muted transition-colors">Search</a>
  </nav>
  <div class="p-4 border-t border-border text-xs text-muted-foreground">
    ${user ? `<div class="mb-2 truncate">${user.email}</div>` : ''}
    <a href="/admin/logout" class="hover:text-foreground transition-colors">Sign out</a>
  </div>
</aside>`

  const header = `
<header class="h-14 border-b border-border flex items-center px-6 gap-4 bg-background">
  <button id="admin-sidebar-toggle" class="md:hidden">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
  <div class="text-sm text-muted-foreground">${breadcrumb}</div>
  <div class="ml-auto flex items-center gap-4">
    <a href="/" target="_blank" class="text-sm text-muted-foreground hover:text-foreground transition-colors">View Site ↗</a>
    <button id="admin-theme-toggle" class="text-muted-foreground hover:text-foreground transition-colors">
      <svg class="dark-icon hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
      <svg class="light-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    </button>
  </div>
</header>`

  const themeInit = `(function(){try{var t=localStorage.getItem('admin-theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Admin</title>
  <link rel="stylesheet" href="/app.css" />
  <script>${themeInit}</script>
</head>
<body class="bg-background text-foreground">
  <div class="flex min-h-screen">
    ${nav}
    <div class="flex-1 flex flex-col overflow-hidden">
      ${header}
      <main class="flex-1 overflow-y-auto p-6">
        ${body}
      </main>
    </div>
  </div>
  <script type="module" src="/admin/client.js"></script>
</body>
</html>`
}

export function adminLoginLayout({ body, error = '' }) {
  const themeInit = `(function(){try{var t=localStorage.getItem('admin-theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',(t==='dark'||(t==='system'&&d))?'dark':'light');}catch(e){}})();`
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login — Admin</title>
  <link rel="stylesheet" href="/app.css" />
  <script>${themeInit}</script>
</head>
<body class="bg-background text-foreground min-h-screen flex items-center justify-center">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold">Zero-Hop Admin</h1>
      <p class="text-muted-foreground text-sm mt-1">Sign in to continue</p>
    </div>
    ${error ? `<div class="mb-4 p-3 bg-error/30 border border-error rounded text-sm">${error}</div>` : ''}
    ${body}
  </div>
</body>
</html>`
}
