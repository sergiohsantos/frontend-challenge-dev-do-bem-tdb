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
import { Building, Search, Filter, Eye, MapPin, Phone, Calendar } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

type PartnerItem = {
  id: number
  nome: string
  tipo?: string
  cidade?: string
  uf?: string
  voluntarios?: number
  atendimentos?: number
  status?: string
  programa?: string
  contato?: string
  email?: string
  telefone?: string
}

type PartnersResponse = {
  kpis?: {
    total?: number
    ativos?: number
    aguardandoAprovacao?: number
  }
  partners?: PartnerItem[]
  items?: PartnerItem[]
}

function getStatusBadge(status?: string) {
  switch (status) {
    case "ativo":
      return <Badge className="rounded-full bg-green-100 text-green-800">Ativo</Badge>
    case "inativo":
      return <Badge className="rounded-full bg-gray-100 text-gray-800">Inativo</Badge>
    default:
      return <Badge className="rounded-full bg-yellow-100 text-yellow-800">Pendente</Badge>
  }
}

function getTypeBadge(type?: string) {
  return <Badge variant="outline" className="rounded-full">{type || "Outro"}</Badge>
}

function MetricCard({ label, value, icon, tone = "primary" }: { label: string; value: number; icon: React.ReactNode; tone?: "primary" | "green" | "yellow" }) {
  const toneClass = tone === "green" ? "bg-green-500/10 text-green-600" : tone === "yellow" ? "bg-yellow-500/10 text-yellow-600" : "bg-primary/10 text-primary"

  return (
    <Card className="min-w-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="truncate text-3xl font-black text-foreground">{value}</p>
          </div>
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminParceirosPage() {
  const navigate = useNavigate()
  const [partners, setPartners] = useState<PartnerItem[]>([])
  const [stats, setStats] = useState({ total: 0, ativos: 0, aguardando: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/admin/login")
          return
        }

        const data = await apiFetch<PartnersResponse>("/api/admin/partners", {}, token)
        const rows = data.partners || data.items || []
        setPartners(rows)
        setStats({
          total: data.kpis?.total || rows.length,
          ativos: data.kpis?.ativos || rows.filter((item) => item.status === "ativo").length,
          aguardando:
            data.kpis?.aguardandoAprovacao ||
            rows.filter((item) => !item.status || !["ativo", "inativo"].includes(item.status)).length,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar parceiros")
      } finally {
        setIsLoading(false)
      }
    }

    void loadPartners()
  }, [navigate])

  const filteredPartners = useMemo(() => {
    const term = searchQuery.toLowerCase().trim()
    return partners.filter((item) => {
      const matchesSearch =
        !term ||
        (item.nome || "").toLowerCase().includes(term) ||
        (item.cidade || "").toLowerCase().includes(term) ||
        (item.email || "").toLowerCase().includes(term) ||
        (item.contato || "").toLowerCase().includes(term)
      const matchesStatus = statusFilter === "all" || (item.status || "") === statusFilter
      const matchesType = typeFilter === "all" || (item.tipo || "") === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [partners, searchQuery, statusFilter, typeFilter])

  const partnerTypes = useMemo(
    () => Array.from(new Set(partners.map((item) => item.tipo).filter(Boolean) as string[])).sort(),
    [partners],
  )

  if (isLoading) {
    return (
      <div className="flex min-h-screen overflow-x-hidden">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminHeader />
          <main className="overflow-x-hidden p-4 sm:p-6"><DashboardSkeleton /></main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          {error && <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

          <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Parceiros</h1>
              <p className="text-muted-foreground">Gerencie parceiros, clínicas e organizações vinculadas aos programas.</p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total de parceiros" value={stats.total} icon={<Building className="h-6 w-6" />} />
            <MetricCard label="Parceiros ativos" value={stats.ativos} icon={<Building className="h-6 w-6" />} tone="green" />
            <MetricCard label="Pendentes" value={stats.aguardando} icon={<Building className="h-6 w-6" />} tone="yellow" />
          </div>

          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" />Parceiros</CardTitle>
                  <CardDescription>{filteredPartners.length} parceiro(s) encontrado(s)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por nome, cidade, contato ou email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-11 pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 w-full lg:w-[150px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="inativo">Inativos</SelectItem></SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-11 w-full lg:w-[180px]"><Building className="mr-2 h-4 w-4" /><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">Todos</SelectItem>{partnerTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {filteredPartners.length > 0 ? (
                <div className="space-y-4">
                  {filteredPartners.map((partner) => (
                    <div key={partner.id} className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10"><Building className="h-6 w-6 text-primary" /></div>
                          <div className="min-w-0">
                            <p className="font-black text-foreground">{partner.nome || "Parceiro"}</p>
                            <p className="text-sm text-muted-foreground">Contato: {partner.contato || "Não informado"}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[partner.cidade, partner.uf].filter(Boolean).join(", ") || "Local não informado"}</div>
                              <div className="flex items-center gap-1"><Phone className="h-4 w-4" />{partner.telefone || "Telefone não informado"}</div>
                              <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />Programa: {partner.programa || "Não informado"}</div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{partner.voluntarios ?? 0} voluntário(s) | {partner.atendimentos ?? 0} atendimento(s)</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          {getTypeBadge(partner.tipo)}
                          {getStatusBadge(partner.status)}
                          <Button size="sm" variant="outline" asChild className="h-10 rounded-full font-bold"><Link to={`/admin/parceiros/${partner.id}`}><Eye className="mr-1 h-4 w-4" />Ver</Link></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty variant="subtle" className="py-12"><EmptyMedia variant="primary"><Building className="h-8 w-8" /></EmptyMedia><EmptyTitle>Nenhum parceiro encontrado</EmptyTitle><EmptyDescription>{searchQuery || statusFilter !== "all" || typeFilter !== "all" ? "Tente ajustar os filtros de busca" : "Nenhum parceiro cadastrado ainda"}</EmptyDescription></Empty>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
