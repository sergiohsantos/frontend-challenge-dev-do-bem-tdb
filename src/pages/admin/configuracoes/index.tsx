"use client"

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Loader2, Save, Bell, Mail, Shield, Globe, User } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { getStoredProfile, mergeProfile, saveStoredProfile, type ManagedProfileData } from "@/lib/profile-storage"
import { toast } from "sonner"

interface AdminProfile {
  id: number
  nome?: string
  email?: string
  role?: string
}

interface AdminSettingsState {
  notifications: {
    emailAlerts: boolean
    approvalAlerts: boolean
    systemAlerts: boolean
    dailyDigest: boolean
    weeklyReport: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    ipWhitelist: boolean
  }
  system: {
    maintenanceMode: boolean
    debugMode: boolean
    language: string
    timezone: string
    siteName: string
    siteDescription: string
    supportPhone: string
  }
}

const defaultSettings: AdminSettingsState = {
  notifications: {
    emailAlerts: true,
    approvalAlerts: true,
    systemAlerts: true,
    dailyDigest: false,
    weeklyReport: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    ipWhitelist: false,
  },
  system: {
    maintenanceMode: false,
    debugMode: false,
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    siteName: "Turma do Bem",
    siteDescription: "",
    supportPhone: "",
  },
}

function normalizeAdminSettings(raw: Record<string, unknown> | null | undefined): AdminSettingsState {
  if (!raw) return defaultSettings
  return {
    notifications: {
      ...defaultSettings.notifications,
      ...(typeof raw.notifications === "object" && raw.notifications ? raw.notifications as Record<string, boolean> : {}),
      emailAlerts: Boolean((raw.notifications as Record<string, unknown> | undefined)?.emailAlerts ?? raw.email_notifications ?? defaultSettings.notifications.emailAlerts),
      approvalAlerts: Boolean((raw.notifications as Record<string, unknown> | undefined)?.approvalAlerts ?? defaultSettings.notifications.approvalAlerts),
      systemAlerts: Boolean((raw.notifications as Record<string, unknown> | undefined)?.systemAlerts ?? defaultSettings.notifications.systemAlerts),
      dailyDigest: Boolean((raw.notifications as Record<string, unknown> | undefined)?.dailyDigest ?? defaultSettings.notifications.dailyDigest),
      weeklyReport: Boolean((raw.notifications as Record<string, unknown> | undefined)?.weeklyReport ?? defaultSettings.notifications.weeklyReport),
    },
    security: {
      ...defaultSettings.security,
      ...(typeof raw.security === "object" && raw.security ? raw.security as Record<string, boolean | number> : {}),
      twoFactorEnabled: Boolean((raw.security as Record<string, unknown> | undefined)?.twoFactorEnabled ?? defaultSettings.security.twoFactorEnabled),
      sessionTimeout: Number((raw.security as Record<string, unknown> | undefined)?.sessionTimeout ?? defaultSettings.security.sessionTimeout),
      ipWhitelist: Boolean((raw.security as Record<string, unknown> | undefined)?.ipWhitelist ?? defaultSettings.security.ipWhitelist),
    },
    system: {
      ...defaultSettings.system,
      ...(typeof raw.system === "object" && raw.system ? raw.system as Record<string, string | boolean> : {}),
      maintenanceMode: Boolean((raw.system as Record<string, unknown> | undefined)?.maintenanceMode ?? raw.maintenance_mode ?? defaultSettings.system.maintenanceMode),
      debugMode: Boolean((raw.system as Record<string, unknown> | undefined)?.debugMode ?? defaultSettings.system.debugMode),
      language: String((raw.system as Record<string, unknown> | undefined)?.language ?? defaultSettings.system.language),
      timezone: String((raw.system as Record<string, unknown> | undefined)?.timezone ?? defaultSettings.system.timezone),
      siteName: String(raw.site_name ?? (raw.system as Record<string, unknown> | undefined)?.siteName ?? defaultSettings.system.siteName),
      siteDescription: String(raw.site_description ?? (raw.system as Record<string, unknown> | undefined)?.siteDescription ?? defaultSettings.system.siteDescription),
      supportPhone: String(raw.support_phone ?? (raw.system as Record<string, unknown> | undefined)?.supportPhone ?? defaultSettings.system.supportPhone),
    },
  }
}

