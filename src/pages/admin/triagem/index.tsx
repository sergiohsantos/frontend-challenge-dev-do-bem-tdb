import { useEffect, useMemo, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageLoader } from "@/components/ui/page-loader"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createLeadBeneficiario,
  deleteLeadBeneficiario,
  getLeadBeneficiario,
  listLeadBeneficiarios,
  updateLeadBeneficiario,
} from "@/services/java-api/lead-beneficiario.service"
import { createTriagem, listTriagens, priorizarTriagem, sugerirEncaminhamento } from "@/services/java-api/triagem.service"
import type { EncaminhamentoSugerido, LeadBeneficiario, LeadBeneficiarioPayload, LeadStatus, Triagem } from "@/types/java-api"
import { AlertCircle, ClipboardList, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"

type LeadFormState = {
  nome: string
  cpf: string
  dataNascimento: string
  responsavelNome: string
  telefone: string
  email: string
  status: string
  vulnerabilidadeSocial: string
  observacoes: string
}

type TriagemFormState = {
  urgenciaOdontologica: string
  observacoes: string
}

const EMPTY_FORM: LeadFormState = {
  nome: "",
  cpf: "",
  dataNascimento: "",
  responsavelNome: "",
  telefone: "",
  email: "",
  status: "NOVO",
  vulnerabilidadeSocial: "false",
  observacoes: "",
}

const EMPTY_TRIAGEM_FORM: TriagemFormState = {
  urgenciaOdontologica: "3",
  observacoes: "",
}

const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string }> = [
  { value: "NOVO", label: "Novo" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "TRIADO", label: "Triado" },
  { value: "APTO_ATENDIMENTO", label: "Apto atendimento" },
  { value: "INATIVO", label: "Inativo" },
]

const URGENCY_BY_STATUS: Record<string, number> = {
  NOVO: 2,
  EM_ANALISE: 3,
  TRIADO: 4,
  APTO_ATENDIMENTO: 5,
}

function getStatusLabel(status?: string): string {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || status || "Sem status"
}

function getStatusVariant(status?: string): "default" | "secondary" | "outline" {
  if (status === "APTO_ATENDIMENTO") return "default"
  if (status === "TRIADO" || status === "EM_ANALISE") return "secondary"
  return "outline"
}

function formatBooleanLabel(value: boolean): string {
  return value ? "Sim" : "Não"
}

function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11)
}

function mapLeadToForm(lead: LeadBeneficiario): LeadFormState {
  return {
    nome: lead.nome,
    cpf: lead.cpf,
    dataNascimento: lead.dataNascimento ? lead.dataNascimento.slice(0, 10) : "",
    responsavelNome: lead.responsavelNome,
    telefone: lead.telefone,
    email: lead.email || "",
    status: lead.status,
    vulnerabilidadeSocial: String(lead.vulnerabilidadeSocial),
    observacoes: lead.observacoes || "",
  }
}

function mapFormToPayload(form: LeadFormState): LeadBeneficiarioPayload {
  return {
    nome: form.nome.trim(),
    cpf: normalizeCpf(form.cpf),
    dataNascimento: form.dataNascimento,
    responsavelNome: form.responsavelNome.trim(),
    telefone: form.telefone.trim(),
    email: form.email.trim() || undefined,
    status: form.status,
    vulnerabilidadeSocial: form.vulnerabilidadeSocial === "true",
    observacoes: form.observacoes.trim() || undefined,
  }
}

function buildTriagemForm(lead: LeadBeneficiario): TriagemFormState {
  return {
    urgenciaOdontologica: String(URGENCY_BY_STATUS[lead.status] || (lead.vulnerabilidadeSocial ? 4 : 3)),
    observacoes: "",
  }
}

