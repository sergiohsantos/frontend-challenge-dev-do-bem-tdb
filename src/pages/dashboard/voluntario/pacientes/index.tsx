import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Users, ArrowLeft, Search, User, Calendar, TrendingUp, MessageSquare, FileText } from "lucide-react"
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
      } catch (err) {
        console.error("Error loading patients:", err)
        setError(err instanceof Error ? err.message : "Erro ao carregar pacientes")
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntario"} userType="voluntario" notificationCount={0} />
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
      <DashboardHeader userName={user?.full_name || "Voluntario"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link to="/dashboard/voluntario">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Link>
          </Button>

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

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Meus Pacientes
                  </CardTitle>
                  <CardDescription>
                    {patients.length} paciente(s) sob seu cuidado
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPatients.length > 0 ? (
                <div className="space-y-4">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-bold text-primary">
                            {patient.name?.charAt(0) || "P"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{patient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {patient.age ? `${patient.age} anos` : ""}
                              {patient.treatment ? ` - ${patient.treatment}` : ""}
                            </p>
                            {patient.status && (
                              <Badge variant="secondary" className="mt-1">
                                {patient.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {patient.progress !== undefined && (
                            <div className="flex items-center gap-1 text-sm font-medium text-primary">
                              <TrendingUp className="h-4 w-4" />
                              {patient.progress}%
                            </div>
                          )}
                        </div>
                      </div>

                      {patient.progress !== undefined && (
                        <div className="mt-4">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                              style={{ width: `${patient.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" asChild>
                          <Link to={`/dashboard/voluntario/pacientes/${patient.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Prontuario
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/dashboard/voluntario/mensagens?caseId=${patient.caseId || patient.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Mensagem
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/dashboard/voluntario/agenda/novo?patientId=${patient.id}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty variant="subtle" className="py-12">
                  <EmptyMedia variant="primary">
                    <Users className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>
                    {searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente atribuido"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {searchTerm
                      ? "Tente buscar com outros termos"
                      : "Seus pacientes aparecerao aqui quando forem atribuidos a voce"}
                  </EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
