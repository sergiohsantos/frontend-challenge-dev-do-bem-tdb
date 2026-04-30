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