export default function AdminTriagemPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const [leads, setLeads] = useState<LeadBeneficiario[]>([])
  const [triagens, setTriagens] = useState<Triagem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLeadId, setEditingLeadId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<LeadFormState>(EMPTY_FORM)
  const [triagemForm, setTriagemForm] = useState<TriagemFormState>(EMPTY_TRIAGEM_FORM)
  const [triagemLead, setTriagemLead] = useState<LeadBeneficiario | null>(null)
  const [isTriagemDialogOpen, setIsTriagemDialogOpen] = useState(false)
  const [isTriagemSubmitting, setIsTriagemSubmitting] = useState(false)
  const [actionLeadId, setActionLeadId] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<Record<number, EncaminhamentoSugerido>>({})

  const triagemByLeadId = useMemo(() => {
    const map = new Map<number, Triagem>()
    triagens.forEach((triagem) => {
      if (triagem.leadId > 0) {
        map.set(triagem.leadId, triagem)
      }
    })
    return map
  }, [triagens])

  const stats = useMemo(() => {
    return {
      total: leads.length,
      emAnalise: leads.filter((lead) => lead.status === "EM_ANALISE").length,
      triados: leads.filter((lead) => lead.status === "TRIADO").length,
      aptos: leads.filter((lead) => lead.status === "APTO_ATENDIMENTO").length,
    }
  }, [leads])

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return leads

    return leads.filter((lead) =>
      [
        lead.nome,
        lead.cpf,
        lead.responsavelNome,
        lead.telefone,
        lead.email,
        lead.status,
        lead.observacoes,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [search, leads])

  async function loadData(showLoader = true) {
    if (showLoader) {
      setIsLoading(true)
    }

    try {
      setError(null)
      const [leadResult, triagemResult] = await Promise.allSettled([
        listLeadBeneficiarios(),
        listTriagens(),
      ])
      setLeads(leadResult.status === "fulfilled" ? leadResult.value : [])
      setTriagens(triagemResult.status === "fulfilled" ? triagemResult.value : [])

      if (leadResult.status === "rejected" || triagemResult.status === "rejected") {
        const firstError = leadResult.status === "rejected"
          ? leadResult.reason
          : triagemResult.status === "rejected"
            ? triagemResult.reason
            : null
        setError(
          firstError instanceof Error
            ? firstError.message
            : "Nao foi possivel carregar todos os dados da triagem agora.",
        )
      }
    } finally {
      if (showLoader) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function resetDialog() {
    setEditingLeadId(null)
    setForm(EMPTY_FORM)
    setIsDialogOpen(false)
  }

  function openCreateDialog() {
    setEditingLeadId(null)
    setForm(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  function openTriagemDialog(lead: LeadBeneficiario) {
    setTriagemLead(lead)
    setTriagemForm(buildTriagemForm(lead))
    setIsTriagemDialogOpen(true)
  }

  function closeTriagemDialog() {
    setTriagemLead(null)
    setTriagemForm(EMPTY_TRIAGEM_FORM)
    setIsTriagemDialogOpen(false)
  }

  async function openEditDialog(leadId: number) {
    try {
      setActionLeadId(leadId)
      const cachedLead = leads.find((lead) => lead.id === leadId)
      const lead = cachedLead || await getLeadBeneficiario(leadId)
      setEditingLeadId(leadId)
      setForm(mapLeadToForm(lead))
      setIsDialogOpen(true)
    } catch (detailError) {
      toast.error(detailError instanceof Error ? detailError.message : "Não foi possível carregar o lead.")
    } finally {
      setActionLeadId(null)
    }
  }

  async function handleSubmit() {
    const payload = mapFormToPayload(form)

    if (!payload.nome || !payload.cpf || !payload.dataNascimento || !payload.responsavelNome || !payload.telefone) {
      toast.error("Preencha nome, CPF, data de nascimento, responsável e telefone.")
      return
    }

    try {
      setIsSubmitting(true)
      if (editingLeadId) {
        const updated = await updateLeadBeneficiario(editingLeadId, payload)
        setLeads((current) => current.map((lead) => (lead.id === editingLeadId ? updated : lead)))
        toast.success("Lead atualizado com sucesso.")
      } else {
        const created = await createLeadBeneficiario(payload)
        setLeads((current) => [created, ...current])
        toast.success("Lead criado com sucesso.")
      }

      resetDialog()
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Não foi possível salvar o lead.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(leadId: number) {
    const confirmed = window.confirm("Deseja realmente excluir este lead da triagem?")
    if (!confirmed) return

    try {
      setActionLeadId(leadId)
      await deleteLeadBeneficiario(leadId)
      setLeads((current) => current.filter((lead) => lead.id !== leadId))
      setTriagens((current) => current.filter((triagem) => triagem.leadId !== leadId))
      setSuggestions((current) => {
        const next = { ...current }
        delete next[leadId]
        return next
      })
      toast.success("Lead removido com sucesso.")
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Não foi possível excluir o lead.")
    } finally {
      setActionLeadId(null)
    }
  }

  async function handlePrioritize(lead: LeadBeneficiario) {
    try {
      setActionLeadId(lead.id)
      const triagem = triagemByLeadId.get(lead.id)

      if (!triagem) {
        toast.error("Registre a triagem antes de recalcular a prioridade.")
        openTriagemDialog(lead)
        return
      }

      const prioritized = await priorizarTriagem(triagem.id)
      setTriagens((current) => {
        const withoutCurrent = current.filter((item) => item.id !== prioritized.id)
        return [prioritized, ...withoutCurrent]
      })
      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? {
                ...item,
                status: item.status === "NOVO" ? "EM_ANALISE" : item.status,
              }
            : item,
        ),
      )
      toast.success(`Lead ${lead.nome} priorizado com sucesso.`)
    } catch (prioritizeError) {
      toast.error(prioritizeError instanceof Error ? prioritizeError.message : "Não foi possível priorizar o lead.")
    } finally {
      setActionLeadId(null)
    }
  }

  async function handleSuggest(leadId: number) {
    const triagem = triagemByLeadId.get(leadId)
    if (!triagem) {
      toast.error("Registre a triagem antes de solicitar encaminhamento.")
      return
    }

    try {
      setActionLeadId(leadId)
      const suggestion = await sugerirEncaminhamento(leadId)
      setSuggestions((current) => ({ ...current, [leadId]: suggestion }))
      toast.success("Sugestão de encaminhamento carregada.")
    } catch (suggestError) {
      toast.error(
        suggestError instanceof Error ? suggestError.message : "Não foi possível sugerir um encaminhamento agora.",
      )
    } finally {
      setActionLeadId(null)
    }
  }

  async function handleCreateTriagem() {
    if (!triagemLead) return

    const urgenciaOdontologica = Number(triagemForm.urgenciaOdontologica)
    if (!Number.isFinite(urgenciaOdontologica) || urgenciaOdontologica < 1 || urgenciaOdontologica > 5) {
      toast.error("Informe uma urgencia odontologica entre 1 e 5.")
      return
    }

    try {
      setIsTriagemSubmitting(true)
      const created = await createTriagem({
        leadId: triagemLead.id,
        urgenciaOdontologica,
        observacoes: triagemForm.observacoes.trim() || undefined,
      })

      let nextLead = triagemLead
      if (triagemLead.status !== "TRIADO") {
        nextLead = await updateLeadBeneficiario(triagemLead.id, {
          nome: triagemLead.nome,
          cpf: triagemLead.cpf,
          dataNascimento: triagemLead.dataNascimento,
          responsavelNome: triagemLead.responsavelNome,
          telefone: triagemLead.telefone,
          email: triagemLead.email,
          status: "TRIADO",
          vulnerabilidadeSocial: triagemLead.vulnerabilidadeSocial,
          observacoes: triagemLead.observacoes,
        })
      }

      setTriagens((current) => {
        const withoutCurrent = current.filter((item) => item.leadId !== triagemLead.id)
        return [created, ...withoutCurrent]
      })
      setLeads((current) =>
        current.map((lead) =>
          lead.id === triagemLead.id
            ? nextLead
            : lead,
        ),
      )
      toast.success("Triagem registrada com sucesso.")
      closeTriagemDialog()
    } catch (triagemError) {
      toast.error(triagemError instanceof Error ? triagemError.message : "Nao foi possivel registrar a triagem.")
    } finally {
      setIsTriagemSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <PageLoader message="Carregando dados da triagem..." />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader />

        <main className="flex-1 space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Triagem</h1>
            <p className="text-muted-foreground">Gestão inicial de leads e priorização de atendimento.</p>
          </div>

          {error && (
            <AlertBanner
              type="error"
              title="Falha ao carregar triagem"
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              action={{ label: "Tentar novamente", onClick: () => void loadData() }}
            />
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total de leads</CardTitle>
                <CardDescription>Leads recebidos do backend Java</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Em análise</CardTitle>
                <CardDescription>Casos em avaliação</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.emAnalise}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Triados</CardTitle>
                <CardDescription>Prontos para onboarding</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.triados}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Aptos</CardTitle>
                <CardDescription>Convertidos pelo fluxo Java</CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-bold">{stats.aptos}</CardContent>
            </Card>
          </div>

          <Card className="border-orange-100">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Triagem inicial
                </CardTitle>
                <CardDescription>
                  Liste, cadastre e acompanhe leads do backend Java sem impactar o restante da aplicação.
                </CardDescription>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="triagem-search"
                    name="triagemSearch"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar lead, CPF, responsável..."
                    className="pl-9"
                  />
                </div>
                <Button className="gap-2" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4" />
                  Novo lead
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const triagem = triagemByLeadId.get(lead.id)
                  const suggestion = suggestions[lead.id]
                  const isBusy = actionLeadId === lead.id

                  return (
                    <div key={lead.id} className="rounded-xl border border-border p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{lead.nome}</h3>
                            <Badge variant={getStatusVariant(lead.status)}>{getStatusLabel(lead.status)}</Badge>
                            {triagem?.prioridade ? <Badge>{triagem.prioridade}</Badge> : null}
                            {!triagem ? <Badge variant="outline">Triagem pendente</Badge> : null}
                          </div>

                          <p className="text-sm text-muted-foreground">CPF: {lead.cpf}</p>
                          <p className="text-sm text-muted-foreground">Responsável: {lead.responsavelNome}</p>
                          <p className="text-sm text-muted-foreground">
                            Contato: {lead.email || "E-mail não informado"} • {lead.telefone}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vulnerabilidade social: {formatBooleanLabel(lead.vulnerabilidadeSocial)}
                          </p>
                          {triagem ? (
                            <p className="text-sm text-muted-foreground">
                              Triagem: urgência {triagem.urgenciaOdontologica || "-"} / {triagem.prioridade || "sem prioridade"}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => void openEditDialog(lead.id)} disabled={isBusy}>
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleSuggest(lead.id)}
                            disabled={isBusy || !triagem}
                          >
                            <Sparkles className="mr-1 h-4 w-4" />
                            Encaminhar
                          </Button>
                          {triagem ? (
                            <Button size="sm" onClick={() => void handlePrioritize(lead)} disabled={isBusy}>
                              {isBusy ? "Processando..." : "Repriorizar"}
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => openTriagemDialog(lead)} disabled={isBusy}>
                              {isBusy ? "Processando..." : "Registrar triagem"}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => void handleDelete(lead.id)} disabled={isBusy}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            Excluir
                          </Button>
                        </div>
                      </div>

                      {suggestion ? (
                        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                          <p className="font-medium text-foreground">Encaminhamento sugerido</p>
                          <p className="mt-1 text-muted-foreground">{suggestion.sugestao}</p>
                          {suggestion.destino ? (
                            <p className="mt-2 text-muted-foreground">Destino sugerido: {suggestion.destino}</p>
                          ) : null}
                          {suggestion.observacoes ? (
                            <p className="mt-1 text-muted-foreground">Observações: {suggestion.observacoes}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <Empty variant="subtle" className="py-10">
                  <EmptyMedia variant="primary">
                    <AlertCircle className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum lead encontrado</EmptyTitle>
                  <EmptyDescription>
                    {search
                      ? "Tente ajustar o termo de busca para localizar os leads desejados."
                      : "Quando o backend Java retornar leads, eles aparecerão aqui para triagem."}
                  </EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (!open ? resetDialog() : setIsDialogOpen(true))}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLeadId ? "Editar lead" : "Novo lead"}</DialogTitle>
            <DialogDescription>Os dados abaixo serão enviados apenas para o backend Java da Sprint 4.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lead-nome">Nome</Label>
              <Input id="lead-nome" value={form.nome} onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-cpf">CPF</Label>
              <Input
                id="lead-cpf"
                name="cpf"
                value={form.cpf}
                maxLength={11}
                onChange={(e) => setForm((current) => ({ ...current, cpf: normalizeCpf(e.target.value) }))}
                placeholder="Somente números"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-data-nascimento">Data de nascimento</Label>
              <Input
                id="lead-data-nascimento"
                name="dataNascimento"
                type="date"
                value={form.dataNascimento}
                onChange={(e) => setForm((current) => ({ ...current, dataNascimento: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-responsavel">Responsável</Label>
              <Input
                id="lead-responsavel"
                name="responsavelNome"
                value={form.responsavelNome}
                onChange={(e) => setForm((current) => ({ ...current, responsavelNome: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-telefone">Telefone</Label>
              <Input
                id="lead-telefone"
                name="telefone"
                value={form.telefone}
                onChange={(e) => setForm((current) => ({ ...current, telefone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-email">E-mail</Label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
                <SelectTrigger id="lead-status" name="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vulnerabilidade social</Label>
              <Select
                value={form.vulnerabilidadeSocial}
                onValueChange={(value) => setForm((current) => ({ ...current, vulnerabilidadeSocial: value }))}
              >
                <SelectTrigger id="lead-vulnerabilidade" name="vulnerabilidadeSocial">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lead-observacoes">Observações</Label>
              <Textarea
                id="lead-observacoes"
                name="observacoes"
                value={form.observacoes}
                onChange={(e) => setForm((current) => ({ ...current, observacoes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : editingLeadId ? "Salvar alterações" : "Criar lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTriagemDialogOpen} onOpenChange={(open) => (!open ? closeTriagemDialog() : setIsTriagemDialogOpen(true))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar triagem</DialogTitle>
            <DialogDescription>
              {triagemLead ? `Crie a triagem inicial para ${triagemLead.nome}.` : "Defina os dados da triagem."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Urgencia odontologica</Label>
              <Select
                value={triagemForm.urgenciaOdontologica}
                onValueChange={(value) => setTriagemForm((current) => ({ ...current, urgenciaOdontologica: value }))}
              >
                <SelectTrigger id="triagem-urgencia" name="urgenciaOdontologica">
                  <SelectValue placeholder="Selecione a urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Baixa</SelectItem>
                  <SelectItem value="2">2 - Leve</SelectItem>
                  <SelectItem value="3">3 - Moderada</SelectItem>
                  <SelectItem value="4">4 - Alta</SelectItem>
                  <SelectItem value="5">5 - Muito alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triagem-observacoes">Observacoes</Label>
              <Textarea
                id="triagem-observacoes"
                name="triagemObservacoes"
                value={triagemForm.observacoes}
                onChange={(e) => setTriagemForm((current) => ({ ...current, observacoes: e.target.value }))}
                rows={4}
                placeholder="Registre um resumo da avaliacao inicial."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeTriagemDialog} disabled={isTriagemSubmitting}>
              Cancelar
            </Button>
            <Button onClick={() => void handleCreateTriagem()} disabled={isTriagemSubmitting}>
              {isTriagemSubmitting ? "Salvando..." : "Salvar triagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

