import { payload } from '../../utils/getPayload.js'
import { renderRichText } from '../components/RichText.js'

const COUNTRIES=[['AF','Afghanistan'],['AL','Albania'],['DZ','Algeria'],['AR','Argentina'],['AU','Australia'],['AT','Austria'],['BE','Belgium'],['BR','Brazil'],['CA','Canada'],['CL','Chile'],['CN','China'],['CO','Colombia'],['HR','Croatia'],['CZ','Czech Republic'],['DK','Denmark'],['EG','Egypt'],['FI','Finland'],['FR','France'],['DE','Germany'],['GH','Ghana'],['GR','Greece'],['HU','Hungary'],['IN','India'],['ID','Indonesia'],['IE','Ireland'],['IL','Israel'],['IT','Italy'],['JP','Japan'],['KE','Kenya'],['MX','Mexico'],['NL','Netherlands'],['NZ','New Zealand'],['NG','Nigeria'],['NO','Norway'],['PK','Pakistan'],['PE','Peru'],['PH','Philippines'],['PL','Poland'],['PT','Portugal'],['RO','Romania'],['SA','Saudi Arabia'],['ZA','South Africa'],['KR','South Korea'],['ES','Spain'],['SE','Sweden'],['CH','Switzerland'],['TW','Taiwan'],['TH','Thailand'],['TR','Turkey'],['UA','Ukraine'],['GB','United Kingdom'],['US','United States'],['VE','Venezuela'],['VN','Vietnam'],['ZW','Zimbabwe']]
const US_STATES=[['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']]

function renderField(field) {
  const name = field.name || field.id
  const label = field.label || name
  const required = field.required ? ' required' : ''
  const reqMark = field.required ? '<span class="text-error ml-1">*</span>' : ''
  const labelHtml = `<label for="${name}" class="block text-sm font-medium mb-1">${label}${reqMark}</label>`
  const baseInput = `w-full border border-input rounded px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring`

  switch (field.blockType) {
    case 'text':
    case 'email':
    case 'number':
      return `<div class="mb-4">${labelHtml}<input type="${field.blockType}" id="${name}" name="${name}" class="${baseInput}"${required} /></div>`
    case 'textarea':
      return `<div class="mb-4">${labelHtml}<textarea id="${name}" name="${name}" rows="4" class="${baseInput}"${required}></textarea></div>`
    case 'select': {
      const options = (field.options || []).map((o) => `<option value="${o.value}">${o.label}</option>`).join('')
      return `<div class="mb-4">${labelHtml}<select id="${name}" name="${name}" class="${baseInput}"${required}>${options}</select></div>`
    }
    case 'country': {
      const opts = COUNTRIES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')
      return `<div class="mb-4">${labelHtml}<select id="${name}" name="${name}" class="${baseInput}"${required}><option value="">Select country...</option>${opts}</select></div>`
    }
    case 'state': {
      const opts = US_STATES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')
      return `<div class="mb-4">${labelHtml}<select id="${name}" name="${name}" class="${baseInput}"${required}><option value="">Select state...</option>${opts}</select></div>`
    }
    case 'checkbox':
      return `<div class="mb-4 flex items-center gap-2"><input type="checkbox" id="${name}" name="${name}" class="rounded border-input"${required} /><label for="${name}" class="text-sm">${label}</label></div>`
    case 'message':
      return `<div class="mb-4 text-sm text-muted-foreground">${renderRichText(field.message)}</div>`
    default:
      return ''
  }
}

export async function renderFormBlock(block) {
  let form = block.form
  if (typeof form === 'string' || typeof form === 'number') {
    try { form = await payload.findByID({ collection: 'forms', id: form, depth: 0 }) } catch { return '' }
  }
  if (!form) return ''

  const intro = block.enableIntro && block.introContent
    ? `<div class="prose max-w-none mb-6">${renderRichText(block.introContent)}</div>`
    : ''

  const fields = (form.fields || []).map(renderField).join('')
  const submitLabel = form.submitButtonLabel || 'Submit'
  const confirmHtml = form.confirmationMessage ? encodeURIComponent(renderRichText(form.confirmationMessage)) : ''

  return `
<section class="my-8">
  ${intro}
  <form
    class="bg-card border border-border rounded-lg p-6 max-w-xl"
    data-form-id="${form.id}"
    data-success-url="${form.redirect?.url || ''}"
    data-confirm-html="${confirmHtml}"
  >
    ${fields}
    <button type="submit" class="bg-primary text-primary-foreground px-6 py-2 rounded hover:opacity-90 transition-opacity w-full">
      ${submitLabel}
    </button>
    <div class="form-message hidden mt-4 p-3 rounded text-sm"></div>
  </form>
</section>`
}
