import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { downloadFromApi } from "@/lib/file-download"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { AlertCircle, ArrowLeft, Download, FileText, FolderOpen, Loader2, Calendar, MessageSquare } from "lucide-react"

interface DocumentItem {
  id: string
  kind: string
  title: string
  description?: string
  status?: string
  date?: string
  downloadUrl: string
}

interface DocumentsResponse {
  documents?: DocumentItem[]
  items?: DocumentItem[]
}

function normalizeDocument(raw: Record<string, unknown>): DocumentItem {
  return {
    id: String(raw.id ?? ""),
    kind: String(raw.kind ?? "document"),
    title: String(raw.title ?? "Documento"),
    description: raw.description ? String(raw.description) : undefined,
    status: raw.status ? String(raw.status) : undefined,
    date: raw.date ? String(raw.date) : raw.createdAt ? String(raw.createdAt) : undefined,
    downloadUrl: String(raw.downloadUrl ?? raw.download_url ?? ""),
  }
}

export default function BeneficiarioDocumentosPage() {
  const navigate = useNavigate()
  const user = getUser()
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login", { replace: true })
          return
        }

        const data = await apiFetch<DocumentsResponse | DocumentItem[]>("/api/beneficiaries/me/documents", {}, token)
        const source = Array.isArray(data) ? data : data.documents || data.items || []
        setDocuments(source.map((item) => normalizeDocument(item as unknown as Record<string, unknown>)).filter((item) => item.downloadUrl))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar documentos")
      } finally {
        setIsLoading(false)
      }
    }

    void loadDocuments()
  }, [navigate])

  const downloadDocument = async (item: DocumentItem) => {
    try {
      setDownloadingId(item.id)
      setError(null)
      const token = getToken()
      if (!token) {
        navigate("/login", { replace: true })
        return
      }
      await downloadFromApi(item.downloadUrl, token, `${item.title}.bin`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar documento")
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-secondary">
        <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/beneficiario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Meus Documentos</h1>
            <p className="mt-1 text-muted-foreground">Baixe resumos do caso, comprovantes de consulta e solicitações relacionadas ao seu atendimento.</p>
          </div>

          {error && <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} className="mb-4" />}

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Documentos do atendimento</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Consulte arquivos gerados para seu caso e leve os documentos solicitados nas próximas consultas.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/beneficiario/consultas">
                    <Calendar className="mr-2 h-4 w-4" />
                    Consultas
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard/beneficiario/mensagens">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensagens
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {documents.length === 0 ? (
            <Card>
              <CardContent className="py-14 text-center">
                <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-lg font-medium">Nenhum documento disponível</h3>
                <p className="mt-2 text-muted-foreground">Quando houver consultas, resumos ou solicitações registradas, eles aparecerão aqui.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5 text-primary" />
                          {item.title}
                        </CardTitle>
                        <CardDescription>{item.description || "Documento gerado pelo sistema"}</CardDescription>
                      </div>
                      {item.status && <Badge variant="outline">{item.status}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {item.date ? `Atualizado em ${new Date(item.date).toLocaleString("pt-BR")}` : "Sem data de atualização"}
                    </div>
                    <Button className="w-full" onClick={() => void downloadDocument(item)} disabled={downloadingId === item.id}>
                      {downloadingId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                      {downloadingId === item.id ? "Baixando..." : "Baixar documento"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
