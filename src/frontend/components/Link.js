export function resolveLink(link) {
  if (!link) return { href: '#', label: '', newTab: false }
  const newTab = link.newTab || false
  let href = '#'
  if (link.type === 'reference' && link.reference?.value?.slug) {
    const prefix = link.reference.relationTo === 'posts' ? '/posts' : ''
    href = `${prefix}/${link.reference.value.slug}`
  } else if (link.url) {
    href = link.url
  }
  return { href, label: link.label || '', newTab }
}

export function renderLink(link, children, className = '') {
  const { href, label, newTab } = resolveLink(link)
  const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
  const cls = className ? ` class="${className}"` : ''
  return `<a href="${href}"${target}${cls}>${children || label}</a>`
}
