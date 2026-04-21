import { getToken } from "@/lib/auth"
import type { ChecklistValidationPayload, ChecklistValidationResult } from "@/types/java-api"
import { asBoolean, asNumber, asObject, asString, javaApiFetch } from "./client"

const CHECKLIST_LABELS: Record<keyof ChecklistValidationPayload, string> = {
  documentoResponsavelOk: "Documento do responsável",
  comprovanteResidenciaOk: "Comprovante de residência",
  autorizacaoOk: "Autorização",
}

function derivePendencias(payload: ChecklistValidationPayload): string[] {
  return (Object.entries(payload) as Array<[keyof ChecklistValidationPayload, boolean]>)
    .filter(([, checked]) => !checked)
    .map(([key]) => CHECKLIST_LABELS[key])
}

function toChecklistPayload(leadId: number, payload: ChecklistValidationPayload): Record<string, unknown> {
  void leadId
  return {
    documentosOk: payload.documentoResponsavelOk,
    dadosCadastraisOk: payload.comprovanteResidenciaOk,
    consentimentosOk: payload.autorizacaoOk,
    regiaoOk: true,
    observacoes: derivePendencias(payload).join(", "),
  }
}

function normalizeValidationResult(
  leadId: number,
  payload: ChecklistValidationPayload,
  raw: unknown,
): ChecklistValidationResult {
  const data = asObject(raw)
  const pendencias = asString(data.pendencias)
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) || derivePendencias(payload)
  const valido = asBoolean(data.validado) ?? asBoolean(data.cadastroCompleto) ?? Object.values(payload).every(Boolean)

  return {
    leadId,
    valido,
    mensagem: valido ? "Checklist validado com sucesso." : "Checklist validado com pendências.",
    pendencias,
    checklist: {
      documentoResponsavelOk: asBoolean(data.documentosOk) ?? asBoolean(data.documentoResponsavelOk) ?? payload.documentoResponsavelOk,
      comprovanteResidenciaOk: asBoolean(data.dadosCadastraisOk) ?? asBoolean(data.comprovanteResidenciaOk) ?? payload.comprovanteResidenciaOk,
      autorizacaoOk: asBoolean(data.consentimentosOk) ?? asBoolean(data.autorizacaoOk) ?? payload.autorizacaoOk,
    },
  }
}

export async function salvarChecklist(leadId: number, payload: ChecklistValidationPayload): Promise<unknown> {
  const habilitacao = await javaApiFetch<unknown>(
    "/api/habilitacoes",
    {
      method: "POST",
      body: JSON.stringify({
        tipoEntidadeCore: "BENEFICIARY",
        idEntidadeCore: leadId,
        observacoes: "Checklist documental iniciado pelo painel administrativo.",
      }),
    },
    getToken(),
  )
  const habilitacaoData = asObject(habilitacao)
  const habilitacaoId = asNumber(habilitacaoData.id)
  if (!habilitacaoId) {
    throw new Error("Nao foi possivel criar ou localizar a habilitacao no backend Java.")
  }

  return javaApiFetch<unknown>(
    `/api/habilitacoes/${habilitacaoId}/validar-checklist`,
    {
      method: "POST",
      body: JSON.stringify(toChecklistPayload(leadId, payload)),
    },
    getToken(),
  )
}

export async function validarChecklist(
  leadId: number,
  payload: ChecklistValidationPayload,
): Promise<ChecklistValidationResult> {
  const savedChecklist = await salvarChecklist(leadId, payload)
  return normalizeValidationResult(leadId, payload, savedChecklist)
}

export async function converterLeadEmApto(leadId: number): Promise<{ leadId: number; mensagem: string }> {
  const habilitacao = await javaApiFetch<unknown>(
    "/api/habilitacoes",
    {
      method: "POST",
      body: JSON.stringify({
        tipoEntidadeCore: "BENEFICIARY",
        idEntidadeCore: leadId,
        observacoes: "Aprovacao administrativa solicitada pelo painel.",
      }),
    },
    getToken(),
  )
  const habilitacaoId = asNumber(asObject(habilitacao).id)
  if (!habilitacaoId) {
    throw new Error("Habilitacao nao encontrada no backend Java.")
  }

  const response = await javaApiFetch<unknown>(
    `/api/habilitacoes/${habilitacaoId}/aprovar`,
    {
      method: "POST",
      body: JSON.stringify({
        motivo: "Checklist validado pelo painel administrativo.",
        observacoes: "Cadastro apto para continuidade no core Python.",
      }),
    },
    getToken(),
  )

  const data = asObject(response)
  return {
    leadId: asNumber(data.idEntidadeCore) || leadId,
    mensagem:
      asString(data.status) === "APROVADO"
        ? "Cadastro habilitado com sucesso."
        : "Decisao administrativa registrada com sucesso.",
  }
}
