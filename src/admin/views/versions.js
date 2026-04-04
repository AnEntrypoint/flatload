import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { execSync } from 'child_process'
import { resolve, join } from 'path'

function gitLog(filePath) {
  try {
    const out = execSync(`git log --pretty=format:"%H|%ai|%s" -- "${filePath}"`, {
      cwd: resolve('.'),
      encoding: 'utf8',
      timeout: 5000,
    })
    return out.trim().split('\n').filter(Boolean).map(line => {
      const [hash, date, ...msgParts] = line.split('|')
      return { hash: hash?.slice(0, 8), date, message: msgParts.join('|') }
    })
  } catch { return [] }
}

export async function versionsView(collectionSlug, id, user) {
  const doc = await payload.findByID({ collection: collectionSlug, id, depth: 0 })
  const title = doc?.title || doc?.filename || doc?.email || doc?.name || id
  const filePath = join('content', collectionSlug, id + '.yaml')
  const log = gitLog(filePath)

  const rows = log.length
    ? log.map(({ hash, date, message }) => `
  <tr class="border-b border-border/20">
    <td class="px-4 py-3 text-sm font-mono text-content2">${hash}</td>
    <td class="px-4 py-3 text-sm text-content1">${date ? new Date(date).toLocaleString() : '—'}</td>
    <td class="px-4 py-3 text-sm text-content2">${message || '—'}</td>
  </tr>`).join('')
    : `<tr><td colspan="3" class="px-4 py-10 text-center text-content3">No git history found for this document</td></tr>`

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
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Date</th>
          <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-content2">Message</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</div>`

  return adminLayout({ title: 'Versions — ' + title, body, user, breadcrumb: collectionSlug + ' / ' + title + ' / versions', path: '/admin/collections/' + collectionSlug })
}
