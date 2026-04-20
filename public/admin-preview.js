;(function () {
  const form = document.querySelector('form#edit-form')
  if (!form) return
  const previewBtn = document.getElementById('toggle-preview')
  const previewFrame = document.getElementById('preview-frame')
  if (!previewBtn || !previewFrame) return

  let visible = false
  previewBtn.addEventListener('click', () => {
    visible = !visible
    previewFrame.parentElement.classList.toggle('hidden', !visible)
    previewFrame.parentElement.previousElementSibling?.classList.toggle('lg:w-1/2', visible)
    if (visible && !previewFrame.src) refreshPreview()
  })

  function refreshPreview() {
    const slug = form.querySelector('[name="slug"]')?.value
    if (!slug) return
    const collection = form.dataset.collection
    const prefix = collection === 'posts' ? '/posts' : ''
    previewFrame.src = prefix + '/' + slug
  }

  let timer
  form.addEventListener('input', () => {
    if (!visible) return
    clearTimeout(timer)
    timer = setTimeout(refreshPreview, 1000)
  })
})()
