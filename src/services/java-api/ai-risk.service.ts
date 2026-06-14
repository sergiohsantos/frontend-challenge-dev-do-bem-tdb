import { getToken } from "@/lib/auth"
import type {
  AIReminderPreviewResponse,
  AIRiskDashboardParams,
  AIRiskDashboardResponse,
} from "@/types/java-api"
import { javaApiFetch } from "./client"

function queryString(params: AIRiskDashboardParams = {}): string {
  const search = new URLSearchParams()

  if (params.days) search.set("days", String(params.days))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.classification && params.classification !== "all") search.set("classification", params.classification)
  if (params.program && params.program !== "all") search.set("program", params.program)
  if (params.region && params.region !== "all") search.set("region", params.region)
  if (params.beneficiary && params.beneficiary !== "all") search.set("beneficiary", params.beneficiary)
  if (params.approvalRequest && params.approvalRequest !== "all") search.set("approvalRequest", params.approvalRequest)

  const value = search.toString()
  return value ? `?${value}` : ""
}

export function getAIRiskDashboard(params: AIRiskDashboardParams = {}): Promise<AIRiskDashboardResponse> {
  return javaApiFetch<AIRiskDashboardResponse>(`/api/ai/risk-dashboard${queryString(params)}`, {}, getToken())
}

export function getAIReminderPreview(appointmentId: number): Promise<AIReminderPreviewResponse> {
  return javaApiFetch<AIReminderPreviewResponse>(
    `/api/ai/appointments/${appointmentId}/reminder-preview`,
    { method: "POST" },
    getToken(),
  )
}
