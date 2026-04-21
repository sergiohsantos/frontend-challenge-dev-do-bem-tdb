import { useEffect, useMemo, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Calendar, Loader2, Star, User, Users } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

type VolunteerDetail = {
  id: number
  nome: string
  especialidade?: string | null
  tipoProfissional?: string | null
  registro?: string | null
  email?: string | null
  telefone?: string | null
  cidade?: string | null
  uf?: string | null
  pais?: string | null
  status?: string | null
  avaliacao?: number | null
  availabilityNotes?: string | null
  stats?: {
    atendimentos?: number
    beneficiarios?: number
    avaliacao?: number
  }
  patients?: Array<{
    caseId?: number
    beneficiaryId?: number
    name: string
    program?: string | null
    status?: string | null
    currentStep?: string | null
  }>
  appointments?: Array<{
    id: number
    caseId?: number
    beneficiaryId?: number
    beneficiaryName?: string | null
    date?: string | null
    dateLabel?: string | null
    status?: string | null
    location?: string | null
  }>
}

export default function AdminVolunteerDetailPage() {
  const params = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode")
  const section = searchParams.get("section")

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<VolunteerDetail | null>(null)

  useEffect(() => {
    const loadDetail = async () => {
      try {
        const token = getToken()
        if (!token) return
        const data = await apiFetch<VolunteerDetail>(`/api/admin/volunteers/${params.id}`, {}, token)
        setDetail(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar voluntário")
      } finally {
        setIsLoading(false)
      }
    }
    void loadDetail()
  }, [params.id])

  const pageDescription = useMemo(() => {
    if (mode === "edit") return "Visualização detalhada para revisão cadastral"
    if (section === "agenda") return "Agenda e pacientes vinculados ao voluntário"
    return "Perfil completo e operação atual do voluntário"
  }, [mode, section])

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
              <Button variant="outline" asChild>
                <Link to="/admin/voluntarios"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
              </Button>
              <Card><CardContent className="py-8 text-sm text-destructive">{error || "Voluntário não encontrado"}</CardContent></Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin/voluntarios"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
                    </Button>
                    {mode === "edit" && <Badge variant="secondary">Modo revisão</Badge>}
                    {section === "agenda" && <Badge variant="secondary">Agenda</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{detail.nome}</h1>
                  <p className="text-muted-foreground">{pageDescription}</p>
                </div>
                <Badge variant="outline">{detail.status || "sem status"}</Badge>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Cadastro profissional</CardTitle>
                    <CardDescription>Informações do voluntário</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{detail.nome}</p></div>
                    <div><p className="text-xs text-muted-foreground">Tipo profissional</p><p className="font-medium">{detail.tipoProfissional || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Especialidade</p><p className="font-medium">{detail.especialidade || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Registro</p><p className="font-medium">{detail.registro || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Cidade/UF</p><p className="font-medium">{[detail.cidade, detail.uf].filter(Boolean).join("/") || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">País</p><p className="font-medium">{detail.pais || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{detail.email || "-"}</p></div>
                    <div><p className="text-xs text-muted-foreground">Telefone</p><p className="font-medium">{detail.telefone || "-"}</p></div>
                    <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Disponibilidade</p><p className="text-sm">{detail.availabilityNotes || "Sem observações cadastradas"}</p></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resumo</CardTitle>
                    <CardDescription>Indicadores principais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg border p-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Beneficiários</p><p className="font-medium">{detail.stats?.beneficiarios ?? detail.patients?.length ?? 0}</p></div></div>
                    <div className="flex items-center gap-3 rounded-lg border p-3"><Calendar className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Atendimentos</p><p className="font-medium">{detail.stats?.atendimentos ?? detail.appointments?.length ?? 0}</p></div></div>
                    <div className="flex items-center gap-3 rounded-lg border p-3"><Star className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Avaliação</p><p className="font-medium">{detail.avaliacao ?? detail.stats?.avaliacao ?? 0}</p></div></div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Beneficiários vinculados</CardTitle>
                    <CardDescription>{detail.patients?.length || 0} registros</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(detail.patients?.length ?? 0) > 0 ? detail.patients?.map((patient) => (
                      <div key={`${patient.caseId ?? patient.beneficiaryId ?? patient.name}`} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">{patient.program || "-"}</p>
                          </div>
                          <Badge variant="outline">{patient.status || "-"}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{patient.currentStep || "Sem etapa atual"}</p>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Nenhum beneficiário vinculado.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Agenda</CardTitle>
                    <CardDescription>{detail.appointments?.length || 0} consultas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(detail.appointments?.length ?? 0) > 0 ? detail.appointments?.map((appointment) => (
                      <div key={appointment.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{appointment.beneficiaryName || "Beneficiário"}</p>
                            <p className="text-sm text-muted-foreground">{appointment.dateLabel || "Sem data"}</p>
                          </div>
                          <Badge variant="outline">{appointment.status || "-"}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{appointment.location || "-"}</p>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
