import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

export type AdminVolunteerOption = {
  id: number
  nome: string
  especialidade?: string | null
  cidade?: string | null
  uf?: string | null
  status?: string | null
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

function normalizeVolunteerOption(raw: unknown): AdminVolunteerOption | null {
  const data = asObject(raw)
  const id = Number(data.id ?? data.volunteerId ?? 0)
  const nome = asString(data.nome ?? data.fullName ?? data.name).trim()

  if (!Number.isFinite(id) || id <= 0 || !nome) {
    return null
  }

  return {
    id,
    nome,
    especialidade: asString(data.especialidade ?? data.specialty).trim() || null,
    cidade: asString(data.cidade ?? data.city).trim() || null,
    uf: asString(data.uf ?? data.state ?? data.estado).trim() || null,
    status: asString(data.status).trim() || null,
  }
}

export async function listAdminVolunteerOptions(): Promise<AdminVolunteerOption[]> {
  const token = getToken()
  if (!token) return []

  const data = await apiFetch<unknown>("/api/admin/volunteers", {}, token)
  const source = Array.isArray(data)
    ? data
    : asObject(data).volunteers || asObject(data).items || []

  return (Array.isArray(source) ? source : [])
    .map(normalizeVolunteerOption)
    .filter((item): item is AdminVolunteerOption => Boolean(item))
}
