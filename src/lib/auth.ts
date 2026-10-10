// Bearer authentication. Legacy JavaScript cookies are removed, never reused.

const TOKEN_KEY = "tdb_token"
const USER_KEY = "tdb_user"
const COOKIE_TOKEN = "tdb_token"
const COOKIE_ROLE = "tdb_role"

export interface AuthUser {
  id: number
  role: string
  full_name: string
  name?: string
  email?: string
}

/**
 * Delete a cookie by name
 */
function deleteCookie(name: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

let legacyCookiesRemoved = false

function removeLegacyCookies(): void {
  if (legacyCookiesRemoved || typeof document === "undefined") return
  deleteCookie(COOKIE_TOKEN)
  deleteCookie(COOKIE_ROLE)
  legacyCookiesRemoved = true
}

/**
 * Save authentication data for existing Bearer clients
 */
export function saveAuth(token: string, user: AuthUser): void {
  const normalizedUser: AuthUser = {
    ...user,
    full_name: user.full_name || user.name || '',
    name: user.name || user.full_name || '',
    email: user.email || undefined,
  }
  if (typeof window === "undefined") return
  
  // Store in localStorage
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
  
  // This application is a static SPA, without an SSR cookie consumer.
  deleteCookie(COOKIE_TOKEN)
  deleteCookie(COOKIE_ROLE)
}

/**
 * Get the existing Bearer token; never recover a token from a JavaScript cookie
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  
  removeLegacyCookies()
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Get user from localStorage
 */
export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr) as AuthUser
  } catch {
    return null
  }
}

/**
 * Compatibility helper; UI role is not a server authorization decision.
 */
export function getRoleFromCookie(): string | null {
  return getUser()?.role || null
}

/**
 * Clear authentication data and any legacy cookies
 */
export function clearAuth(): void {
  if (typeof window === "undefined") return
  
  // Clear localStorage
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  
  // Clear cookies
  deleteCookie(COOKIE_TOKEN)
  deleteCookie(COOKIE_ROLE)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken()
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

