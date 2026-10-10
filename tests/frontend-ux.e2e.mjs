// Synthetic UI regression tests: no production login, data, or writes.
// npm install --no-save --package-lock=false playwright && npx playwright install chromium
// TDB_PLAYWRIGHT_MODULE=/path/to/playwright npm run test:ux
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'vite'
const { chromium } = createRequire(import.meta.url)(process.env.TDB_PLAYWRIGHT_MODULE || 'playwright')
const origin = 'http://127.0.0.1:5187'
process.env.VITE_API_URL = origin
process.env.VITE_JAVA_API_URL = origin + '/java'
process.env.VITE_AI_API_URL = origin + '/ai'
const server = await createServer({server:{host:'127.0.0.1',port:5187,strictPort:true}})
await server.listen()
const browser = await chromium.launch({headless:true})
const fixtures = {
 '/api/admin/dashboard':{kpis:{totalBeneficiaries:23,totalVolunteers:12,totalAppointments:30},trends:[{month:"Set",value:10},{month:"Out",value:23}],pipeline:[],regional:[{region:"Sudeste",count:23}],programs:[],alerts:[],insights:[],satisfaction:[]},
 '/api/admin/approvals':{kpis:{pending:0,approvedToday:0,rejected:0,urgent:0},requests:[],approved:[],rejected:[]},
 '/api/beneficiaries/me/dashboard':{name:'Pessoa de Teste',caseId:999999,status:'in-progress',currentStep:'Consulta',journeySteps:[],nextAppointment:null,appointmentsNeedingConfirmation:[],recentMessages:[],reminders:[],satisfaction:{canSubmit:false}},
 '/api/admin/settings':{}, '/api/admin/profile':{nome:'Pessoa de Teste',email:'test@example.invalid',role:'ADMIN'}, '/api/admin/whatsapp/status':{enabled:false},
 '/api/admin/programs':{programs:[]}, '/api/admin/reports':{reportTypes:[],recentReports:[]},
}
let passed = 0
async function scenario(name, route, check, {width=390, failures=[], anonymous=false, dark=false}={}) {
 if (process.env.TDB_UX_FILTER && !name.includes(process.env.TDB_UX_FILTER)) return
 const ctx = await browser.newContext({viewport:{width,height:900},colorScheme:dark?'dark':'light',reducedMotion:'reduce'})
 const page = await ctx.newPage(), errors=[], requests=[]
 let loggedIn = !anonymous
 const failed = new Set(failures)
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/*', async r=>{
  const u = new URL(r.request().url())
  if (u.origin !== origin) return r.abort()
  if (!/^\/(api|java|ai)(\/|$)/.test(u.pathname)) return r.continue()
  requests.push({path:u.pathname,method:r.request().method()})
  if (u.pathname==='/api/auth/session' || u.pathname==='/api/auth/browser/login') {
   if (u.pathname.endsWith('/login')) loggedIn=true
   if (!loggedIn) return r.fulfill({status:401,json:{detail:'Synthetic anonymous'}})
   const role = route.startsWith('/admin')?'ADMIN':route.includes('/voluntario')?'VOLUNTARIO':'BENEFICIARIO'
   const token='x.'+Buffer.from(JSON.stringify({sub:'999999',role,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.synthetic'
   return r.fulfill({json:{access_token:token,user:{id:999999,role,full_name:'Pessoa de Teste',email:'test@example.invalid'}}})
  }
  if (!failed.has(u.pathname) && Object.hasOwn(fixtures,u.pathname)) return r.fulfill({json:fixtures[u.pathname]})
  return r.fulfill({status:503,json:{detail:'Indisponibilidade sintética'}})
 })
 try {
  await page.goto(origin+route)
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(()=>document.body.innerText.trim() !== 'Carregando...')
  await check(page,failed,requests)
  assert.deepEqual(errors,[],`${name}: no uncaught browser exceptions`)
  passed++; console.log(`PASS ${name}`)
 } finally { await ctx.close() }
}
const noOverflow = async p=>assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2),'page fits viewport')
const contrast = async locator => locator.evaluate(el=>{
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d')
 const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)}
 const lum=color=>rgb(color).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0)
 const style=getComputedStyle(el),a=lum(style.color),b=lum(style.backgroundColor)
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)
})
try {
 for (const dark of [false,true]) {
  await scenario(`approval buttons and mobile tabs (${dark?'dark':'light'})`,'/admin/aprovacoes',async p=>{
   const button=p.getByRole('button',{name:'Exportar',exact:true});await button.waitFor()
   assert.ok(await contrast(button)>=4.5,'outline text readable')
   await button.hover(); await p.waitForTimeout(250)
   assert.ok(await contrast(button)>=4.5,'outline hover readable')
   await noOverflow(p)
  },{dark})
 }
 for (const dark of [false,true]) await scenario(`dashboard chart palette (${dark?'dark':'light'})`,'/admin',async p=>{
  const bar=p.locator('.recharts-bar-rectangle path').first();await bar.waitFor()
  const colors=await bar.evaluate(el=>{
   const probe=document.createElement('span');probe.style.color='var(--chart-1)';document.body.append(probe)
   const expected=getComputedStyle(probe).color,actual=getComputedStyle(el).fill;probe.remove()
   return {expected,actual}
  })
  assert.equal(colors.actual,colors.expected,'chart uses theme color rather than invalid-color black fallback')
 },{dark,width:1440})
 await scenario('beneficiary journey fits phone' ,'/dashboard/beneficiario',async p=>{
  await p.getByRole('progressbar',{name:'Progresso das etapas'}).waitFor();await noOverflow(p)
  assert.ok(await p.locator('main ol li').count()>=4)
 })
 await scenario('Apolônias signup fits phone','/cadastro/apolonias',async p=>{
  await p.getByRole('progressbar').waitFor();await noOverflow(p)
 })
 for (const [route,endpoint,empty] of [
  ['/admin/aprovacoes','/api/admin/approvals','Nenhuma aprovação pendente agora'],
  ['/admin/programas','/api/admin/programs','Nenhum programa encontrado'],
  ['/admin/relatorios','/api/admin/reports','Nenhum relatório'],
  ['/admin','/api/admin/dashboard','Nenhum alerta crítico no momento'],
 ]) await scenario(`failure and retry ${route}`,route,async(p,failed)=>{
  const retry=p.getByRole('button',{name:'Tentar novamente',exact:true});await retry.waitFor()
  assert.equal(await p.getByText(empty,{exact:false}).count(),0)
  failed.delete(endpoint);await retry.click();await retry.waitFor({state:'hidden'})
 },{failures:[endpoint]})
 await scenario('unsupported dashboard filters explicit','/admin',async p=>{
  await p.getByText('Todos os períodos',{exact:true}).waitFor()
  assert.equal(await p.getByRole('combobox').count(),3)
  for(const combo of await p.getByRole('combobox').all()) assert.ok(await combo.isDisabled())
  assert.ok(await p.getByText('Todos os períodos',{exact:true}).isVisible())
 })
 await scenario('settings failure blocks writes','/admin/configuracoes',async(p,failed,requests)=>{
  await p.getByRole('button',{name:'Tentar novamente',exact:true}).waitFor()
  assert.ok(await p.getByRole('button',{name:'Salvar alterações',exact:false}).isDisabled())
  await p.getByRole('tab',{name:'Geral',exact:true}).click()
  assert.ok(await p.getByRole('switch').first().isDisabled())
  assert.equal(requests.filter(r=>r.method==='PUT').length,0)
  failed.clear();await p.getByRole('button',{name:'Tentar novamente',exact:true}).click()
  await p.getByRole('button',{name:'Tentar novamente',exact:true}).waitFor({state:'hidden'})
  assert.equal(await p.getByRole('button',{name:'Salvar alterações',exact:false}).isDisabled(),false)
 },{failures:['/api/admin/settings']})
 await scenario('WhatsApp failure does not block loaded settings','/admin/configuracoes',async p=>{
  const save=p.getByRole('button',{name:'Salvar alterações',exact:false});await save.waitFor()
  assert.equal(await save.isDisabled(),false)
  await p.getByRole('tab',{name:'Notificações',exact:true}).click()
  assert.ok(await p.getByText('Indisponível',{exact:true}).first().isVisible())
 },{failures:['/api/admin/whatsapp/status']})
 await scenario('password recovery does not simulate delivery','/admin/recuperar-senha',async(p,_,requests)=>{
  await p.getByRole('heading',{name:'Recuperar acesso administrativo'}).waitFor()
  assert.equal(await p.locator('input[type=email]').count(),0)
  assert.equal(requests.filter(r=>r.method==='POST').length,0)
  assert.ok(await p.locator('a[href="/contato"]').isVisible())
 })
 await scenario('skip link reaches main content','/',async p=>{
  await p.keyboard.press('Tab');await p.getByRole('link',{name:'Pular para conteúdo',exact:true}).click()
  assert.equal(await p.evaluate(()=>document.activeElement?.tagName),'MAIN')
 })
 await scenario('unknown URL has recovery page','/does-not-exist',async p=>{
  await p.getByRole('heading',{name:'Página não encontrada'}).waitFor()
  assert.ok(p.url().endsWith('/does-not-exist'))
 })
 await scenario('program deep link selects correct slide','/programas#apolonias-do-bem',async p=>{
  const card=p.locator('#apolonias-do-bem');await card.waitFor()
  await p.waitForTimeout(500)
  const box=await card.boundingBox();assert.ok(box.x>=-1 && box.x<390 && box.y>=0 && box.y<900,JSON.stringify(box))
 })
 await scenario('admin login resumes protected destination','/admin/programas?view=all',async p=>{
  await p.waitForURL('**/admin/login');await p.locator('#email').fill('test@example.invalid')
  await p.locator('#password').fill('synthetic-password-123');await p.locator('#role').click()
  await p.getByRole('option',{name:'Administrador',exact:false}).click()
  await p.locator('button[type=submit]').click();await p.waitForURL('**/admin/programas?view=all')
 },{anonymous:true})
 console.log(`${passed} UI regression scenarios passed`)
} finally { await browser.close(); await server.close() }
