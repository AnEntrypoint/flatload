# Changelog

## 2026-04-08 - aggregate CLI
- Added bin/flatspace.js CLI entry point with aggregate subcommand
- Added src/aggregate.js: transforms saved_images.json→descriptions map, saved_videos.json→sorted array
- Added bin entry to package.json for npx usage

## 2026-04-09 - npm package trim
- Added files field to package.json: index.js, src/, bin/ only
- Reduced published file count from 138 to 70, size from 894KB to 144KB
- Validated: aggregate CLI (images/videos/merge), bin/flatspace.js via node, skip-ci no double-run, store/createServer exports
