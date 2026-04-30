import { getToken } from "@/lib/auth"
import type { LeadBeneficiario, LeadBeneficiarioPayload } from "@/types/java-api"
import { asArray, asBoolean, asNumber, asObject, asString, javaApiFetch } from "./client"

function normalizeLead(raw: unknown): LeadBeneficiario {
  const data = asObject(raw)

  return {
    id: asNumber(data.id) || 0,
    nome: asString(data.nome) || asString(data.fullName) || "Beneficiario sem nome",
    cpf: asString(data.cpf) || "",
    dataNascimento: asString(data.dataNascimento) || asString(data.birthDate) || "",
    responsavelNome: asString(data.responsavelNome) || asString(data.nome) || asString(data.fullName) || "",
    telefone: asString(data.telefone) || asString(data.phone) || "",
    email: asString(data.email),
    escolaParceira: undefined,
    status: asString(data.status) || "EM_ANALISE",
    vulnerabilidadeSocial: asBoolean(data.vulnerabilidadeSocial) ?? false,
    observacoes: asString(data.observacoes),
    cidade: asString(data.cidade) || asString(data.city),
    estado: asString(data.estado) || asString(data.state),
    programa: asString(data.programa) || asString(data.programCode),
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
  const response = await javaApiFetch<unknown>("/api/admin/beneficiarios-pendentes", {}, getToken())
  return asArray<unknown>(response).map(normalizeLead).filter((lead) => lead.id > 0)
}

export async function getLeadBeneficiario(id: number): Promise<LeadBeneficiario> {
  const leads = await listLeadBeneficiarios()
  const lead = leads.find((item) => item.id === id)
  if (!lead) {
    throw new Error("Beneficiario nao encontrado entre os pendentes do backend Java.")
  }
  return lead
}

export async function createLeadBeneficiario(payload: LeadBeneficiarioPayload): Promise<LeadBeneficiario> {
  void toLeadPayload(payload)
  throw new Error("Cadastros centrais devem ser criados pelo backend Python.")
}

export async function updateLeadBeneficiario(id: number, payload: LeadBeneficiarioPayload): Promise<LeadBeneficiario> {
  void id
  void toLeadPayload(payload)
  throw new Error("Dados centrais devem ser atualizados pelo backend Python.")
}

export async function deleteLeadBeneficiario(id: number): Promise<void> {
  void id
  throw new Error("Beneficiarios do core nao podem ser excluidos pelo backend Java.")
}

export async function converterLeadBeneficiario(id: number): Promise<LeadBeneficiario> {
  const response = await javaApiFetch<unknown>(
    "/api/habilitacoes",
    {
      method: "POST",
      body: JSON.stringify({
        tipoEntidadeCore: "BENEFICIARY",
        idEntidadeCore: id,
        observacoes: "Habilitacao iniciada pelo painel administrativo.",
      }),
    },
    getToken(),
  )

  return normalizeLead(response)
}
