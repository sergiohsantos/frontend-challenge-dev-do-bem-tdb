import { getToken } from "@/lib/auth"
import type { LeadBeneficiario, LeadBeneficiarioPayload } from "@/types/java-api"
import { asArray, asBoolean, asNumber, asObject, asString, javaApiFetch } from "./client"

function normalizeLead(raw: unknown): LeadBeneficiario {
  const data = asObject(raw)
  const escolaParceira = asObject(data.escolaParceira)

  return {
    id: asNumber(data.id) || 0,
    nome: asString(data.nome) || "Lead sem nome",
    cpf: asString(data.cpf) || "",
    dataNascimento: asString(data.dataNascimento) || "",
    responsavelNome: asString(data.responsavelNome) || "",
    telefone: asString(data.telefone) || "",
    email: asString(data.email),
    escolaParceira: asString(escolaParceira.nome) || asString(data.escolaParceira),
    status: asString(data.status) || "NOVO",
    vulnerabilidadeSocial: asBoolean(data.vulnerabilidadeSocial) ?? false,
    observacoes: asString(data.observacoes),
  }
}

function toLeadPayload(payload: LeadBeneficiarioPayload): Record<string, unknown> {
  return {
    nome: payload.nome,
    cpf: payload.cpf,
    dataNascimento: payload.dataNascimento,
    responsavelNome: payload.responsavelNome,
    telefone: payload.telefone,
    email: payload.email || null,
    escolaParceira: null,
    status: payload.status,
    vulnerabilidadeSocial: payload.vulnerabilidadeSocial,
    observacoes: payload.observacoes || null,
  }
}

export async function listLeadBeneficiarios(): Promise<LeadBeneficiario[]> {
  const response = await javaApiFetch<unknown>("/api/leads-beneficiarios", {}, getToken())
  return asArray<unknown>(response).map(normalizeLead).filter((lead) => lead.id > 0)
}

export async function getLeadBeneficiario(id: number): Promise<LeadBeneficiario> {
  const response = await javaApiFetch<unknown>(`/api/leads-beneficiarios/${id}`, {}, getToken())
  return normalizeLead(response)
}

export async function createLeadBeneficiario(payload: LeadBeneficiarioPayload): Promise<LeadBeneficiario> {
  const response = await javaApiFetch<unknown>(
    "/api/leads-beneficiarios",
    {
      method: "POST",
      body: JSON.stringify(toLeadPayload(payload)),
    },
    getToken(),
  )

  return normalizeLead(response)
}

export async function updateLeadBeneficiario(id: number, payload: LeadBeneficiarioPayload): Promise<LeadBeneficiario> {
  const response = await javaApiFetch<unknown>(
    `/api/leads-beneficiarios/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toLeadPayload(payload)),
    },
    getToken(),
  )

  return normalizeLead(response)
}

export async function deleteLeadBeneficiario(id: number): Promise<void> {
  await javaApiFetch<void>(
    `/api/leads-beneficiarios/${id}`,
    {
      method: "DELETE",
    },
    getToken(),
  )
}

export async function converterLeadBeneficiario(id: number): Promise<LeadBeneficiario> {
  const response = await javaApiFetch<unknown>(
    `/api/leads-beneficiarios/${id}/converter`,
    {
      method: "POST",
    },
    getToken(),
  )

  return normalizeLead(response)
}
