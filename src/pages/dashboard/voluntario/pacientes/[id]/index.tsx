import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertBanner } from "@/components/ui/alert-banner"
import { DocumentUploadPanel, getFriendlyUploadError, type DocumentUploadFormState } from "@/components/shared/document-upload-panel"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiFetch, apiUpload } from "@/lib/api"
import { downloadFromApi } from "@/lib/file-download"
import { getToken, getUser } from "@/lib/auth"
import { ArrowLeft, Calendar, Download, FileText, Loader2, Mail, MapPin, MessageSquare, Phone, User, ClipboardList, GraduationCap, HeartPulse, Users, Home, Save } from "lucide-react"
import { toast } from "sonner"

interface PatientDetail {
  id: number
  caseId?: number
  case_id?: number
  nome?: string
  name?: string
  cpf?: string | null
  rg?: string | null
  genero?: string | null
  dataNascimento?: string | null
  email?: string | null
  telefone?: string | null
  phone?: string | null
  cidade?: string | null
  uf?: string | null
  bairro?: string | null
  cep?: string | null
  endereco?: string | null
  numero?: string | null
  complemento?: string | null
  address?: string | null
  programa?: string | null
  program?: string | null
  treatment?: string | null
  status?: string | null
  caseStatus?: string | null
  etapa?: string | null
  progress?: number
  responsavel?: string | null
  telefoneResponsavel?: string | null
  parentesco?: string | null
  escola?: string | null
  serie?: string | null
  rendaFamiliar?: string | null
  comoConheceu?: string | null
  necessidadesEspeciais?: string | null
  observacoes?: string | null
  medicalHistory?: string[]
  notes?: Array<{ id: number; date?: string | null; content?: string | null; author?: string | null }>
  appointments?: Array<{ id: number; date?: string | null; time?: string | null; type?: string | null; status?: string | null; notes?: string | null }>
}

interface PatientDocumentsResponse {
  documents?: PatientDocument[]
  items?: PatientDocument[]
}

interface PatientDocument {
  id: number
  title: string
  category?: string
  notes?: string
  fileName?: string
  uploadedAt?: string
  uploadedByName?: string
  downloadUrl: string
}

function normalizeDocument(raw: Record<string, unknown>): PatientDocument {
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? raw.fileName ?? "Documento"),
    category: raw.category ? String(raw.category) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    fileName: raw.fileName ? String(raw.fileName) : undefined,
    uploadedAt: raw.uploadedAt ? String(raw.uploadedAt) : undefined,
    uploadedByName: raw.uploadedByName ? String(raw.uploadedByName) : undefined,
    downloadUrl: String(raw.downloadUrl ?? ""),
  }
}

const initialUploadState: DocumentUploadFormState = {
  file: null,
  title: "",
  category: "documento",
  notes: "",
  visibleToBeneficiary: false,
}

