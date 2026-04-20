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
  return {
    leadBeneficiario: {
      id: leadId,
    },
    ...payload,
    cadastroCompleto: Object.values(payload).every(Boolean),
    pendencias: derivePendencias(payload).join(", "),
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
  const valido = asBoolean(data.cadastroCompleto) ?? Object.values(payload).every(Boolean)

  return {
    leadId,
    valido,
    mensagem: valido ? "Checklist validado com sucesso." : "Checklist validado com pendências.",
    pendencias,
    checklist: {
      documentoResponsavelOk: asBoolean(data.documentoResponsavelOk) ?? payload.documentoResponsavelOk,
      comprovanteResidenciaOk: asBoolean(data.comprovanteResidenciaOk) ?? payload.comprovanteResidenciaOk,
      autorizacaoOk: asBoolean(data.autorizacaoOk) ?? payload.autorizacaoOk,
    },
  }
}

export async function salvarChecklist(leadId: number, payload: ChecklistValidationPayload): Promise<unknown> {
  return javaApiFetch<unknown>(
    "/api/checklists",
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

  try {
    const response = await javaApiFetch<unknown>(
      `/api/checklists/${leadId}/validar`,
      {
        method: "POST",
      },
      getToken(),
    )

    return normalizeValidationResult(leadId, payload, response)
  } catch {
    return normalizeValidationResult(leadId, payload, savedChecklist)
  }
}

export async function converterLeadEmApto(leadId: number): Promise<{ leadId: number; mensagem: string }> {
  const response = await javaApiFetch<unknown>(
    `/api/leads-beneficiarios/${leadId}/converter`,
    {
      method: "POST",
    },
    getToken(),
  )

  const data = asObject(response)
  return {
    leadId: asNumber(data.id) || leadId,
    mensagem:
      asString(data.status) === "APTO_ATENDIMENTO"
        ? "Lead convertido com sucesso para apto atendimento."
        : "Lead convertido com sucesso.",
  }
}
