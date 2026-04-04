import { createMachine, createActor, assign } from 'xstate'

const themeMachine = createMachine({
  id: 'theme',
  initial: 'system',
  states: {
    light:  { on: { TOGGLE: 'dark',  SET_SYSTEM: 'system' } },
    dark:   { on: { TOGGLE: 'light', SET_SYSTEM: 'system' } },
    system: { on: { TOGGLE: 'light' } },
  },
})

function applyTheme(theme) {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  localStorage.setItem('theme', theme)
  document.querySelectorAll('.dark-icon').forEach((el) => el.classList.toggle('hidden', !isDark))
  document.querySelectorAll('.light-icon').forEach((el) => el.classList.toggle('hidden', isDark))
}

const savedTheme = localStorage.getItem('theme') || 'system'
const themeActor = createActor(themeMachine, { snapshot: themeMachine.resolveState({ value: savedTheme }) })
themeActor.subscribe((s) => applyTheme(s.value))
themeActor.start()

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  themeActor.send({ type: 'TOGGLE' })
})

document.getElementById('theme-toggle-mobile')?.addEventListener('click', () => {
  themeActor.send({ type: 'TOGGLE' })
})

const mobileMenuToggle = document.getElementById('mobile-menu-toggle')
const mobileMenu = document.getElementById('mobile-menu')
mobileMenuToggle?.addEventListener('click', () => {
  const open = mobileMenu?.classList.toggle('hidden') === false
  mobileMenuToggle.querySelector('.menu-open-icon')?.classList.toggle('hidden', open)
  mobileMenuToggle.querySelector('.menu-close-icon')?.classList.toggle('hidden', !open)
})

document.querySelectorAll('.copy-code-btn').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const code = btn.getAttribute('data-code') || ''
    await navigator.clipboard.writeText(code).catch(() => {})
    const orig = btn.textContent
    btn.textContent = 'Copied!'
    setTimeout(() => { btn.textContent = orig }, 2000)
  })
})

const searchMachine = createMachine({
  id: 'search',
  initial: 'idle',
  context: { query: '', results: [] },
  states: {
    idle:       { on: { INPUT: { target: 'debouncing', actions: assign({ query: ({ event }) => event.value }) } } },
    debouncing: { after: { 300: 'fetching' }, on: { INPUT: { target: 'debouncing', actions: assign({ query: ({ event }) => event.value }) } } },
    fetching: {
      invoke: {
        src: 'fetchResults',
        input: ({ context }) => context.query,
        onDone:  { target: 'results', actions: assign({ results: ({ event }) => event.output }) },
        onError: { target: 'idle' },
      },
    },
    results: {
      entry: ({ context }) => history.pushState({}, '', `/search?q=${encodeURIComponent(context.query)}`),
      on: { INPUT: { target: 'debouncing', actions: assign({ query: ({ event }) => event.value }) } },
    },
  },
}, {
  actors: {
    fetchResults: async ({ input }) => {
      if (!input || input.length < 2) return []
      const res = await fetch(`/api/search?where[or][0][title][like]=${encodeURIComponent(input)}&limit=5&depth=0`)
      const data = await res.json()
      return data.docs || []
    },
  },
})

const searchInput = document.querySelector('input[name="q"]')
if (searchInput) {
  const searchActor = createActor(searchMachine)
  searchActor.start()
  searchInput.addEventListener('input', (e) => searchActor.send({ type: 'INPUT', value: e.target.value }))
}

const formMachine = createMachine({
  id: 'form',
  initial: 'idle',
  states: {
    idle:       { on: { SUBMIT: 'submitting' } },
    submitting: {
      invoke: {
        src: 'submitForm',
        onDone:  'success',
        onError: 'error',
      },
    },
    success: { type: 'final' },
    error:   { on: { RETRY: 'idle' } },
  },
})

document.querySelectorAll('form[data-form-id]').forEach((formEl) => {
  const formId = formEl.getAttribute('data-form-id')
  const successUrl = formEl.getAttribute('data-success-url')
  const confirmHtml = decodeURIComponent(formEl.getAttribute('data-confirm-html') || '')
  const msgEl = formEl.querySelector('.form-message')

  const actor = createActor(formMachine, {
    actors: {
      submitForm: async () => {
        const data = Object.fromEntries(new FormData(formEl))
        const res = await fetch('/api/form-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: formId, submissionData: Object.entries(data).map(([field, value]) => ({ field, value })) }),
        })
        if (!res.ok) throw new Error(await res.text())
        return res.json()
      },
    },
  })

  actor.subscribe((state) => {
    if (!msgEl) return
    if (state.value === 'submitting') {
      msgEl.className = 'form-message mt-4 p-3 rounded text-sm bg-muted text-muted-foreground'
      msgEl.textContent = 'Submitting...'
    } else if (state.value === 'success') {
      msgEl.className = 'form-message mt-4 p-3 rounded text-sm bg-success/30 border border-success'
      msgEl.innerHTML = confirmHtml || 'Thank you! Your message has been sent.'
      if (successUrl) setTimeout(() => { window.location.href = successUrl }, 2000)
    } else if (state.value === 'error') {
      msgEl.className = 'form-message mt-4 p-3 rounded text-sm bg-error/30 border border-error'
      msgEl.textContent = 'Something went wrong. Please try again.'
    }
  })

  actor.start()
  formEl.addEventListener('submit', (e) => {
    e.preventDefault()
    actor.send({ type: 'SUBMIT' })
  })
})

if (window.self !== window.top) {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'payload-live-preview') {
      const data = e.data?.data
      if (!data) return
      Object.entries(data).forEach(([key, value]) => {
        document.querySelectorAll(`[data-live-preview="${key}"]`).forEach((el) => {
          el.textContent = String(value)
        })
      })
    }
  })
}
