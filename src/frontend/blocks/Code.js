export function renderCode(block) {
  const lang = block.language || 'text'
  // Basic HTML escape for code
  const code = String(block.code || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return `
<div class="relative my-6 group">
  <div class="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border border-b-0 border-border">
    <span class="text-xs text-muted-foreground font-mono">${lang}</span>
    <button
      class="text-xs text-muted-foreground hover:text-foreground transition-colors copy-code-btn"
      data-code="${block.code?.replace(/"/g, '&quot;') || ''}"
    >Copy</button>
  </div>
  <pre class="bg-card border border-border rounded-b-lg p-4 overflow-x-auto"><code class="language-${lang} text-sm font-mono">${code}</code></pre>
</div>`
}
