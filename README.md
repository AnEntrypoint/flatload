# flatload

Flat-file CMS — buildless Bun SSR, YAML content, static GitHub Pages output.

## Live demo

https://anentrypoint.github.io/flatload/

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

- **Collections**: Pages, Posts, Media, Categories, Users, Forms, Redirects, Search
- **Globals**: Header, Footer — edited as structured forms, not raw JSON
- **Field rendering**: driven by `src/payload/collections/*.js` and `src/payload/globals/*.js` schemas
- **Versions**: git-backed history at `/admin/collections/{slug}/{id}/versions`
- **Relationship picker**: inline modal search across any collection

Default login: `demo@example.com` / `demo` (from `content/users/demo.yaml`)

## Stack

- **Runtime**: Bun (server + build)
- **CSS**: Tailwind v4 via `@tailwindcss/cli`
- **Client JS**: XState (theme toggle, search debounce)
- **Store**: js-yaml flat files, zero database
- **Media**: file passthrough, no image resizing dependency
- **Admin**: built-in admin UI at `/admin` — schema-driven field rendering, CRUD for all collections, globals editing, media library, version history
