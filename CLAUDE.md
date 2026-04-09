# flatspace

Flat-file CMS — YAML content, Bun SSR, zero-hop stack.

## CLI (npx flatspace)

```
npx flatspace aggregate --input <file.json> --output <out.json> [--type images|videos|merge]
```

### Types
- `images` — array of `{filename,date,size}` → object map of `filename → {title,description,date,size}`
- `videos` — object map of filename→metadata → sorted array by date desc
- `merge` — array of objects → merged single object
- auto-detected if `--type` omitted

### Entry points
- `bin/flatspace.js` — CLI dispatcher
- `src/aggregate.js` — transform logic

## Publish
Push to main → GH Actions auto-bumps patch version and publishes to npm (NPM_TOKEN secret required).
Published files: `index.js`, `src/`, `bin/` (70 files, ~144KB). Set via `files` field in package.json.

## Server
`src/server.js` — Bun HTTP server serving YAML content via `src/store/index.js`
