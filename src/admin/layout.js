export function adminLayout({ title = 'Admin', body, user = null, breadcrumb = '' }) {
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
<body class="bg-backgroundPrimary text-content1 min-h-screen flex">
  <div class="sidebar sidebar-sticky w-64 shrink-0 border-r border-border/30">
    <div class="p-4 border-b border-border/30">
      <a href="/admin" class="font-semibold text-base text-content1">Flatload Admin</a>
    </div>
    <nav class="menu p-3 flex-1">
      <ul class="menu-items">
        <li class="menu-item" onclick="location.href='/admin'">
          <a href="/admin" class="w-full">Dashboard</a>
        </li>
        <li><span class="menu-title px-2 mt-3">Collections</span></li>
        <li class="menu-item"><a href="/admin/collections/pages" class="w-full">Pages</a></li>
        <li class="menu-item"><a href="/admin/collections/posts" class="w-full">Posts</a></li>
        <li class="menu-item"><a href="/admin/collections/media" class="w-full">Media</a></li>
        <li class="menu-item"><a href="/admin/collections/categories" class="w-full">Categories</a></li>
        <li class="menu-item"><a href="/admin/collections/users" class="w-full">Users</a></li>
        <li><span class="menu-title px-2 mt-3">Globals</span></li>
        <li class="menu-item"><a href="/admin/globals/header" class="w-full">Header</a></li>
        <li class="menu-item"><a href="/admin/globals/footer" class="w-full">Footer</a></li>
        <li><span class="menu-title px-2 mt-3">Plugins</span></li>
        <li class="menu-item"><a href="/admin/collections/forms" class="w-full">Forms</a></li>
        <li class="menu-item"><a href="/admin/collections/redirects" class="w-full">Redirects</a></li>
        <li class="menu-item"><a href="/admin/collections/search" class="w-full">Search</a></li>
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
<body class="bg-backgroundPrimary text-content1 min-h-screen flex items-center justify-center">
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
