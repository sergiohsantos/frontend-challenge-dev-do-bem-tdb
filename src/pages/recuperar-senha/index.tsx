import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Heart, KeyRound, Mail, Phone, ShieldCheck, User, Users } from "lucide-react"
import { HelpButton } from "@/components/layout/help-button"
import { AccessibilityPanel } from "@/components/accessibility/accessibility-panel"

const profileGuidance = {
  beneficiario: {
    title: "Acesso de beneficiário",
    description: "Tenha em mãos seu CPF e os dados usados no cadastro. A equipe confirma sua identidade antes de orientar a redefinição de acesso.",
    helper: "Esse cuidado protege seus dados e evita alteração indevida de senha.",
  },
  voluntario: {
    title: "Acesso de voluntário",
    description: "Tenha em mãos seu e-mail cadastrado e dados profissionais. A equipe valida o vínculo antes de orientar a recuperação.",
    helper: "A validação protege agenda, casos acompanhados e mensagens da rede.",
  },
}

export default function RecuperarSenhaPage() {
  const [userType, setUserType] = useState<"beneficiario" | "voluntario">("beneficiario")
  const guidance = profileGuidance[userType]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="group flex items-center gap-3" aria-label="Turma do Bem">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-sm transition-transform group-hover:scale-105"><Heart className="h-5 w-5 text-primary-foreground" aria-hidden="true" /></div>
            <span className="text-lg font-black text-foreground">Turma do Bem</span>
          </Link>
          <div className="flex items-center gap-2">
            <AccessibilityPanel />
            <Button variant="ghost" size="sm" asChild className="gap-2 rounded-full">
              <Link to="/login"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="tdb-premium-shell relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20 lg:py-24">
          <div className="tdb-orb left-[-5rem] top-12 h-72 w-72 bg-secondary" aria-hidden="true" />
          <div className="tdb-orb tdb-orb-delayed bottom-[-5rem] right-[-5rem] h-80 w-80 bg-accent" aria-hidden="true" />
          <div className="container relative mx-auto grid gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="tdb-reveal">
              <span className="inline-flex rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Recuperação de acesso</span>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Vamos ajudar você a voltar para sua jornada.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-primary-foreground/86 sm:text-lg">Por segurança, a recuperação de senha é orientada pelo canal oficial de atendimento da Turma do Bem.</p>
            </div>

            <Card className="tdb-glass tdb-reveal tdb-reveal-delay-2 rounded-[2.25rem] border-primary-foreground/15 bg-primary-foreground/10 text-primary-foreground shadow-2xl shadow-primary/20">
              <CardContent className="p-6 sm:p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground"><KeyRound className="h-8 w-8" aria-hidden="true" /></div>
                <h2 className="mt-6 text-2xl font-black tracking-tight">Atendimento seguro</h2>
                <p className="mt-3 text-sm leading-7 text-primary-foreground/82">A equipe orienta a recuperação sem expor dados sensíveis e sem enviar instruções para contatos não confirmados.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a href="tel:08007777766" className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 transition-colors hover:bg-primary-foreground/15"><Phone className="h-5 w-5 text-secondary" aria-hidden="true" /><p className="mt-2 text-sm font-black">0800 777 7766</p><p className="mt-1 text-xs text-primary-foreground/70">Segunda a sexta</p></a>
                  <Link to="/contato" className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 transition-colors hover:bg-primary-foreground/15"><Mail className="h-5 w-5 text-accent" aria-hidden="true" /><p className="mt-2 text-sm font-black">Enviar mensagem</p><p className="mt-1 text-xs text-primary-foreground/70">Canal institucional</p></Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <aside className="tdb-reveal rounded-[2rem] border border-border/70 bg-card p-6 shadow-xl shadow-primary/5 lg:sticky lg:top-24">
                <ShieldCheck className="h-8 w-8 text-success" aria-hidden="true" />
                <h2 className="mt-5 text-2xl font-black tracking-tight text-foreground">Antes de solicitar ajuda</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">A recuperação de acesso envolve confirmação de identidade. Isso protege informações pessoais, agenda, documentos e mensagens.</p>
                <Button className="mt-6 w-full rounded-full" asChild><Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Voltar ao login</Link></Button>
              </aside>

              <Card className="tdb-polished-card tdb-reveal tdb-reveal-delay-1 rounded-[2rem] shadow-xl shadow-primary/5">
                <CardContent className="p-6 sm:p-8">
                  <Tabs value={userType} onValueChange={(v) => setUserType(v as "beneficiario" | "voluntario")}> 
                    <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-full">
                      <TabsTrigger value="beneficiario" className="gap-2 rounded-full"><User className="h-4 w-4" aria-hidden="true" />Beneficiário</TabsTrigger>
                      <TabsTrigger value="voluntario" className="gap-2 rounded-full"><Users className="h-4 w-4" aria-hidden="true" />Voluntário</TabsTrigger>
                    </TabsList>

                    <TabsContent value={userType} className="mt-0">
                      <div className="rounded-[2rem] bg-muted/40 p-5 sm:p-6">
                        <h3 className="text-2xl font-black tracking-tight text-foreground">{guidance.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{guidance.description}</p>
                        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-background p-4 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />{guidance.helper}</div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <HelpButton />
    </div>
  )
}

