import { getToken } from "@/lib/auth"
import type { CreateTriagemPayload, EncaminhamentoSugerido, SugerirEncaminhamentoPayload, Triagem } from "@/types/java-api"
import { asArray, asBoolean, asNumber, asObject, asString, javaApiFetch } from "./client"

function normalizeTriagem(raw: unknown): Triagem {
  const data = asObject(raw)

  return {
    id: asNumber(data.id) || 0,
    leadId: asNumber(data.beneficiaryId) || 0,
    prioridade: asString(data.prioridade),
    encaminhamentoSugerido: asString(data.encaminhamentoSugerido),
    observacoes: asString(data.observacoes),
    dataTriagem: asString(data.criadoEm) || asString(data.dataTriagem),
    modalidade: asString(data.modalidade),
    especialidadeDesejada: asString(data.especialidadeDesejada),
  }
}

function normalizeEncaminhamento(raw: unknown, leadId: number, triagemId?: number): EncaminhamentoSugerido {
  const data = asObject(raw)

  return {
    matchId: asNumber(data.id) || asNumber(data.matchId),
    leadId,
    triagemId: asNumber(data.triagemId) || triagemId,
    volunteerId: asNumber(data.volunteerId),
    sugestao: asString(data.motivoScore) || "Encaminhamento sugerido sem descricao detalhada.",
    destino: asString(data.volunteerId),
    observacoes: asString(data.motivoScore),
    status: asString(data.status),
    score: asNumber(data.score),
    regiaoCompativel: asBoolean(data.regiaoCompativel),
    onlinePermitido: asBoolean(data.onlinePermitido),
  }
}

export async function selecionarMatch(
  triagemId: number,
  matchId: number,
  leadId: number,
): Promise<EncaminhamentoSugerido> {
  const response = await javaApiFetch<unknown>(
    `/api/triagens/${triagemId}/matches/${matchId}/selecionar`,
    {
      method: "POST",
    },
    getToken(),
  )

  return normalizeEncaminhamento(response, leadId, triagemId)
}

function priorityFromUrgency(value: number): string {
  if (value >= 5) return "urgente"
  if (value >= 4) return "alta"
  if (value <= 2) return "baixa"
  return "normal"
}

function toTriagemPayload(payload: CreateTriagemPayload): Record<string, unknown> {
  return {
    beneficiaryId: payload.leadId,
    prioridade: priorityFromUrgency(payload.urgenciaOdontologica),
    modalidade: payload.modalidade || "PRESENCIAL",
    especialidadeDesejada: payload.especialidadeDesejada,
    programa: payload.programa,
    observacoes: payload.observacoes || null,
  }
}

export async function listTriagens(): Promise<Triagem[]> {
  const response = await javaApiFetch<unknown>("/api/triagens", {}, getToken())
  return asArray<unknown>(response).map(normalizeTriagem).filter((triagem) => triagem.id > 0)
}

export async function createTriagem(payload: CreateTriagemPayload): Promise<Triagem> {
  const response = await javaApiFetch<unknown>(
    "/api/triagens",
    {
      method: "POST",
      body: JSON.stringify(toTriagemPayload(payload)),
    },
    getToken(),
  )

  return normalizeTriagem(response)
}

export async function priorizarTriagem(id: number): Promise<Triagem> {
  const response = await javaApiFetch<unknown>(`/api/triagens/${id}`, {}, getToken())
  return normalizeTriagem(response)
}

export async function sugerirEncaminhamento(
  triagemId: number,
  leadId: number,
  payload?: SugerirEncaminhamentoPayload,
): Promise<EncaminhamentoSugerido> {
  const response = await javaApiFetch<unknown>(
    `/api/triagens/${triagemId}/sugerir-vinculo`,
    {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    },
    getToken(),
  )

  return normalizeEncaminhamento(response, leadId, triagemId)
}
