const JAVA_API_BASE_URL = import.meta.env.VITE_JAVA_API_URL || "http://localhost:8080"

type PrimitiveRecord = Record<string, unknown>

function joinUrl(path: string): string {
  const base = JAVA_API_BASE_URL.replace(/\/+$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}

function isObject(value: unknown): value is PrimitiveRecord {
  return typeof value === "object" && value !== null
}

function extractErrorMessage(data: unknown, status: number): string {
  if (isObject(data)) {
    const candidates = [
      data.message,
      data.detail,
      data.error,
      data.title,
    ]

    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate
      }
    }
  }

  if (status >= 500) {
    return "O backend Java não conseguiu processar a solicitação agora."
  }

  if (status === 404) {
    return "O recurso solicitado não foi encontrado no backend Java."
  }

  if (status === 422) {
    return "Os dados enviados para o backend Java precisam ser revisados."
  }

  return `Erro na integração com o backend Java (${status}).`
}

export async function javaApiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  const response = await fetch(joinUrl(path), {
    ...options,
    headers: token
      ? {
          ...headers,
          Authorization: `Bearer ${token}`,
        }
      : headers,
  })

  let data: unknown = null

  if (response.status !== 204) {
    try {
      data = await response.json()
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(data, response.status))
  }

  return data as T
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (isObject(value)) {
    const candidates = [value.data, value.items, value.content, value.results]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as T[]
      }
    }
  }

  return []
}

export function asObject(value: unknown): PrimitiveRecord {
  return isObject(value) ? value : {}
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "true") return true
    if (normalized === "false") return false
  }

  return undefined
}
