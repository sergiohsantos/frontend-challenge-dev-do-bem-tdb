import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Users, Search, Calendar, TrendingUp, MessageSquare, FileText, HeartHandshake, ShieldCheck } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface Patient {
  id: number
  caseId?: number
  name: string
  age?: number
  treatment?: string
  progress?: number
  status?: string
  lastAppointment?: string
  nextAppointment?: string
  phone?: string
  email?: string
}

interface PatientsResponse {
  patients?: Patient[]
  items?: Patient[]
  total?: number
}

export default function VoluntarioPacientesPage() {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const user = getUser()

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login")
          return
        }

        const data = await apiFetch<PatientsResponse>("/api/volunteers/my-patients", {}, token)
        setPatients(data.patients || data.items || [])
      } catch {
        setError("Não foi possível carregar seus pacientes agora. Tente novamente em instantes.")
      } finally {
        setIsLoading(false)
      }
    }

    loadPatients()
  }, [navigate])

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.treatment?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activePatients = patients.filter((patient) => !patient.status || !["concluído", "concluido", "finalizado"].includes(patient.status.toLowerCase())).length
  const withProgress = patients.filter((patient) => typeof patient.progress === "number").length

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4">
            <DashboardSkeleton />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <VolunteerPageHero
            eyebrow="Pacientes"
            title="Acompanhe quem está sob seu cuidado."
            description="Veja pacientes ativos, evolução do tratamento, histórico de ações e atalhos para mensagem, prontuário e agendamento."
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            meta={(
              <>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{patients.length} paciente(s) vinculados</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{activePatients} em acompanhamento</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{withProgress} com progresso informado</span>
              </>
            )}
          />

          {error && (
            <AlertBanner
              type="error"
              title="Não foi possível carregar tudo"
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card className="tdb-polished-card rounded-[2rem]">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-black text-foreground">{patients.length}</p></div>
              </CardContent>
            </Card>
            <Card className="tdb-polished-card rounded-[2rem]">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success/10 text-success"><HeartHandshake className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-black text-foreground">{activePatients}</p></div>
              </CardContent>
            </Card>
            <Card className="tdb-polished-card rounded-[2rem]">
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><ShieldCheck className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">Com evolução</p><p className="text-2xl font-black text-foreground">{withProgress}</p></div>
              </CardContent>
            </Card>
          </div>

          <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl font-black">
                    <Users className="h-6 w-6 text-primary" />
                    Lista de pacientes
                  </CardTitle>
                  <CardDescription>
                    {filteredPatients.length} paciente(s) exibidos a partir dos seus vínculos atuais.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome ou tratamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 rounded-full pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPatients.length > 0 ? (
                <div className="grid gap-4">
                  {filteredPatients.map((patient) => (
                    <article
                      key={patient.id}
                      className="rounded-[2rem] border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-black text-primary">
                            {patient.name?.charAt(0) || "P"}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-black text-foreground">{patient.name}</p>
                              {patient.status && <Badge variant="secondary" className="rounded-full">{patient.status}</Badge>}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {patient.age ? `${patient.age} anos` : "Idade não informada"}
                              {patient.treatment ? ` • ${patient.treatment}` : ""}
                            </p>
                          </div>
                        </div>
                        {patient.progress !== undefined && (
                          <div className="flex items-center gap-2 text-sm font-black text-primary">
                            <TrendingUp className="h-4 w-4" />
                            {patient.progress}% concluído
                          </div>
                        )}
                      </div>

                      {patient.progress !== undefined && (
                        <div className="mt-4">
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500" style={{ width: `${patient.progress}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button size="sm" asChild className="h-10 w-full rounded-full font-bold sm:w-auto">
                          <Link to={`/dashboard/voluntario/pacientes/${patient.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver prontuário
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="h-10 w-full rounded-full font-bold sm:w-auto">
                          <Link to={`/dashboard/voluntario/mensagens?caseId=${patient.caseId || patient.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Mensagem
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="h-10 w-full rounded-full font-bold sm:w-auto">
                          <Link to={`/dashboard/voluntario/agenda/novo?patientId=${patient.id}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar
                          </Link>
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty variant="subtle" className="py-12">
                  <EmptyMedia variant="primary"><Users className="h-8 w-8" /></EmptyMedia>
                  <EmptyTitle>{searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente atribuído"}</EmptyTitle>
                  <EmptyDescription>
                    {searchTerm ? "Tente buscar com outros termos." : "Seus pacientes aparecerão aqui quando forem atribuídos a você."}
                  </EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
