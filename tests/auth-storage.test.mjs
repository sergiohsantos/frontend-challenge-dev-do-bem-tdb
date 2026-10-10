import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, auth
const stored = new Map()
const cookieWrites = []
before(async () => {
  globalThis.window = {}
  globalThis.localStorage = {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
    removeItem: key => stored.delete(key),
  }
  globalThis.document = {
    get cookie() { return 'tdb_token=legacy-sensitive-token; tdb_role=ADMIN' },
    set cookie(value) { cookieWrites.push(value) },
  }
  server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true } })
  auth = await server.ssrLoadModule('/src/lib/auth.ts')
})
after(async () => {
  await server?.close()
  delete globalThis.window
  delete globalThis.localStorage
  delete globalThis.document
})

test('legacy token cookie cannot restore a session and gets expired', () => {
  assert.equal(auth.getToken(), null)
  assert.equal(auth.isAuthenticated(), false)
  assert.equal(cookieWrites.length, 2)
  assert.ok(cookieWrites.every(value => value.includes('expires=Thu, 01 Jan 1970')))
})

test('login keeps Bearer integration and profile; never writes token to a cookie', () => {
  auth.saveAuth('new-sensitive-token', { id: 1, role: 'ADMIN', full_name: 'Test user' })
  assert.equal(auth.getToken(), 'new-sensitive-token')
  assert.equal(auth.getUser().full_name, 'Test user')
  assert.equal(auth.getRoleFromCookie(), 'ADMIN')
  assert.equal(auth.getRedirectPath(auth.getUser().role), '/admin')
  assert.ok(cookieWrites.every(value => !value.includes('new-sensitive-token')))
  assert.ok(cookieWrites.every(value => value.includes('expires=Thu, 01 Jan 1970')))
})

test('logout removes token and profile and expires old cookies', () => {
  auth.clearAuth()
  assert.equal(auth.getToken(), null)
  assert.equal(auth.getUser(), null)
  assert.equal(auth.getRoleFromCookie(), null)
})
