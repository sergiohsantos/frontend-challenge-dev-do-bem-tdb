import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Loader2, TrendingUp, Users, MessageSquare } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { toast } from "sonner"

interface SatisfactionResponse {
  overallScore?: number
  averageScore?: number
  previousScore?: number
  npsScore?: number
  promoters?: number
  neutrals?: number
  passives?: number
  detractors?: number
  totalResponses?: number
  legacyScaleDetected?: boolean
  scoreScale?: { min: number; max: number }
  trendData?: Array<{ month: string; nps: number; respostas: number }>
  recentFeedback?: Array<{ id: number; nome: string; programa: string; nota: number; rawScore?: number; comentario: string; data: string }>
}

function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="min-w-0">
      <CardContent className="p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">{icon}</div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="truncate text-2xl font-black text-foreground">{value}</p>
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminSatisfacaoPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SatisfactionResponse>({})

  useEffect(() => {
    ;(async () => {
      try {
        const token = getToken()
        const response = await apiFetch<SatisfactionResponse>("/api/admin/satisfaction", {}, token)
        setData(response)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar satisfação")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const hasResponses = (data.totalResponses || 0) > 0 || (data.recentFeedback || []).length > 0
  const averageScore = data.overallScore ?? data.averageScore ?? 0
  const passivePercentage = data.passives ?? data.neutrals ?? 0

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          <div className="mb-6 min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Satisfação</h1>
            <p className="text-sm text-muted-foreground">Indicadores agregados de satisfação e NPS na escala 0 a 10.</p>
          </div>

          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <>
              {data.legacyScaleDetected && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                  Dados antigos em escala 1-5 detectados. O painel converte temporariamente para 0-10 na leitura do NPS.
                </div>
              )}

              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard icon={<Star className="h-5 w-5 text-yellow-500" />} label="Nota geral" value={hasResponses ? `${averageScore}/10` : "Sem dados"} />
                <MetricCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="NPS atual" value={hasResponses ? data.npsScore ?? 0 : "Sem dados"} hint={`Anterior: ${hasResponses ? data.previousScore ?? 0 : "-"}`} />
                <MetricCard icon={<Users className="h-5 w-5 text-green-500" />} label="Promotores" value={`${hasResponses ? data.promoters || 0 : 0}%`} />
                <MetricCard icon={<MessageSquare className="h-5 w-5 text-accent" />} label="Detratores" value={`${hasResponses ? data.detractors || 0 : 0}%`} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="min-w-0">
                  <CardHeader><CardTitle>Distribuição</CardTitle><CardDescription>Percentual por grupo NPS.</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl border p-4"><span className="font-medium">Promotores (9-10)</span><Badge className="rounded-full">{hasResponses ? data.promoters || 0 : 0}%</Badge></div>
                    <div className="flex items-center justify-between rounded-2xl border p-4"><span className="font-medium">Neutros/Passivos (7-8)</span><Badge variant="secondary" className="rounded-full">{hasResponses ? passivePercentage : 0}%</Badge></div>
                    <div className="flex items-center justify-between rounded-2xl border p-4"><span className="font-medium">Detratores (0-6)</span><Badge variant="destructive" className="rounded-full">{hasResponses ? data.detractors || 0 : 0}%</Badge></div>
                    {!hasResponses && <p className="text-sm text-muted-foreground">Sem respostas suficientes para calcular distribuição.</p>}
                  </CardContent>
                </Card>

                <Card className="min-w-0">
                  <CardHeader><CardTitle>Feedback recente</CardTitle><CardDescription>Últimos registros retornados pela API.</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {(data.recentFeedback || []).length === 0 ? <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhum feedback recente.</p> : (data.recentFeedback || []).map((item) => (
                      <div key={item.id} className="rounded-2xl border p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="font-black text-foreground">{item.nome}</p><Badge variant="outline" className="rounded-full">Nota {item.nota}/10</Badge></div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.comentario || "Sem comentário"}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{item.data} - {item.programa}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
