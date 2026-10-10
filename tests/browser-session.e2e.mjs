// Run against tests/browser_fixture.py from the Python PR over local HTTPS.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.TDB_PLAYWRIGHT_MODULE || 'playwright')
const origin = 'https://localhost:8443'
const browser = await chromium.launch({headless:true})
try {
  const context = await browser.newContext({ignoreHTTPSErrors:true})
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  const page = await context.newPage()
  await page.clock.install()
  const errors = [], sessions = [], accessRequests = []
  page.on('pageerror',error=>errors.push(error.message))
  page.on('request',request=>{
    if(request.url().endsWith('/api/auth/session')) sessions.push(request)
    if(request.headers()['authorization']) accessRequests.push(request)
  })
  await page.goto(`${origin}/admin/login`)
  await page.locator('#email').fill('admin@example.invalid')
  await page.locator('#password').fill('synthetic-password-123')
  await page.locator('#role').click()
  await page.getByRole('option',{name:'Administrador',exact:false}).click()
  await page.locator('button[type=submit]').click()
  await page.waitForURL(`${origin}/admin`)
  const cookie = (await context.cookies()).find(c=>c.name==='__Host-tdb_session')
  assert.ok(cookie,'session cookie exists')
  assert.equal(cookie.httpOnly,true);assert.equal(cookie.secure,true);assert.equal(cookie.sameSite,'Strict');assert.equal(cookie.path,'/')
  const exposed = await page.evaluate(()=>({cookie:document.cookie,local:localStorage.getItem('tdb_token'),session:sessionStorage.getItem('tdb_token')}))
  assert.equal(exposed.local,null);assert.equal(exposed.session,null);assert.ok(!exposed.cookie.includes('__Host-tdb_session'))
  await page.reload()
  await page.waitForURL(`${origin}/admin`)
  await page.getByRole('button',{name:/sair/i}).first().waitFor({state:'visible'})
  assert.ok(sessions.length>=2,'reload restores session')
  const before=sessions.length
  // Fixture TTL is 40s. Advance only frontend time to enter the 30s refresh margin.
  await page.clock.fastForward(31000)
  await page.waitForFunction(()=>document.body.innerText.includes('Sair'))
  // The dashboard notification interval naturally exercises the real API wrapper.
  for(let i=0;i<10 && sessions.length===before;i++) await page.waitForTimeout(300)
  assert.ok(sessions.length>before,'authenticated polling renews the short token')
  assert.ok(accessRequests.length>0,'API calls still send Bearer')
  const csrf = await page.evaluate(async()=>{
    const response=await fetch('/api/auth/logout',{method:'POST',credentials:'include'})
    return response.status
  })
  assert.equal(csrf,403,'logout without CSRF header is rejected')
  await page.getByRole('button',{name:/sair/i}).first().click()
  await page.waitForURL(`${origin}/admin/login`)
  assert.ok(!(await context.cookies()).some(c=>c.name==='__Host-tdb_session'))
  await page.goto(`${origin}/admin`)
  await page.waitForURL(`${origin}/admin/login`)
  assert.deepEqual(errors,[],'no unhandled frontend exceptions')
  console.log('PASS: real Chromium + Python/SQLite + built frontend: login, HttpOnly, no Web Storage token, reload, renewal, Bearer, CSRF, logout and protected-route redirect.')
} finally { await browser.close() }
