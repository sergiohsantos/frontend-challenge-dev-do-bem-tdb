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
import { Phone, Mail, MapPin, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { apiFetch, type ContactPayload } from "@/lib/api"

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

export default function ContatoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    defaultValues,
    mode: "onBlur",
  })

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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-10 sm:py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-primary-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              Fale Conosco
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base text-primary-foreground/90 sm:mt-4 sm:text-lg">
              Estamos aqui para ouvir voce
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:space-y-6 lg:gap-0">
                  <Card>
                    <CardContent className="p-4 sm:pt-6">
                      <Phone className="mb-2 h-6 w-6 text-primary sm:mb-3 sm:h-8 sm:w-8" />
                      <h3 className="text-sm font-semibold sm:text-base">Telefone</h3>
                      <a href="tel:08007777766" className="text-sm text-primary hover:underline sm:text-base">
                        0800 777 7766
                      </a>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        Segunda a sexta, 8h as 18h
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:pt-6">
                      <Mail className="mb-2 h-6 w-6 text-primary sm:mb-3 sm:h-8 sm:w-8" />
                      <h3 className="text-sm font-semibold sm:text-base">E-mail</h3>
                      <a href="mailto:contato@turmadobem.org.br" className="break-all text-sm text-primary hover:underline sm:text-base">
                        contato@turmadobem.org.br
                      </a>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:pt-6">
                      <MapPin className="mb-2 h-6 w-6 text-primary sm:mb-3 sm:h-8 sm:w-8" />
                      <h3 className="text-sm font-semibold sm:text-base">Endereco</h3>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Rua Exemplo, 123
                        <br />
                        Sao Paulo - SP
                        <br />
                        CEP: 01000-000
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  {success ? (
                    <Card className="h-full">
                      <CardContent className="flex h-full flex-col items-center justify-center py-8 sm:py-12">
                        <CheckCircle2 className="mb-3 h-12 w-12 text-success sm:mb-4 sm:h-16 sm:w-16" />
                        <h2 className="text-xl font-bold sm:text-2xl">Mensagem enviada!</h2>
                        <p className="mt-2 text-center text-sm text-muted-foreground sm:text-base">
                          Agradecemos seu contato. Responderemos em breve.
                        </p>
                        <Button className="mt-4 sm:mt-6" onClick={() => setSuccess(false)}>
                          Enviar outra mensagem
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl">Envie sua mensagem</CardTitle>
                        <CardDescription className="text-sm">
                          Preencha o formulario abaixo e entraremos em contato
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4" noValidate>
                          {error && (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                              <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              {error}
                            </div>
                          )}

                          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                              <Label htmlFor="name" className="text-sm">
                                Nome completo
                              </Label>
                              <Controller
                                name="name"
                                control={control}
                                rules={{
                                  required: "Informe seu nome completo.",
                                  minLength: {
                                    value: 3,
                                    message: "Digite pelo menos 3 caracteres.",
                                  },
                                }}
                                render={({ field }) => (
                                  <Input
                                    id="name"
                                    className="h-11 sm:h-10"
                                    aria-invalid={Boolean(errors.name)}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                  />
                                )}
                              />
                              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                              <Label htmlFor="email" className="text-sm">
                                E-mail
                              </Label>
                              <Controller
                                name="email"
                                control={control}
                                rules={{
                                  required: "Informe seu e-mail.",
                                  pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Informe um e-mail valido.",
                                  },
                                }}
                                render={({ field }) => (
                                  <Input
                                    id="email"
                                    type="email"
                                    className="h-11 sm:h-10"
                                    aria-invalid={Boolean(errors.email)}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                  />
                                )}
                              />
                              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                              <Label htmlFor="phone" className="text-sm">
                                Telefone
                              </Label>
                              <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                  <Input
                                    id="phone"
                                    type="tel"
                                    className="h-11 sm:h-10"
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                  />
                                )}
                              />
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                              <Label id="subject-label" className="text-sm">
                                Assunto
                              </Label>
                              <Controller
                                name="subject"
                                control={control}
                                render={({ field }) => (
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger aria-labelledby="subject-label" className="h-11 sm:h-10">
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="duvida">Duvida</SelectItem>
                                      <SelectItem value="sugestao">Sugestao</SelectItem>
                                      <SelectItem value="reclamacao">Reclamacao</SelectItem>
                                      <SelectItem value="parceria">Parceria</SelectItem>
                                      <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2">
                            <Label htmlFor="message" className="text-sm">
                              Mensagem
                            </Label>
                            <Controller
                              name="message"
                              control={control}
                              rules={{
                                required: "Digite sua mensagem.",
                                minLength: {
                                  value: 10,
                                  message: "Digite pelo menos 10 caracteres.",
                                },
                              }}
                              render={({ field }) => (
                                <Textarea
                                  id="message"
                                  rows={4}
                                  className="min-h-[100px] sm:min-h-[120px]"
                                  aria-invalid={Boolean(errors.message)}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                />
                              )}
                            />
                            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                          </div>

                          <Button type="submit" className="h-11 w-full sm:h-10" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar mensagem"
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
