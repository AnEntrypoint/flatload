# flatspace

Flat-file CMS — YAML content, Bun SSR, zero-hop stack. Git-based versioning and access control (no user accounts).

## Architecture

- `src/server.js` — Bun HTTP server, routes to admin/frontend/API
- `src/store/index.js` — YAML-based CRUD operations on `content/` directory
- `src/admin/` — Server-rendered admin panel (HTML string templates)
- `src/admin/registry.js` — Auto-discovers collections from `src/payload/collections/`
- `src/admin/api/crud.js` — CRUD handlers with git auto-commit
- `src/frontend/` — SSR frontend pages/blocks/components
- `src/payload/collections/` — Collection schemas (Pages, Posts, Media, Categories, Forms, Redirects)
- `src/payload/globals/` — Global schemas (Header, Footer)
- `public/` — Client-side JS (admin-client, admin-richtext, admin-search, admin-drawer, admin-preview)

## Admin Panel

No login required — access is controlled via git push/pull permissions.
Features: sidebar nav, dark mode, breadcrumbs, sortable/filterable list view, bulk operations, global search (Cmd/Ctrl+K), document drawer, draft/publish workflow, live preview, version history with git diff and restore.

## CLI (npx flatspace)

```
npx flatspace aggregate --input <file.json> --output <out.json> [--type images|videos|merge]
```

### Types
- `images` — array of `{filename,date,size}` → object map
- `videos` — object map → sorted array by date desc
- `merge` — array of objects → merged single object

## API

- `GET /api/:collection` — list documents (supports where, sort, limit, page params)
- `GET /api/:collection/:id` — get document
- `POST /api/:collection` — create document
- `PATCH /api/:collection/:id` — update document
- `DELETE /api/:collection/:id` — delete document
- `GET /api/globals/:slug` — get global
- `PATCH /api/globals/:slug` — update global

## Dev

`bun run --hot src/server.js` — dev server with hot reload
`bun run build` — static export to docs/

## Publish

Push to main → GH Actions auto-bumps patch version and publishes to npm.
Published files: `index.js`, `src/`, `bin/` (set via `files` field in package.json).
