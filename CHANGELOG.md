## [Unreleased]

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
