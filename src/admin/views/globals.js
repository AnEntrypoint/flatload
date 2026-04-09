import { adminLayout } from '../layout.js'
import { payload } from '../../utils/getPayload.js'
import { renderField } from '../fields.js'

const GLOBALS_FIELDS = {
  header: () => import('../../payload/globals/Header.js').then(m => m.Header.fields),
  footer: () => import('../../payload/globals/Footer.js').then(m => m.Footer.fields),
}

export async function globalView(slug) {
  const doc = await payload.findGlobal({ slug, depth: 1 })
  const title = slug.charAt(0).toUpperCase() + slug.slice(1)

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
<div class="flex items-center justify-between mb-6">
  <h1 class="text-2xl font-bold">${title}</h1>
  <button form="global-form" type="submit" class="btn btn-primary btn-sm">Save</button>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <form id="global-form" method="POST" action="/admin/globals/${slug}" class="lg:col-span-2 space-y-4">
    ${fieldsHtml}
    <button type="submit" class="btn btn-primary">Save ${title}</button>
  </form>
  <aside>
    <div class="card bg-card border border-border">
      <div class="card-body">
        <h3 class="font-medium text-sm mb-2">Global</h3>
        <div class="text-xs text-muted-foreground">Updated: ${doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : '—'}</div>
        <button form="global-form" type="submit" class="btn btn-primary btn-sm btn-block mt-4">Save</button>
      </div>
    </div>
  </aside>
</div>`

  return adminLayout({ title, body, breadcrumb: '<a href="/admin" class="hover:text-content1">Dashboard</a> <span class="text-content3">/</span> Globals <span class="text-content3">/</span> ' + title, path: '/admin/globals/' + slug })
}
