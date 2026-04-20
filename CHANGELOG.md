## [Unreleased]

### Security (2026-04-20 hardening pass)
- Fixed shell injection in `/admin/api/versions/restore` — user-supplied `hash` was interpolated into `execSync`
- Fixed shell injection in version history `git log` / `git diff` — switched to `spawnSync` with arg arrays
- Fixed shell injection in git auto-commit — switched to `spawnSync` with arg arrays
- Added path traversal protection in store (`safeJoin` + `requireSlug`/`requireId`)
- Added path traversal protection in media upload (`safeFilename` canonicalizes user-provided filenames)
- Fixed XSS in admin list view (search input, row IDs, cell values all escaped)
- Fixed XSS in admin edit view (doc title, slug, id interpolations escaped)
- Fixed XSS in versions view (commit messages, authors, hashes escaped)
- Replaced inline `onclick` handlers that interpolated user data with data-attribute event delegation
- Added `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` on all admin responses
- Fixed undefined `collection` variable bug in `edit.js:blockTemplateHtml` (was silently throwing ReferenceError)
- Bumped `js-yaml` ^4.1.0 → ^4.1.1 (CVE-2025-64718: prototype pollution via `<<` merge key)
- Admin/API now return 400 with clear error for invalid slugs/ids/hashes instead of 500

### Added
- `src/utils/safe.js`: centralized `escapeHtml`, `validSlug`, `validId`, `validGitHash`, `validFilename`, `safeJoin`, `safeFilename`, `requireSlug`, `requireId`, `requireGitHash`
- `test.js` at repo root: 26 integration tests covering security utilities and store CRUD + traversal blocking

### Removed
- Users collection and authentication system (git is now the access control)
- Login/logout views and cookie-based sessions
- bcryptjs dependency
- Posts.authors field (was referencing removed users collection)
- admin-proxy module (dead code)
- Stale files: bash.exe.stackdump, .codeinsight

### Added
- Git auto-commit on document save/create/delete (crud.js)
- Version history with git author, diff view, and restore to prior version
- Full public REST API: GET/POST/PATCH/DELETE for collections and globals
- Draft/Publish workflow with _status field and separate buttons
- Collapsible sidebar with mobile hamburger menu
- Clickable breadcrumb navigation (Dashboard > Collection > Document)
- Sortable column headers in list view
- Bulk select and bulk delete in list view
- Global search modal (Cmd/Ctrl+K) across all collections
- Document drawer for inline editing of related documents
- Live preview panel in edit view (iframe-based)
- Collection auto-discovery from src/payload/collections/ (registry.js)


### Fixed (validation pass)
- All silent catch blocks now log errors with context before returning
- Removed --allow-empty from git auto-commit (no noise commits)
- Fixed const body assignment in edit.js that broke static build
- Rebuilt docs/ to reflect auth removal and Flatspace rename

### Removed (validation pass)
- Orphaned utils: deepMerge.js, generatePreviewPath.js, toKebabCase.js, formatAuthors.js
- PostHero.js authors rendering (references removed Users collection)

### Added (validation pass)
- window.__debug exposed in admin client (theme, sidebar, formDirty)

### Fixed
- Renamed remaining "Flatload" references to "Flatspace"
- Removed stale "users" from build.js and list view

# Changelog

## 2026-04-08 - aggregate CLI
- Added bin/flatspace.js CLI entry point with aggregate subcommand
- Added src/aggregate.js: transforms saved_images.json→descriptions map, saved_videos.json→sorted array
- Added bin entry to package.json for npx usage

## 2026-04-09 - npm package trim
- Added files field to package.json: index.js, src/, bin/ only
- Reduced published file count from 138 to 70, size from 894KB to 144KB
- Validated: aggregate CLI (images/videos/merge), bin/flatspace.js via node, skip-ci no double-run, store/createServer exports
