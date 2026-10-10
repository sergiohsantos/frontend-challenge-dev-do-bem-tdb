import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
let server, auth, api, java, ai, download, destination
const stored = new Map([['tdb_token','legacy-token'],['tdb_user','{}']])
const writes = [], calls = []
let responseStatus = 200, holdRefresh = null
const user = {id:1,role:'ADMIN',full_name:'Test user'}
const jwt = (seconds=300) => `header.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+seconds})).toString('base64url')}.signature`
const originalFetch = globalThis.fetch
before(async () => {
  process.env.VITE_API_URL = 'https://app.example.invalid'
  process.env.VITE_JAVA_API_URL = 'https://app.example.invalid/java'
  process.env.VITE_AI_API_URL = 'https://app.example.invalid/ai'
  const storage = {getItem:key=>stored.get(key),setItem:(key,value)=>{writes.push([key,value]);stored.set(key,value)},removeItem:key=>stored.delete(key)}
  globalThis.window = {location:{origin:'https://app.example.invalid'},localStorage:storage,sessionStorage:storage}
  globalThis.document = {set cookie(value){writes.push(['cookie',value])},get cookie(){return 'tdb_token=legacy-token'}}
  globalThis.fetch = async (url,options) => {
    calls.push({url:String(url),options})
    if(String(url).endsWith('/session') && holdRefresh) await holdRefresh
    return new Response(JSON.stringify({access_token:jwt(),user}),{status:responseStatus})
  }
  server = await createServer({configFile:false,optimizeDeps:{noDiscovery:true},server:{middlewareMode:true,hmr:false},resolve:{alias:{'@':fileURLToPath(new URL('../src',import.meta.url))}}})
  auth = await server.ssrLoadModule('/src/lib/auth.ts')
  destination = await server.ssrLoadModule('/src/lib/login-destination.ts')
  api = await server.ssrLoadModule('/src/lib/api.ts')
  java = await server.ssrLoadModule('/src/services/java-api/client.ts')
  ai = await server.ssrLoadModule('/src/services/aiApi.ts')
  download = await server.ssrLoadModule('/src/lib/file-download.ts')
})
after(async()=>{
  await server?.close();globalThis.fetch=originalFetch
  delete globalThis.window;delete globalThis.document
  delete process.env.VITE_API_URL;delete process.env.VITE_JAVA_API_URL;delete process.env.VITE_AI_API_URL
})
test('bootstrap restores session and removes old storage without persisting credentials',async()=>{
  await auth.initializeAuth()
  assert.equal(auth.isAuthReady(),true);assert.equal(auth.getUser().role,'admin');assert.ok(auth.getToken())
  assert.equal(stored.has('tdb_token'),false);assert.equal(stored.has('tdb_user'),false)
  assert.ok(writes.every(([key,value])=>key==='cookie'&&value.includes('expires=Thu, 01 Jan 1970')))
  const {options}=calls.at(-1)
  assert.equal(options.credentials,'include');assert.equal(options.headers['X-TDB-CSRF'],'1');assert.equal(options.cache,'no-store')
})
test('browser login includes cookie transport and CSRF header',async()=>{
  const payload={login:'person@example.invalid',password:'test-only-password',role:'admin'}
  await api.apiFetch('/api/auth/browser/login',{method:'POST',body:JSON.stringify(payload)})
  const {options}=calls.at(-1)
  assert.equal(options.credentials,'include');assert.equal(options.headers['X-TDB-CSRF'],'1');assert.deepEqual(JSON.parse(options.body),payload)
})
test('Python Java AI share one refresh and preserve Bearer without cookies',async()=>{
  auth.saveAuth(jwt(10),user)
  const old=auth.getToken(),start=calls.length
  await Promise.all([api.apiFetch('/api/admin/test',{},old),java.javaApiFetch('/api/test',{},old),ai.getAIModelStatus()])
  const recent=calls.slice(start)
  assert.equal(recent.filter(c=>c.url.endsWith('/session')).length,1)
  for(const c of recent.filter(c=>!c.url.endsWith('/session'))){assert.equal(new Headers(c.options.headers).get('Authorization'),`Bearer ${auth.getToken()}`);assert.equal(c.options.credentials,'omit')}
})
test('external download never receives the access token',async()=>{
  responseStatus=404
  await assert.rejects(download.downloadFromApi('https://external.example.invalid/file',auth.getToken()))
  assert.equal(new Headers(calls.at(-1).options.headers).has('Authorization'),false);assert.equal(calls.at(-1).options.credentials,'omit')
  responseStatus=200
})
test('failed logout retains state for retry and successful logout clears memory',async()=>{
  responseStatus=503;await assert.rejects(auth.clearAuth(),/encerrar/);assert.ok(auth.getToken())
  responseStatus=200;await auth.clearAuth();assert.equal(auth.getToken(),null);assert.equal(auth.getUser(),null)
  assert.equal(calls.at(-1).options.method,'POST');assert.equal(calls.at(-1).options.credentials,'include')
})
test('in-flight refresh cannot restore memory after logout',async()=>{
  auth.saveAuth(jwt(),user)
  let release;holdRefresh=new Promise(resolve=>{release=resolve})
  const refreshing=auth.restoreSession();await auth.clearAuth();release();holdRefresh=null;await refreshing
  assert.equal(auth.getToken(),null)
})
test('expired cookie leaves no authenticated state',async()=>{
  responseStatus=401;assert.equal(await auth.restoreSession(),false);assert.equal(auth.getToken(),null);responseStatus=200
})

test('post-login destination preserves role-local path and rejects unsafe destinations',()=>{
  assert.equal(destination.loginDestination('ADMIN','/admin/programas?view=all#list'),'/admin/programas?view=all#list')
  assert.equal(destination.loginDestination('VOLUNTARIO','/dashboard/voluntario/agenda'),'/dashboard/voluntario/agenda')
  for(const path of ['https://evil.invalid','//evil.invalid','/admin/../login','/admin/%2e%2e/login','/admin\\evil','/administrator','/admin/login',undefined]) {
    assert.equal(destination.loginDestination('ADMIN',path),'/admin')
  }
  assert.equal(destination.loginDestination('BENEFICIARIO','/admin'),'/dashboard/beneficiario')
})
