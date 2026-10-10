import { getPythonApiBaseUrl } from "./api-base"

export interface AuthUser {
  id: number
  role: string
  full_name: string
  name?: string
  email?: string
}

// Access credential and profile exist only in this page's memory.
let accessToken: string | null = null
let currentUser: AuthUser | null = null
let expiresAt = 0
let ready = false
let generation = 0
let version = 0
let pendingRestore: Promise<boolean> | null = null
let pendingLogout: Promise<void> | null = null
const listeners = new Set<() => void>()
function notify() { version++; listeners.forEach(listener => listener()) }
export const subscribeAuth = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const getAuthVersion = () => version
export const isAuthReady = () => ready

function removeLegacyStorage(): void {
  if (typeof window === "undefined") return
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      window[name]?.removeItem("tdb_token")
      window[name]?.removeItem("tdb_user")
    } catch { /* Storage restrictions must not disable cookie authentication. */ }
  }
  if (typeof document !== "undefined") {
    for (const name of ["tdb_token", "tdb_role"]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
    }
  }
}

function forgetSession(): void {
  accessToken = null
  currentUser = null
  expiresAt = 0
  removeLegacyStorage()
  notify()
}

function setMemoryAuth(token: string, user: AuthUser): void {
  let expiry: number
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    expiry = Number(JSON.parse(atob(part)).exp) * 1000
    if (!Number.isFinite(expiry) || expiry <= Date.now()) throw new Error("Expired token")
  } catch { throw new Error("Resposta de autenticação inválida.") }
  accessToken = token
  expiresAt = expiry
  currentUser = { ...user, role: normalizeRole(user.role),
    full_name: user.full_name || user.name || "", name: user.name || user.full_name || "" }
  removeLegacyStorage()
  notify()
}

export function saveAuth(token: string, user: AuthUser): void {
  generation++
  setMemoryAuth(token, user)
  ready = true
  notify()
}
export function getToken(): string | null { return accessToken }
export function getUser(): AuthUser | null { return currentUser }
export function getRoleFromCookie(): string | null { return currentUser?.role || null }
export function isAuthenticated(): boolean { return !!accessToken }

function sessionUrl(path: string): string {
  const base = getPythonApiBaseUrl().replace(/\/+$/, "")
  const url = new URL(`${base}/api/auth/${path}`, window.location.origin)
  if (import.meta.env.PROD && url.origin !== window.location.origin) {
    throw new Error("Não foi possível iniciar uma sessão segura neste endereço.")
  }
  return url.href
}

export async function restoreSession(): Promise<boolean> {
  if (pendingRestore) return pendingRestore
  const startedAt = generation
  pendingRestore = (async () => {
    const response = await fetch(sessionUrl("session"), {
      credentials: "include", cache: "no-store", redirect: "error",
      headers: { "X-TDB-CSRF": "1" }, signal: AbortSignal.timeout(8000),
    })
    if (startedAt !== generation) return !!accessToken
    if (response.status === 401) { forgetSession(); return false }
    if (!response.ok) throw new Error("Não foi possível restaurar a sessão. Tente novamente.")
    const data = await response.json()
    if (startedAt !== generation) return !!accessToken
    setMemoryAuth(data.access_token, data.user)
    return true
  })().finally(() => { pendingRestore = null })
  return pendingRestore
}

export async function initializeAuth(): Promise<void> {
  removeLegacyStorage()
  try { await restoreSession() } catch { /* Public pages remain usable if the API is unavailable. */ }
  finally { ready = true; notify() }
}

export async function getFreshToken(): Promise<string | null> {
  if (pendingLogout) throw new Error("Saída da sessão em andamento.")
  if (!accessToken) return null
  if (expiresAt - Date.now() < 30000) {
    if (!await restoreSession()) throw new Error("Sua sessão expirou. Entre novamente.")
  }
  return accessToken
}

const channel = typeof window !== "undefined" && "BroadcastChannel" in window
  ? new BroadcastChannel("tdb-auth") : null
if (channel) channel.onmessage = event => {
  if (event.data === "logout") { generation++; forgetSession() }
}

export async function clearAuth(): Promise<void> {
  if (pendingLogout) return pendingLogout
  generation++ // An earlier refresh must not recreate memory state after logout.
  pendingLogout = (async () => {
    const response = await fetch(sessionUrl("logout"), {
      method: "POST", credentials: "include", cache: "no-store", redirect: "error",
      headers: { "X-TDB-CSRF": "1" }, signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão. Tente novamente.")
    forgetSession()
    channel?.postMessage("logout")
  })().finally(() => { pendingLogout = null })
  return pendingLogout
}

/**
 * Normalize role values from backend to frontend expected format
 * Handles various formats like UPPERCASE, English variants, etc.
 */
export function normalizeRole(role: string): string {
  if (!role) return "unknown"
  
  const normalized = role.toLowerCase().trim()
  
  // Beneficiary family
  if (normalized === "beneficiario" || normalized === "beneficiary") {
    return "beneficiario"
  }
  
  // Volunteer family
  if (normalized === "voluntario" || normalized === "volunteer") {
    return "voluntario"
  }
  
  // Admin family
  if (
    normalized === "admin" ||
    normalized === "administrator" ||
    normalized === "manager" ||
    normalized === "coordinator" ||
    normalized === "support" ||
    normalized === "gestor" ||
    normalized === "coordenador" ||
    normalized === "suporte"
  ) {
    return "admin"
  }
  
  return "unknown"
}

/**
 * Get redirect path based on user role
 * Uses normalizeRole to handle various backend role formats
 */
export function getRedirectPath(role: string): string {
  const normalizedRole = normalizeRole(role)
  
  switch (normalizedRole) {
    case "beneficiario":
      return "/dashboard/beneficiario"
    case "voluntario":
      return "/dashboard/voluntario"
    case "admin":
      return "/admin"
    default:
      // For unknown roles, check if it contains admin-like keywords
      const lowerRole = (role || "").toLowerCase()
      if (lowerRole.includes("admin") || lowerRole.includes("manage") || lowerRole.includes("coord")) {
        return "/admin"
      }
      if (lowerRole.includes("volunt")) {
        return "/dashboard/voluntario"
      }
      if (lowerRole.includes("benef") || lowerRole.includes("patient") || lowerRole.includes("paciente")) {
        return "/dashboard/beneficiario"
      }
      // Ultimate fallback - prefer dashboard over home
      return "/dashboard/beneficiario"
  }
}

