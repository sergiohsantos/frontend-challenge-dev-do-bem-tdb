export type LeadStatus =
  | "NOVO"
  | "EM_ANALISE"
  | "TRIADO"
  | "APTO_ATENDIMENTO"
  | "INATIVO"
  | string

export type LeadPriority = "BAIXA" | "MEDIA" | "ALTA" | string

export interface LeadBeneficiario {
  id: number
  nome: string
  cpf: string
  dataNascimento: string
  responsavelNome: string
  telefone: string
  email?: string
  escolaParceira?: string
  status: LeadStatus
  vulnerabilidadeSocial: boolean
  observacoes?: string
  cidade?: string
  estado?: string
  programa?: string
  necessidadeInicial?: string
}

export interface LeadBeneficiarioPayload {
  nome: string
  cpf: string
  dataNascimento: string
  responsavelNome: string
  telefone: string
  email?: string
  status: LeadStatus
  vulnerabilidadeSocial: boolean
  observacoes?: string
  necessidadeInicial?: string
}

export interface Triagem {
  id: number
  leadId: number
  urgenciaOdontologica?: number
  prioridade?: LeadPriority
  encaminhamentoSugerido?: string
  observacoes?: string
  dataTriagem?: string
  modalidade?: string
  especialidadeDesejada?: string
}

export interface CreateTriagemPayload {
  leadId: number
  urgenciaOdontologica: number
  observacoes?: string
  modalidade?: string
  especialidadeDesejada?: string
  programa?: string
}

export interface ChecklistValidationPayload {
  documentoResponsavelOk: boolean
  comprovanteResidenciaOk: boolean
  autorizacaoOk: boolean
}

export interface ChecklistValidationResult {
  leadId: number
  valido: boolean
  mensagem?: string
  pendencias: string[]
  checklist: ChecklistValidationPayload
}

export interface EncaminhamentoSugerido {
  matchId?: number
  leadId: number
  triagemId?: number
  volunteerId?: number
  sugestao: string
  destino?: string
  prioridade?: LeadPriority
  observacoes?: string
  status?: string
  score?: number
  regiaoCompativel?: boolean
  onlinePermitido?: boolean
}

export interface SugerirEncaminhamentoPayload {
  tipoAtendimento?: string
}

export interface AIRiskSummary {
  totalAnalyzed: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  averageRisk: number | null
  unconfirmed: number
  nextDays: number
  aiAvailable: boolean
  modelSource?: string | null
  generatedAt?: string
}

export interface AIRiskItem {
  appointmentId: number
  caseId: number
  beneficiaryId: number
  beneficiaryName: string
  beneficiaryPhoneMasked?: string | null
  programa?: string | null
  regiao?: string | null
  procedureTitle?: string | null
  approvalRequestId?: string | null
  volunteerId?: number | null
  volunteerName?: string | null
  appointmentDate?: string | null
  appointmentTime?: string | null
  appointmentStatus?: string | null
  confirmed: boolean
  risk: number | null
  classification?: string | null
  recommendation?: string | null
  reasons: string[]
  features: Record<string, unknown>
}

export interface AIRiskDashboardResponse {
  summary: AIRiskSummary
  items: AIRiskItem[]
  warnings: string[]
}

export interface AIRiskDashboardParams {
  days?: number
  limit?: number
  classification?: string
  program?: string
  region?: string
  beneficiary?: string
  approvalRequest?: string
}

export interface AIReminderPreviewResponse {
  appointmentId: number
  channel: "whatsapp" | string
  message: string
}
