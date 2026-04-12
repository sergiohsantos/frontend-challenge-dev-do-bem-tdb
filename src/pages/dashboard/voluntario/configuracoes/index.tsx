import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { ArrowLeft, Bell, Mail, Shield, Loader2, Save } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface VolunteerSettingsApi {
  notifications?: {
    email?: boolean
    sms?: boolean
    push?: boolean
    appointmentReminders?: boolean
    newPatientAlerts?: boolean
    approvalUpdates?: boolean
    systemUpdates?: boolean
  }
  calendar?: {
    autoConfirm?: boolean
    reminderHours?: number
  }
}

interface VolunteerSettingsForm {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  appointmentReminders: boolean
  newPatientAlerts: boolean
  approvalUpdates: boolean
  systemUpdates: boolean
  autoConfirm: boolean
}

const defaultSettings: VolunteerSettingsForm = {
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  appointmentReminders: true,
  newPatientAlerts: true,
  approvalUpdates: true,
  systemUpdates: false,
  autoConfirm: false,
}

function mapApiToForm(data?: VolunteerSettingsApi | null): VolunteerSettingsForm {
  return {
    emailNotifications: data?.notifications?.email ?? defaultSettings.emailNotifications,
    smsNotifications: data?.notifications?.sms ?? defaultSettings.smsNotifications,
    pushNotifications: data?.notifications?.push ?? defaultSettings.pushNotifications,
    appointmentReminders: data?.notifications?.appointmentReminders ?? defaultSettings.appointmentReminders,
    newPatientAlerts: data?.notifications?.newPatientAlerts ?? defaultSettings.newPatientAlerts,
    approvalUpdates: data?.notifications?.approvalUpdates ?? defaultSettings.approvalUpdates,
    systemUpdates: data?.notifications?.systemUpdates ?? defaultSettings.systemUpdates,
    autoConfirm: data?.calendar?.autoConfirm ?? defaultSettings.autoConfirm,
  }
}

function mapFormToApi(data: VolunteerSettingsForm): VolunteerSettingsApi {
  return {
    notifications: {
      email: data.emailNotifications,
      sms: data.smsNotifications,
      push: data.pushNotifications,
      appointmentReminders: data.appointmentReminders,
      newPatientAlerts: data.newPatientAlerts,
      approvalUpdates: data.approvalUpdates,
      systemUpdates: data.systemUpdates,
    },
    calendar: {
      autoConfirm: data.autoConfirm,
      reminderHours: 24,
    },
  }
}

export default function VoluntarioConfiguracoesPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<VolunteerSettingsForm>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const user = getUser()

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = getToken()
        if (!token) {
          navigate("/login")
          return
        }

        const data = await apiFetch<VolunteerSettingsApi>("/api/volunteers/me/settings", {}, token)
        setSettings(mapApiToForm(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar configurações")
      } finally {
        setIsLoading(false)
      }
    }

    void loadSettings()
  }, [navigate])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const token = getToken()
      if (!token) return

      await apiFetch("/api/volunteers/me/settings", {
        method: "PUT",
        body: JSON.stringify(mapFormToApi(settings)),
      }, token)

      setSuccess("Configurações salvas com sucesso!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar configurações")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof VolunteerSettingsForm) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/voluntario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>

          {error ? <AlertBanner type="error" title="Erro" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" /> : null}
          {success ? <AlertBanner type="success" title="Sucesso" message={success} dismissible onDismiss={() => setSuccess(null)} className="mb-6" /> : null}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notificações</CardTitle>
                <CardDescription>Controle os alertas enviados para seu perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  ["emailNotifications", "Notificações por e-mail", "Receba atualizações importantes por e-mail"],
                  ["smsNotifications", "Notificações por SMS", "Receba avisos urgentes por SMS"],
                  ["pushNotifications", "Notificações push", "Seja avisado diretamente no navegador"],
                  ["appointmentReminders", "Lembretes de agenda", "Receba alertas sobre consultas e horários"],
                  ["newPatientAlerts", "Novos pacientes", "Seja notificado quando um caso for atribuído a você"],
                  ["approvalUpdates", "Atualizações de aprovações", "Receba avisos sobre suas solicitações de procedimento"],
                  ["systemUpdates", "Atualizações do sistema", "Receba comunicados sobre novidades e manutenção"],
                ].map(([key, title, description]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={key}>{title}</Label>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch id={key} checked={settings[key as keyof VolunteerSettingsForm] as boolean} onCheckedChange={() => handleToggle(key as keyof VolunteerSettingsForm)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Agenda e preferências</CardTitle>
                <CardDescription>Defina comportamentos básicos do seu fluxo de agenda.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoConfirm">Confirmação automática</Label>
                    <p className="text-sm text-muted-foreground">Quando ativado, simplifica a confirmação do seu lado para novos agendamentos.</p>
                  </div>
                  <Switch id="autoConfirm" checked={settings.autoConfirm} onCheckedChange={() => handleToggle("autoConfirm")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Comunicação</CardTitle>
                <CardDescription>Suas preferências são usadas pela plataforma nas próximas interações.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Use o módulo de mensagens e notificações para acompanhar casos, pacientes e aprovações em andamento.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
