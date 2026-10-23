// Run after npm run build with VITE_API_URL=http://127.0.0.1:5199.
// All API requests are intercepted; no production access or real notifications.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.env.TDB_PLAYWRIGHT_MODULE || 'playwright')
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const origin = 'http://127.0.0.1:5199'
const types = { '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, origin).pathname
  const file = pathname.startsWith('/assets/') ? resolve(dist, '.' + pathname) : join(dist, 'index.html')
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return }
  try { res.setHeader('Content-Type', types[extname(file)] || 'text/html'); res.end(await readFile(file)) }
  catch { res.writeHead(404).end() }
})
await new Promise(resolve => server.listen(5199, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.env.TDB_CHROMIUM_EXECUTABLE ? { executablePath: process.env.TDB_CHROMIUM_EXECUTABLE } : {}) })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const patients = [{ id: 1, name: 'Paciente com dois procedimentos' }, { id: 2, name: 'Paciente já agendado' }, { id: 3, name: 'Paciente reagendamento' }, { id: 4, name: 'Paciente concluído' }]
  const procedure = (id, patient, available, extra = {}) => ({ id, public_id: id, beneficiario_id: patient, beneficiaryId: patient, beneficiario: patients.find(p => p.id === patient).name, procedimento: 'Procedimento ' + id, procedureTitle: 'Procedimento ' + id, status: 'aprovado', prioridade: 'normal', dataSolicitacao: '2030-01-01', canSchedule: available, ...extra })
  const requests = [procedure('SYN-A', 1, true), procedure('SYN-B', 1, true), procedure('SYN-C', 2, false, { appointmentId: 20, appointmentStatus: 'scheduled' }), procedure('SYN-R', 3, true, { canReschedule: true, appointmentId: 30, appointmentStatus: 'rescheduled' }), procedure('SYN-D', 4, false, { appointmentId: 40, appointmentStatus: 'completed' })]
  const schedule = [{ id: 30, patientId: 3, patientName: patients[2].name, date: '2030-02-10', time: '15:00', status: 'rescheduled', approvalRequestId: 'SYN-R' }]
  let posts = 0, failAvailability = false
  await page.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/auth/session') {
      const token = 'x.' + Buffer.from(JSON.stringify({ sub: '999999', role: 'VOLUNTARIO', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url') + '.synthetic'
      return route.fulfill({ json: { access_token: token, user: { id: 999999, role: 'VOLUNTARIO', full_name: 'Voluntário Sintético' } } })
    }
    if (url.pathname === '/api/volunteers/my-patients') return route.fulfill({ json: { items: patients } })
    if (url.pathname === '/api/volunteers/procedure-requests') return route.fulfill({ status: failAvailability ? 503 : 200, json: failAvailability ? { detail: 'Disponibilidade temporariamente indisponível' } : requests })
    if (url.pathname === '/api/volunteers/schedule') return route.fulfill({ json: { appointments: schedule } })
    if (url.pathname === '/api/volunteers/appointments' && route.request().method() === 'POST') {
      posts++
      const data = route.request().postDataJSON()
      const selected = requests.find(item => item.id === data.approvalRequestId)
      assert.equal(selected?.canSchedule, true)
      selected.canSchedule = false
      await new Promise(resolve => setTimeout(resolve, 100))
      return route.fulfill({ status: 201, json: { id: 100, message: 'Consulta sintética agendada' } })
    }
    return route.fulfill({ json: { notifications: [], items: [] } })
  })
  const form = '/dashboard/voluntario/agenda/novo?patientId=1&approvalRequestId=SYN-A'
  await page.goto(origin + form)
  const patientSelect = page.getByRole('combobox', { name: 'Selecione o paciente' })
  const procedureSelect = () => page.getByRole('combobox', { name: 'Selecione o procedimento aprovado' })
  await patientSelect.click()
  assert.equal(await page.getByRole('option', { name: patients[1].name, exact: true }).count(), 0)
  assert.equal(await page.getByRole('option', { name: patients[3].name, exact: true }).count(), 0)
  await page.getByRole('option', { name: patients[0].name, exact: true }).click()
  await procedureSelect().click()
  await page.getByRole('option', { name: 'SYN-A • Procedimento SYN-A', exact: true }).click()
  await page.locator('#date').fill('2030-02-05')
  await page.locator('#time').fill('15:00')
  requests[0].canSchedule = false // Another browser schedules it before this form submits.
  await page.getByRole('button', { name: 'Agendar consulta', exact: true }).click()
  await page.getByText('Este procedimento não está mais disponível para agendamento. A lista foi atualizada.', { exact: true }).waitFor()
  assert.equal(posts, 0)
  await procedureSelect().click()
  assert.equal(await page.getByRole('option', { name: 'SYN-A • Procedimento SYN-A', exact: true }).count(), 0)
  await page.getByRole('option', { name: 'SYN-B • Procedimento SYN-B', exact: true }).click()
  await page.getByRole('button', { name: 'Agendar consulta', exact: true }).evaluate(button => { button.click(); button.click() })
  await page.getByText('Agendamento atualizado', { exact: true }).waitFor()
  assert.equal(posts, 1)
  console.log('PASS eligible patients, independent procedures, stale availability and double-submit guard')

  await page.goto(origin + '/dashboard/voluntario/solicitacoes')
  await page.getByRole('tab', { name: /Aprovados/ }).click()
  await page.getByRole('heading', { name: 'Reagendamento solicitado (1)', exact: true }).waitFor()
  assert.equal(await page.getByRole('link', { name: 'Agendar consulta', exact: true }).count(), 0)
  assert.equal(await page.getByRole('link', { name: 'Reagendar consulta', exact: true }).count(), 1)
  await page.getByText('Consulta realizada', { exact: true }).waitFor()
  if (process.env.TDB_ARTIFACT_DIR) {
    await mkdir(process.env.TDB_ARTIFACT_DIR, { recursive: true })
    await page.screenshot({ path: join(process.env.TDB_ARTIFACT_DIR, 'scheduling-approved-history.png'), fullPage: true })
  }
  await page.getByRole('link', { name: 'Reagendar consulta', exact: true }).click()
  await procedureSelect().waitFor()
  await page.locator('#date').fill('2030-02-10')
  await page.locator('#time').fill('15:00')
  assert.equal(await page.getByText(/Conflito de agenda:/).count(), 0)
  await page.getByRole('button', { name: 'Agendar consulta', exact: true }).waitFor({ state: 'visible' })
  assert.equal(await page.getByRole('button', { name: 'Agendar consulta', exact: true }).isEnabled(), true)
  schedule.push({ id: 99, patientName: 'Outro paciente', date: '2030-02-10', time: '15:00', status: 'scheduled' })
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByText(/Conflito de agenda:.*Outro paciente/).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Agendar consulta', exact: true }).isEnabled(), false)
  console.log('PASS approval history, reschedule preselection, self-exclusion and other appointment conflict')

  failAvailability = true
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByText('Disponibilidade temporariamente indisponível', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Agendar consulta', exact: true }).isEnabled(), false)
  failAvailability = false
  requests[3].canSchedule = false
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.getByText(/Nenhum procedimento disponível para agendamento\./).waitFor()
  assert.equal(await page.getByRole('combobox', { name: 'Selecione o paciente' }).count(), 0)
  assert.equal(await page.getByText(/Conflito de agenda:/).count(), 0)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false)
  if (process.env.TDB_ARTIFACT_DIR) await page.screenshot({ path: join(process.env.TDB_ARTIFACT_DIR, 'scheduling-empty-mobile.png'), fullPage: true })
  assert.deepEqual(errors, [])
  console.log('PASS focus refresh, unavailable API blocks writes, empty queue and mobile layout')
  await context.close()
} finally {
  if (browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
}
