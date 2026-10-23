import { z } from 'zod'

const timestamp = z.string().datetime({ offset: true })
const nullableMetric = z.number().finite().nonnegative().nullable()
const rate = z.number().finite().min(0).max(100).nullable()
const pointSchema = z.object({
  timestamp, requests: z.number().finite().int().nonnegative(),
  bytesDownloaded: nullableMetric, totalErrorRate: rate, error4xxRate: rate, error5xxRate: rate,
})
const snapshotSchema = z.object({
  schemaVersion: z.literal(1), source: z.literal('cloudfront'), scope: z.literal('distribution'),
  generatedAt: timestamp, windowStart: timestamp, windowEnd: timestamp,
  periodSeconds: z.literal(60), points: z.array(pointSchema).max(60),
})

export type InfrastructureSnapshot = z.infer<typeof snapshotSchema>
export type InfrastructurePoint = z.infer<typeof pointSchema>
export type HealthPeriod = 10 | 30 | 60
export const HEALTH_OBJECT_PATH = '/observability/health.json'

export function infrastructureRate(value: number | null) {
  if (value === null) return '—'
  if (value > 0 && value < 0.01) return '<0,01%'
  if (value < 100 && value > 99.99) return '>99,99%'
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

export function parseInfrastructureSnapshot(raw: unknown, now = Date.now()): InfrastructureSnapshot {
  const parsed = snapshotSchema.safeParse(raw)
  if (!parsed.success) throw new Error('Os dados de infraestrutura estão em um formato indisponível.')
  const data = parsed.data
  const start = Date.parse(data.windowStart), end = Date.parse(data.windowEnd)
  const generated = Date.parse(data.generatedAt)
  const stamps = data.points.map(point => Date.parse(point.timestamp))
  if (end - start !== 3600000 || start % 60000 !== 0 || end % 60000 !== 0 ||
      generated < end || generated > now + 120000 || new Set(stamps).size !== stamps.length ||
      stamps.some(stamp => stamp < start || stamp >= end || stamp % 60000 !== 0)) {
    throw new Error('O período dos dados de infraestrutura é inválido.')
  }
  return { ...data, points: [...data.points].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)) }
}

export async function fetchInfrastructureHealth(signal: AbortSignal): Promise<InfrastructureSnapshot> {
  let response: Response
  try {
    response = await fetch(HEALTH_OBJECT_PATH, {
      credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { Accept: 'application/json' }, signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    })
  } catch (cause) {
    if (signal.aborted) throw cause
    throw new Error('Não foi possível conectar ao monitoramento agora. Tente novamente em instantes.')
  }
  if (response.status === 404 || response.status === 403) {
    throw new Error('A coleta de infraestrutura ainda não está disponível. Aguarde a ativação do monitoramento.')
  }
  if (!response.ok) throw new Error('Não foi possível atualizar a infraestrutura agora. Tente novamente em instantes.')
  if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    throw new Error('O monitoramento não retornou dados válidos. Tente novamente em instantes.')
  }
  let raw: unknown
  try { raw = await response.json() }
  catch { throw new Error('O monitoramento retornou dados inválidos. Tente novamente em instantes.') }
  return parseInfrastructureSnapshot(raw)
}

export function summarizeInfrastructure(data: InfrastructureSnapshot, minutes: HealthPeriod, now = Date.now()) {
  const end = Date.parse(data.windowEnd), start = end - minutes * 60000
  const points = data.points.filter(point => Date.parse(point.timestamp) >= start)
  const requests = points.reduce((sum, point) => sum + point.requests, 0)
  const active = points.filter(point => point.requests > 0)
  const weightedRate = (key: 'totalErrorRate' | 'error4xxRate' | 'error5xxRate') =>
    !requests || active.some(point => point[key] === null) ? null :
      active.reduce((sum, point) => sum + point.requests * (point[key] as number), 0) / requests
  const totalErrorRate = weightedRate('totalErrorRate')
  const error5xxRate = weightedRate('error5xxRate')
  const latestSample = points.length ? points[points.length - 1].timestamp : null
  const stale = now - Date.parse(data.generatedAt) > 180000 ||
    Boolean(latestSample && now - Date.parse(latestSample) > 300000)
  const missing = points.length !== minutes
  const status = stale ? 'Dados atrasados' : !points.length ? 'Sem amostras' :
    error5xxRate === null ? 'Dados parciais' : error5xxRate > 0 ? 'Erros 5xx observados' : 'Sem erros 5xx observados'
  const byStamp = new Map(points.map(point => [Date.parse(point.timestamp), point]))
  const chart = Array.from({ length: minutes }, (_, i) => {
    const stamp = start + i * 60000
    return byStamp.get(stamp) || { timestamp: new Date(stamp).toISOString(), requests: null,
      bytesDownloaded: null, totalErrorRate: null, error4xxRate: null, error5xxRate: null }
  })
  return {
    points, chart, requests: points.length ? requests : null,
    requestsPerSecond: points.length ? requests / (points.length * 60) : null,
    bytesDownloaded: !points.length || points.some(point => point.bytesDownloaded === null) ? null :
      points.reduce((sum, point) => sum + (point.bytesDownloaded as number), 0),
    totalErrorRate, error4xxRate: weightedRate('error4xxRate'), error5xxRate,
    successRate: totalErrorRate === null ? null : 100 - totalErrorRate,
    latestSample, missing, stale, status, sampleCount: points.length,
  }
}

export function infrastructureClock(value: string, includeDate = false) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', ...(includeDate ? { day: '2-digit', month: '2-digit', year: 'numeric' } as const : {}),
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value))
}
