import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { VolunteerPageHero } from "@/components/dashboard/volunteer-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Bell, Mail, Shield, Loader2, Save, Settings, CalendarCheck2 } from "lucide-react"
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

const notificationOptions: Array<[keyof VolunteerSettingsForm, string, string]> = [
  ["emailNotifications", "Notificações por e-mail", "Receba atualizações importantes por e-mail."],
  ["smsNotifications", "Notificações por SMS", "Receba avisos urgentes por SMS."],
  ["pushNotifications", "Notificações push", "Seja avisado diretamente no navegador."],
  ["appointmentReminders", "Lembretes de agenda", "Receba alertas sobre consultas e horários."],
  ["newPatientAlerts", "Novos pacientes", "Seja notificado quando um caso for atribuído a você."],
  ["approvalUpdates", "Atualizações de aprovações", "Receba avisos sobre suas solicitações de procedimento."],
  ["systemUpdates", "Atualizações do sistema", "Receba comunicados sobre novidades e manutenção."],
]

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
      } catch {
        setError("Não foi possível carregar suas configurações agora. Tente novamente em instantes.")
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

      await apiFetch("/api/volunteers/me/settings", { method: "PUT", body: JSON.stringify(mapFormToApi(settings)) }, token)
      setSuccess("Configurações salvas com sucesso.")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Não foi possível salvar suas configurações agora.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof VolunteerSettingsForm) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const enabledNotifications = notificationOptions.filter(([key]) => settings[key]).length

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8"><div className="container mx-auto px-4"><DashboardSkeleton /></div></main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={user?.full_name || "Voluntário"} userType="voluntario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <VolunteerPageHero
            eyebrow="Configurações"
            title="Ajuste como a plataforma acompanha sua rotina."
            description="Defina preferências de comunicação, lembretes e comportamento da agenda sem alterar regras do atendimento."
            icon={<Settings className="h-4 w-4" aria-hidden="true" />}
            primaryAction={(
              <Button size="lg" onClick={handleSave} disabled={isSaving} className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Salvar configurações
              </Button>
            )}
            meta={(
              <>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">{enabledNotifications} alerta(s) ativos</span>
                <span className="rounded-full bg-primary-foreground/10 px-3 py-1 font-semibold">Agenda {settings.autoConfirm ? "com" : "sem"} confirmação automática</span>
              </>
            )}
          />

          <div className="mx-auto max-w-5xl">
            {error ? <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" /> : null}
            {success ? <AlertBanner type="success" title="Sucesso" message={success} dismissible onDismiss={() => setSuccess(null)} className="mb-6" /> : null}

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl font-black"><Bell className="h-6 w-6 text-primary" />Notificações</CardTitle>
                  <CardDescription>Controle os alertas enviados para seu perfil.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notificationOptions.map(([key, title, description]) => (
                    <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor={key} className="font-black text-foreground">{title}</Label>
                        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                      </div>
                      <Switch id={key} checked={settings[key] as boolean} onCheckedChange={() => handleToggle(key)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-black"><CalendarCheck2 className="h-5 w-5 text-primary" />Agenda e preferências</CardTitle>
                    <CardDescription>Defina comportamentos básicos do fluxo de agenda.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoConfirm" className="font-black text-foreground">Confirmação automática</Label>
                        <p className="text-sm leading-6 text-muted-foreground">Quando ativado, simplifica a confirmação do seu lado para novos agendamentos.</p>
                      </div>
                      <Switch id="autoConfirm" checked={settings.autoConfirm} onCheckedChange={() => handleToggle("autoConfirm")} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-black"><Mail className="h-5 w-5 text-primary" />Comunicação</CardTitle>
                    <CardDescription>Preferências usadas nas próximas interações.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                    <p>Use mensagens e notificações para acompanhar casos, pacientes e aprovações em andamento.</p>
                    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4"><Shield className="mb-2 h-5 w-5 text-primary" /><p>As configurações respeitam os canais disponíveis no backend atual e não criam integrações novas.</p></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
