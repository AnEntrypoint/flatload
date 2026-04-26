import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { renderField } from '../fields.js'
import { escapeHtml } from '../../utils/safe.js'

const GLOBALS_FIELDS = {
  header: () => import('../../payload/globals/Header.js').then(m => m.Header.fields),
  footer: () => import('../../payload/globals/Footer.js').then(m => m.Footer.fields),
}

export async function globalView(slug) {
  const doc = await payload.findGlobal({ slug, depth: 1 })
  const title = slug.charAt(0).toUpperCase() + slug.slice(1)
  const safeTitle = escapeHtml(title.toLowerCase())

  let fieldsHtml = ''
  try {
    const getFields = GLOBALS_FIELDS[slug]
    if (getFields) {
      const fields = await getFields()
      fieldsHtml = fields.map(f => renderField(f, doc[f.name])).join('')
    }
  } catch {
    fieldsHtml = Object.entries(doc)
      .filter(([k]) => !['globalType', 'createdAt', 'updatedAt', 'id', 'slug'].includes(k))
      .map(([k, v]) => renderField(
        { name: k, type: typeof v === 'object' ? 'textarea' : 'text', label: k },
        typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v ?? '')
      )).join('')
  }

  const body = `
<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap">
  <h1>${safeTitle}</h1>
  <button form="global-form" type="submit" class="btn-primary">save</button>
</div>

<div style="display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:24px;align-items:start">
  <form id="global-form" method="POST" action="/admin/globals/${escapeHtml(slug)}">
    ${fieldsHtml}
    <div style="margin-top:24px"><button type="submit" class="btn-primary">save ${safeTitle}</button></div>
  </form>
  <aside>
    <div class="panel">
      <div class="panel-head">global</div>
      <div class="panel-body" style="padding:14px">
        <table class="kv">
          <tr><td>updated</td><td>${doc.updatedAt ? escapeHtml(new Date(doc.updatedAt).toLocaleString()) : '—'}</td></tr>
        </table>
        <button form="global-form" type="submit" class="btn-primary" style="width:100%;margin-top:12px;justify-content:center">save</button>
      </div>
    </div>
  </aside>
</div>`

  return adminLayout({
    title,
    body,
    breadcrumb: `<a href="/admin">dashboard</a> <span class="sep">/</span> globals <span class="sep">/</span> <span class="leaf">${safeTitle}</span>`,
    path: '/admin/globals/' + slug,
  })
}
