// Auth Helper for localStorage + cookie token management

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
 * Set a cookie with given name, value, and days to expire
 */
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * Delete a cookie by name
 */
function deleteCookie(name: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
}

/**
 * Save authentication data to localStorage AND cookies
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
  
  // Also store in cookies for SSR/middleware access
  setCookie(COOKIE_TOKEN, token)
  setCookie(COOKIE_ROLE, normalizedUser.role)
}

/**
 * Get token from localStorage (or cookie fallback)
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  
  return localStorage.getItem(TOKEN_KEY) || getCookie(COOKIE_TOKEN)
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
 * Get role from cookie (useful for quick checks)
 */
export function getRoleFromCookie(): string | null {
  return getCookie(COOKIE_ROLE)
}

/**
 * Clear authentication data from localStorage AND cookies
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
