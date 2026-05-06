import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  User,
  ArrowLeft,
  Mail,
  Calendar,
  Heart,
  Shield,
  Save,
  Phone,
  MapPin,
  Pencil,
  X,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { saveStoredProfile, getStoredProfile, type ManagedProfileData } from "@/lib/profile-storage"
import { toast } from "sonner"

interface DashboardData {
  name?: string
  status?: string
  statusLabel?: string
  nextAppointment?: {
    specialty?: string
    doctor?: string
    date?: string
    time?: string
  }
}

interface SettingsData {
  notifications?: Record<string, boolean>
  privacy?: Record<string, boolean>
}

interface BeneficiaryProfile {
  id: number
  nome?: string
  fullName?: string
  email?: string
  telefone?: string
  phone?: string
  cidade?: string
  city?: string
  estado?: string
  uf?: string
  state?: string
  endereco?: string
  address?: string
  responsavel?: string
  guardianName?: string
  telefoneResponsavel?: string
  guardianPhone?: string
  observacoes?: string
  notes?: string
}

function humanizeBoolean(value?: boolean) {
  return value ? "Ativado" : "Desativado"
}

function buildBaseProfile(
  apiData: BeneficiaryProfile | null | undefined,
  stored: ManagedProfileData | null | undefined,
  dashboardData?: DashboardData | null,
  user?: { full_name?: string | null; email?: string | null } | null,
): ManagedProfileData {
  return {
    nome: apiData?.nome || apiData?.fullName || stored?.nome || dashboardData?.name || user?.full_name || "",
    email: apiData?.email || stored?.email || user?.email || "",
    telefone: apiData?.telefone || apiData?.phone || stored?.telefone || "",
    cidade: apiData?.cidade || apiData?.city || stored?.cidade || "",
    estado: apiData?.estado || apiData?.uf || apiData?.state || stored?.estado || "",
    endereco: apiData?.endereco || apiData?.address || stored?.endereco || "",
    responsavel: apiData?.responsavel || apiData?.guardianName || stored?.responsavel || "",
    telefoneResponsavel: apiData?.telefoneResponsavel || apiData?.guardianPhone || stored?.telefoneResponsavel || "",
    observacoes: apiData?.observacoes || apiData?.notes || stored?.observacoes || "",
  }
}

