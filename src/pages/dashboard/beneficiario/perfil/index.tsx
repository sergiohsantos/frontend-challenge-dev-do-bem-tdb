import { useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { BeneficiaryPageHero } from "@/components/dashboard/beneficiary-page-hero"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardSkeleton } from "@/components/ui/page-loader"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Mail, Calendar, Heart, Shield, Save, Phone, MapPin, Pencil, X } from "lucide-react"
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
      } catch {
        setError("Não foi possível carregar seu perfil agora. Tente novamente em instantes.")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [navigate, user?.email, user?.full_name, user?.id])

  const updateProfile = <K extends keyof ManagedProfileData>(key: K, value: ManagedProfileData[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  const handleCancelEdit = () => {
    setProfile(initialProfile)
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const token = getToken()
      if (!token) {
        navigate("/login")
        return
      }

      const savedProfile = await apiFetch<BeneficiaryProfile>("/api/beneficiaries/me/profile", {
        method: "PUT",
        body: JSON.stringify({
          nome: profile.nome,
          email: profile.email,
          telefone: profile.telefone,
          cidade: profile.cidade,
          estado: profile.estado,
          endereco: profile.endereco,
          responsavel: profile.responsavel,
          telefoneResponsavel: profile.telefoneResponsavel,
          observacoes: profile.observacoes,
        }),
      }, token)
      const updatedProfile = buildBaseProfile(savedProfile, profile, dashboard, user)
      saveStoredProfile("beneficiario", updatedProfile, user?.id)
      setProfile(updatedProfile)
      setInitialProfile(updatedProfile)
      setIsEditing(false)
      toast.success("Perfil do beneficiário atualizado")
    } catch {
      setError("Não foi possível salvar seu perfil agora.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardHeader userName={user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />
        <main className="flex-1 py-6 lg:py-8">
          <div className="container mx-auto px-4"><DashboardSkeleton /></div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader userName={profile.nome || user?.full_name || "Beneficiário"} userType="beneficiario" notificationCount={0} />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto px-4">
          <BeneficiaryPageHero
            eyebrow="Perfil"
            title="Mantenha seus dados atualizados."
            description="Confira dados de contato, responsável, endereço e preferências vinculadas ao seu acompanhamento."
            icon={<User className="h-4 w-4" aria-hidden="true" />}
            primaryAction={isEditing ? (
              <Button size="lg" onClick={() => void handleSave()} disabled={isSaving} className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                <Save className="mr-2 h-5 w-5" />{isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            ) : (
              <Button size="lg" onClick={() => setIsEditing(true)} className="h-14 rounded-full bg-accent text-base font-black text-accent-foreground hover:bg-accent/90">
                <Pencil className="mr-2 h-5 w-5" />Editar perfil
              </Button>
            )}
            secondaryAction={isEditing ? (
              <Button size="lg" variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="h-14 rounded-full border-primary-foreground/30 bg-transparent text-base font-black text-primary-foreground hover:bg-primary-foreground/10">
                <X className="mr-2 h-5 w-5" />Cancelar
              </Button>
            ) : undefined}
            meta={(
              <>
                {(dashboard?.statusLabel || dashboard?.status) ? <span>{dashboard?.statusLabel || dashboard?.status}</span> : null}
                <span>{profile.email || "E-mail não informado"}</span>
              </>
            )}
          />

          <div className="mx-auto max-w-5xl">
            {error && <AlertBanner type="error" title="Atenção" message={error} dismissible onDismiss={() => setError(null)} className="mb-6" />}

            <div className="space-y-6">
              <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-primary/10"><User className="h-10 w-10 text-primary" /></div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-black text-foreground">{profile.nome || user?.full_name || "Beneficiário"}</h2>
                      <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                        {(dashboard?.statusLabel || dashboard?.status) && <Badge className="rounded-full">{dashboard?.statusLabel || dashboard?.status}</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black">Meus dados</CardTitle>
                    <CardDescription>Visualize seus dados do perfil. Clique em "Editar perfil" para habilitar alterações.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <ProfileInput id="beneficiary-name" label="Nome completo" value={profile.nome || ""} disabled={!isEditing} onChange={(value) => updateProfile("nome", value)} className="sm:col-span-2" />
                    <ProfileInput id="beneficiary-email" label="E-mail" value={profile.email || ""} disabled={!isEditing} type="email" onChange={(value) => updateProfile("email", value)} />
                    <ProfileInput id="beneficiary-phone" label="Telefone" value={profile.telefone || ""} disabled={!isEditing} onChange={(value) => updateProfile("telefone", value)} />
                    <ProfileInput id="beneficiary-city" label="Cidade" value={profile.cidade || ""} disabled={!isEditing} onChange={(value) => updateProfile("cidade", value)} />
                    <ProfileInput id="beneficiary-state" label="Estado" value={profile.estado || ""} disabled={!isEditing} onChange={(value) => updateProfile("estado", value)} />
                    <ProfileInput id="beneficiary-address" label="Endereço" value={profile.endereco || ""} disabled={!isEditing} onChange={(value) => updateProfile("endereco", value)} className="sm:col-span-2" />
                    <ProfileInput id="guardian-name" label="Responsável" value={profile.responsavel || ""} disabled={!isEditing} onChange={(value) => updateProfile("responsavel", value)} />
                    <ProfileInput id="guardian-phone" label="Telefone do responsável" value={profile.telefoneResponsavel || ""} disabled={!isEditing} onChange={(value) => updateProfile("telefoneResponsavel", value)} />
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="beneficiary-notes">Observações do perfil</Label>
                      <Textarea id="beneficiary-notes" rows={4} value={profile.observacoes || ""} onChange={(e) => updateProfile("observacoes", e.target.value)} disabled={!isEditing} className="rounded-2xl" />
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl font-black"><Mail className="h-5 w-5 text-primary" />Informações rápidas</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                      <InfoRow icon={<Mail className="h-4 w-4" />} text={profile.email || "E-mail não disponível nesta etapa"} />
                      <InfoRow icon={<Phone className="h-4 w-4" />} text={profile.telefone || "Telefone não informado"} />
                      <InfoRow icon={<MapPin className="h-4 w-4" />} text={[profile.cidade, profile.estado].filter(Boolean).join(" - ") || "Localização não informada"} />
                      <InfoRow icon={<Heart className="h-4 w-4" />} text="Preferências configuráveis na página de Configurações" />
                      <InfoRow icon={<Calendar className="h-4 w-4" />} text={dashboard?.nextAppointment ? `Próxima consulta: ${dashboard.nextAppointment.date || "-"} às ${dashboard.nextAppointment.time || "-"}${dashboard.nextAppointment.specialty ? ` • ${dashboard.nextAppointment.specialty}` : ""}` : "Sem próxima consulta cadastrada"} />
                    </CardContent>
                  </Card>

                  <Card className="tdb-polished-card rounded-[2rem] shadow-xl shadow-primary/5">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl font-black"><Shield className="h-5 w-5 text-primary" />Preferências ativas</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                      <div>
                        <p className="font-black text-foreground">Notificações</p>
                        <ul className="mt-2 space-y-1">
                          <li>E-mail: {humanizeBoolean(settings?.notifications?.email)}</li>
                          <li>SMS: {humanizeBoolean(settings?.notifications?.sms)}</li>
                          <li>Push: {humanizeBoolean(settings?.notifications?.push)}</li>
                          <li>Lembretes de consulta: {humanizeBoolean(settings?.notifications?.appointmentReminders)}</li>
                          <li>Alertas de mensagem: {humanizeBoolean(settings?.notifications?.messageAlerts)}</li>
                          <li>Atualizações do caso: {humanizeBoolean(settings?.notifications?.updates)}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-black text-foreground">Privacidade</p>
                        <ul className="mt-2 space-y-1">
                          <li>Compartilhar progresso: {humanizeBoolean(settings?.privacy?.shareProgress)}</li>
                          <li>Permitir contato: {humanizeBoolean(settings?.privacy?.allowContact)}</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <HelpButton />
    </div>
  )
}

function ProfileInput({ id, label, value, disabled, onChange, type = "text", className = "" }: { id: string; label: string; value: string; disabled: boolean; onChange: (value: string) => void; type?: string; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="h-11 rounded-2xl" />
    </div>
  )
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-3 text-muted-foreground">{icon}<span>{text}</span></div>
}
