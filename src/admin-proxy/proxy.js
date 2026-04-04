// No more Next.js subprocess — admin is served natively by the Bun process
// This file re-exports the admin router for use in server.js
export { adminRouter as adminProxy } from '../admin/router.js'
export function startAdminProcess() {
  // No-op — admin is fully native now
  console.log('✓ Admin UI running natively at /admin')
}
