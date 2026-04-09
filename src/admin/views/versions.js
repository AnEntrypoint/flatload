import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { execSync } from 'child_process'
import { resolve, join } from 'path'

function gitLog(filePath) {
  try {
    const out = execSync(`git log --pretty=format:"%H|%an|%ai|%s" -- "${filePath}"`, {
      cwd: resolve('.'), encoding: 'utf8', timeout: 5000,
    })
    return out.trim().split('\n').filter(Boolean).map(line => {
      const [hash, author, date, ...msgParts] = line.split('|')
      return { hash, shortHash: hash?.slice(0, 8), author, date, message: msgParts.join('|') }
    })
  } catch { return [] }
}

function gitDiff(filePath, hash) {
  try {
    return execSync(`git diff ${hash}~1 ${hash} -- "${filePath}"`, {
      cwd: resolve('.'), encoding: 'utf8', timeout: 5000,
    }).slice(0, 4000)
  } catch { return '' }
}

export async function versionsView(collectionSlug, id, query = {}) {
  const doc = await payload.findByID({ collection: collectionSlug, id, depth: 0 })
  const title = doc?.title || doc?.filename || doc?.name || id
  const filePath = join('content', collectionSlug, id + '.yaml')
  const log = gitLog(filePath)
  const diffHash = query.diff || ''
  let diffHtml = ''
  if (diffHash) {
    const raw = gitDiff(filePath, diffHash)
    const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const colored = escaped.split('\n').map(l => {
      if (l.startsWith('+') && !l.startsWith('+++')) return `<span class="text-success">${l}</span>`
      if (l.startsWith('-') && !l.startsWith('---')) return `<span class="text-error">${l}</span>`
      return l
    }).join('\n')
    diffHtml = `<div class="card bg-backgroundSecondary border border-border/30 mt-4 p-4"><h3 class="font-semibold text-sm mb-2">Diff for ${diffHash.slice(0, 8)}</h3><pre class="text-xs overflow-x-auto whitespace-pre">${colored}</pre></div>`
  }

  const rows = log.length
    ? log.map(({ hash, shortHash, author, date, message }) => `
  <tr class="border-b border-border/20">
    <td class="px-4 py-3 text-sm font-mono text-content2">${shortHash}</td>
    <td class="px-4 py-3 text-sm text-content1">${author || '—'}</td>
    <td class="px-4 py-3 text-sm text-content1">${date ? new Date(date).toLocaleString() : '—'}</td>
    <td class="px-4 py-3 text-sm text-content2">${message || '—'}</td>
    <td class="px-4 py-3 text-sm">
      <a href="?diff=${hash}" class="btn btn-ghost btn-xs">Diff</a>
      <button type="button" class="btn btn-ghost btn-xs" onclick="if(confirm('Restore to this version?'))fetch('/admin/api/versions/restore?collection=${collectionSlug}&id=${id}&hash=${hash}',{method:'POST'}).then(r=>{if(r.ok)location.href='/admin/collections/${collectionSlug}/${id}'})">Restore</button>
    </td>
  </tr>`).join('')
    : `<tr><td colspan="5" class="px-4 py-10 text-center text-content3">No git history found</td></tr>`

  const body = `
<div class="flex items-center justify-between mb-6">
  <div>
    <a href="/admin/collections/${collectionSlug}/${id}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${title}</a>
    <h1 class="text-2xl font-bold mt-1">Version History</h1>
  </div>
</div>
<div class="card bg-backgroundSecondary border border-border/30 overflow-hidden">
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead class="bg-backgroundPrimary">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Commit</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Author</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Date</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Message</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>
${diffHtml}`

  const bc = '<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> <a href="/admin/collections/' + collectionSlug + '" class="hover:text-content1">' + collectionSlug + '</a> <span class="text-content3">/</span> <a href="/admin/collections/' + collectionSlug + '/' + id + '" class="hover:text-content1">' + title + '</a> <span class="text-content3">/</span> Versions'
  return adminLayout({ title: 'Versions — ' + title, body, breadcrumb: bc, path: '/admin/collections/' + collectionSlug })
}
