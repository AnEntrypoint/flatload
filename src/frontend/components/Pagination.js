export function renderPagination({ page, totalPages, baseUrl }) {
  if (totalPages <= 1) return ''

  const prev = page > 1 ? `<a href="${baseUrl}/page/${page - 1}" class="px-3 py-1 border border-border rounded hover:bg-muted">&larr; Prev</a>` : ''
  const next = page < totalPages ? `<a href="${baseUrl}/page/${page + 1}" class="px-3 py-1 border border-border rounded hover:bg-muted">Next &rarr;</a>` : ''

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
    const active = p === page ? ' bg-primary text-primary-foreground' : ' hover:bg-muted'
    const href = p === 1 ? baseUrl : `${baseUrl}/page/${p}`
    return `<a href="${href}" class="px-3 py-1 border border-border rounded${active}">${p}</a>`
  }).join('')

  return `<nav class="flex gap-2 items-center justify-center mt-8" aria-label="Pagination">${prev}${pages}${next}</nav>`
}

export function renderPageRange({ page, limit, total }) {
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  return `<p class="text-muted-foreground text-sm">${from}–${to} of ${total}</p>`
}
