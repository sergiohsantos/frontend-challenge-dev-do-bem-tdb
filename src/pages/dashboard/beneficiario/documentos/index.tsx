import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { downloadFromApi } from "@/lib/file-download"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { Download, FileText, FolderOpen, Loader2, Calendar, MessageSquare } from "lucide-react"

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
      } catch {
        setError("Não foi possível carregar seus documentos agora. Tente novamente em instantes.")
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
    } catch {
      setError("Não foi possível baixar este documento agora. Tente novamente em instantes.")
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
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
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <BeneficiaryPageHero
            eyebrow="Documentos"
            title="Acompanhe os documentos do seu atendimento."
            description="Baixe resumos do caso, comprovantes de consulta e solicitações relacionadas à sua jornada na Turma do Bem."
            icon={<FolderOpen className="h-4 w-4" aria-hidden="true" />}
            primaryAction={(
              <Button size="lg" asChild className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                <Link to="/dashboard/beneficiario/consultas"><Calendar className="mr-2 h-5 w-5" />Ver consultas</Link>
              </Button>
            )}
            secondaryAction={(
              <Button size="lg" variant="outline" asChild className="h-14 rounded-full border-primary-foreground/30 bg-transparent text-base font-black text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/dashboard/beneficiario/mensagens"><MessageSquare className="mr-2 h-5 w-5" />Mensagens</Link>
              </Button>
            )}
            meta={(
              <>
                <span>{documents.length} documento(s)</span>
                <span>Download seguro</span>
              </>
            )}
          />

          {error && <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <Card className="tdb-polished-card mb-6 rounded-[2rem] border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-foreground">Documentos do atendimento</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Consulte arquivos gerados para seu caso e leve os documentos solicitados nas próximas consultas.</p>
              </div>
            </CardContent>
          </Card>

          {documents.length === 0 ? (
            <Card className="tdb-polished-card rounded-[2rem]">
              <CardContent className="py-14">
                <Empty variant="subtle">
                  <EmptyMedia variant="primary"><FolderOpen className="h-8 w-8" /></EmptyMedia>
                  <EmptyTitle>Nenhum documento disponível</EmptyTitle>
                  <EmptyDescription>Quando houver consultas, resumos ou solicitações registradas, eles aparecerão aqui.</EmptyDescription>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {documents.map((item) => (
                <Card key={item.id} className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg font-black">
                          <FileText className="h-5 w-5 text-primary" />
                          {item.title}
                        </CardTitle>
                        <CardDescription>{item.description || "Documento gerado pelo sistema"}</CardDescription>
                      </div>
                      {item.status && <Badge variant="outline" className="rounded-full">{item.status}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {item.date ? `Atualizado em ${new Date(item.date).toLocaleString("pt-BR")}` : "Sem data de atualização"}
                    </div>
                    <Button className="h-11 w-full rounded-full font-black" onClick={() => void downloadDocument(item)} disabled={downloadingId === item.id}>
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

      <HelpButton />
    </div>
  )
}
