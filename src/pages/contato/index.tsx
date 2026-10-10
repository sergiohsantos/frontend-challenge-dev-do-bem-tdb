import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, HeartHandshake, Loader2, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react"
import { apiFetch } from "@/lib/api"

type ContactFormValues = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const defaultValues: ContactFormValues = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
}

const contactCards = [
  { icon: Phone, title: "Telefone", content: "0800 777 7766", helper: "Segunda a sexta, 8h às 18h", href: "tel:08007777766" },
  { icon: Mail, title: "E-mail", content: "contato@turmadobem.org.br", helper: "Canal institucional", href: "mailto:contato@turmadobem.org.br" },
  { icon: MapPin, title: "Endereço", content: "Rua Maurício Francisco Klabin, 449", helper: "Vila Mariana, São Paulo - SP" },
]

export default function ContatoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({ defaultValues, mode: "onBlur" })

  const onSubmit = async (data: ContactFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        nome: data.name.trim(),
        email: data.email.trim(),
        telefone: data.phone.trim() || undefined,
        assunto: data.subject || "Contato",
        mensagem: data.message.trim(),
      }

      await apiFetch("/api/public/contact", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      setSuccess(true)
      reset(defaultValues)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="tdb-premium-shell relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20 lg:py-24">
          <div className="tdb-orb left-[-5rem] top-10 h-72 w-72 bg-secondary" aria-hidden="true" />
          <div className="tdb-orb tdb-orb-delayed bottom-[-5rem] right-[-5rem] h-80 w-80 bg-accent" aria-hidden="true" />
          <div className="container relative mx-auto grid gap-10 px-4 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="tdb-reveal">
              <span className="inline-flex rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Contato</span>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Converse com a Turma do Bem.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-primary-foreground/86 sm:text-lg">Use este canal para dúvidas, orientações, parcerias e mensagens relacionadas à jornada de atendimento.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur"><HeartHandshake className="h-6 w-6 text-accent" aria-hidden="true" /><p className="mt-3 font-black">Acolhimento no primeiro contato</p><p className="mt-2 text-sm leading-6 text-primary-foreground/80">Mensagem clara ajuda a equipe a direcionar a resposta certa.</p></div>
                <div className="rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-5 backdrop-blur"><ShieldCheck className="h-6 w-6 text-secondary" aria-hidden="true" /><p className="mt-3 font-black">Canal institucional</p><p className="mt-2 text-sm leading-6 text-primary-foreground/80">As informações são enviadas pelo formulário oficial da plataforma.</p></div>
              </div>
            </div>
            <div className="tdb-reveal tdb-reveal-delay-2 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {contactCards.map((item) => (
                <Card key={item.title} className="tdb-polished-card rounded-[2rem] border-primary-foreground/10 bg-background/95 shadow-2xl shadow-primary/10">
                  <CardContent className="p-5">
                    <item.icon className="mb-3 h-7 w-7 text-primary" aria-hidden="true" />
                    <h3 className="font-black text-foreground">{item.title}</h3>
                    {item.href ? (
                      <a href={item.href} className="mt-2 block break-all text-sm font-bold text-primary hover:underline">{item.content}</a>
                    ) : (
                      <p className="mt-2 text-sm font-bold text-foreground">{item.content}</p>
                    )}
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.helper}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
              <aside className="tdb-reveal lg:sticky lg:top-24">
                <Card className="rounded-[2rem] border-primary/10 bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                  <CardContent className="p-6">
                    <MessageCircle className="h-8 w-8 text-accent" aria-hidden="true" />
                    <h2 className="mt-5 text-2xl font-black tracking-tight">Como podemos ajudar?</h2>
                    <p className="mt-3 text-sm leading-7 text-primary-foreground/82">Quanto mais claro for o assunto, melhor a equipe consegue direcionar a mensagem para o fluxo correto.</p>
                    <div className="mt-6 space-y-3 text-sm text-primary-foreground/86">
                      <p className="rounded-2xl bg-primary-foreground/10 p-3">Dúvidas sobre cadastro e atendimento.</p>
                      <p className="rounded-2xl bg-primary-foreground/10 p-3">Orientação para voluntários e parceiros.</p>
                      <p className="rounded-2xl bg-primary-foreground/10 p-3">Mensagens institucionais para a equipe TDB.</p>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              <div className="tdb-reveal tdb-reveal-delay-1">
                {success ? (
                  <Card className="rounded-[2rem] shadow-xl shadow-primary/5">
                    <CardContent className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                      <CheckCircle2 className="mb-4 h-16 w-16 text-success" aria-hidden="true" />
                      <h2 className="text-2xl font-black tracking-tight text-foreground">Mensagem enviada</h2>
                      <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">Recebemos seu contato. A equipe fará o direcionamento pelo canal informado.</p>
                      <Button className="mt-6 rounded-full" onClick={() => setSuccess(false)}>Enviar outra mensagem</Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-[2rem] shadow-xl shadow-primary/5">
                    <CardHeader className="p-5 pb-2 sm:p-6 sm:pb-4">
                      <CardTitle className="text-2xl font-black tracking-tight">Envie sua mensagem</CardTitle>
                      <CardDescription>Preencha os dados abaixo para que a equipe possa responder pelo caminho correto.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        {error && (
                          <div className="flex items-center gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            {error}
                          </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome completo</Label>
                            <Controller
                              name="name"
                              control={control}
                              rules={{ required: "Informe seu nome completo.", minLength: { value: 3, message: "Digite pelo menos 3 caracteres." } }}
                              render={({ field }) => <Input id="name" className="h-12" aria-invalid={Boolean(errors.name)} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />}
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Controller
                              name="email"
                              control={control}
                              rules={{ required: "Informe seu e-mail.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Informe um e-mail válido." } }}
                              render={({ field }) => <Input id="email" type="email" className="h-12" aria-invalid={Boolean(errors.email)} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Controller name="phone" control={control} render={({ field }) => <Input id="phone" type="tel" className="h-12" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />} />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="subject">Assunto</Label>
                            <Controller
                              name="subject"
                              control={control}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger id="subject" className="h-12"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="duvida">Dúvida</SelectItem>
                                    <SelectItem value="sugestao">Sugestão</SelectItem>
                                    <SelectItem value="reclamacao">Reclamação</SelectItem>
                                    <SelectItem value="parceria">Parceria</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Mensagem</Label>
                          <Controller
                            name="message"
                            control={control}
                            rules={{ required: "Digite sua mensagem.", minLength: { value: 10, message: "Digite pelo menos 10 caracteres." } }}
                            render={({ field }) => <Textarea id="message" rows={5} className="min-h-[140px]" aria-invalid={Boolean(errors.message)} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} name={field.name} />}
                          />
                          {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                        </div>

                        <Button type="submit" className="h-12 w-full rounded-full text-base font-black" disabled={isLoading}>
                          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Enviando...</> : "Enviar mensagem"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}

