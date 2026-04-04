import { adminLoginLayout } from '../layout.js'

export function loginView({ error = '' } = {}) {
  const body = `
<form method="POST" action="/admin/login" class="card bg-card border border-border">
  <div class="card-body gap-4">
    <div class="form-group">
      <label class="form-label" for="email">Email</label>
      <input id="email" name="email" type="email" class="input input-block input-solid" required autofocus />
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Password</label>
      <input id="password" name="password" type="password" class="input input-block input-solid" required />
    </div>
    <button type="submit" class="btn btn-primary btn-block mt-2">Sign In</button>
  </div>
</form>
<p class="text-center text-sm text-muted-foreground mt-4">
  <a href="/next/seed?secret=${process.env.PAYLOAD_SECRET || ''}" class="underline hover:no-underline">Seed database</a> if first run
</p>`
  return adminLoginLayout({ body, error })
}
