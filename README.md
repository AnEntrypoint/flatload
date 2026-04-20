# flatspace

Flat-file CMS — buildless Bun SSR, YAML content, git-based versioning.

[![npm](https://img.shields.io/npm/v/flatspace)](https://www.npmjs.com/package/flatspace)

## Live demo

https://anentrypoint.github.io/flatspace/

## Quick start

```bash
bun install
bun run --hot src/server.js
```

Open http://localhost:3000

## Build static site (GitHub Pages)

```bash
bun run build
```

Output lands in `docs/`. GitHub Pages serves from `docs/` on `main`.

## Content

All content lives in `content/` as YAML files:

```
content/
  pages/        # home.yaml, contact.yaml, ...
  posts/        # blog posts
  globals/      # header.yaml, footer.yaml
  categories/   # taxonomy
  media/        # image metadata (filename, alt, mimeType)
  forms/        # contact form definition
  search/       # search index entries
```

Edit any YAML file, save — flatspace auto-commits to git. Push to deploy.

## Admin panel

The admin panel at `/admin` provides a Payload-like CMS experience with no login required — access is controlled via git push/pull permissions. Git tracks who changed what.

### Features

- **Sidebar navigation** with collapsible toggle and mobile hamburger
- **Dark/light mode** with system preference detection
- **Sortable columns** — click any column header to sort
- **Bulk operations** — select multiple documents, bulk delete
- **Global search** — Cmd/Ctrl+K searches across all collections
- **Draft/Publish workflow** — Save Draft or Publish buttons, status badges in list view
- **Rich text editor** — WYSIWYG toolbar (bold, italic, headings, lists, links, code, blockquote) with Lexical JSON output
- **Relationship picker** — searchable modal for linking related documents
- **Media library** — thumbnail grid picker, drag-and-drop upload
- **Blocks editor** — add/remove/reorder layout blocks with schema-driven fields
- **Document drawer** — slide-out panel for inline editing of related documents
- **Live preview** — iframe-based preview panel in edit view
- **Version history** — git-backed history with author, diff view, and restore to prior version
- **Breadcrumbs** — clickable navigation: Dashboard > Collection > Document
- **Auto-discovery** — add a collection schema file and it appears in the admin

## API

```
GET    /api/:collection              # list (supports where, sort, limit, page)
GET    /api/:collection/:id          # get document
POST   /api/:collection              # create document
PATCH  /api/:collection/:id          # update document
DELETE /api/:collection/:id          # delete document
GET    /api/globals/:slug            # get global
PATCH  /api/globals/:slug            # update global
```

## Stack

- **Runtime**: Bun (server + build)
- **CSS**: Tailwind v4 + RippleUI
- **Store**: js-yaml flat files, zero database
- **Versioning**: git (auto-commit on save, git log for history)
- **Admin**: server-rendered HTML, schema-driven field rendering

## npm

```bash
npm install flatspace
```

```js
import { createServer } from 'flatspace'
createServer({ port: 3000, contentDir: 'content', publicDir: 'public' })
```

```bash
npx flatspace aggregate --input data.json --output out.json
```

### Publishing
Push to `main` → GH Actions auto-bumps patch version and publishes to npm.
**Required secret**: `NPM_TOKEN` in repo Settings → Secrets.
