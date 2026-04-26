import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const tokens = readFileSync(join(here, 'brand-tokens.css'), 'utf8')
const shell = readFileSync(join(here, 'brand-shell.css'), 'utf8')

const additions = `
/* === flatspace admin additions === */
.form-group { margin-bottom: 14px; }
.form-label { display: block; font-family: var(--ff-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--panel-text-2); margin-bottom: 6px; font-weight: 600; }
.app-main .input { background: var(--panel-1); border-radius: 6px; padding: 8px 12px; font-size: 13px; width: 100%; }
.app-main .input:focus { background: var(--panel-0); box-shadow: 0 0 0 2px var(--panel-accent) inset; }
.app-main select.input { appearance: auto; }
.app-main table th { font-family: var(--ff-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--panel-text-2); padding: 10px 16px; text-align: left; }
.app-main table th a { color: inherit; text-decoration: none; }
.app-main table th a:hover { color: var(--panel-text); }
.app-main code { font-family: var(--ff-mono); font-size: 11px; }
.app-side a.active .glyph { color: var(--panel-accent); }
`

const out = `/* 247420 brand bible — admin identity layer */\n` + tokens + '\n' + shell + '\n' + additions
writeFileSync(join(here, '..', '..', 'public', 'admin-brand.css'), out)
console.log('wrote public/admin-brand.css', out.length, 'bytes')
