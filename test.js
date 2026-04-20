import { escapeHtml, validSlug, validId, validGitHash, validFilename, safeJoin, safeFilename, requireSlug, requireId, requireGitHash } from './src/utils/safe.js'
import { setContentDir, find, findByID, create, update, del } from './src/store/index.js'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let pass = 0, fail = 0
const ok = (n, cond) => cond ? (pass++, console.log('PASS', n)) : (fail++, console.log('FAIL', n))
const okThrows = (n, fn) => { try { fn(); fail++; console.log('FAIL', n, 'did not throw') } catch { pass++; console.log('PASS', n) } }

console.log('== safe.js ==')
ok('escapeHtml', escapeHtml('<script>"\'&</script>') === '&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;')
ok('validSlug ok', validSlug('pages'))
ok('validSlug traversal', !validSlug('../etc'))
ok('validSlug empty', !validSlug(''))
ok('validId ok', validId('home-page'))
ok('validId traversal', !validId('../../../etc/passwd'))
ok('validGitHash ok', validGitHash('deadbeef1234'))
ok('validGitHash inject', !validGitHash('abc; rm -rf /'))
ok('validFilename ok', validFilename('photo.jpg'))
ok('validFilename traversal', !validFilename('../evil'))
okThrows('safeJoin blocks ..', () => safeJoin('/tmp/root', '../etc/passwd'))
okThrows('safeJoin blocks abs', () => safeJoin('/tmp/root', '/etc/passwd'))
ok('safeJoin ok', safeJoin('/tmp/root', 'a.yaml') === '/tmp/root/a.yaml')
ok('safeFilename sanitizes', safeFilename('my image.png') === 'my_image.png')
ok('safeFilename strips path', safeFilename('/etc/evil.png') === 'evil.png')
okThrows('requireSlug throws', () => requireSlug('../bad'))
okThrows('requireId throws', () => requireId('../bad'))
okThrows('requireGitHash throws', () => requireGitHash('not-a-hash; rm'))

console.log('== store.js (isolated content dir) ==')
const tmp = mkdtempSync(join(tmpdir(), 'flatspace-test-'))
try {
  mkdirSync(join(tmp, 'pages'), { recursive: true })
  writeFileSync(join(tmp, 'pages', 'hello.yaml'), 'id: hello\ntitle: Hello\n')
  setContentDir(tmp)
  const doc = findByID({ collection: 'pages', id: 'hello' })
  ok('findByID reads', doc?.title === 'Hello')
  const list = find({ collection: 'pages' })
  ok('find lists', list.docs.length === 1)
  const created = create({ collection: 'pages', id: 'world', data: { title: 'World' } })
  ok('create writes', created.id === 'world')
  const updated = update({ collection: 'pages', id: 'world', data: { title: 'Earth' } })
  ok('update merges', updated.title === 'Earth')
  del({ collection: 'pages', id: 'world' })
  ok('del removes', !findByID({ collection: 'pages', id: 'world' }))
  okThrows('store blocks collection traversal', () => find({ collection: '../etc' }))
  okThrows('store blocks id traversal', () => findByID({ collection: 'pages', id: '../../../etc/passwd' }))
  okThrows('store blocks slash in collection', () => find({ collection: 'pages/hack' }))
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
