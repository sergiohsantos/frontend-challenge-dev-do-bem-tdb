// API Helper for FastAPI Backend Integration
// Base URL from environment variable or fallback to localhost

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export interface ApiError {
  message: string
  detail?: string
  status: number
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

/**
 * Generic fetch wrapper for API calls
 * - Automatically sends Content-Type: application/json
 * - Automatically sends Authorization: Bearer <token> when token exists
 * - Parses backend error messages from response JSON.detail
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  })
  
  // Try to parse response as JSON
  let data: unknown
  try {
    data = await response.json()
  } catch {
    // Response is not JSON
    data = null
  }
  
  if (!response.ok) {
    let errorMessage = `Erro na requisição: ${response.status}`
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail
      if (typeof detail === "string" && detail.trim()) {
        errorMessage = detail
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail
          .map((item) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object") {
              const entry = item as { msg?: unknown; loc?: unknown }
              const msg = typeof entry.msg === "string" ? entry.msg : null
              const loc = Array.isArray(entry.loc) ? entry.loc.slice(1).join(" > ") : null
              return [loc, msg].filter(Boolean).join(": ")
            }
            return null
          })
          .filter(Boolean)
          .join("; ") || errorMessage
      }
    }
    if (response.status === 401) {
      errorMessage = "Login ou senha inválidos. Confira seus dados e tente novamente."
    } else if (response.status === 403) {
      errorMessage = errorMessage || "Você não tem permissão para realizar esta ação."
    } else if (response.status === 422 && (!errorMessage || errorMessage.startsWith("Erro na requisição"))) {
      errorMessage = "Revise os dados informados e tente novamente."
    }
    throw new Error(errorMessage)
  }
  
  return data as T
}

export async function apiUpload<T>(path: string, formData: FormData, token?: string | null): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const headers: HeadersInit = {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
  })

  let data: unknown
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    let errorMessage = `Erro na requisição: ${response.status}`
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail: unknown }).detail
      if (typeof detail === "string" && detail.trim()) {
        errorMessage = detail
      }
    }
    if (response.status === 422 && (!errorMessage || errorMessage.startsWith("Erro na requisição"))) {
      errorMessage = "Revise o arquivo e os dados informados antes de enviar."
    }
    throw new Error(errorMessage)
  }

  return data as T
}

// Normalize helpers
export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, "")
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

// API Types
export interface LoginPayload {
  login: string
  password: string
  role: "beneficiario" | "voluntario" | "admin"
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: {
    id: number
    role: string
    full_name: string
  }
}

export interface BeneficiaryDashboard {
  appointmentsNeedingConfirmation?: Array<{
    id: number
    date: string
    time: string
    doctor: string
    specialty: string
    procedureTitle?: string
    approvalRequestId?: string
    address: string
    phone: string
    status?: string
    statusRaw?: string
    canConfirm?: boolean
    canReschedule?: boolean
  }>
  appointmentsWithRescheduleRequest?: Array<{
    id: number
    date: string
    time: string
    doctor: string
    specialty: string
    procedureTitle?: string
    approvalRequestId?: string
    address: string
    phone: string
    status?: string
    statusRaw?: string
    canConfirm?: boolean
    canReschedule?: boolean
  }>
  confirmedUpcomingAppointments?: Array<{
    id: number
    date: string
    time: string
    doctor: string
    specialty: string
    procedureTitle?: string
    approvalRequestId?: string
    address: string
    phone: string
    status?: string
    statusRaw?: string
    canConfirm?: boolean
    canReschedule?: boolean
  }>
  caseId?: number
  name: string
  status: string
  statusRaw?: string
  statusLabel?: string
  currentStep: string
  journeySteps: Array<{
    id: string
    title: string
    description: string
    date?: string
    status: string
  }>
  nextAppointment?: {
    id: number
    date: string
    time: string
    doctor: string
    specialty: string
    procedureTitle?: string
    approvalRequestId?: string
    address: string
    phone: string
    status?: string
    statusRaw?: string
    canConfirm?: boolean
    canReschedule?: boolean
  }
  recentMessages: Array<{
    id: number
    from?: string
    sender?: string
    content?: string
    message?: string
    date: string
  }>
  reminders: Array<{
    id: number
    title: string
    description?: string
    type?: string
    date: string
  }>
}

export interface VolunteerDashboard {
  name: string
  specialty: string
  cro?: string
  crp?: string
  stats: {
    totalPatients: number
    activePatients: number
    completedTreatments: number
    monthlyAppointments: number
    pendingApprovals?: number
    approvedProcedures?: number
  }
  upcomingAppointments: Array<{
    id: number
    patientId?: number
    caseId?: number
    patientName: string
    date: string
    time: string
    type: string
    status?: string
    statusRaw?: string
  }>
  activePatients: Array<{
    id: number
    caseId?: number
    name: string
    age: number
    treatment: string
    progress: number
  }>
  recentMessages: Array<{
    id: number
    from?: string
    sender?: string
    content?: string
    message?: string
    date: string
  }>
}

export interface AdminDashboard {
  kpis?: {
    totalBeneficiaries?: number
    totalVolunteers?: number
    totalAppointments?: number
    totalPartners?: number
    inProgressAppointments?: number
    completedAppointments?: number
    pendingApprovals?: number
    [key: string]: number | undefined
  }
  trends?: Array<{
    month: string
    value: number
  }>
  pipeline?: Array<{
    stage: string
    count: number
  }>
  regional?: Array<{
    region: string
    count: number
  }>
  programs?: Array<{
    name: string
    count: number
  }>
  alerts?: Array<{
    id: number
    type: string
    message: string
  }>
  insights?: Array<{
    id: number
    title: string
    description: string
  }>
  satisfaction?: Array<{
    category?: string
    month?: string
    score: number
  }>
}

export interface Message {
  id: number
  content: string
  sender?: string
  senderName?: string
  senderType?: "user" | "volunteer" | "system"
  senderRole?: string
  createdAt?: string
  messageType?: string
  audience?: string
  scope?: string
  isInternal?: boolean
}

export interface ContactPayload {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

// ============================================
// APPROVAL WORKFLOW TYPES
// ============================================

export interface ApprovalKPIs {
  pending: number
  approvedToday: number
  rejected: number
  urgent: number
}

export interface ApprovalRequest {
  id: string
  public_id?: string
  beneficiario: string
  idade?: number
  beneficiario_idade?: number
  programa: string
  tipo: string
  procedimento: string
  voluntario: string
  crm?: string
  dataSolicitacao: string
  prioridade: "urgente" | "alta" | "normal"
  status: "pendente" | "em_analise" | "aprovado" | "rejeitado" | "info_adicional"
  justificativa?: string
  anexos?: Array<{ nome?: string; url?: string } | string>
  historico?: Array<{
    data: string
    acao: string
    autor: string
    detalhes?: string
  }>
}

export interface ApprovalDetail {
  id: string
  public_id?: string
  beneficiaryId?: number
  beneficiario: {
    id?: number

    nome: string
    idade: number
    dataNascimento?: string
    cpf?: string
    telefone?: string
    email?: string
    endereco?: string
    cidade?: string
    uf?: string
    programa?: string
    dataIngresso?: string
    responsavel?: string
  }
  voluntario: {
    id?: number
    nome: string
    especialidade?: string
    crm?: string
    telefone?: string
    email?: string
    clinica?: string
    endereco?: string
    cidade?: string
    uf?: string
    atendimentosRealizados?: number
    avaliacaoMedia?: number
  }
  procedimento: {
    tipo: string
    titulo: string
    descricao?: string
    justificativa?: string
    diagnostico?: string
    planoTratamento?: string
    custoEstimado?: string
    materiaisNecessarios?: string[]
  }
  prioridade: "urgente" | "alta" | "normal"
  status: "pendente" | "em_analise" | "aprovado" | "rejeitado" | "info_adicional"
  dataSolicitacao: string
  anexos?: Array<{
    nome: string
    tamanho?: string
    tipo?: string
    url?: string
  }>
  historico?: Array<{
    data: string
    acao: string
    autor: string
    detalhes?: string
  }>
  atendimentosAnteriores?: Array<{
    data: string
    procedimento: string
    voluntario: string
    status: string
  }>
  comments?: Array<{
    id: number
    content: string
    author: string
    authorRole?: string
    createdAt: string
  }>
}

export interface ApprovalsListResponse {
  kpis: ApprovalKPIs
  requests: ApprovalRequest[]
  approved?: ApprovalRequest[]
  rejected?: ApprovalRequest[]
}

// ============================================
// VOLUNTEER PROCEDURE REQUEST TYPES
// ============================================

export interface ProcedureRequest {
  id: string
  public_id: string
  beneficiario: string
  beneficiario_id?: number
  tipo: string
  procedimento: string
  justificativa?: string
  status: "pendente" | "em_analise" | "aprovado" | "rejeitado" | "info_adicional"
  prioridade: "urgente" | "alta" | "normal"
  dataSolicitacao: string
  dataAtualizacao?: string
  canSchedule?: boolean
  adminComments?: Array<{
    id: number
    content: string
    author: string
    createdAt: string
  }>
}

export interface CreateProcedureRequestPayload {
  beneficiario_id: number
  tipo: string
  procedimento: string
  justificativa: string
  prioridade: "urgente" | "alta" | "normal"
  diagnostico?: string
  plano_tratamento?: string
}

// ============================================
// APPROVAL MESSAGE TYPES
// ============================================

export interface ApprovalMessage {
  id: number
  content: string
  senderName: string
  senderRole: string
  createdAt: string
}

// ============================================
// DOWNLOAD HELPER
// ============================================

/**
 * Download a file from the API
 * - Uses Content-Disposition header for filename when available
 * - Falls back to provided filename
 * - Handles blob response correctly
 */
export async function apiDownload(
  path: string,
  fallbackFilename: string,
  token?: string | null
): Promise<void> {
  const url = `${API_BASE_URL}${path}`
  
  const headers: HeadersInit = {}
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  const response = await fetch(url, { headers })
  
  if (!response.ok) {
    let errorMessage = `Erro no download: ${response.status}`
    try {
      const errorData = await response.json()
      if (errorData?.detail) {
        errorMessage = typeof errorData.detail === "string" ? errorData.detail : errorMessage
      }
    } catch {
      // Response is not JSON, keep default error message
    }
    throw new Error(errorMessage)
  }
  
  // Get filename from Content-Disposition header if available
  let filename = fallbackFilename
  const contentDisposition = response.headers.get("Content-Disposition")
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "").trim()
    }
  }
  
  // Create blob and trigger download
  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

