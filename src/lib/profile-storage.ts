import { getUser, saveAuth, type AuthUser } from "@/lib/auth"

export type ManagedProfileRole = "beneficiario" | "voluntario" | "admin"

export interface ManagedProfileData {
  nome?: string
  email?: string
  telefone?: string
  cidade?: string
  estado?: string
  endereco?: string
  cpf?: string
  rg?: string
  genero?: string
  dataNascimento?: string
  responsavel?: string
  telefoneResponsavel?: string
  parentesco?: string
  escola?: string
  serie?: string
  rendaFamiliar?: string
  comoConheceu?: string
  necessidadesEspeciais?: string
  observacoes?: string
  especialidade?: string
  registro?: string
  tipoProfissional?: string
  role?: string
}

function keyFor(role: ManagedProfileRole, userId?: number | string | null) {
  return `tdb_profile_override:${role}:${userId ?? "anon"}`
}

export function getStoredProfile(role: ManagedProfileRole, userId?: number | string | null): ManagedProfileData | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(keyFor(role, userId))
  if (!raw) return null
  try {
    return JSON.parse(raw) as ManagedProfileData
  } catch {
    return null
  }
}

export function saveStoredProfile(role: ManagedProfileRole, data: ManagedProfileData, userId?: number | string | null) {
  if (typeof window === "undefined") return data
  const current = getStoredProfile(role, userId) || {}
  const merged = { ...current, ...data }
  window.localStorage.setItem(keyFor(role, userId), JSON.stringify(merged))
  syncAuthUserFromProfile(merged)
  return merged
}

export function clearStoredProfile(role: ManagedProfileRole, userId?: number | string | null) {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(keyFor(role, userId))
}

export function mergeProfile<T extends Record<string, unknown>>(base: T, override: ManagedProfileData | null | undefined): T {
  if (!override) return base
  return {
    ...base,
    ...Object.fromEntries(Object.entries(override).filter(([, value]) => value !== undefined && value !== null && value !== "")),
  } as T
}

export function syncAuthUserFromProfile(profile: ManagedProfileData) {
  if (typeof window === "undefined") return
  const currentUser = getUser()
  const token = window.localStorage.getItem("tdb_token")
  if (!currentUser || !token) return

  const updatedUser: AuthUser = {
    ...currentUser,
    full_name: profile.nome || currentUser.full_name,
    name: profile.nome || currentUser.name,
    email: profile.email || currentUser.email,
  }

  saveAuth(token, updatedUser)
}
