export function renderAdminBar(collection, id) {
  if (!collection || !id) return ''
  const editUrl = `/admin/collections/${collection}/${id}`
  return `
<div class="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground text-sm flex items-center justify-between px-4 py-2">
  <span>Draft Preview Mode</span>
  <div class="flex gap-4">
    <a href="${editUrl}" class="underline hover:no-underline">Edit in Admin</a>
    <a href="/next/exit-preview" class="underline hover:no-underline">Exit Preview</a>
  </div>
</div>
<div class="h-10"></div>`
}
