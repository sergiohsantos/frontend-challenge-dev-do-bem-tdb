import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'
import { fileURLToPath } from 'node:url'

test('civil dates, UTC events and Sao Paulo appointments preserve their distinct contracts', async () => {
  const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } } })
  const previous = process.env.TZ
  try {
    const d = await server.ssrLoadModule('/src/lib/dates.ts')
    const registration = await server.ssrLoadModule('/src/lib/registration-validation.ts')
    for (const zone of ['UTC', 'America/Sao_Paulo', 'America/Manaus']) {
      process.env.TZ = zone
      assert.equal(d.calendarDate('29/02/2024'), '2024-02-29')
      assert.equal(registration.isValidDate('2025-02-29'), false)
      assert.equal(registration.isValidDate('2024-02-29'), true)
      assert.equal(registration.isValidDate('2099-01-01'), false)
      assert.equal(d.formatDate('2026-10-21'), '21/10/2026')
      assert.equal(d.utcTimestamp('2026-10-16T12:18:39'), Date.parse('2026-10-16T12:18:39Z'))
      assert.equal(d.utcTimestamp('2026-02-30T12:00:00Z'), null)
      assert.equal(d.utcTimestamp('2026-10-16T12:18:39.123456Z'), Date.parse('2026-10-16T12:18:39.123Z'))
      assert.equal(d.appointmentTimestamp('2026-10-21', '14:00'), Date.parse('2026-10-21T17:00:00Z'))
    }
    process.env.TZ = 'America/Sao_Paulo'
    assert.match(d.formatDateTime('2026-10-16T01:10:00Z'), /15\/10\/2026.*22:10/)
    assert.equal(d.formatDateTime('2026-10-21'), '21/10/2026')
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; await server.close() }
})
