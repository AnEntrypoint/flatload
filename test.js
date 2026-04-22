import { escapeHtml, validSlug, validId, validGitHash, validFilename, safeJoin, safeFilename, requireSlug, requireId, requireGitHash } from './src/utils/safe.js'
import { setContentDir, find, findByID, create, update, del } from './src/store/index.js'
import { aggregate } from './src/aggregate.js'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs'
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

console.log('== aggregate.js ==')
const atmp = mkdtempSync(join(tmpdir(), 'flatspace-agg-'))
try {
  const imgsIn = join(atmp, 'imgs-in.json')
  const imgsOut = join(atmp, 'imgs-out.json')
  writeFileSync(imgsIn, JSON.stringify([{ filename: 'a.jpg', date: '2026-01-01', size: 1 }]))
  await aggregate({ input: imgsIn, output: imgsOut })
  const imgs = JSON.parse(readFileSync(imgsOut, 'utf8'))
  ok('images autodetect', imgs['a.jpg']?.title === 'a')

  const vidsIn = join(atmp, 'vids-in.json')
  const vidsOut = join(atmp, 'vids-out.json')
  writeFileSync(vidsIn, JSON.stringify({ x: { date: '2026-02-01', t: 1 }, y: { date: '2026-03-01', t: 2 } }))
  await aggregate({ input: vidsIn, output: vidsOut })
  const vids = JSON.parse(readFileSync(vidsOut, 'utf8'))
  ok('videos autodetect + sort desc', Array.isArray(vids) && vids[0].t === 2)

  const passIn = join(atmp, 'pass-in.json')
  const passOut = join(atmp, 'pass-out.json')
  const contentDoc = { slug: 'index', project: { title: 'x' }, pipeline: { label: 'p' } }
  writeFileSync(passIn, JSON.stringify(contentDoc))
  await aggregate({ input: passIn, output: passOut, type: 'passthrough' })
  const pass1 = JSON.parse(readFileSync(passOut, 'utf8'))
  ok('passthrough preserves shape', pass1.pipeline?.label === 'p' && !Array.isArray(pass1))

  const structIn = join(atmp, 'struct-in.json')
  const structOut = join(atmp, 'struct-out.json')
  writeFileSync(structIn, JSON.stringify(contentDoc))
  let threw = false
  try { await aggregate({ input: structIn, output: structOut }) } catch { threw = true }
  ok('autodetect refuses to mangle content doc (no date fields)', threw)
} finally {
  rmSync(atmp, { recursive: true, force: true })
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
