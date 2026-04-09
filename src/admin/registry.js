import { readdirSync } from 'fs'
import { join, resolve } from 'path'

const COLLECTIONS_DIR = resolve(import.meta.dir, '../payload/collections')
const GLOBALS_DIR = resolve(import.meta.dir, '../payload/globals')

let _collections = null
let _globals = null

export function getCollections() {
  if (_collections) return _collections
  _collections = []
  try {
    for (const f of readdirSync(COLLECTIONS_DIR).filter(f => f.endsWith('.js'))) {
      const mod = require(join(COLLECTIONS_DIR, f))
      const config = Object.values(mod)[0]
      if (config?.slug) _collections.push(config)
    }
  } catch {}
  return _collections
}

export function getGlobalConfigs() {
  if (_globals) return _globals
  _globals = []
  try {
    for (const f of readdirSync(GLOBALS_DIR).filter(f => f.endsWith('.js'))) {
      const mod = require(join(GLOBALS_DIR, f))
      const config = Object.values(mod)[0]
      if (config?.slug) _globals.push(config)
    }
  } catch {}
  return _globals
}

export function getCollectionBySlug(slug) {
  return getCollections().find(c => c.slug === slug)
}

export function collectionLabel(slug) {
  const col = getCollectionBySlug(slug)
  return col?.labels?.plural || slug.charAt(0).toUpperCase() + slug.slice(1)
}
