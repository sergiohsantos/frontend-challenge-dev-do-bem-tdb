import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'

let server, health
before(async () => {
  server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, hmr: false } })
  health = await server.ssrLoadModule('/src/services/infrastructure-health.service.ts')
})
after(async () => { await server?.close() })
const end = '2026-10-23T15:10:00Z'
const now = Date.parse(end)
const point = (timestamp, requests, errorRate = 0) => ({ timestamp, requests, bytesDownloaded: 1000, totalErrorRate: errorRate, error4xxRate: errorRate, error5xxRate: 0 })
const snapshot = (points = []) => ({ schemaVersion: 1, source: 'cloudfront', scope: 'distribution', generatedAt: end,
  windowStart: '2026-10-23T14:10:00Z', windowEnd: end, periodSeconds: 60, points })

test('weighted errors, sample coverage and chart gaps are distinct from zero', () => {
  const parsed = health.parseInfrastructureSnapshot(snapshot([
    point('2026-10-23T15:08:00Z', 900, 0), point('2026-10-23T15:09:00Z', 100, 10),
  ]), now)
  const summary = health.summarizeInfrastructure(parsed, 10, now)
  assert.equal(summary.requests, 1000)
  assert.equal(summary.totalErrorRate, 1)
  assert.equal(summary.successRate, 99)
  assert.equal(summary.requestsPerSecond, 1000 / 120)
  assert.equal(summary.sampleCount, 2)
  assert.equal(summary.missing, true)
  assert.equal(summary.chart.length, 10)
  assert.equal(summary.chart[0].requests, null)
  assert.equal(summary.chart[9].requests, 100)
  assert.equal(summary.status, 'Sem erros 5xx observados')
  assert.equal(health.infrastructureRate(0.0001), '<0,01%')
  assert.equal(health.infrastructureRate(99.9999), '>99,99%')
  assert.equal(health.infrastructureRate(0), '0,00%')
})

test('missing rates and empty windows never produce a healthy 100 percent', () => {
  const empty = health.summarizeInfrastructure(snapshot(), 10, now)
  assert.equal(empty.requests, null)
  assert.equal(empty.totalErrorRate, null)
  assert.equal(empty.successRate, null)
  assert.equal(empty.status, 'Sem amostras')
  const p = { ...point('2026-10-23T15:09:00Z', 100), totalErrorRate: null, error5xxRate: null, bytesDownloaded: null }
  const missing = health.summarizeInfrastructure(snapshot([p]), 10, now)
  assert.equal(missing.successRate, null)
  assert.equal(missing.bytesDownloaded, null)
  assert.equal(missing.status, 'Dados parciais')
  assert.equal(health.summarizeInfrastructure(snapshot([p]), 10, now + 360000).status, 'Dados atrasados')
})

test('malformed, future, duplicated, misaligned and out-of-window samples are rejected', () => {
  const valid = point('2026-10-23T15:09:00Z', 100)
  for (const raw of [
    '<html>SPA fallback</html>', { ...snapshot(), schemaVersion: 2 },
    snapshot([valid, valid]), snapshot([{ ...valid, error5xxRate: 101 }]),
    snapshot([{ ...valid, timestamp: end }]), snapshot([{ ...valid, timestamp: '2026-10-23T15:09:01Z' }]),
    { ...snapshot(), generatedAt: '2026-10-23T16:00:00Z' },
  ]) assert.throws(() => health.parseInfrastructureSnapshot(raw, now))
  assert.equal(health.infrastructureClock('2026-10-23T01:10:00Z', true), '22/10/2026, 22:10')
})

test('request is same-origin, bounded and never transmits account credentials', async () => {
  const original = globalThis.fetch
  let options, path
  try {
    globalThis.fetch = async (url, init) => {
      path = url; options = init
      const liveEnd = Math.floor(Date.now() / 60000) * 60000
      return new Response(JSON.stringify({ ...snapshot(), generatedAt: new Date().toISOString(),
        windowStart: new Date(liveEnd - 3600000).toISOString(), windowEnd: new Date(liveEnd).toISOString() }),
      { headers: { 'Content-Type': 'application/json' } })
    }
    await health.fetchInfrastructureHealth(new AbortController().signal)
    assert.equal(path, '/observability/health.json')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.Authorization, undefined)
    assert.ok(options.signal instanceof AbortSignal)
    globalThis.fetch = async () => new Response('<html>fallback</html>', { headers: { 'Content-Type': 'text/html' } })
    await assert.rejects(() => health.fetchInfrastructureHealth(new AbortController().signal), /válidos/)
    globalThis.fetch = async () => new Response('', { status: 404 })
    await assert.rejects(() => health.fetchInfrastructureHealth(new AbortController().signal), /ativação/)
    globalThis.fetch = async () => { throw new TypeError('Technical network detail') }
    await assert.rejects(() => health.fetchInfrastructureHealth(new AbortController().signal), /conectar ao monitoramento/)
    globalThis.fetch = async () => new Response('invalid json', { headers: { 'Content-Type': 'application/json' } })
    await assert.rejects(() => health.fetchInfrastructureHealth(new AbortController().signal), /dados inválidos/)
  } finally { globalThis.fetch = original }
})

test('admin boundary and deployment preserve the operational telemetry namespace', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  assert.match(app, /path="\/admin\/infraestrutura" element=\{<RequireRole role="admin"/)
  const script = await readFile(new URL('../scripts/deploy-frontend.sh', import.meta.url), 'utf8')
  assert.match(script, /--exclude 'observability\/\*'/)
})
