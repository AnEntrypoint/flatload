import { renderRichText } from '../components/RichText.js'

const styleMap = {
  info:    'border-blue-400 bg-blue-50 dark:bg-blue-950 dark:border-blue-700',
  warning: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700',
  error:   'border-error bg-error/30',
  success: 'border-success bg-success/30',
}

export function renderBanner(block) {
  const cls = styleMap[block.style] || styleMap.info
  return `<div class="border-l-4 p-4 my-6 rounded-r ${cls}">${renderRichText(block.content)}</div>`
}
