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
import { Stethoscope, Search, Filter, Eye, MapPin, Award, Users, Heart } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

type VolunteerItem = {
  id: number
  nome: string
  especialidade?: string
  tipoProfissional?: string
  registro?: string
  email?: string
  telefone?: string
  cidade?: string
  uf?: string
  availabilityNotes?: string
  programa?: string
  atendimentos?: number
  beneficiarios?: number
  status?: string
  avaliacao?: number
  destaque?: boolean
}

type VolunteersResponse = {
  kpis?: {
    total?: number
    ativos?: number
    destaques?: number
  }
  volunteers?: VolunteerItem[]
  items?: VolunteerItem[]
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "ativo":
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
    case "inativo":
      return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
    default:
      return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
  }
}

export default function AdminVoluntariosPage() {
  const navigate = useNavigate()
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([])
  const [stats, setStats] = useState({ total: 0, ativos: 0, destaques: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all")

  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/admin/login")
          return
        }

        const data = await apiFetch<VolunteersResponse>("/api/admin/volunteers", {}, token)
        const rows = data.volunteers || data.items || []
        setVolunteers(rows)
        setStats({
          total: data.kpis?.total || rows.length,
          ativos: data.kpis?.ativos || rows.filter((item) => item.status === "ativo").length,
          destaques: data.kpis?.destaques || rows.filter((item) => item.destaque).length,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar voluntários")
      } finally {
        setIsLoading(false)
      }
    }

    void loadVolunteers()
  }, [navigate])

  const filteredVolunteers = useMemo(() => {
    const term = searchQuery.toLowerCase().trim()
    return volunteers.filter((item) => {
      const matchesSearch =
        !term ||
        (item.nome || "").toLowerCase().includes(term) ||
        (item.especialidade || "").toLowerCase().includes(term) ||
        (item.tipoProfissional || "").toLowerCase().includes(term) ||
        (item.email || "").toLowerCase().includes(term) ||
        (item.telefone || "").toLowerCase().includes(term) ||
        (item.programa || "").toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || (item.status || "") === statusFilter
      const matchesSpecialty = specialtyFilter === "all" || (item.especialidade || "") === specialtyFilter
      return matchesSearch && matchesStatus && matchesSpecialty
    })
  }, [volunteers, searchQuery, statusFilter, specialtyFilter])

  const specialties = useMemo(
    () => Array.from(new Set(volunteers.map((item) => item.especialidade).filter(Boolean) as string[])).sort(),
    [volunteers],
  )

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
                Voluntários
              </h1>
              <p className="text-muted-foreground">
                Gerencie voluntários, especialidades, disponibilidade e desempenho
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
                  <Stethoscope className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Destaques</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.destaques}</p>
                  </div>
                  <Award className="h-8 w-8 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Voluntários
                  </CardTitle>
                  <CardDescription>
                    {filteredVolunteers.length} voluntário(s) encontrado(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, especialidade ou programa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <Award className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredVolunteers.length > 0 ? (
                <div className="space-y-4">
                  {filteredVolunteers.map((volunteer) => (
                    <div
                      key={volunteer.id}
                      className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{volunteer.nome || "Voluntário"}</p>
                              {volunteer.destaque ? <Award className="h-4 w-4 text-amber-500" /> : null}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {volunteer.tipoProfissional || "Tipo nao informado"} - {volunteer.especialidade || "Especialidade nao informada"}
                              {volunteer.registro ? ` - ${volunteer.registro}` : ""}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {volunteer.email || "E-mail nao informado"} - {volunteer.telefone || "Telefone nao informado"}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {[volunteer.cidade, volunteer.uf].filter(Boolean).join(", ") || "Local não informado"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {volunteer.beneficiarios ?? 0} beneficiário(s)
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                {volunteer.atendimentos ?? 0} atendimento(s)
                              </div>
                            </div>
                            {volunteer.availabilityNotes ? (
                              <p className="mt-2 text-sm text-muted-foreground">Disponibilidade: {volunteer.availabilityNotes}</p>
                            ) : null}
                            <p className="mt-2 text-sm text-muted-foreground">Programa: {volunteer.programa || "Não informado"}</p>
                            <p className="mt-1 text-sm text-muted-foreground">Avaliação: {volunteer.avaliacao ?? 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(volunteer.status)}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/admin/voluntarios/${volunteer.id}`}>
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
                    <Stethoscope className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum voluntário encontrado</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery || statusFilter !== "all" || specialtyFilter !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Nenhum voluntário cadastrado ainda"}
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