export default function AdminConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [settings, setSettings] = useState<AdminSettingsState>(defaultSettings)
  const [profile, setProfile] = useState<ManagedProfileData>({})
  const user = getUser()

  useEffect(() => {
    void fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const token = getToken()
      const [rawSettings, rawProfile] = await Promise.all([
        apiFetch<Record<string, unknown>>("/api/admin/settings", {}, token),
        apiFetch<AdminProfile>("/api/admin/profile", {}, token),
      ])
      setSettings(normalizeAdminSettings(rawSettings))
      const stored = getStoredProfile("admin", user?.id)
      const mergedProfile = mergeProfile({
        nome: rawProfile.nome || user?.full_name || "",
        email: rawProfile.email || user?.email || "",
        role: rawProfile.role || user?.role || "admin",
      }, stored)
      setProfile(mergedProfile)
    } catch (error) {
      console.error("Erro ao carregar configuracoes:", error)
      const stored = getStoredProfile("admin", user?.id)
      setProfile({
        nome: stored?.nome || user?.full_name || "Administrador",
        email: stored?.email || user?.email || "admin@turmadobem.org.br",
        role: stored?.role || user?.role || "admin",
      })
      toast.error("Erro ao carregar configuracoes")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSettings() {
    setSaving(true)
    try {
      const token = getToken()
      const payload = {
        notifications: settings.notifications,
        security: settings.security,
        system: {
          maintenanceMode: settings.system.maintenanceMode,
          debugMode: settings.system.debugMode,
          language: settings.system.language,
          timezone: settings.system.timezone,
        },
        site_name: settings.system.siteName,
        site_description: settings.system.siteDescription,
        support_phone: settings.system.supportPhone,
      }
      await apiFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      }, token)
      toast.success("Configurações salvas com sucesso")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar configurações")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    try {
      setProfileSaving(true)
      saveStoredProfile("admin", profile, user?.id)
      toast.success("Perfil do admin atualizado")
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast.error("Erro ao salvar perfil")
    } finally {
      setProfileSaving(false)
    }
  }

  function updateSystem<K extends keyof AdminSettingsState["system"]>(key: K, value: AdminSettingsState["system"][K]) {
    setSettings((prev) => ({ ...prev, system: { ...prev.system, [key]: value } }))
  }

  function updateNotifications<K extends keyof AdminSettingsState["notifications"]>(key: K, value: AdminSettingsState["notifications"][K]) {
    setSettings((prev) => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }))
  }

  function updateSecurity<K extends keyof AdminSettingsState["security"]>(key: K, value: AdminSettingsState["security"][K]) {
    setSettings((prev) => ({ ...prev, security: { ...prev.security, [key]: value } }))
  }

  function updateProfile<K extends keyof ManagedProfileData>(key: K, value: ManagedProfileData[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1">
          <AdminHeader />
          <main className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">Configurações</h1>
              <p className="text-sm text-muted-foreground">Gerencie o perfil do admin e as configurações do sistema</p>
            </div>
            <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar alterações
            </Button>
          </div>

          <Tabs defaultValue="perfil" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="perfil" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="geral" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Geral</span>
              </TabsTrigger>
              <TabsTrigger value="notificacoes" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Perfil do administrador</CardTitle>
                  <CardDescription>Atualize os dados do usuário logado. As alterações ficam persistidas no frontend atual.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-nome">Nome</Label><Input id="admin-nome" value={profile.nome || ""} onChange={(e) => updateProfile("nome", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="admin-email">E-mail</Label><Input id="admin-email" type="email" value={profile.email || ""} onChange={(e) => updateProfile("email", e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="admin-role">Perfil</Label><Input id="admin-role" value={profile.role || "admin"} onChange={(e) => updateProfile("role", e.target.value)} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label htmlFor="admin-observacoes">Observações</Label><Textarea id="admin-observacoes" rows={4} value={profile.observacoes || ""} onChange={(e) => updateProfile("observacoes", e.target.value)} /></div>
                  <div className="sm:col-span-2">
                    <Button onClick={() => void handleSaveProfile()} disabled={profileSaving} className="gap-2">
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geral">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Configurações gerais</CardTitle>
                  <CardDescription>Informações básicas e preferências do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="site_name">Nome do site</Label>
                      <Input id="site_name" value={settings.system.siteName} onChange={(e) => updateSystem("siteName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="support_phone">Telefone de suporte</Label>
                      <Input id="support_phone" value={settings.system.supportPhone} onChange={(e) => updateSystem("supportPhone", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_description">Descrição do site</Label>
                    <Textarea id="site_description" value={settings.system.siteDescription} onChange={(e) => updateSystem("siteDescription", e.target.value)} rows={4} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma padrão</Label>
                      <Input id="language" value={settings.system.language} onChange={(e) => updateSystem("language", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" value={settings.system.timezone} onChange={(e) => updateSystem("timezone", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Modo de manutenção</p>
                      <p className="text-sm text-muted-foreground">Quando ativado, o sistema pode operar em modo restrito.</p>
                    </div>
                    <Switch checked={settings.system.maintenanceMode} onCheckedChange={(checked) => updateSystem("maintenanceMode", checked)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Modo debug</p>
                      <p className="text-sm text-muted-foreground">Use apenas para diagnóstico.</p>
                    </div>
                    <Switch checked={settings.system.debugMode} onCheckedChange={(checked) => updateSystem("debugMode", checked)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notificacoes">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de notificações</CardTitle>
                  <CardDescription>Gerencie como os alertas administrativos são enviados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {([
                    ["emailAlerts", "Alertas por e-mail", "Receba avisos administrativos no e-mail"],
                    ["approvalAlerts", "Aprovações", "Receba alertas sempre que houver novas aprovações"],
                    ["systemAlerts", "Eventos do sistema", "Notificações sobre mudanças e incidentes"],
                    ["dailyDigest", "Resumo diário", "Consolida notificações importantes do dia"],
                    ["weeklyReport", "Relatório semanal", "Resumo semanal para acompanhamento gerencial"],
                  ] as Array<[keyof AdminSettingsState["notifications"], string, string]>).map(([key, title, description]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                      <Switch checked={settings.notifications[key]} onCheckedChange={(checked) => updateNotifications(key, checked)} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seguranca">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Segurança</CardTitle>
                  <CardDescription>Gerencie as configurações de segurança do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Autenticação em dois fatores</p>
                      <p className="text-sm text-muted-foreground">Ativa proteção adicional para logins administrativos.</p>
                    </div>
                    <Switch checked={settings.security.twoFactorEnabled} onCheckedChange={(checked) => updateSecurity("twoFactorEnabled", checked)} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Whitelist de IP</p>
                      <p className="text-sm text-muted-foreground">Limita o acesso administrativo a endereços aprovados.</p>
                    </div>
                    <Switch checked={settings.security.ipWhitelist} onCheckedChange={(checked) => updateSecurity("ipWhitelist", checked)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Timeout de sessão (minutos)</Label>
                    <Input id="session-timeout" type="number" min={5} max={480} value={settings.security.sessionTimeout} onChange={(e) => updateSecurity("sessionTimeout", Number(e.target.value || 30))} />
                  </div>
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    As configurações de e-mail e integrações avançadas continuam sendo gerenciadas pelo servidor quando disponíveis.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
