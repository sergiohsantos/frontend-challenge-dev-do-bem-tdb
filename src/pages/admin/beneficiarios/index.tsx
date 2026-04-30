import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Users, Search, Filter, Eye, MapPin, Calendar, UserCheck, Clock3 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

type BeneficiaryItem = {
  id: number
  nome: string
  idade?: number
  cidade?: string
  uf?: string
  programa?: string
  status?: string
  etapa?: string
  proximaConsulta?: string
  voluntario?: string
}

type BeneficiariesResponse = {
  kpis?: {
    total?: number
    emTratamento?: number
    concluidos?: number
    novos?: number
  }
  beneficiaries?: BeneficiaryItem[]
  items?: BeneficiaryItem[]
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "em_tratamento":
      return <Badge className="bg-blue-100 text-blue-800">Em tratamento</Badge>
    case "concluido":
      return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
    case "inativo":
      return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Aguardando</Badge>
  }
}

export default function AdminBeneficiariosPage() {
  const navigate = useNavigate()
  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryItem[]>([])
  const [stats, setStats] = useState({ total: 0, emTratamento: 0, concluidos: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const loadBeneficiaries = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/admin/login")
          return
        }

        const data = await apiFetch<BeneficiariesResponse>("/api/admin/beneficiaries", {}, token)
        const rows = data.beneficiaries || data.items || []
        setBeneficiaries(rows)
        setStats({
          total: data.kpis?.total || rows.length,
          emTratamento: data.kpis?.emTratamento || rows.filter((item) => item.status === "em_tratamento").length,
          concluidos: data.kpis?.concluidos || rows.filter((item) => item.status === "concluido").length,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar beneficiários")
      } finally {
        setIsLoading(false)
      }
    }

    void loadBeneficiaries()
  }, [navigate])

  const filteredBeneficiaries = useMemo(() => {
    const term = searchQuery.toLowerCase().trim()
    return beneficiaries.filter((item) => {
      const matchesSearch =
        !term ||
        (item.nome || "").toLowerCase().includes(term) ||
        (item.cidade || "").toLowerCase().includes(term) ||
        (item.programa || "").toLowerCase().includes(term) ||
        (item.voluntario || "").toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || (item.status || "") === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [beneficiaries, searchQuery, statusFilter])

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="p-4 sm:p-6">
            <DashboardSkeleton />
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
          {error && (
            <AlertBanner
              type="error"
              title="Erro"
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Beneficiários
              </h1>
              <p className="text-muted-foreground">
                Gerencie beneficiários, acompanhe etapas do atendimento e próximas consultas
              </p>
            </div>
          </div>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em tratamento</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.emTratamento}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.concluidos}</p>
                  </div>
                  <Clock3 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Beneficiários
                  </CardTitle>
                  <CardDescription>
                    {filteredBeneficiaries.length} beneficiário(s) encontrado(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, cidade, programa ou voluntário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[190px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aguardando">Aguardando</SelectItem>
                    <SelectItem value="em_tratamento">Em tratamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredBeneficiaries.length > 0 ? (
                <div className="space-y-4">
                  {filteredBeneficiaries.map((beneficiary) => (
                    <div
                      key={beneficiary.id}
                      className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{beneficiary.nome || "Beneficiário"}</p>
                            <p className="text-sm text-muted-foreground">
                              {beneficiary.idade ? `${beneficiary.idade} anos` : "Idade não informada"}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {[beneficiary.cidade, beneficiary.uf].filter(Boolean).join(", ") || "Local não informado"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {beneficiary.proximaConsulta ? `Próxima consulta: ${beneficiary.proximaConsulta}` : "Sem consulta agendada"}
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">Programa: {beneficiary.programa || "Não informado"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Etapa: {beneficiary.etapa || "Não informada"}</p>
                            {beneficiary.voluntario && beneficiary.voluntario !== "-" ? (
                              <p className="mt-1 text-sm text-muted-foreground">Voluntário: {beneficiary.voluntario}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(beneficiary.status)}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/admin/beneficiarios/${beneficiary.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty variant="subtle" className="py-12">
                  <EmptyMedia variant="primary">
                    <Users className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum beneficiário encontrado</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || statusFilter !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Nenhum beneficiário cadastrado ainda"}
                  </EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
