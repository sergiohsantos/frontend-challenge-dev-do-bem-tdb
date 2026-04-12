import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertBanner } from "@/components/ui/alert-banner"
import { DocumentUploadPanel, getFriendlyUploadError, type DocumentUploadFormState } from "@/components/shared/document-upload-panel"
import { apiFetch, apiUpload } from "@/lib/api"
import { downloadFromApi } from "@/lib/file-download"
import { getToken } from "@/lib/auth"
import { ArrowLeft, Calendar, Download, FileText, Loader2, Mail, MapPin, Phone, UserCheck } from "lucide-react"

type BeneficiaryDetail = {
  id: number
  nome: string
  idade?: number
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  cidade?: string | null
  uf?: string | null
  endereco?: string | null
  programa?: string | null
  status?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  notes?: string | null
  case?: {
    id?: number | null
    status?: string | null
    currentStep?: string | null
    summary?: string | null
    program?: string | null
  } | null
  voluntario?: {
    id: number
    nome: string
    especialidade?: string | null
    email?: string | null
    telefone?: string | null
    cidade?: string | null
    uf?: string | null
  } | null
  appointments?: Array<{
    id: number
    date?: string | null
    dateLabel?: string | null
    status?: string | null
    location?: string | null
    phone?: string | null
    notes?: string | null
  }>
  timeline?: Array<{
    id: number
    title: string
    description?: string | null
    eventType?: string | null
    createdAt?: string | null
    dateLabel?: string | null
  }>
}

type DocumentItem = {
  id: number
  title: string
  category?: string
  notes?: string
  fileName?: string
  uploadedAt?: string
  uploadedByName?: string
  downloadUrl: string
}

function normalizeDocument(raw: Record<string, unknown>): DocumentItem {
  return {
    id: Number(raw.id ?? 0),
    title: String(raw.title ?? raw.fileName ?? 'Documento'),
    category: raw.category ? String(raw.category) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    fileName: raw.fileName ? String(raw.fileName) : undefined,
    uploadedAt: raw.uploadedAt ? String(raw.uploadedAt) : undefined,
    uploadedByName: raw.uploadedByName ? String(raw.uploadedByName) : undefined,
    downloadUrl: String(raw.downloadUrl ?? ''),
  }
}

const initialUploadState: DocumentUploadFormState = {
  file: null,
  title: "",
  category: "documento",
  notes: "",
  visibleToBeneficiary: false,
}

