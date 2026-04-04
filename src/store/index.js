import path from 'path'
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'
import yaml from 'js-yaml'

const CONTENT_DIR = resolve('content')

function collectionDir(collection) {
  return join(CONTENT_DIR, collection)
}

function globalFile(slug) {
  return join(CONTENT_DIR, 'globals', `${slug}.yaml`)
}

function readDoc(file) {
  try { return yaml.load(readFileSync(file, 'utf8')) || {} } catch { return null }
}

function writeDoc(file, data) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, yaml.dump(data, { lineWidth: -1 }))
}

function docFile(collection, id) {
  return join(collectionDir(collection), `${id}.yaml`)
}

function allDocs(collection) {
  const dir = collectionDir(collection)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.yaml'))
    .map(f => readDoc(join(dir, f)))
    .filter(Boolean)
}

function matchesWhere(doc, where) {
  if (!where) return true
  for (const [field, condition] of Object.entries(where)) {
    if (field === 'or') {
      if (!condition.some(sub => matchesWhere(doc, sub))) return false
      continue
    }
    if (field === 'and') {
      if (!condition.every(sub => matchesWhere(doc, sub))) return false
      continue
    }
    const val = field.split('.').reduce((o, k) => o?.[k], doc)
    if (condition.equals !== undefined && val != condition.equals) return false
    if (condition.not_in !== undefined && condition.not_in.includes(val)) return false
    if (condition.like !== undefined) {
      const s = String(val ?? '').toLowerCase()
      if (!s.includes(String(condition.like).toLowerCase())) return false
    }
  }
  return true
}

function sortDocs(docs, sort) {
  if (!sort) return docs
  const desc = sort.startsWith('-')
  const key = desc ? sort.slice(1) : sort
  return [...docs].sort((a, b) => {
    const av = a[key], bv = b[key]
    if (av == null) return 1; if (bv == null) return -1
    return desc ? (av < bv ? 1 : -1) : (av > bv ? 1 : -1)
  })
}

export function find({ collection, where, sort, limit = 100, page = 1 } = {}) {
  let docs = allDocs(collection)
  if (where) docs = docs.filter(d => matchesWhere(d, where))
  docs = sortDocs(docs, sort)
  const totalDocs = docs.length
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit))
  const start = (page - 1) * limit
  return { docs: docs.slice(start, start + limit), totalDocs, totalPages, page }
}

export function findByID({ collection, id }) {
  return readDoc(docFile(collection, id))
}

export function findGlobal({ slug }) {
  return readDoc(globalFile(slug)) || {}
}

export function create({ collection, id, data }) {
  const docId = id || data.slug || data.id || Date.now().toString(36)
  const file = docFile(collection, docId)
  const doc = { id: docId, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  writeDoc(file, doc)
  return doc
}

export function update({ collection, id, data }) {
  const file = docFile(collection, id)
  const existing = readDoc(file) || {}
  const doc = { ...existing, ...data, id, updatedAt: new Date().toISOString() }
  writeDoc(file, doc)
  return doc
}

export function del({ collection, id }) {
  const file = docFile(collection, id)
  if (existsSync(file)) unlinkSync(file)
  return { id }
}

export function updateGlobal({ slug, data }) {
  const file = globalFile(slug)
  const existing = readDoc(file) || {}
  const doc = { ...existing, ...data, updatedAt: new Date().toISOString() }
  writeDoc(file, doc)
  return doc
}
