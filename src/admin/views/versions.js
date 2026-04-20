import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { escapeHtml, requireSlug, requireId, requireGitHash } from '../../utils/safe.js'
import { spawnSync } from 'child_process'
import { resolve, join } from 'path'

function git(args) {
  const r = spawnSync('git', args, { cwd: resolve('.'), encoding: 'utf8', timeout: 5000 })
  if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${(r.stderr || '').trim() || r.error?.message || 'unknown'}`)
  return r.stdout
}

function gitLog(filePath) {
  try {
    return git(['log', '--pretty=format:%H|%an|%ai|%s', '--', filePath])
      .trim().split('\n').filter(Boolean).map(line => {
        const [hash, author, date, ...msgParts] = line.split('|')
        return { hash, shortHash: hash?.slice(0, 8), author, date, message: msgParts.join('|') }
      })
  } catch (err) { console.error('git log failed for', filePath + ':', err.message); return [] }
}

function gitDiff(filePath, hash) {
  try {
    return git(['diff', `${hash}~1`, hash, '--', filePath]).slice(0, 4000)
  } catch (err) { console.error('git diff failed:', err.message); return '' }
}

export async function versionsView(collectionSlug, id, query = {}) {
  requireSlug(collectionSlug, 'collection')
  requireId(id, 'id')
  const doc = await payload.findByID({ collection: collectionSlug, id, depth: 0 })
  const title = doc?.title || doc?.filename || doc?.name || id
  const filePath = join('content', collectionSlug, id + '.yaml')
  const log = gitLog(filePath)
  const diffHash = query.diff || ''
  let diffHtml = ''
  if (diffHash) {
    try { requireGitHash(diffHash) }
    catch { return adminLayout({ title: 'Versions', body: '<p class="text-error p-6">Invalid git hash</p>', breadcrumb: '', path: '' }) }
    const raw = gitDiff(filePath, diffHash)
    const escaped = escapeHtml(raw)
    const colored = escaped.split('\n').map(l => {
      if (l.startsWith('+') && !l.startsWith('+++')) return `<span class="text-success">${l}</span>`
      if (l.startsWith('-') && !l.startsWith('---')) return `<span class="text-error">${l}</span>`
      return l
    }).join('\n')
    diffHtml = `<div class="card bg-backgroundSecondary border border-border/30 mt-4 p-4"><h3 class="font-semibold text-sm mb-2">Diff for ${escapeHtml(diffHash.slice(0, 8))}</h3><pre class="text-xs overflow-x-auto whitespace-pre">${colored}</pre></div>`
  }

  const encCol = encodeURIComponent(collectionSlug)
  const encId = encodeURIComponent(id)

  const rows = log.length
    ? log.map(({ hash, shortHash, author, date, message }) => `
  <tr class="border-b border-border/20">
    <td class="px-4 py-3 text-sm font-mono text-content2">${escapeHtml(shortHash)}</td>
    <td class="px-4 py-3 text-sm text-content1">${escapeHtml(author || '—')}</td>
    <td class="px-4 py-3 text-sm text-content1">${escapeHtml(date ? new Date(date).toLocaleString() : '—')}</td>
    <td class="px-4 py-3 text-sm text-content2">${escapeHtml(message || '—')}</td>
    <td class="px-4 py-3 text-sm">
      <a href="?diff=${encodeURIComponent(hash)}" class="btn btn-ghost btn-xs">Diff</a>
      <button type="button" class="btn btn-ghost btn-xs" onclick="if(confirm('Restore to this version?'))fetch('/admin/api/versions/restore?collection=${encCol}&amp;id=${encId}&amp;hash=${encodeURIComponent(hash)}',{method:'POST'}).then(r=>{if(r.ok)location.href='/admin/collections/${encCol}/${encId}'})">Restore</button>
    </td>
  </tr>`).join('')
    : `<tr><td colspan="5" class="px-4 py-10 text-center text-content3">No git history found</td></tr>`

  const safeTitle = escapeHtml(title)
  const body = `
<div class="flex items-center justify-between mb-6">
  <div>
    <a href="/admin/collections/${encCol}/${encId}" class="text-sm text-muted-foreground hover:text-foreground">&larr; ${safeTitle}</a>
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

  const bc = `<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> <a href="/admin/collections/${encCol}" class="hover:text-content1">${escapeHtml(collectionSlug)}</a> <span class="text-content3">/</span> <a href="/admin/collections/${encCol}/${encId}" class="hover:text-content1">${safeTitle}</a> <span class="text-content3">/</span> Versions`
  return adminLayout({ title: 'Versions — ' + title, body, breadcrumb: bc, path: '/admin/collections/' + collectionSlug })
}
