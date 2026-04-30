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
  previousScore?: number
  promoters?: number
  neutrals?: number
  detractors?: number
  trendData?: Array<{ month: string; nps: number; respostas: number }>
  recentFeedback?: Array<{ id: number; nome: string; programa: string; nota: number; comentario: string; data: string }>
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

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Satisfação</h1>
            <p className="text-sm text-muted-foreground">Indicadores agregados de satisfação disponibilizados pelo backend.</p>
          </div>
          {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <>
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-500" /><div><p className="text-sm text-muted-foreground">Nota geral</p><p className="text-2xl font-bold">{data.overallScore || 0}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Pontuação anterior</p><p className="text-2xl font-bold">{data.previousScore || 0}</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-green-500" /><div><p className="text-sm text-muted-foreground">Promotores</p><p className="text-2xl font-bold">{data.promoters || 0}%</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-accent" /><div><p className="text-sm text-muted-foreground">Detratores</p><p className="text-2xl font-bold">{data.detractors || 0}%</p></div></div></CardContent></Card>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Distribuição</CardTitle><CardDescription>Percentual por grupo NPS.</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3"><span>Promotores</span><Badge>{data.promoters || 0}%</Badge></div>
                    <div className="flex items-center justify-between rounded-lg border p-3"><span>Neutros</span><Badge variant="secondary">{data.neutrals || 0}%</Badge></div>
                    <div className="flex items-center justify-between rounded-lg border p-3"><span>Detratores</span><Badge variant="destructive">{data.detractors || 0}%</Badge></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Feedback recente</CardTitle><CardDescription>Últimos registros retornados pela API.</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {(data.recentFeedback || []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum feedback recente.</p> : (data.recentFeedback || []).map((item) => (
                      <div key={item.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3"><p className="font-medium text-foreground">{item.nome}</p><Badge variant="outline">Nota {item.nota}</Badge></div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.comentario || 'Sem comentário'}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{item.data} • {item.programa}</p>
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