export default function AdminBeneficiarioDetailPage() {
  const params = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode")
  const section = searchParams.get("section")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<BeneficiaryDetail | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [uploadState, setUploadState] = useState<DocumentUploadFormState>(initialUploadState)

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const token = getToken()
        if (!token) return
        const [data, docs] = await Promise.all([
          apiFetch<BeneficiaryDetail>(`/api/admin/beneficiaries/${params.id}`, {}, token),
          apiFetch<unknown>(`/api/admin/beneficiaries/${params.id}/documents`, {}, token),
        ])
        const source = Array.isArray(docs) ? docs : (docs && typeof docs === 'object' && ('documents' in docs || 'items' in docs)) ? ((docs as { documents?: unknown[]; items?: unknown[] }).documents || (docs as { items?: unknown[] }).items || []) : []
        setDetail(data)
        setDocuments(source.map((item) => normalizeDocument(item as Record<string, unknown>)).filter((item) => item.id > 0))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar beneficiário")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDetail()
  }, [params.id])

  const pageDescription = useMemo(() => {
    if (mode === "edit") return "Visualização detalhada para revisão cadastral"
    if (section === "appointments") return "Consultas e histórico do beneficiário"
    return "Dados completos do beneficiário e jornada atual"
  }, [mode, section])

  const handleUploadDocument = async () => {
    if (!uploadState.file) return
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
      const created = await apiUpload<unknown>(`/api/admin/beneficiaries/${params.id}/documents`, formData, token)
      setDocuments((prev) => [normalizeDocument(created as Record<string, unknown>), ...prev])
      setUploadState(initialUploadState)
    } catch (err) {
      setError(getFriendlyUploadError(err instanceof Error ? err.message : "Erro ao enviar documento"))
    } finally {
      setIsUploading(false)
    }
  }

  const downloadDocument = async (document: DocumentItem) => {
    try {
      setDownloadingId(document.id)
      const token = getToken()
      if (!token) return
      await downloadFromApi(document.downloadUrl, token, document.fileName || `${document.id}.bin`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar documento")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !detail ? (
            <AlertBanner type="error" title="Erro" message={error || 'Beneficiário não encontrado'} />
          ) : (
            <div className="space-y-6">
              {error && <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} />}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/beneficiarios"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
                    </Button>
                    {mode === "edit" && <Badge variant="secondary">Modo revisão</Badge>}
                    {section === "appointments" && <Badge variant="secondary">Consultas</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{detail.nome}</h1>
                  <p className="text-muted-foreground">{pageDescription}</p>
                </div>
                <Badge variant="outline">{detail.status || "sem status"}</Badge>
              </div>

              <Tabs defaultValue="cadastro" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-[720px]">
                  <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
                  <TabsTrigger value="voluntario">Voluntário</TabsTrigger>
                  <TabsTrigger value="consultas">Consultas</TabsTrigger>
                  <TabsTrigger value="documentos">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="cadastro">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cadastro</CardTitle>
                      <CardDescription>Informações principais do beneficiário</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{detail.nome}</p></div>
                      <div><p className="text-xs text-muted-foreground">Idade</p><p className="font-medium">{detail.idade ?? '-'}</p></div>
                      <div><p className="text-xs text-muted-foreground">CPF</p><p className="font-medium">{detail.cpf || '-'}</p></div>
                      <div><p className="text-xs text-muted-foreground">Programa</p><p className="font-medium">{detail.programa || detail.case?.program || '-'}</p></div>
                      <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{detail.telefone || '-'}</p></div></div>
                      <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{detail.email || '-'}</p></div></div>
                      <div className="flex items-start gap-3 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Endereço</p><p className="font-medium">{detail.endereco || [detail.cidade, detail.uf].filter(Boolean).join(' - ') || '-'}</p></div></div>
                      <div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-medium">{detail.guardianName || '-'}</p></div>
                      <div><p className="text-xs text-muted-foreground">Telefone do responsável</p><p className="font-medium">{detail.guardianPhone || '-'}</p></div>
                      <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Observações</p><p className="font-medium">{detail.notes || detail.case?.summary || '-'}</p></div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="voluntario">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" />Voluntário vinculado</CardTitle>
                      <CardDescription>Profissional associado ao caso</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!detail.voluntario ? <p className="text-sm text-muted-foreground">Nenhum voluntário vinculado.</p> : (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{detail.voluntario.nome}</p></div>
                          <div><p className="text-xs text-muted-foreground">Especialidade</p><p className="font-medium">{detail.voluntario.especialidade || '-'}</p></div>
                          <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{detail.voluntario.telefone || '-'}</p></div>
                          <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{detail.voluntario.email || '-'}</p></div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="consultas">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Consultas</CardTitle>
                      <CardDescription>Histórico do atendimento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(detail.appointments || []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p> : detail.appointments?.map((appointment) => (
                        <div key={appointment.id} className="rounded-xl border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{appointment.dateLabel || appointment.date || 'Sem data'}</p>
                              <p className="text-sm text-muted-foreground">{appointment.location || '-'}</p>
                            </div>
                            <Badge variant="outline">{appointment.status || 'sem status'}</Badge>
                          </div>
                          {appointment.notes ? <p className="mt-2 text-sm text-muted-foreground">{appointment.notes}</p> : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documentos">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <DocumentUploadPanel
                      value={uploadState}
                      onChange={setUploadState}
                      onSubmit={handleUploadDocument}
                      submitting={isUploading}
                      submitLabel="Enviar documento"
                      helperText="Anexe arquivos ao prontuário do beneficiário e defina se também ficarão visíveis para ele."
                      error={error}
                    />
                    <Card>
                      <CardHeader>
                        <CardTitle>Arquivos anexados</CardTitle>
                        <CardDescription>Downloads do prontuário e documentos administrativos</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {documents.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p> : documents.map((document) => (
                          <div key={document.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">{document.title}</p>
                                <p className="text-xs text-muted-foreground">{document.category || 'documento'} • {document.uploadedAt || 'Sem data'}</p>
                                {document.notes ? <p className="mt-2 text-sm text-muted-foreground">{document.notes}</p> : null}
                              </div>
                              <Button variant="outline" onClick={() => void downloadDocument(document)} disabled={downloadingId === document.id}>
                                {downloadingId === document.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Baixar
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
          )}
        </main>
      </div>
    </div>
  )
}
