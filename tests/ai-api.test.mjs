import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

let server, api, auth
const jwt = label => `test.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000)+300, label })).toString("base64url")}.signature`
let responseStatus = 200
const calls = []
const originalFetch = globalThis.fetch

before(async () => {
  process.env.VITE_AI_API_URL = 'https://example.invalid/ai'
  globalThis.window = { location: { origin: "https://example.invalid" } }
  process.env.VITE_API_URL = 'https://example.invalid'
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return new Response(JSON.stringify({ status: 'ok' }), { status: responseStatus })
  }
  server = await createServer({
    configFile: false,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  })
  api = await server.ssrLoadModule('/src/services/aiApi.ts')
  auth = await server.ssrLoadModule('/src/lib/auth.ts')
})

after(async () => {
  await server?.close()
  globalThis.fetch = originalFetch
  delete globalThis.window
  delete globalThis.localStorage
  delete process.env.VITE_AI_API_URL
})

test('prediction forwards the current login token and preserves the payload', async () => {
  const first = jwt('first-login')
  auth.saveAuth(first, {id:1,role:'ADMIN',full_name:'Test'})
  const payload = { idade: 15, programa: 'Dentista do Bem' }
  await api.predictNoShowRisk(payload)
  const { url, options } = calls.at(-1)
  assert.equal(url, 'https://example.invalid/ai/predict')
  assert.equal(options.method, 'POST')
  assert.equal(options.headers.get('Authorization'), `Bearer ${first}`)
  assert.equal(options.headers.get('X-AI-SERVICE-TOKEN'), null)
  assert.equal(options.headers.get('X-AI-ADMIN-TOKEN'), null)
  assert.deepEqual(JSON.parse(options.body), payload)
  const renewed = jwt('renewed-login')
  auth.saveAuth(renewed, {id:1,role:'ADMIN',full_name:'Test'})
  await api.getAIModelStatus()
  assert.equal(calls.at(-1).options.headers.get('Authorization'), `Bearer ${renewed}`)
})

test('probes remain usable without a session; no fake token is generated', async () => {
  await auth.clearAuth()
  await api.getAIHealth()
  await api.getAIReady()
  assert.equal(calls.at(-1).options.headers.has('Authorization'), false)
})

test('authentication and authorization failures get distinct messages', async () => {
  responseStatus = 401
  await assert.rejects(api.getAIModelStatus(), /sessão.*inválida ou expirou/)
  responseStatus = 403
  await assert.rejects(api.predictNoShowRisk({}), /perfil não tem permissão/)
  responseStatus = 503
  await assert.rejects(api.getAIModelStatus(), /Nao foi possivel consultar/)
  responseStatus = 200
})
