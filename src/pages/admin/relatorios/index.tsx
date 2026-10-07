import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { downloadFromApi } from "@/lib/file-download"
import { downloadAdminReportLocally } from "@/lib/admin-report-download"
import { toast } from "sonner"

interface ReportType {
  id: string
  name: string
  description: string
  category: string
  format: string[]
}

interface RecentReport {
  id: number
  name: string
  date: string
  format: string
  status: string
  size: string
  download_url?: string
}

interface ReportsResponse {
  generatedAt?: string
  reportTypes?: ReportType[]
  recentReports?: RecentReport[]
}

export default function AdminRelatoriosPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportsResponse>({})
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const token = getToken()
        const response = await apiFetch<ReportsResponse>("/api/admin/reports", {}, token)
        setData(response)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar relatórios")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleDownload(reportId: string, format: string) {
    const normalizedFormat = format.toLowerCase()
    try {
      setDownloading(`${reportId}-${format}`)
      const token = getToken()
      await downloadFromApi(
        `/api/admin/reports/${reportId}/download?format=${normalizedFormat}`,
        token,
        `${reportId}.${normalizedFormat}`,
      )
    } catch {
      try {
        const token = getToken()
        const localResult = await downloadAdminReportLocally(reportId, normalizedFormat, token)
        if (localResult.extension === "xls") {
          toast.success("Relatório gerado localmente em planilha compatível com Excel")
        } else {
          toast.success("Relatório gerado localmente porque a exportação do backend falhou")
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao baixar relatório")
      }
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          <div className="mb-6 min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Baixe relatórios do Admin. Quando a exportação do backend falhar, o frontend gera o arquivo localmente.</p>
          </div>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Tipos de relatório</CardTitle>
              <CardDescription>Gerado em {data.generatedAt || "—"}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (data.reportTypes || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum relatório disponível agora. Tente novamente mais tarde ou acompanhe os indicadores do dashboard.
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.reportTypes || []).map((report) => (
                    <div key={report.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-black text-foreground">{report.name}</p>
                            <Badge variant="outline" className="rounded-full">{report.category}</Badge>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">{report.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {report.format.map((format) => (
                            <Button
                              key={format}
                              variant="outline"
                              size="sm"
                              disabled={downloading === `${report.id}-${format}`}
                              onClick={() => void handleDownload(report.id, format)}
                              className="h-10 gap-2 rounded-full font-bold"
                            >
                              {downloading === `${report.id}-${format}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                              {format}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
