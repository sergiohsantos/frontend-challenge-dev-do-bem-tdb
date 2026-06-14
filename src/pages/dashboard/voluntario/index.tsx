import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLoader, DashboardSkeleton } from "@/components/ui/page-loader"
import { StatCard, StatGrid, HighlightStat } from "@/components/ui/stat-card"
import { AlertBanner } from "@/components/ui/alert-banner"
import { PageHeader, SectionHeader, TwoColumnLayout, PageContainer } from "@/components/ui/page-section"
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle2,
  Award,
  Heart,
  ArrowRight,
  Smile,
  User as UserIcon,
  AlertCircle,
  FileText,
  FilePlus,
  Phone,
  Sparkles,
  CalendarPlus,
  TrendingUp
} from "lucide-react"
import { apiFetch, type VolunteerDashboard } from "@/lib/api"
import { getToken } from "@/lib/auth"

export default function VoluntarioDashboardPage() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<VolunteerDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login")
          return
        }
        
        const data = await apiFetch<VolunteerDashboard>("/api/volunteers/me/dashboard", {}, token)
        setDashboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboard()
  }, [navigate])

  const volunteerData = dashboardData

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName="..." userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <PageContainer>
            <DashboardSkeleton />
          </PageContainer>
        </main>
      </div>
    )
  }

  const firstName = (volunteerData?.name || "Voluntário").split(" ").slice(-1)[0]
  const hasUpcomingAppointments = (volunteerData?.upcomingAppointments || []).length > 0
  const hasActivePatients = (volunteerData?.activePatients || []).length > 0
  const hasMessages = (volunteerData?.recentMessages || []).length > 0
  const nextAppointment = volunteerData?.upcomingAppointments?.[0]
  const pendingApprovals = volunteerData?.stats?.pendingApprovals || 0
  const impactValue = volunteerData?.impact?.beneficiariesImpacted
    ?? volunteerData?.stats?.beneficiariesImpacted
    ?? volunteerData?.stats?.impactedBeneficiaries
    ?? volunteerData?.stats?.completedTreatments
    ?? 0
  const nextAction = hasUpcomingAppointments
    ? {
        title: "Ver agenda",
        description: nextAppointment
          ? `Você tem uma consulta próxima com ${nextAppointment.patientName || "um paciente"}.`
          : "Você tem uma consulta próxima para acompanhar.",
        href: "/dashboard/voluntario/agenda",
        icon: Calendar,
      }
    : hasActivePatients
      ? {
          title: "Ver pacientes",
          description: "Revise seus pacientes ativos e acompanhe o progresso dos tratamentos.",
          href: "/dashboard/voluntario/pacientes",
          icon: Users,
        }
      : {
          title: "Atualizar disponibilidade",
          description: "Mantenha sua disponibilidade atualizada para receber novos encaminhamentos.",
          href: "/dashboard/voluntario/disponibilidade",
          icon: Clock,
        }
  const NextActionIcon = nextAction.icon
  const routineItems = [
    {
      title: nextAppointment ? "Próxima consulta" : "Agenda",
      description: nextAppointment
        ? `${nextAppointment.patientName || "Paciente"} - ${nextAppointment.date || "-"} às ${nextAppointment.time || "-"}`
        : "Nenhuma consulta próxima no momento.",
      href: "/dashboard/voluntario/agenda",
      icon: Calendar,
      active: hasUpcomingAppointments,
    },
    {
      title: "Pacientes ativos",
      description: hasActivePatients
        ? `${volunteerData?.stats?.activePatients || volunteerData?.activePatients?.length || 0} paciente(s) em acompanhamento.`
        : "Seus pacientes em tratamento aparecerão aqui.",
      href: "/dashboard/voluntario/pacientes",
      icon: Users,
      active: hasActivePatients,
    },
    {
      title: "Mensagens recentes",
      description: hasMessages ? "Há conversas recentes para acompanhar." : "Nenhuma mensagem recente.",
      href: "/dashboard/voluntario/mensagens",
      icon: MessageSquare,
      active: hasMessages,
    },
    {
      title: pendingApprovals > 0 ? "Solicitações pendentes" : "Nova solicitação",
      description: pendingApprovals > 0
        ? `${pendingApprovals} solicitação(ões) aguardando andamento.`
        : "Crie uma nova solicitação de procedimento quando necessário.",
      href: pendingApprovals > 0 ? "/dashboard/voluntario/solicitacoes" : "/dashboard/voluntario/solicitacoes/nova",
      icon: FilePlus,
      active: pendingApprovals > 0,
    },
    {
      title: "Disponibilidade",
      description: "Mantenha seus horários disponíveis sempre atualizados.",
      href: "/dashboard/voluntario/disponibilidade",
      icon: Clock,
      active: true,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={volunteerData?.name || "Voluntário"} userType="voluntario" notificationCount={0} />
      
      <main className="flex-1 py-6 lg:py-8">
        <PageContainer>
          {/* Error alert */}
          {error && (
            <AlertBanner
              type="error"
              title="Erro ao carregar dados"
              message={error}
              dismissible
              className="mb-6"
            />
          )}
          
          {/* Welcome Section with gradient */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                    <Sparkles className="h-7 w-7 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                      Olá, {firstName}!
                    </h1>
                    <p className="text-muted-foreground">
                      {volunteerData?.specialty || "Profissional de Saúde"}
                      {volunteerData?.cro ? ` • ${volunteerData.cro}` : ""}
                      {volunteerData?.crp ? ` • ${volunteerData.crp}` : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/dashboard/voluntario/solicitacoes/nova">
                    <FilePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Nova Solicitação
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dashboard/voluntario/agenda/novo">
                    <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Agendar Consulta
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <StatGrid columns={5} className="mb-8">
            <StatCard
              title="Pacientes Ativos"
              value={volunteerData?.stats?.activePatients || 0}
              icon={<Users />}
              variant="primary"
            />
            <StatCard
              title="Tratamentos Concluídos"
              value={volunteerData?.stats?.completedTreatments || 0}
              icon={<Smile />}
              variant="success"
              trend={volunteerData?.stats?.completedTreatments ? {
                value: 12,
                direction: "up",
                label: "vs. mês anterior"
              } : undefined}
            />
            <StatCard
              title="Consultas Este Mês"
              value={volunteerData?.stats?.monthlyAppointments || 0}
              icon={<Calendar />}
              variant="accent"
            />
            <StatCard
              title="Total de Pacientes"
              value={volunteerData?.stats?.totalPatients || 0}
              icon={<Award />}
              variant="warning"
            />
            <StatCard
              title="Procedimentos Pendentes"
              value={volunteerData?.stats?.pendingApprovals || 0}
              subtitle={`${volunteerData?.stats?.approvedProcedures || 0} aprovado(s)`}
              icon={<FilePlus />}
              variant="primary"
            />
          </StatGrid>

          <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <NextActionIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  Próxima ação recomendada
                </CardTitle>
                <CardDescription>{nextAction.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link to={nextAction.href}>
                      {nextAction.title}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard/voluntario/solicitacoes/nova">
                      <FilePlus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Nova solicitação
                    </Link>
                  </Button>
                  {hasMessages && (
                    <Button variant="ghost" asChild>
                      <Link to="/dashboard/voluntario/mensagens">
                        <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                        Mensagens
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  Minha rotina de hoje
                </CardTitle>
                <CardDescription>Ações úteis para acompanhar seus atendimentos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {routineItems.map((item) => {
                  const RoutineIcon = item.icon
                  return (
                    <Link
                      key={item.title}
                      to={item.href}
                      className="flex items-start gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <RoutineIcon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Grid */}
          <TwoColumnLayout
            main={
              <>
                {/* Upcoming Appointments */}
                <Card>
                  <CardHeader className="pb-4">
                    <SectionHeader
                      title="Próximas Consultas"
                      description={hasUpcomingAppointments ? "Suas consultas agendadas" : undefined}
                      icon={<Calendar className="h-5 w-5" />}
                      action={{ label: "Ver agenda", href: "/dashboard/voluntario/agenda" }}
                    />
                  </CardHeader>
                  <CardContent>
                    {hasUpcomingAppointments ? (
                      <div className="space-y-3">
                        {volunteerData?.upcomingAppointments?.slice(0, 4).map((apt) => (
                          <div 
                            key={apt.id}
                            className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-bold text-primary">
                                {apt.patientName?.charAt(0) || "P"}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{apt.patientName || "Paciente"}</p>
                                <p className="text-sm text-muted-foreground">{apt.type || "Consulta"}</p>
                                <div className="mt-1.5 flex items-center gap-2 text-sm">
                                  <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" aria-hidden="true" />
                                    {apt.date} • {apt.time}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            {apt.patientId && (
                              <Button size="sm" variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                <Link to={`/dashboard/voluntario/pacientes/${apt.patientId}`}>
                                  Ver detalhes
                                  <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty variant="subtle" className="py-8">
                        <EmptyMedia variant="primary">
                          <Calendar className="h-7 w-7" />
                        </EmptyMedia>
                        <EmptyTitle>Nenhuma consulta agendada</EmptyTitle>
                        <EmptyDescription>
                          Agende uma nova consulta para seus pacientes
                        </EmptyDescription>
                        <Button size="sm" asChild>
                          <Link to="/dashboard/voluntario/agenda/novo">
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            Agendar consulta
                          </Link>
                        </Button>
                      </Empty>
                    )}
                  </CardContent>
                </Card>

                {/* Active Patients */}
                <Card>
                  <CardHeader className="pb-4">
                    <SectionHeader
                      title="Pacientes em Tratamento"
                      description={hasActivePatients ? "Acompanhe o progresso dos seus pacientes" : undefined}
                      icon={<Users className="h-5 w-5" />}
                      action={{ label: "Ver todos", href: "/dashboard/voluntario/pacientes" }}
                    />
                  </CardHeader>
                  <CardContent>
                    {hasActivePatients ? (
                      <div className="space-y-4">
                        {volunteerData?.activePatients?.slice(0, 3).map((patient) => (
                          <div 
                            key={patient.id}
                            className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-success/20 to-success/10 text-lg font-bold text-success">
                                  {patient.name?.charAt(0) || "P"}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground">{patient.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {patient.age ? `${patient.age} anos` : "Idade não informada"}
                                    {patient.treatment ? ` • ${patient.treatment}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                <TrendingUp className="h-4 w-4" />
                                {patient.progress || 0}% concluído
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-4">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                                  style={{ width: `${patient.progress || 0}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button size="sm" className="flex-1" asChild>
                                <Link to={`/dashboard/voluntario/pacientes/${patient.id}`}>
                                  <UserIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Ver prontuário
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" asChild>
                                <Link to={`/dashboard/voluntario/mensagens?caseId=${patient.caseId ?? patient.id}`}>
                                  <MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Mensagem
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty variant="subtle" className="py-8">
                        <EmptyMedia variant="icon">
                          <Users className="h-7 w-7" />
                        </EmptyMedia>
                        <EmptyTitle>Nenhum paciente ativo</EmptyTitle>
                        <EmptyDescription>
                          Seus pacientes em tratamento aparecerão aqui
                        </EmptyDescription>
                      </Empty>
                    )}
                  </CardContent>
                </Card>
              </>
            }
            sidebar={
              <>
                {/* Messages */}
                <Card>
                  <CardHeader className="pb-4">
                    <SectionHeader
                      title="Mensagens Recentes"
                      icon={<MessageSquare className="h-5 w-5" />}
                      action={{ label: "Ver todas", href: "/dashboard/voluntario/mensagens" }}
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hasMessages ? (
                      volunteerData?.recentMessages?.slice(0, 3).map((msg, index) => (
                        <div
                          key={msg.id ?? `msg-${index}`}
                          className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{msg.from || msg.sender}</p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{msg.date}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{msg.message || msg.content}</p>
                        </div>
                      ))
                    ) : (
                      <Empty variant="subtle" className="py-6">
                        <EmptyMedia variant="icon">
                          <MessageSquare className="h-6 w-6" />
                        </EmptyMedia>
                        <EmptyTitle className="text-base">Nenhuma mensagem</EmptyTitle>
                        <EmptyDescription>
                          Suas conversas aparecerão aqui
                        </EmptyDescription>
                      </Empty>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full justify-start gap-2 h-11" asChild>
                      <Link to="/dashboard/voluntario/solicitacoes/nova">
                        <FilePlus className="h-4 w-4" aria-hidden="true" />
                        Nova Solicitação de Procedimento
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
                      <Link to="/dashboard/voluntario/solicitacoes">
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Ver Solicitações
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
                      <Link to="/dashboard/voluntario/agenda/novo">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        Agendar consulta
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
                      <Link to="/dashboard/voluntario/pacientes">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        Gerenciar pacientes
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 h-11" asChild>
                      <Link to="/dashboard/voluntario/disponibilidade">
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        Atualizar disponibilidade
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Impact Card */}
                <HighlightStat
                  title="Seu Impacto"
                  value={impactValue}
                  description="beneficiários impactados"
                  icon={<Heart />}
                  variant="primary"
                />

                {/* Support */}
                <Card className="bg-gradient-to-br from-secondary/50 to-secondary/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
                        <Phone className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <h3 className="font-semibold text-foreground">Suporte ao Voluntário</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Dúvidas ou problemas?
                      </p>
                      <a 
                        href="tel:08007777766"
                        className="mt-2 inline-block text-lg font-bold text-primary hover:underline"
                      >
                        0800 777 7766
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </>
            }
          />
        </PageContainer>
      </main>

      <HelpButton />
    </div>
  )
}
