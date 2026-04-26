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
    catch { return adminLayout({ title: 'versions', body: '<p style="color:var(--warn);padding:24px">invalid git hash</p>', breadcrumb: '', path: '' }) }
    const raw = gitDiff(filePath, diffHash)
    const escaped = escapeHtml(raw)
    const colored = escaped.split('\n').map(l => {
      if (l.startsWith('+') && !l.startsWith('+++')) return `<span style="color:var(--live)">${l}</span>`
      if (l.startsWith('-') && !l.startsWith('---')) return `<span style="color:var(--warn)">${l}</span>`
      return l
    }).join('\n')
    diffHtml = `<div class="panel" style="margin-top:16px"><div class="panel-head">diff ${escapeHtml(diffHash.slice(0, 8))}</div><div class="panel-body" style="padding:14px"><pre style="margin:0;font-size:12px;overflow-x:auto;white-space:pre">${colored}</pre></div></div>`
  }

  const encCol = encodeURIComponent(collectionSlug)
  const encId = encodeURIComponent(id)
  const safeCol = escapeHtml(collectionSlug)
  const safeTitle = escapeHtml(title)

  const rows = log.length
    ? log.map(({ hash, shortHash, author, date, message }) => `
  <tr>
    <td><code>${escapeHtml(shortHash)}</code></td>
    <td>${escapeHtml(author || '—')}</td>
    <td>${escapeHtml(date ? new Date(date).toLocaleString() : '—')}</td>
    <td>${escapeHtml(message || '—')}</td>
    <td>
      <a href="?diff=${encodeURIComponent(hash)}" class="btn-ghost">diff</a>
      <button type="button" class="btn-ghost" onclick="if(confirm('restore to this version?'))fetch('/admin/api/versions/restore?collection=${encCol}&amp;id=${encId}&amp;hash=${encodeURIComponent(hash)}',{method:'POST'}).then(r=>{if(r.ok)location.href='/admin/collections/${encCol}/${encId}'})">restore</button>
    </td>
  </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:48px;color:var(--panel-text-3)">no git history found</td></tr>`

  const body = `
<div style="margin-bottom:16px">
  <a href="/admin/collections/${encCol}/${encId}" class="t-meta" style="text-decoration:none">← ${safeTitle}</a>
  <h1 style="margin-top:4px">version history</h1>
</div>

<div class="panel">
  <div class="panel-head">
    <span>commits</span>
    <span>${log.length} entries</span>
  </div>
  <div class="panel-body">
    <table class="kv" style="max-width:none;width:100%;margin:0;border-radius:0">
      <thead style="background:var(--panel-2)">
        <tr>
          <th>commit</th><th>author</th><th>date</th><th>message</th><th>actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>
${diffHtml}`

  const bc = `<a href="/admin">dashboard</a> <span class="sep">/</span> <a href="/admin/collections/${encCol}">${safeCol}</a> <span class="sep">/</span> <a href="/admin/collections/${encCol}/${encId}">${safeTitle}</a> <span class="sep">/</span> <span class="leaf">versions</span>`
  return adminLayout({ title: 'versions — ' + title, body, breadcrumb: bc, path: '/admin/collections/' + collectionSlug })
}
