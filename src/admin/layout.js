import { getCollections, getGlobalConfigs } from './registry.js'

function getNav() {
  const collections = getCollections().map(c => ({ slug: c.slug, label: c.labels?.plural || c.slug.charAt(0).toUpperCase() + c.slug.slice(1) }))
  const globals = getGlobalConfigs().map(g => ({ slug: g.slug, label: g.slug.charAt(0).toUpperCase() + g.slug.slice(1) }))
  return { collections, globals }
}

const themeScript = `(function(){try{
const sidebarState = localStorage.getItem('admin-sidebar') || 'open';
document.documentElement.setAttribute('data-sidebar', sidebarState);var t=localStorage.getItem('admin-theme')||'system';var d=window.matchMedia('(prefers-color-scheme:dark)').matches;var dark=(t==='dark')||(t==='system'&&d);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`

function navLink(href, label, currentPath) {
  const active = currentPath === href || (href !== '/admin' && currentPath?.startsWith(href))
  return `<li class="menu-item${active ? ' active' : ''}"><a href="${href}" class="w-full${active ? ' font-medium text-primary' : ''}">${label}</a></li>`
}

export function adminLayout({ title = 'Admin', body, breadcrumb = '', path = '' }) {
  const { collections, globals } = getNav()
  const collectionLinks = collections.map(c => navLink('/admin/collections/' + c.slug, c.label, path)).join('')
  const globalLinks = globals.map(g => navLink('/admin/globals/' + g.slug, g.label, path)).join('')

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Admin</title>
  <link rel="stylesheet" href="/app.css" />
  <script>${themeScript}</script>
  <style>
[data-sidebar="collapsed"] .sidebar { width: 0; overflow: hidden; padding: 0; border: none; }
[data-sidebar="collapsed"] .sidebar-label { display: none; }
@media (max-width: 1023px) { .sidebar { display: none; } .sidebar.mobile-open { display: flex; position: fixed; z-index: 40; top: 0; left: 0; height: 100vh; width: 16rem; background: var(--backgroundPrimary, #fff); } }
</style>
</head>
<body class="min-h-screen flex">
  <div class="sidebar sidebar-sticky w-64 shrink-0 border-r border-border/30">
    <div class="p-4 border-b border-border/30">
      <a href="/admin" class="font-semibold text-base text-content1 sidebar-label">Flatspace</a>
      <button id="sidebar-toggle" class="btn btn-ghost btn-xs ml-auto sidebar-label" onclick="var s=document.documentElement.getAttribute('data-sidebar')==='open'?'collapsed':'open';document.documentElement.setAttribute('data-sidebar',s);localStorage.setItem('admin-sidebar',s)">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/></svg>
      </button>
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
  </div>
  <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
    <header class="navbar bg-backgroundSecondary border-b border-border/30 h-14 px-6 shrink-0">
      <div class="navbar-start gap-2">
        <button id="mobile-menu" class="btn btn-ghost btn-sm lg:hidden" onclick="document.querySelector('.sidebar').classList.toggle('mobile-open')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <nav class="text-sm text-content2 flex items-center gap-1">${breadcrumb}</nav>
      </div>
      <div class="navbar-end gap-4">
        <button onclick="openGlobalSearch()" class="btn btn-ghost btn-sm text-content2 gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span class="hidden md:inline text-xs">Search</span><kbd class="hidden md:inline text-[10px] bg-muted px-1 rounded">⌘K</kbd></button>
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
  <script defer src="/admin/search.js"></script>
  <script defer src="/admin/drawer.js"></script>
  <script defer src="/admin/preview.js"></script>
</body>
</html>`
}
