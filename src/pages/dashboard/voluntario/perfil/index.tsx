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
  Phone,
  Mail,
  MapPin,
  Award,
  Save,
  Pencil,
  X,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken, getUser } from "@/lib/auth"
import { getStoredProfile, saveStoredProfile, type ManagedProfileData } from "@/lib/profile-storage"
import { toast } from "sonner"

interface VolunteerProfile {
  id: number
  nome: string
  email: string
  telefone?: string
  especialidade?: string
  registro?: string
  cidade?: string
  estado?: string
  tipoProfissional?: string
}

function buildBaseProfile(
  apiData?: VolunteerProfile | null,
  stored?: ManagedProfileData | null,
  user?: { full_name?: string | null; email?: string | null } | null,
): ManagedProfileData {
  return {
    nome: String(stored?.nome || apiData?.nome || user?.full_name || ""),
    email: String(stored?.email || apiData?.email || user?.email || ""),
    telefone: String(stored?.telefone || apiData?.telefone || ""),
    cidade: String(stored?.cidade || apiData?.cidade || ""),
    estado: String(stored?.estado || apiData?.estado || ""),
    especialidade: String(stored?.especialidade || apiData?.especialidade || ""),
    registro: String(stored?.registro || apiData?.registro || ""),
    tipoProfissional: String(stored?.tipoProfissional || apiData?.tipoProfissional || ""),
    observacoes: String(stored?.observacoes || ""),
  }
}

export default function VoluntarioPerfilPage() {
  const navigate = useNavigate()
  const user = getUser()

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

        const data = await apiFetch<VolunteerProfile>("/api/volunteers/me/profile", {}, token)
        const stored = getStoredProfile("voluntario", user?.id)
        const baseProfile = buildBaseProfile(data, stored, user)

        setProfile(baseProfile)
        setInitialProfile(baseProfile)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar perfil")
      } finally {
        setIsLoading(false)
      }
    })()
  }, [navigate, user?.email, user?.full_name, user?.id])

  const updateField = <K extends keyof ManagedProfileData>(
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
      saveStoredProfile("voluntario", profile, user?.id)
      setInitialProfile(profile)
      setIsEditing(false)
      toast.success("Perfil do voluntário atualizado")
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
          userName={user?.full_name || "Voluntário"}
          userType="voluntario"
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
        userName={String(profile.nome || user?.full_name || "Voluntário")}
        userType="voluntario"
        notificationCount={0}
      />

      <main className="flex-1 py-6 lg:py-8">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" size="sm" className="mb-0" asChild>
              <Link to="/dashboard/voluntario">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
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

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-2xl font-bold text-primary">
                    <User className="h-8 w-8" />
                  </div>

                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {String(profile.nome || user?.full_name || "Voluntário")}
                      <Badge variant="outline">Perfil</Badge>
                    </CardTitle>

                    <CardDescription>
                      {String(profile.especialidade || "Especialidade não informada")}
                      {profile.registro ? ` • ${String(profile.registro)}` : ""}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="vol-name">Nome completo</Label>
                  <Input
                    id="vol-name"
                    value={String(profile.nome || "")}
                    onChange={(e) => updateField("nome", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vol-email">E-mail</Label>
                  <Input
                    id="vol-email"
                    type="email"
                    value={String(profile.email || "")}
                    onChange={(e) => updateField("email", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vol-phone">Telefone</Label>
                  <Input
                    id="vol-phone"
                    value={String(profile.telefone || "")}
                    onChange={(e) => updateField("telefone", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vol-city">Cidade</Label>
                  <Input
                    id="vol-city"
                    value={String(profile.cidade || "")}
                    onChange={(e) => updateField("cidade", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vol-state">Estado</Label>
                  <Input
                    id="vol-state"
                    value={String(profile.estado || "")}
                    onChange={(e) => updateField("estado", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vol-specialty">Especialidade</Label>
                  <Input
                    id="vol-specialty"
                    value={String(profile.especialidade || "")}
                    onChange={(e) => updateField("especialidade", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vol-license">Registro profissional</Label>
                  <Input
                    id="vol-license"
                    value={String(profile.registro || "")}
                    onChange={(e) => updateField("registro", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="vol-type">Tipo profissional</Label>
                  <Input
                    id="vol-type"
                    value={String(profile.tipoProfissional || "")}
                    onChange={(e) => updateField("tipoProfissional", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="vol-notes">Observações do perfil</Label>
                  <Textarea
                    id="vol-notes"
                    rows={4}
                    value={String(profile.observacoes || "")}
                    onChange={(e) => updateField("observacoes", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
                <CardDescription>
                  Visualize seus dados atuais. Clique em "Editar perfil" para habilitar alterações.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {String(profile.email || user?.email || "Não informado")}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{String(profile.telefone || "Não informado")}</span>
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {[profile.cidade, profile.estado].filter(Boolean).join(" - ") ||
                      "Localização não informada"}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {String(profile.tipoProfissional || "Profissional voluntário")}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Para preferências e notificações, utilize a página de configurações do voluntário.
                  As alterações deste formulário permanecem disponíveis após refresh.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}