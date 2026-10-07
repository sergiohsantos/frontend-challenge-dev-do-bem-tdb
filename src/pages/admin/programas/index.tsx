import { useEffect, useMemo, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, Search, Users, Calendar } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import { toast } from "sonner"

interface ProgramStats { totalAtendimentos?: number; emAndamento?: number; concluidos?: number; aguardando?: number; voluntarios?: number; satisfacao?: number; tempoMedio?: string; taxaConversao?: string }
interface ProgramItem { id: string; name: string; description: string; stats?: ProgramStats }
interface ProgramsResponse { programs?: ProgramItem[] }

export default function AdminProgramasPage() {
  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<ProgramItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => { fetchPrograms() }, [])

  async function fetchPrograms() {
    setLoading(true)
    try {
      const token = getToken()
      const data = await apiFetch<ProgramsResponse>("/api/admin/programs", {}, token)
      setPrograms(data.programs || [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar programas")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => programs.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())), [programs, searchTerm])

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminHeader />
        <main className="overflow-x-hidden p-4 sm:p-6">
          <div className="mb-6 min-w-0">
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Programas</h1>
            <p className="text-sm text-muted-foreground">Visualização dos programas cadastrados e seus indicadores.</p>
          </div>

          <Card className="min-w-0">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" />Programas</CardTitle>
                  <CardDescription>O backend atual disponibiliza consulta dos programas, sem ações de cadastro/edição nesta tela.</CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="h-11 pl-10" placeholder="Buscar programas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum programa encontrado.</div> : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((program) => (
                    <Card key={program.id} className="min-w-0 border-primary/10 transition-all hover:border-primary/30">
                      <CardHeader className="pb-2">
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Heart className="h-5 w-5" /></div>
                        <CardTitle className="text-lg font-black">{program.name}</CardTitle>
                        <CardDescription className="leading-6">{program.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {program.stats?.totalAtendimentos || 0} atendimentos</div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {program.stats?.voluntarios || 0} voluntários</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="rounded-full">Em andamento: {program.stats?.emAndamento || 0}</Badge>
                          <Badge variant="outline" className="rounded-full">Concluídos: {program.stats?.concluidos || 0}</Badge>
                        </div>
                      </CardContent>
                    </Card>
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
