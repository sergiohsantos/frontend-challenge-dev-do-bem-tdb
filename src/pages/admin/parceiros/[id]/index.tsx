import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Building2, Loader2, Mail, MapPin, Phone, Users } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

type PartnerDetail = {
  id: number
  nome: string
  tipo?: string | null
  cidade?: string | null
  uf?: string | null
  pais?: string | null
  status?: string | null
  programa?: string | null
  contato?: string | null
  email?: string | null
  telefone?: string | null
  voluntarios?: number | null
  atendimentos?: number | null
  observacoes?: string | null
}

export default function AdminPartnerDetailPage() {
  const params = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode")

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<PartnerDetail | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const token = getToken()
        if (!token) return
        const data = await apiFetch<PartnerDetail>(`/api/admin/partners/${params.id}`, {}, token)
        setDetail(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar parceiro")
      } finally {
        setIsLoading(false)
      }
    }
    void loadDetail()
  }, [params.id])

  const description = useMemo(
    () => mode === "edit" ? "Visualização detalhada para revisão cadastral" : "Dados completos do parceiro e contato principal",
    [mode],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 sm:p-6">
          {error || !detail ? (
            <div className="space-y-4">
              <Button variant="outline" asChild><Link to="/admin/parceiros"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>
              <Card><CardContent className="py-8 text-sm text-destructive">{error || "Parceiro não encontrado"}</CardContent></Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild><Link to="/admin/parceiros"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>
                    {mode === "edit" && <Badge variant="secondary">Modo revisão</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{detail.nome}</h1>
                  <p className="text-muted-foreground">{description}</p>
                </div>
                <Badge variant="outline">{detail.status || "sem status"}</Badge>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Cadastro do parceiro</CardTitle>
                    <CardDescription>Informações da clínica ou consultório</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{detail.nome}</p></div>
                    <div><p className="text-xs text-muted-foreground">Tipo</p><p className="font-medium">{detail.tipo || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Programa</p><p className="font-medium">{detail.programa || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Cidade/UF</p><p className="font-medium">{[detail.cidade, detail.uf].filter(Boolean).join("/") || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">País</p><p className="font-medium">{detail.pais || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Contato</p><p className="font-medium">{detail.contato || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{detail.email || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{detail.telefone || "-"}</p></div>
                    {detail.observacoes && <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm">{detail.observacoes}</p></div>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores</CardTitle>
                    <CardDescription>Resumo operacional</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border p-3"><Building2 className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Status</p><p className="font-medium">{detail.status || "-"}</p></div></div>
                    <div className="flex items-center gap-3 rounded-lg border p-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Voluntários</p><p className="font-medium">{detail.voluntarios ?? 0}</p></div></div>
                    <div className="flex items-center gap-3 rounded-lg border p-3"><MapPin className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Atendimentos</p><p className="font-medium">{detail.atendimentos ?? 0}</p></div></div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Contato rápido</CardTitle>
                  <CardDescription>Dados principais do ponto focal do parceiro</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-lg border p-3"><Mail className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{detail.email || "-"}</p></div></div>
                  <div className="flex items-center gap-3 rounded-lg border p-3"><Phone className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{detail.telefone || "-"}</p></div></div>
                  <div className="flex items-center gap-3 rounded-lg border p-3"><MapPin className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Localização</p><p className="font-medium">{[detail.cidade, detail.uf, detail.pais].filter(Boolean).join(" - ") || "-"}</p></div></div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