export default function VoluntarioPacienteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [uploadState, setUploadState] = useState<DocumentUploadFormState>(initialUploadState)
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }
        const [detailData, docsData] = await Promise.all([
          apiFetch<PatientDetail & { patient?: PatientDetail }>(`/api/volunteers/my-patients/${id}`, {}, token),
          apiFetch<PatientDocumentsResponse | PatientDocument[]>(`/api/volunteers/my-patients/${id}/documents`, {}, token),
        ])
        const detail = detailData.patient || detailData
        const source = Array.isArray(docsData) ? docsData : docsData.documents || docsData.items || []
        setPatient(detail)
        setDocuments(source.map((item) => normalizeDocument(item as unknown as Record<string, unknown>)).filter((item) => item.id > 0))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados do paciente")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) void loadDetail()
  }, [id, navigate])

  const patientName = patient?.nome || patient?.name || "Paciente"
  const patientProgram = patient?.programa || patient?.program || patient?.treatment || "-"
  const caseId = patient?.caseId || patient?.case_id || patient?.id

  const sortedAppointments = useMemo(
    () => (patient?.appointments || []).slice().sort((a, b) => `${a.date || ""}${a.time || ""}`.localeCompare(`${b.date || ""}${b.time || ""}`)),
    [patient?.appointments],
  )
  const notes = patient?.notes || []
  const medicalHistory = patient?.medicalHistory || []

  const handleUploadDocument = async () => {
    if (!uploadState.file || !id) return
    try {
      setIsUploading(true)
      setError(null)
      const token = getToken()
      if (!token) return
      const formData = new FormData()
      formData.append("file", uploadState.file)
      formData.append("title", uploadState.title || uploadState.file.name)
      formData.append("category", uploadState.category)
      formData.append("notes", uploadState.notes)
      formData.append("visible_to_beneficiary", String(uploadState.visibleToBeneficiary))
      const created = await apiUpload<unknown>(`/api/volunteers/my-patients/${id}/documents`, formData, token)
      setDocuments((prev) => [normalizeDocument(created as Record<string, unknown>), ...prev])
      setUploadState(initialUploadState)
      toast.success("Documento anexado ao prontuário")
    } catch (err) {
      setError(getFriendlyUploadError(err instanceof Error ? err.message : "Erro ao enviar documento"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!id || newNote.trim().length < 3) {
      setError("Escreva uma anotação com pelo menos 3 caracteres.")
      return
    }
    try {
      setIsSavingNote(true)
      setError(null)
      const token = getToken()
      if (!token) return
      const created = await apiFetch<{ id: number; date?: string; content?: string; author?: string }>(`/api/volunteers/my-patients/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: newNote.trim() }),
      }, token)
      setPatient((prev) => prev ? { ...prev, notes: [created, ...(prev.notes || [])] } : prev)
      setNewNote("")
      toast.success("Anotação adicionada ao prontuário")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar anotação")
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDownloadDocument = async (document: PatientDocument) => {
    try {
      setDownloadingId(document.id)
      setError(null)
      const token = getToken()
      if (!token) return
      await downloadFromApi(document.downloadUrl, token, document.fileName || `${document.id}.bin`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar documento")
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></main>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4">
            <AlertBanner type="error" title="Erro" message={error || "Paciente não encontrado"} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/voluntario/pacientes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos pacientes
            </Link>
          </Button>

          {error && <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} className="mb-4" />}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{patientName}</h1>
              <p className="text-muted-foreground">Prontuário, consultas, mensagens e anexos do paciente.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {patient.status ? <Badge variant="outline">{patient.status}</Badge> : null}
                <Badge variant="secondary">{patientProgram}</Badge>
                {patient.etapa ? <Badge variant="secondary">Etapa: {patient.etapa}</Badge> : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to={`/dashboard/voluntario/agenda/novo?patientId=${patient.id}`}><Calendar className="mr-2 h-4 w-4" />Agendar consulta</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/dashboard/voluntario/mensagens?thread=case-public-${caseId}`}><MessageSquare className="mr-2 h-4 w-4" />Mensagem</Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-[640px]">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="consultas">Consultas</TabsTrigger>
              <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Dados completos do beneficiário</CardTitle>
                    <CardDescription>Informações pessoais, contato, cadastro social e acompanhamento do caso</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3"><User className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Paciente</p><p className="font-medium">{patientName}</p></div></div>
                    <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{patient.cpf || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">RG</p><p className="font-medium">{patient.rg || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><HeartPulse className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Gênero</p><p className="font-medium">{patient.genero || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Nascimento</p><p className="font-medium">{patient.dataNascimento || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{patient.telefone || patient.phone || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{patient.email || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Cidade / UF</p><p className="font-medium">{[patient.cidade, patient.uf].filter(Boolean).join(" - ") || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Home className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Bairro / CEP</p><p className="font-medium">{[patient.bairro, patient.cep].filter(Boolean).join(" • ") || "-"}</p></div></div>
                    <div className="flex items-start gap-3 sm:col-span-2"><MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Endereço completo</p><p className="font-medium">{patient.address || [patient.endereco, patient.numero, patient.complemento].filter(Boolean).join(", ") || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Users className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-medium">{patient.responsavel || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Telefone responsável</p><p className="font-medium">{patient.telefoneResponsavel || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><Users className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Parentesco</p><p className="font-medium">{patient.parentesco || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><GraduationCap className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Escola / Série</p><p className="font-medium">{[patient.escola, patient.serie].filter(Boolean).join(" • ") || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Renda familiar</p><p className="font-medium">{patient.rendaFamiliar || "-"}</p></div></div>
                    <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Como conheceu</p><p className="font-medium">{patient.comoConheceu || "-"}</p></div></div>
                    <div className="flex items-start gap-3 sm:col-span-2"><HeartPulse className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Necessidades especiais</p><p className="font-medium">{patient.necessidadesEspeciais || "-"}</p></div></div>
                    <div className="flex items-start gap-3 sm:col-span-2"><ClipboardList className="mt-0.5 h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Observações de cadastro</p><p className="font-medium">{patient.observacoes || "-"}</p></div></div>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumo do caso</CardTitle>
                      <CardDescription>Andamento clínico e status geral</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div><p className="text-xs text-muted-foreground">Programa</p><p className="font-medium">{patientProgram}</p></div>
                      <div><p className="text-xs text-muted-foreground">Status do caso</p><p className="font-medium">{patient.caseStatus || patient.status || "-"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Etapa atual</p><p className="font-medium">{patient.etapa || "-"}</p></div>
                      <div><p className="text-xs text-muted-foreground">Progresso</p><p className="font-medium">{patient.progress ?? 0}%</p></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico clínico</CardTitle>
                      <CardDescription>Dados relevantes para o atendimento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {medicalHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum histórico clínico complementar informado.</p>
                      ) : medicalHistory.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-lg border p-3 text-muted-foreground">{item}</div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="consultas">
              <Card>
                <CardHeader>
                  <CardTitle>Consultas</CardTitle>
                  <CardDescription>Agendamentos vinculados ao caso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedAppointments.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p> : sortedAppointments.map((appt) => (
                    <div key={appt.id} className="rounded-xl border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{appt.type || "Consulta"}</p>
                          <p className="text-sm text-muted-foreground">{appt.date || "-"} {appt.time ? `às ${appt.time}` : ""}</p>
                        </div>
                        <Badge variant="outline">{appt.status || "sem status"}</Badge>
                      </div>
                      {appt.notes ? <p className="mt-2 text-sm text-muted-foreground">{appt.notes}</p> : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="anotacoes">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Anotações do prontuário</CardTitle>
                    <CardDescription>Histórico clínico e observações do caso</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {notes.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma anotação disponível.</p> : notes.map((note) => (
                      <div key={note.id} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{note.author || "Registro"}</p>
                          <span className="text-xs text-muted-foreground">{note.date || ""}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{note.content || "-"}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Nova anotação</CardTitle>
                    <CardDescription>Registre observações clínicas diretamente no prontuário do beneficiário.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient-note">Anotação</Label>
                      <Textarea
                        id="patient-note"
                        value={newNote}
                        onChange={(event) => setNewNote(event.target.value)}
                        placeholder="Escreva uma observação, evolução do atendimento ou informação clínica relevante..."
                        rows={8}
                      />
                    </div>
                    <Button onClick={() => void handleSaveNote()} disabled={isSavingNote} className="gap-2">
                      {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Enviar ao prontuário
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documentos">
              <div className="grid gap-4 lg:grid-cols-2">
                <DocumentUploadPanel
                  value={uploadState}
                  onChange={setUploadState}
                  onSubmit={handleUploadDocument}
                  submitting={isUploading}
                  submitLabel="Enviar ao prontuário"
                  helperText="Anexe exames, laudos, evidências e documentos clínicos do paciente."
                  error={error}
                />
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Arquivos anexados</CardTitle>
                    <CardDescription>Downloads e histórico do prontuário</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {documents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p> : documents.map((document) => (
                      <div key={document.id} className="rounded-xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{document.title}</p>
                            <p className="text-xs text-muted-foreground">{document.category || "documento"} • {document.uploadedAt || "Sem data"}</p>
                            {document.notes ? <p className="mt-2 text-sm text-muted-foreground">{document.notes}</p> : null}
                          </div>
                          <Button variant="outline" onClick={() => void handleDownloadDocument(document)} disabled={downloadingId === document.id}>
                            {downloadingId === document.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Baixar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
