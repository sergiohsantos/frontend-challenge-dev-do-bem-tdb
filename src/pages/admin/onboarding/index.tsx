import { useEffect, useMemo, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { AlertBanner } from "@/components/ui/alert-banner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { PageLoader } from "@/components/ui/page-loader"
import { listLeadBeneficiarios } from "@/services/java-api/lead-beneficiario.service"
import { converterLeadEmApto, validarChecklist } from "@/services/java-api/onboarding.service"
import type { ChecklistValidationPayload, ChecklistValidationResult, LeadBeneficiario } from "@/types/java-api"
import { FileCheck, Search } from "lucide-react"
import { toast } from "sonner"

type ChecklistState = Record<number, ChecklistValidationPayload>

const DEFAULT_CHECKLIST: ChecklistValidationPayload = {
  documentoResponsavelOk: false,
  comprovanteResidenciaOk: false,
  autorizacaoOk: false,
}

function isEligibleForOnboarding(lead: LeadBeneficiario): boolean {
  return ["EM_ANALISE", "AGUARDANDO_TRIAGEM", "PENDENTE_HABILITACAO"].includes(lead.status)
}

function createChecklistState(leads: LeadBeneficiario[]): ChecklistState {
  return leads.reduce<ChecklistState>((acc, lead) => {
    acc[lead.id] = DEFAULT_CHECKLIST
    return acc
  }, {})
}

function isChecklistComplete(checklist?: ChecklistValidationPayload): boolean {
  if (!checklist) return false
  return Object.values(checklist).every(Boolean)
}

function getChecklistPendencies(checklist?: ChecklistValidationPayload): string[] {
  if (!checklist) return ["documento do responsavel", "comprovante de residencia", "autorizacao"]
  const pendencies = []
  if (!checklist.documentoResponsavelOk) pendencies.push("documento do responsavel")
  if (!checklist.comprovanteResidenciaOk) pendencies.push("comprovante de residencia")
  if (!checklist.autorizacaoOk) pendencies.push("autorizacao")
  return pendencies
}

function getOnboardingNextAction(complete: boolean, validation?: ChecklistValidationResult): string {
  if (validation?.valido) return "Checklist validado. Habilite o cadastro para seguir para atendimento."
  if (complete) return "Todos os itens foram marcados. Valide o checklist para confirmar no backend."
  return "Marque todos os documentos obrigatorios antes de validar."
}

export default function AdminOnboardingPage() {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const [leads, setLeads] = useState<LeadBeneficiario[]>([])
  const [checklists, setChecklists] = useState<ChecklistState>({})
  const [validationResults, setValidationResults] = useState<Record<number, ChecklistValidationResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyLeadId, setBusyLeadId] = useState<number | null>(null)

  async function loadLeads(showLoader = true) {
    if (showLoader) setIsLoading(true)

    try {
      setError(null)
      const leadResult = await Promise.allSettled([listLeadBeneficiarios()])
      const allLeads = leadResult[0].status === "fulfilled" ? leadResult[0].value : []
      const eligibleLeads = allLeads.filter(isEligibleForOnboarding)
      setLeads(eligibleLeads)
      setChecklists((current) => {
        const seeded = createChecklistState(eligibleLeads)
        return Object.keys(current).length > 0 ? { ...seeded, ...current } : seeded
      })

      if (leadResult[0].status === "rejected") {
        setError(
          leadResult[0].reason instanceof Error
            ? leadResult[0].reason.message
            : "Nao foi possivel carregar o onboarding.",
        )
      }
    } finally {
      if (showLoader) setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLeads()
  }, [])

  const filteredLeads = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return leads

    return leads.filter((lead) =>
      [lead.nome, lead.cpf, lead.responsavelNome, lead.email, lead.telefone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    )
  }, [search, leads])

  const summary = useMemo(() => {
    const completos = filteredLeads.filter((lead) => isChecklistComplete(checklists[lead.id])).length
    const validados = filteredLeads.filter((lead) => validationResults[lead.id]?.valido).length

    return {
      total: filteredLeads.length,
      completos,
      pendentes: Math.max(filteredLeads.length - completos, 0),
      validados,
    }
  }, [checklists, filteredLeads, validationResults])

  function updateChecklist(leadId: number, field: keyof ChecklistValidationPayload, checked: boolean) {
    setChecklists((current) => ({
      ...current,
      [leadId]: {
        ...(current[leadId] || DEFAULT_CHECKLIST),
        [field]: checked,
      },
    }))

    setValidationResults((current) => {
      const next = { ...current }
      delete next[leadId]
      return next
    })
  }

  async function handleValidate(lead: LeadBeneficiario) {
    const payload = checklists[lead.id] || DEFAULT_CHECKLIST
    if (!isChecklistComplete(payload)) {
      toast.error(`Complete o checklist antes de validar. Faltam: ${getChecklistPendencies(payload).join(", ")}.`)
      return
    }

    try {
      setBusyLeadId(lead.id)
      const result = await validarChecklist(lead.id, payload)
      setValidationResults((current) => ({ ...current, [lead.id]: result }))

      if (result.valido) {
        toast.success(result.mensagem || "Checklist validado com sucesso.")
      } else {
        toast.error(result.mensagem || "Checklist validado com pendências.")
      }
    } catch (validateError) {
      toast.error(
        validateError instanceof Error ? validateError.message : "Não foi possível validar o checklist agora.",
      )
    } finally {
      setBusyLeadId(null)
    }
  }

  async function handleConvert(leadId: number) {
    const validation = validationResults[leadId]
    if (!validation?.valido) {
      toast.error("Valide o checklist com sucesso antes de habilitar o cadastro.")
      return
    }

    try {
      setBusyLeadId(leadId)
      const result = await converterLeadEmApto(leadId)
      setLeads((current) => current.filter((lead) => lead.id !== leadId))
      setValidationResults((current) => {
        const next = { ...current }
        delete next[leadId]
        return next
      })
      setChecklists((current) => {
        const next = { ...current }
        delete next[leadId]
        return next
      })
      toast.success(result.mensagem)
    } catch (convertError) {
      toast.error(convertError instanceof Error ? convertError.message : "Não foi possível converter o lead.")
    } finally {
      setBusyLeadId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-4 sm:p-6">
            <PageLoader message="Carregando dados do onboarding..." />
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

        <main className="flex-1 space-y-6 p-4 sm:p-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Onboarding</h1>
            <p className="text-muted-foreground">Validação documental e preparação para atendimento.</p>
          </div>

          {error && (
            <AlertBanner
              type="error"
              title="Falha ao carregar onboarding"
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              action={{ label: "Tentar novamente", onClick: () => void loadLeads() }}
            />
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">Total</p>
                  <p className="text-sm text-muted-foreground">Leads elegíveis para onboarding</p>
                </div>
                <p className="shrink-0 text-3xl font-bold">{summary.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">Checklist completo</p>
                  <p className="text-sm text-muted-foreground">Tudo marcado localmente</p>
                </div>
                <p className="shrink-0 text-3xl font-bold">{summary.completos}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">Validados</p>
                  <p className="text-sm text-muted-foreground">Confirmados pelo backend Java</p>
                </div>
                <p className="shrink-0 text-3xl font-bold">{summary.validados}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">Pendentes</p>
                  <p className="text-sm text-muted-foreground">Itens faltando no checklist</p>
                </div>
                <p className="shrink-0 text-3xl font-bold">{summary.pendentes}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-orange-100">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Checklist documental
                </CardTitle>
                <CardDescription>
                  Valide a documentação do lead no backend Java e converta apenas os casos aptos.
                </CardDescription>
              </div>

              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="onboarding-search"
                  name="onboardingSearch"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, CPF ou contato..."
                  className="pl-9"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const checklist = checklists[lead.id] || DEFAULT_CHECKLIST
                  const validation = validationResults[lead.id]
                  const isBusy = busyLeadId === lead.id
                  const complete = isChecklistComplete(checklist)
                  const pendencies = getChecklistPendencies(checklist)
                  const nextAction = getOnboardingNextAction(complete, validation)

                  return (
                    <div key={lead.id} className="rounded-xl border border-border p-4">
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{lead.nome}</h3>
                            <Badge variant={validation?.valido ? "default" : complete ? "secondary" : "outline"}>
                              {validation?.valido ? "VALIDADO" : complete ? "PRONTO PARA VALIDAR" : "PENDÊNCIAS"}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">CPF: {lead.cpf}</p>
                          <p className="text-sm text-muted-foreground">Responsável: {lead.responsavelNome}</p>
                          <p className="text-sm text-muted-foreground">
                            Contato: {lead.email || "E-mail não informado"} • {lead.telefone}
                          </p>
                          <p className="text-sm text-muted-foreground">Status atual: {lead.status}</p>
                        </div>

                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm lg:max-w-sm">
                          <p className="font-medium text-foreground">Proxima acao recomendada</p>
                          <p className="mt-1 text-muted-foreground">{nextAction}</p>
                          {!complete ? (
                            <p className="mt-1 text-muted-foreground">Pendencias: {pendencies.join(", ")}.</p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => void handleValidate(lead)} disabled={isBusy || !complete}>
                            {isBusy ? "Processando..." : complete ? "Validar checklist" : "Complete o checklist"}
                          </Button>
                          <Button size="sm" onClick={() => void handleConvert(lead.id)} disabled={isBusy || !validation?.valido}>
                            {isBusy ? "Processando..." : "Habilitar cadastro"}
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex items-center gap-3 rounded-lg border p-3">
                          <Checkbox
                            checked={checklist.documentoResponsavelOk}
                            onCheckedChange={(checked) =>
                              updateChecklist(lead.id, "documentoResponsavelOk", Boolean(checked))
                            }
                          />
                          <span className="text-sm">Documento do responsável</span>
                        </label>

                        <label className="flex items-center gap-3 rounded-lg border p-3">
                          <Checkbox
                            checked={checklist.comprovanteResidenciaOk}
                            onCheckedChange={(checked) =>
                              updateChecklist(lead.id, "comprovanteResidenciaOk", Boolean(checked))
                            }
                          />
                          <span className="text-sm">Comprovante de residência</span>
                        </label>

                        <label className="flex items-center gap-3 rounded-lg border p-3">
                          <Checkbox
                            checked={checklist.autorizacaoOk}
                            onCheckedChange={(checked) => updateChecklist(lead.id, "autorizacaoOk", Boolean(checked))}
                          />
                          <span className="text-sm">Autorização</span>
                        </label>
                      </div>

                      {validation ? (
                        <div
                          className={`mt-4 rounded-lg border p-3 text-sm ${
                            validation.valido
                              ? "border-green-200 bg-green-50 text-green-900"
                              : "border-amber-200 bg-amber-50 text-amber-900"
                          }`}
                        >
                          <p className="font-medium">{validation.mensagem || "Checklist processado."}</p>
                          {validation.pendencias.length > 0 ? (
                            <p className="mt-1">Pendências: {validation.pendencias.join(", ")}</p>
                          ) : (
                            <p className="mt-1">Nenhuma pendência retornada pelo backend Java.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              ) : (
                <Empty variant="subtle" className="py-10">
                  <EmptyMedia variant="primary">
                    <FileCheck className="h-8 w-8" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum lead em onboarding</EmptyTitle>
                  <EmptyDescription>
                    {search
                      ? "Nenhum lead corresponde aos filtros aplicados."
                      : "Não há leads elegíveis para onboarding retornados pelo backend Java neste momento."}
                  </EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

