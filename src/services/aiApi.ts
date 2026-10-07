import { getToken } from "@/lib/auth"
import type {
  AIHealthResponse,
  AIModelStatusResponse,
  AIReadyResponse,
  PredictRequest,
  PredictResponse,
} from "@/types/ai"

function getAIApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_AI_API_URL
  if (configuredUrl) return configuredUrl
  if (import.meta.env.DEV) return "https://apichatbot-devdobem.clinicarx.dev/ai"
  throw new Error("VITE_AI_API_URL precisa ser configurada para o build de producao.")
}

const AI_API_BASE_URL = getAIApiBaseUrl()

function joinUrl(path: string): string {
  const base = AI_API_BASE_URL.replace(/\/+$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}

async function aiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(joinUrl(path), {
    ...options,
    headers,
  })

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (response.status === 401) {
    throw new Error("Sua sessão é inválida ou expirou. Entre novamente para consultar a IA.")
  }
  if (response.status === 403) {
    throw new Error("Seu perfil não tem permissão para consultar a IA.")
  }
  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o servico de IA agora.")
  }

  return data as T
}

export function getAIHealth(): Promise<AIHealthResponse> {
  return aiFetch<AIHealthResponse>("/health")
}

export function getAIReady(): Promise<AIReadyResponse> {
  return aiFetch<AIReadyResponse>("/ready")
}

export function getAIModelStatus(): Promise<AIModelStatusResponse> {
  return aiFetch<AIModelStatusResponse>("/model/status")
}

export function predictNoShowRisk(payload: PredictRequest): Promise<PredictResponse> {
  return aiFetch<PredictResponse>("/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