export default function BeneficiarioPerfilPage() {
  const navigate = useNavigate()
  const user = getUser()

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [profile, setProfile] = useState<ManagedProfileData>({})
  const [initialProfile, setInitialProfile] = useState<ManagedProfileData>({})

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const token = getToken()

        if (!token) {
          navigate("/login")
          return
        }

        const [dashboardData, settingsData, profileData] = await Promise.all([
          apiFetch<DashboardData>("/api/beneficiaries/me/dashboard", {}, token),
          apiFetch<SettingsData>("/api/beneficiaries/me/settings", {}, token),
          apiFetch<BeneficiaryProfile>("/api/beneficiaries/me/profile", {}, token).catch(() => null),
        ])

        setDashboard(dashboardData)
        setSettings(settingsData)

        const stored = getStoredProfile("beneficiario", user?.id)
        const baseProfile = buildBaseProfile(profileData, stored, dashboardData, user)

        setProfile(baseProfile)
        setInitialProfile(baseProfile)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar perfil")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [navigate, user?.email, user?.full_name, user?.id])

  const updateProfile = <K extends keyof ManagedProfileData>(
    key: K,
    value: ManagedProfileData[K],
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleCancelEdit = () => {
    setProfile(initialProfile)
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      saveStoredProfile("beneficiario", profile, user?.id)
      setInitialProfile(profile)
      setIsEditing(false)
      toast.success("Perfil do beneficiário atualizado")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader
          userName={user?.full_name || "Beneficiário"}
          userType="beneficiario"
          notificationCount={0}
        />
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
      <DashboardHeader
        userName={profile.nome || user?.full_name || "Beneficiário"}
        userType="beneficiario"
        notificationCount={0}
      />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/beneficiario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>

                  <Button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar perfil
                </Button>
              )}
            </div>
          </div>

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

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-10 w-10 text-primary" />
                  </div>

                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-foreground">
                      {profile.nome || user?.full_name || "Beneficiário"}
                    </h2>

                    <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                      {(dashboard?.statusLabel || dashboard?.status) && (
                        <Badge>{dashboard?.statusLabel || dashboard?.status}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Meus dados</CardTitle>
                  <CardDescription>
                    Visualize seus dados do perfil. Clique em "Editar perfil" para habilitar
                    alterações.
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="beneficiary-name">Nome completo</Label>
                    <Input
                      id="beneficiary-name"
                      value={profile.nome || ""}
                      onChange={(e) => updateProfile("nome", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiary-email">E-mail</Label>
                    <Input
                      id="beneficiary-email"
                      type="email"
                      value={profile.email || ""}
                      onChange={(e) => updateProfile("email", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiary-phone">Telefone</Label>
                    <Input
                      id="beneficiary-phone"
                      value={profile.telefone || ""}
                      onChange={(e) => updateProfile("telefone", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiary-city">Cidade</Label>
                    <Input
                      id="beneficiary-city"
                      value={profile.cidade || ""}
                      onChange={(e) => updateProfile("cidade", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="beneficiary-state">Estado</Label>
                    <Input
                      id="beneficiary-state"
                      value={profile.estado || ""}
                      onChange={(e) => updateProfile("estado", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="beneficiary-address">Endereço</Label>
                    <Input
                      id="beneficiary-address"
                      value={profile.endereco || ""}
                      onChange={(e) => updateProfile("endereco", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian-name">Responsável</Label>
                    <Input
                      id="guardian-name"
                      value={profile.responsavel || ""}
                      onChange={(e) => updateProfile("responsavel", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guardian-phone">Telefone do responsável</Label>
                    <Input
                      id="guardian-phone"
                      value={profile.telefoneResponsavel || ""}
                      onChange={(e) => updateProfile("telefoneResponsavel", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="beneficiary-notes">Observações do perfil</Label>
                    <Textarea
                      id="beneficiary-notes"
                      rows={4}
                      value={profile.observacoes || ""}
                      onChange={(e) => updateProfile("observacoes", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Informações rápidas
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.email || "E-mail não disponível nesta etapa"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.telefone || "Telefone não informado"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[profile.cidade, profile.estado].filter(Boolean).join(" - ") ||
                          "Localização não informada"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span>Preferências configuráveis na página de Configurações</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {dashboard?.nextAppointment
                          ? `Próxima consulta: ${dashboard.nextAppointment.date || "-"} às ${
                              dashboard.nextAppointment.time || "-"
                            }${
                              dashboard.nextAppointment.specialty
                                ? ` • ${dashboard.nextAppointment.specialty}`
                                : ""
                            }`
                          : "Sem próxima consulta cadastrada"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Preferências ativas
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Notificações</p>
                      <ul className="mt-2 space-y-1">
                        <li>E-mail: {humanizeBoolean(settings?.notifications?.email)}</li>
                        <li>SMS: {humanizeBoolean(settings?.notifications?.sms)}</li>
                        <li>Push: {humanizeBoolean(settings?.notifications?.push)}</li>
                        <li>
                          Lembretes de consulta:{" "}
                          {humanizeBoolean(settings?.notifications?.appointmentReminders)}
                        </li>
                        <li>
                          Alertas de mensagem:{" "}
                          {humanizeBoolean(settings?.notifications?.messageAlerts)}
                        </li>
                        <li>Atualizações do caso: {humanizeBoolean(settings?.notifications?.updates)}</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-foreground">Privacidade</p>
                      <ul className="mt-2 space-y-1">
                        <li>
                          Compartilhar progresso:{" "}
                          {humanizeBoolean(settings?.privacy?.shareProgress)}
                        </li>
                        <li>
                          Permitir contato: {humanizeBoolean(settings?.privacy?.allowContact)}
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
