import { getToken } from "@/lib/auth"
import type { CreateTriagemPayload, EncaminhamentoSugerido, Triagem } from "@/types/java-api"
import { asArray, asNumber, asObject, asString, javaApiFetch } from "./client"

function normalizeTriagem(raw: unknown): Triagem {
  const data = asObject(raw)
  const lead = asObject(data.leadBeneficiario)

  return {
    id: asNumber(data.id) || 0,
    leadId: asNumber(lead.id) || 0,
    urgenciaOdontologica: asNumber(data.urgenciaOdontologica),
    prioridade: asString(data.prioridade),
    encaminhamentoSugerido: asString(data.encaminhamentoSugerido),
    observacoes: asString(data.observacoes),
    dataTriagem: asString(data.dataTriagem),
  }
}

function normalizeEncaminhamento(raw: unknown, leadId: number): EncaminhamentoSugerido {
  const data = asObject(raw)

  return {
    leadId,
    sugestao: asString(data.tipoEncaminhamento) || "Encaminhamento sugerido sem descrição detalhada.",
    destino: asString(data.profissionalDestino),
    observacoes: asString(data.observacoes),
    status: asString(data.status),
  }
}

function toTriagemPayload(payload: CreateTriagemPayload): Record<string, unknown> {
  return {
    leadBeneficiario: {
      id: payload.leadId,
    },
    urgenciaOdontologica: payload.urgenciaOdontologica,
    observacoes: payload.observacoes || null,
    dataTriagem: new Date().toISOString().slice(0, 19),
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
  const response = await javaApiFetch<unknown>(
    `/api/triagens/${id}/priorizar`,
    {
      method: "POST",
    },
    getToken(),
  )

  return normalizeTriagem(response)
}

export async function sugerirEncaminhamento(leadId: number): Promise<EncaminhamentoSugerido> {
  const response = await javaApiFetch<unknown>(
    `/api/encaminhamentos/sugerir/${leadId}`,
    {
      method: "POST",
    },
    getToken(),
  )

  return normalizeEncaminhamento(response, leadId)
}
