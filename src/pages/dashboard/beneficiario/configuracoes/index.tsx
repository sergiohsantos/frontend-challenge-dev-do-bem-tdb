import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Bell, Mail, Shield, Loader2, Save, Settings } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"

interface BeneficiarySettingsApi {
  notifications?: {
    email?: boolean
    sms?: boolean
    push?: boolean
    appointmentReminders?: boolean
    messageAlerts?: boolean
    updates?: boolean
  }
  privacy?: {
    shareProgress?: boolean
    allowContact?: boolean
  }
}

interface BeneficiarySettingsForm {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  appointmentReminders: boolean
  messageAlerts: boolean
  treatmentUpdates: boolean
  shareProgress: boolean
  allowContact: boolean
}

const defaultSettings: BeneficiarySettingsForm = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  appointmentReminders: true,
  messageAlerts: true,
  treatmentUpdates: true,
  shareProgress: false,
  allowContact: true,
}

function mapApiToForm(data?: BeneficiarySettingsApi | null): BeneficiarySettingsForm {
  return {
    emailNotifications: data?.notifications?.email ?? defaultSettings.emailNotifications,
    smsNotifications: data?.notifications?.sms ?? defaultSettings.smsNotifications,
    pushNotifications: data?.notifications?.push ?? defaultSettings.pushNotifications,
    appointmentReminders: data?.notifications?.appointmentReminders ?? defaultSettings.appointmentReminders,
    messageAlerts: data?.notifications?.messageAlerts ?? defaultSettings.messageAlerts,
    treatmentUpdates: data?.notifications?.updates ?? defaultSettings.treatmentUpdates,
    shareProgress: data?.privacy?.shareProgress ?? defaultSettings.shareProgress,
    allowContact: data?.privacy?.allowContact ?? defaultSettings.allowContact,
  }
}

function mapFormToApi(data: BeneficiarySettingsForm): BeneficiarySettingsApi {
  return {
    notifications: {
      email: data.emailNotifications,
      sms: data.smsNotifications,
      push: data.pushNotifications,
      appointmentReminders: data.appointmentReminders,
      messageAlerts: data.messageAlerts,
      updates: data.treatmentUpdates,
    },
    privacy: {
      shareProgress: data.shareProgress,
      allowContact: data.allowContact,
    },
  }
}

export default function BeneficiarioConfiguracoesPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<BeneficiarySettingsForm>(defaultSettings)
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

        const data = await apiFetch<BeneficiarySettingsApi>("/api/beneficiaries/me/settings", {}, token)
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

      const payload = mapFormToApi(settings)
      await apiFetch("/api/beneficiaries/me/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      }, token)

      setSuccess("Configurações salvas com sucesso.")
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError("Não foi possível salvar suas configurações agora.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof BeneficiarySettingsForm) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const enabledNotifications = [
    settings.emailNotifications,
    settings.smsNotifications,
    settings.pushNotifications,
    settings.appointmentReminders,
    settings.messageAlerts,
    settings.treatmentUpdates,
  ].filter(Boolean).length

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
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
      <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <BeneficiaryPageHero
            eyebrow="Configurações"
            title="Ajuste como a plataforma acompanha você."
            description="Defina preferências de comunicação, lembretes, atualizações do tratamento e privacidade sem alterar regras do atendimento."
            icon={<Settings className="h-4 w-4" aria-hidden="true" />}
            primaryAction={(
              <Button size="lg" onClick={handleSave} disabled={isSaving} className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                Salvar configurações
              </Button>
            )}
            meta={(
              <>
                <span>{enabledNotifications} alerta(s) ativos</span>
                <span>{settings.allowContact ? "Contato permitido" : "Contato restrito"}</span>
              </>
            )}
          />

          <div className="mx-auto max-w-5xl">
            {error ? <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" /> : null}
            {success ? <AlertBanner type="success" title="Sucesso" message={success} dismissible onDismiss={() => setSuccess(null)} className="mb-6" /> : null}

            <div className="space-y-6">
              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl font-black"><Bell className="h-6 w-6 text-primary" />Notificações</CardTitle>
                  <CardDescription>Configure como deseja receber avisos e atualizações.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    ["emailNotifications", "Notificações por e-mail", "Receba avisos importantes por e-mail"],
                    ["smsNotifications", "Notificações por SMS", "Receba avisos urgentes por SMS"],
                    ["pushNotifications", "Notificações push", "Receba lembretes e alertas no navegador"],
                    ["appointmentReminders", "Lembretes de consultas", "Receba alertas sobre consultas agendadas"],
                    ["messageAlerts", "Alertas de mensagens", "Seja avisado quando houver novas mensagens"],
                    ["treatmentUpdates", "Atualizações do tratamento", "Receba mudanças de status do seu caso"],
                  ].map(([key, title, description]) => (
                    <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor={key} className="font-black text-foreground">{title}</Label>
                        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                      </div>
                      <Switch id={key} checked={settings[key as keyof BeneficiarySettingsForm] as boolean} onCheckedChange={() => handleToggle(key as keyof BeneficiarySettingsForm)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black"><Shield className="h-5 w-5 text-primary" />Privacidade</CardTitle>
                  <CardDescription>Gerencie preferências de compartilhamento e contato.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="shareProgress" className="font-black text-foreground">Compartilhar progresso</Label>
                      <p className="text-sm leading-6 text-muted-foreground">Autoriza o compartilhamento do progresso para fins de acompanhamento.</p>
                    </div>
                    <Switch id="shareProgress" checked={settings.shareProgress} onCheckedChange={() => handleToggle("shareProgress")} />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowContact" className="font-black text-foreground">Permitir contato</Label>
                      <p className="text-sm leading-6 text-muted-foreground">Permite contato da equipe pelos canais cadastrados.</p>
                    </div>
                    <Switch id="allowContact" checked={settings.allowContact} onCheckedChange={() => handleToggle("allowContact")} />
                  </div>
                </CardContent>
              </Card>

              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black"><Mail className="h-5 w-5 text-primary" />Comunicação</CardTitle>
                  <CardDescription>As preferências são salvas no seu perfil e usadas nas próximas interações.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">Caso tenha dúvidas sobre mensagens ou privacidade, fale com a equipe pelo módulo de mensagens.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}
