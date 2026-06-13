import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

export interface AdminWhatsAppStatus {
  enabled?: boolean
  enabledByEnv?: boolean
  enabledByAdmin?: boolean
  configured?: boolean
  messageMode?: string
  templateDefaultPresent?: boolean
  warning?: string | null
}

export interface AIRiskWhatsAppPayload {
  beneficiary_id: number
  appointment_id?: number
  message: string
  risk_classification?: string | null
  risk_score?: number | null
}

export interface AIRiskWhatsAppResponse {
  success: boolean
  message: string
  to?: string | null
}

export function getAdminWhatsAppStatus(): Promise<AdminWhatsAppStatus> {
  return apiFetch<AdminWhatsAppStatus>("/api/admin/whatsapp/status", {}, getToken())
}

export function sendAIRiskWhatsAppAlert(payload: AIRiskWhatsAppPayload): Promise<AIRiskWhatsAppResponse> {
  return apiFetch<AIRiskWhatsAppResponse>(
    "/api/admin/whatsapp/risk-alert",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    getToken(),
  )
}
