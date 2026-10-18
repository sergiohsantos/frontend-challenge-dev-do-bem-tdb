// Integrated browser test: real local Python API, synthetic Admin and disposable SQLite.
// Requires TDB_PYTHON_REPO, TDB_PYTHON_EXECUTABLE; optional TDB_PYTHON_SITE_PACKAGES.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, rm, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID, createHmac } from 'node:crypto'
import { createServer } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.env.TDB_PLAYWRIGHT_MODULE || 'playwright')
const origin = 'http://127.0.0.1:5188'
const folder = await mkdtemp(join(tmpdir(), 'tdb-admin-ui-'))
const password = randomUUID() + '-Synthetic!'
const artifacts = resolve(process.env.TDB_ADMIN_ARTIFACTS || join(folder, 'screens'))
await mkdir(artifacts, { recursive: true })
const api = spawn(process.env.TDB_PYTHON_EXECUTABLE, [join(process.env.TDB_PYTHON_REPO, 'tests/admin_ui_fixture.py')], {
  cwd: process.env.TDB_PYTHON_REPO,
  env: { ...process.env, PYTHONPATH: [process.env.TDB_PYTHON_REPO, process.env.TDB_PYTHON_SITE_PACKAGES].filter(Boolean).join(process.platform === 'win32' ? ';' : ':'),
    PYTHONDONTWRITEBYTECODE: '1', TDB_TEST_DATABASE_FILE: join(folder, 'test.sqlite'), TDB_TEST_PASSWORD: password },
  windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'],
})
let apiError = ''
api.stderr.on('data', data => { apiError += data.toString() })
let server, browser, context
const passed = []
try {
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch('http://127.0.0.1:5191/health')).ok) break } catch { /* wait for isolated API */ }
    if (attempt >= 60 || api.exitCode !== null) throw new Error('Local API did not start: ' + apiError.slice(-1500))
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  process.env.VITE_API_URL = origin
  process.env.VITE_JAVA_API_URL = origin + '/java'
  process.env.VITE_AI_API_URL = origin + '/ai'
  server = await createServer({ server: { host: '127.0.0.1', port: 5188, strictPort: true, open: false, hmr: false, proxy: { '/api': 'http://127.0.0.1:5191', '/health': 'http://127.0.0.1:5191' } } })
  await server.listen()
  browser = await chromium.launch({ headless: true, ...(process.env.TDB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.TDB_CHROMIUM_EXECUTABLE } : {}) })
  context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' })
  context.setDefaultTimeout(15000)
  const page = await context.newPage()
  page.on("response", async response => { if (new URL(response.url()).pathname === "/api/admin/operations") { const value = await response.json().catch(() => ({})); console.log("Queue response", response.status(), value.total ?? value.detail) } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  let failOperations = false
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    // Optional Java/AI services deliberately unavailable; Python operations must stay usable.
    if (/^\/(java|ai)(\/|$)/.test(url.pathname) || failOperations && url.pathname === '/api/admin/operations') return route.fulfill({ status: 503, json: { detail: 'Synthetic optional-service failure' } })
    return route.continue()
  })
  await page.goto(origin + '/admin')
  await page.waitForURL('**/admin/login')
  await page.locator('#email').fill('admin-operacao@example.invalid')
  await page.locator('#password').fill(password)
  await page.locator('#role').click()
  await page.getByRole('option', { name: 'Administrador', exact: false }).click()
  await page.locator('button[type=submit]').click()
  await page.waitForURL('**/admin')
  await page.getByText('6 pendência(s) neste recorte', { exact: true }).waitFor()
  passed.push('Real browser login and Python queue; optional Java/AI unavailable')
  await page.screenshot({ path: join(artifacts, 'admin-operacao-desktop.png') })
  await page.getByLabel('Pendência', { exact: true }).selectOption('approval')
  await page.getByText('1 pendência(s) neste recorte', { exact: true }).waitFor()
  await page.getByLabel('Origem da pendência').selectOption('7d')
  await page.getByText('Nenhuma pendência encontrada neste recorte.', { exact: true }).waitFor()
  await page.getByLabel('Origem da pendência').selectOption('all')
  await page.getByText('1 pendência(s) neste recorte', { exact: true }).waitFor()
  passed.push('Real kind/period filters preserve old pending work')
  await page.getByRole('searchbox', { name: 'Busca administrativa' }).fill('SYN-APPROVED')
  await page.getByRole('link', { name: /Solicitação.*SYN-APPROVED/ }).click()
  await page.waitForURL('**/admin/aprovacoes/SYN-APPROVED')
  await page.getByText('Documento demonstrativo', { exact: true }).waitFor()
  passed.push('Global search and JSON materials in real approval detail')
  await page.goto(origin + '/admin/beneficiarios/1?case=2')
  await page.getByLabel('Caso em acompanhamento').waitFor()
  assert.equal(await page.getByLabel('Caso em acompanhamento').inputValue(), '2')
  await page.getByLabel('Caso em acompanhamento').selectOption('1')
  await page.waitForURL('**/admin/beneficiarios/1?case=1')
  await page.waitForFunction(() => document.querySelector('select')?.value === '1')
  passed.push('Multi-case context survives navigation')
  await page.goto(origin + '/admin')
  await page.getByText('6 pendência(s) neste recorte', { exact: true }).waitFor()
  failOperations = true
  await page.getByRole('button', { name: 'Atualizar operação', exact: true }).click()
  await page.getByText('Não foi possível carregar a operação. As pendências estão indisponíveis, não zeradas.').waitFor()
  failOperations = false
  await page.getByRole('button', { name: 'Tentar novamente a operação' }).click()
  await page.getByText('6 pendência(s) neste recorte', { exact: true }).waitFor()
  passed.push('Unavailable operation has explicit error and working retry')
  await page.setViewportSize({ width: 390, height: 844 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'mobile layout fits')
  await page.screenshot({ path: join(artifacts, 'admin-operacao-mobile.png') })
  passed.push('Responsive logged-in layout fits 390px')
  await page.setViewportSize({ width: 1440, height: 1050 })
  const row = page.locator('li').filter({ hasText: 'SYN-PENDING' }).first()
  await row.getByRole('button', { name: 'Definir responsável e prazo' }).click()
  await page.getByRole('dialog').getByLabel('Responsável', { exact: true }).selectOption('3')
  await page.getByRole('dialog').getByLabel('Prazo', { exact: false }).fill('2030-01-20T14:30')
  await page.getByRole('dialog').getByLabel('Observação operacional').fill('Acompanhamento sintético')
  await page.getByRole('button', { name: 'Salvar acompanhamento' }).click()
  await page.getByRole('dialog').waitFor({ state: 'hidden' })
  await row.getByText(/Admin de demonstração local.*Prazo/).waitFor()
  passed.push('Persistent owner and local-to-UTC deadline saved through real API')
  await page.screenshot({ path: join(artifacts, 'admin-responsavel-prazo.png') })
  await page.goto(origin + '/admin/configuracoes')
  await page.locator('#admin-nome').fill('Admin atualizado localmente')
  await page.locator('#admin-email').fill('admin-updated@example.org')
  await page.locator('#admin-current-password').fill(password)
  await page.getByRole('button', { name: 'Salvar dados da conta' }).click()
  await page.getByText('Dados da conta atualizados no servidor', { exact: true }).waitFor()
  await page.reload()
  await page.locator('#admin-nome').waitFor()
  assert.equal(await page.locator('#admin-nome').inputValue(), 'Admin atualizado localmente')
  passed.push('Admin profile persists server-side after password confirmation and reload')
  const body = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: 'wamid.synthetic-local-browser', status: 'failed', timestamp: String(Math.floor(Date.now()/1000)), recipient_id: '5500000000000', errors: [{ code: 131049 }] }] } }] }] })
  const webhook = await context.request.post(origin + '/api/public/whatsapp/webhook', { data: body, headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': 'sha256='+createHmac('sha256','synthetic-webhook-test-secret').update(body).digest('hex') } })
  assert.equal(webhook.status(), 200)
  await page.getByRole('tab', { name: 'Notificações' }).click()
  await page.getByRole('button', { name: 'Atualizar entregas' }).click()
  await page.getByText('Código da Meta: 131049', { exact: true }).waitFor()
  passed.push('Signed local webhook persists masked delivery failure visible in Admin')
  await page.screenshot({ path: join(artifacts, 'admin-historico-whatsapp.png') })
  // A second browser session uses the real local volunteer login and persistence contracts.
  const volunteer = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  try {
    const p = await volunteer.newPage()
    p.on('pageerror', error => errors.push(error.message))
    let failRead = false, failSave = false
    await p.route('**/*', r => {
      const u = new URL(r.request().url())
      if (u.origin !== origin) return r.abort()
      if (u.pathname === '/api/volunteers/availability' && ((failRead && r.request().method() === 'GET') || (failSave && r.request().method() === 'PUT'))) return r.fulfill({ status: 503, json: { detail: 'Synthetic availability outage' } })
      return r.continue()
    })
    await p.goto(origin + '/login')
    await p.getByRole('tab', { name: 'Voluntário', exact: true }).click()
    await p.locator('#email-voluntario').fill('profissional@example.invalid')
    await p.locator('#password').fill(password)
    await p.locator('button[type=submit]').click()
    await p.waitForURL('**/dashboard/voluntario')
    await p.goto(origin + '/dashboard/voluntario/disponibilidade')
    await p.getByRole('button', { name: 'Salvar disponibilidade', exact: true }).waitFor()
    await p.getByLabel('Máximo de casos ativos').fill('5')
    await p.getByRole('button', { name: 'Salvar capacidade', exact: true }).click()
    await p.getByText('Capacidade salva no servidor.', { exact: true }).waitFor()
    failSave = true
    await p.getByRole('button', { name: 'Salvar disponibilidade', exact: true }).click()
    await p.getByText('Não foi possível salvar no servidor. Suas alterações continuam na tela; tente novamente.', { exact: true }).waitFor()
    failSave = false
    await p.getByRole('button', { name: 'Salvar disponibilidade', exact: true }).click()
    await p.getByText('Disponibilidade salva com sucesso', { exact: true }).waitFor()
    await p.reload()
    await p.getByLabel('Máximo de casos ativos').waitFor()
    await p.waitForFunction(() => document.querySelector('input[type=number]')?.value === '5')
    passed.push('Volunteer capacity persists; failed availability save never reports success')
    await p.screenshot({ path: join(artifacts, 'voluntario-disponibilidade.png') })
    failRead = true
    await p.reload()
    await p.getByText(/A edição está bloqueada para preservar os horários existentes/).waitFor()
    assert.equal(await p.getByRole('button', { name: 'Salvar disponibilidade', exact: true }).isDisabled(), true)
    failRead = false
    await p.getByRole('button', { name: 'Tentar novamente', exact: true }).click()
    await p.locator('#switch-monday').waitFor()
    passed.push('Availability read failure blocks overwrite and retry restores server state')
  } finally { await volunteer.close() }
  assert.deepEqual(errors, [], 'no uncaught page exceptions')
  console.log(JSON.stringify({ passed, count: passed.length, screenshots: artifacts }))
} catch (error) {
  if (context) for (const p of context.pages()) { await p.screenshot({ path: join(artifacts, 'failure.png') }).catch(() => {}); console.log((await p.locator('body').innerText()).slice(-2500)) }
  console.log(apiError.slice(-2500))
  throw error
} finally {
  if (context) await context.close()
  if (browser) await browser.close()
  if (server) await server.close()
  if (api.exitCode === null) {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(api.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
    else api.kill('SIGTERM')
  }
  await rm(folder, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
