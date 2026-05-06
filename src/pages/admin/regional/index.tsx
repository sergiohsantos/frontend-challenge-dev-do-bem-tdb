import { useEffect, useMemo, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Map, Loader2, Search, MapPin, Users, Heart, Building2, AlertTriangle } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { toast } from "sonner"

interface RegionSummaryItem {
  regiao: string
  beneficiarios: number
  voluntarios: number
  atendimentos: number
  cobertura: number
  satisfacao: number
  estados?: string[]
}

interface StateDataItem {
  uf: string
  nome: string
  atendimentos: number
  cobertura: number
  satisfacao: number
}

interface AlertRegionItem {
  regiao: string
  motivo: string
  nivel: string
}

interface RegionalResponse {
  regionSummary?: RegionSummaryItem[]
  stateData?: StateDataItem[]
  alertRegions?: AlertRegionItem[]
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

const formatNumber = (value: number | undefined) => Number(value || 0).toLocaleString("pt-BR")

export default function AdminRegionalPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RegionalResponse>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUf, setSelectedUf] = useState("all")

  useEffect(() => {
    void fetchRegionalData()
  }, [])

  async function fetchRegionalData() {
    setLoading(true)
    try {
      const token = getToken()
      const response = await apiFetch<RegionalResponse>("/api/admin/regional", {}, token)
      setData(response)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar dados regionais")
    } finally {
      setLoading(false)
    }
  }

  const stateOptions = useMemo(() => {
    const items = (data.stateData || []).map((item) => ({
      value: item.uf,
      label: `${item.uf} • ${item.nome}`,
    }))
    return [{ value: "all", label: "Todos os estados" }, ...items]
  }, [data.stateData])

  const filteredStates = useMemo(() => {
    const term = normalize(searchTerm)
    return (data.stateData || []).filter((item) => {
      const matchesUf = selectedUf === "all" || item.uf === selectedUf
      const matchesSearch = !term || normalize(`${item.uf} ${item.nome}`).includes(term)
      return matchesUf && matchesSearch
    })
  }, [data.stateData, searchTerm, selectedUf])

  const totals = filteredStates.reduce(
    (acc, curr) => ({
      states: acc.states + 1,
      atendimentos: acc.atendimentos + Number(curr.atendimentos || 0),
      coberturaMedia: acc.coberturaMedia + Number(curr.cobertura || 0),
      satisfacaoMedia: acc.satisfacaoMedia + Number(curr.satisfacao || 0),
    }),
    { states: 0, atendimentos: 0, coberturaMedia: 0, satisfacaoMedia: 0 },
  )

  const avgCobertura = totals.states > 0 ? Math.round(totals.coberturaMedia / totals.states) : 0
  const avgSatisfacao = totals.states > 0 ? Math.round(totals.satisfacaoMedia / totals.states) : 0

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          <div className="mb-6 min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Gestão Regional</h1>
            <p className="text-sm text-muted-foreground">
              Cobertura, atendimento e alertas por região e estado.
            </p>
          </div>

          <div className="mb-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="min-w-0">
              <CardContent className="p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Estados filtrados</p>
                    <p className="truncate text-2xl font-bold">{totals.states}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Heart className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Atendimentos</p>
                    <p className="truncate text-2xl font-bold">{formatNumber(totals.atendimentos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Cobertura média</p>
                    <p className="truncate text-2xl font-bold">{avgCobertura}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Satisfação média</p>
                    <p className="truncate text-2xl font-bold">{avgSatisfacao}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Card className="min-w-0">
              <CardHeader>
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0 truncate">Dados por estado</span>
                    </CardTitle>
                    <CardDescription>Baseada no payload real de /api/admin/regional.</CardDescription>
                  </div>

                  <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
                    <Select value={selectedUf} onValueChange={setSelectedUf}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {stateOptions.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative min-w-0">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por UF ou cidade..."
                        className="w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="min-w-0">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredStates.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Map className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                    <p>Nenhum estado encontrado.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile/tablet cards */}
                    <div className="grid gap-3 lg:hidden">
                      {filteredStates.map((item) => (
                        <div key={`${item.uf}-${item.nome}`} className="rounded-xl border border-border p-4">
                          <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="mb-1">
                                <Badge variant="outline">{item.uf}</Badge>
                              </div>
                              <p className="min-w-0 truncate font-medium">{item.nome}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-lg font-bold text-primary">
                                {formatNumber(item.atendimentos)}
                              </p>
                              <p className="text-xs text-muted-foreground">atendimentos</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-lg bg-muted/50 p-2">
                              <p className="text-xs text-muted-foreground">Cobertura</p>
                              <p className="font-semibold">{item.cobertura}%</p>
                            </div>
                            <div className="rounded-lg bg-muted/50 p-2">
                              <p className="text-xs text-muted-foreground">Satisfação</p>
                              <p className="font-semibold">{item.satisfacao}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden min-w-0 overflow-x-auto lg:block">
                      <table className="w-full min-w-[640px]">
                        <thead>
                          <tr className="border-b text-left text-sm text-muted-foreground">
                            <th className="pb-3 font-medium">UF</th>
                            <th className="pb-3 font-medium">Referência</th>
                            <th className="pb-3 text-center font-medium">Atendimentos</th>
                            <th className="pb-3 text-center font-medium">Cobertura</th>
                            <th className="pb-3 text-center font-medium">Satisfação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStates.map((item) => (
                            <tr key={`${item.uf}-${item.nome}`} className="border-b last:border-b-0">
                              <td className="py-4">
                                <Badge variant="outline">{item.uf}</Badge>
                              </td>
                              <td className="max-w-[240px] truncate py-4 font-medium">{item.nome}</td>
                              <td className="py-4 text-center">{formatNumber(item.atendimentos)}</td>
                              <td className="py-4 text-center">
                                <Badge>{item.cobertura}%</Badge>
                              </td>
                              <td className="py-4 text-center">
                                <Badge variant="secondary">{item.satisfacao}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="min-w-0 space-y-6">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 shrink-0 text-primary" />
                    <span>Resumo por região</span>
                  </CardTitle>
                  <CardDescription>Dados consolidados por macrorregião.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (data.regionSummary || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem resumo regional disponível.</p>
                  ) : (
                    (data.regionSummary || []).map((region) => (
                      <div key={region.regiao} className="min-w-0 rounded-xl border p-4">
                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{region.regiao}</p>
                            <p className="text-xs text-muted-foreground">
                              Estados: {(region.estados || []).join(", ") || "—"}
                            </p>
                          </div>
                          <Badge variant="outline" className="w-fit shrink-0">
                            {region.cobertura}% cobertura
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <span>
                            Beneficiários:{" "}
                            <strong className="text-foreground">{formatNumber(region.beneficiarios)}</strong>
                          </span>
                          <span>
                            Voluntários:{" "}
                            <strong className="text-foreground">{formatNumber(region.voluntarios)}</strong>
                          </span>
                          <span>
                            Atendimentos:{" "}
                            <strong className="text-foreground">{formatNumber(region.atendimentos)}</strong>
                          </span>
                          <span>
                            Satisfação: <strong className="text-foreground">{region.satisfacao}</strong>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
                    <span>Alertas regionais</span>
                  </CardTitle>
                  <CardDescription>Itens que exigem atenção operacional.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (data.alertRegions || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum alerta regional no momento.</p>
                  ) : (
                    (data.alertRegions || []).map((alert, index) => (
                      <div
                        key={`${alert.regiao}-${index}`}
                        className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="min-w-0 truncate font-medium text-foreground">{alert.regiao}</p>
                          <Badge variant="destructive" className="w-fit shrink-0">
                            {alert.nivel}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{alert.motivo}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