// ============================================
// ADDITIONAL TYPES FOR MODULES
// ============================================

export interface Program {
  id: number
  name: string
  slug?: string
  description: string
  longDescription?: string
  icon?: string
  image?: string
  stats?: {
    beneficiaries?: number
    volunteers?: number
    cities?: number
  }
  features?: string[]
  requirements?: string[]
  isActive?: boolean
}

export interface Notification {
  id: number
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  createdAt: string
  link?: string
}

export interface Document {
  id: number
  name: string
  type: string
  kind?: string
  size?: string
  uploadedAt: string
  uploadedBy?: string
  url?: string
}

export interface Settings {
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  privacy: {
    showProfile: boolean
    showContact: boolean
  }
  language?: string
  theme?: string
}

export interface Appointment {
  id: number
  date: string
  time: string
  patientId?: number
  patientName?: string
  volunteerName?: string
  doctor?: string
  specialty?: string
  type?: string
  status: string
  statusRaw?: string
  address?: string
  phone?: string
  notes?: string
  canConfirm?: boolean
  canReschedule?: boolean
  canCancel?: boolean
}

export interface Patient {
  id: number
  caseId?: number
  name: string
  age: number
  cpf?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  program?: string
  status: string
  treatment?: string
  progress?: number
  lastAppointment?: string
  nextAppointment?: string
  notes?: Array<{
    id: number
    content: string
    author: string
    createdAt: string
  }>
}

export interface Availability {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Partner {
  id: number
  name: string
  type: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  status: string
  contactPerson?: string
  createdAt?: string
}

export interface Report {
  id: number
  name: string
  type: string
  period?: string
  generatedAt: string
  size?: string
  status: string
}

export interface RegionalData {
  region: string
  state?: string
  city?: string
  beneficiaries: number
  volunteers: number
  appointments: number
  partners?: number
}

export interface SatisfactionData {
  period: string
  nps: number
  responses: number
  positive: number
  neutral: number
  negative: number
  comments?: Array<{
    id: number
    content: string
    rating: number
    createdAt: string
  }>
}
