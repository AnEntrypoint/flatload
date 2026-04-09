# flatspace

Flat-file CMS — buildless Bun SSR, YAML content, static GitHub Pages output.

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
bun x @tailwindcss/cli -i src/styles/app.css -o public/app.css --minify
bun build src/client.js --outfile public/client.js --target browser --minify
bun run src/build.js
```

Output lands in `docs/`. GitHub Pages is configured to serve from `docs/` on `main`.

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

Edit any YAML file, rebuild, push — the site updates.

## Admin

The admin panel at `/admin` provides full CMS editing for all content:

- **Collections**: Pages, Posts, Media, Categories, Users, Forms, Redirects, Search — all with static demo pages on GitHub Pages
- **Globals**: Header, Footer — edited as structured forms, not raw JSON
- **Field rendering**: driven by `src/payload/collections/*.js` and `src/payload/globals/*.js` schemas
- **Rich text editor**: formatting toolbar (Bold, Italic, Underline, Strikethrough, Code, H1–H3, OL, UL, Blockquote, Link) — DOM serializes to Lexical AST JSON on every keystroke (`public/admin-richtext.js`)
- **Blocks**: adding a block fetches schema-driven field HTML from `/admin/api/block-template` — correct fields for every block type
- **Relationships**: inline picker modal, remove badges work, string IDs resolved to labels at edit time
- **Upload fields**: inline media picker modal with thumbnail grid; clear button
- **Checkboxes**: hidden-input trick ensures unchecked saves `false`, not the previous value
- **Field clearing**: empty text input saves `null`, overwriting the stored value (password fields excluded)
- **Dirty state**: browser warns before navigating away from unsaved edit/global forms
- **List views**: human-readable column headers, Published/Draft status badges for posts and pages
- **Versions**: git-backed history at `/admin/collections/{slug}/{id}/versions`

Default login: `demo@example.com` / `demo` (from `content/users/demo.yaml`)

## Stack

- **Runtime**: Bun (server + build)
- **CSS**: Tailwind v4 via `@tailwindcss/cli`
- **Client JS**: XState (theme toggle, search debounce)
- **Store**: js-yaml flat files, zero database
- **Media**: file passthrough, no image resizing dependency
- **Admin**: built-in admin UI at `/admin` — schema-driven field rendering, CRUD for all collections, globals editing, media library, version history

## npm

```bash
npm install flatspace
```

```js
import { createServer } from 'flatspace';
createServer({ port: 3000, contentDir: 'content', publicDir: 'public' });
```

```bash
npx flatspace aggregate --input saved_images.json --output descriptions.json
```

### Publishing
Push to `main` → GH Actions auto-bumps patch version and publishes to npm.
**Required secret**: `NPM_TOKEN` in repo **Settings → Secrets and variables → Actions**.
