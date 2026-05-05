import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { Smile, Brain, Heart, Users, CheckCircle2, Award, Sparkles, Loader2 } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { apiFetch, type Program } from "@/lib/api"

// Fallback data when API is unavailable
const fallbackPrograms = [
  {
    id: "dentista-do-bem",
    icon: Smile,
    title: "Dentista do Bem",
    subtitle: "Tratamento odontologico gratuito para jovens",
    description: "O programa Dentista do Bem oferece tratamento odontologico completo e gratuito para criancas e adolescentes de 11 a 17 anos em situacao de vulnerabilidade social.",
    impact: "+90 mil jovens atendidos",
    benefits: [
      "Tratamento odontologico completo sem custo",
      "Acompanhamento ate os 18 anos",
      "Dentistas voluntarios qualificados",
      "Atendimento humanizado",
    ],
    requirements: [
      "Ter entre 11 e 17 anos",
      "Estar em situacao de vulnerabilidade social",
      "Apresentar documentos solicitados",
    ],
    cta: { beneficiary: "/cadastro/beneficiario", volunteer: "/cadastro/voluntario" },
    color: "bg-primary",
    textColor: "text-primary",
  },
  {
    id: "apolonias-do-bem",
    icon: Heart,
    title: "Apolonias do Bem",
    subtitle: "Reconstruindo sorrisos, restaurando vidas",
    description: "O programa Apolonias do Bem oferece tratamento odontologico gratuito para mulheres vitimas de violencia domestica que tiveram seus dentes afetados.",
    impact: "+1.400 mulheres atendidas",
    highlight: "Lei Federal em 2025",
    benefits: [
      "Tratamento odontologico completo e gratuito",
      "Atendimento humanizado e sigiloso",
      "Reconstrucao dentaria especializada",
      "Apoio a autoestima",
    ],
    requirements: [
      "Ser mulher (cis ou trans)",
      "Ter sofrido violencia que afetou a denticao",
      "Compromisso com o tratamento",
    ],
    cta: { beneficiary: "/cadastro/apolonias", volunteer: "/cadastro/voluntario" },
    color: "bg-accent",
    textColor: "text-accent",
  },
  {
    id: "psicologo-do-bem",
    icon: Brain,
    title: "Psicologo do Bem",
    subtitle: "Apoio psicologico gratuito",
    description: "O programa Psicologo do Bem oferece suporte emocional e psicologico gratuito para jovens que necessitam de acompanhamento.",
    benefits: [
      "Atendimento psicologico individual gratuito",
      "Profissionais voluntarios especializados",
      "Acolhimento humanizado e sigiloso",
      "Orientacao para familias",
    ],
    requirements: [
      "Ser beneficiario do Dentista do Bem ou indicado",
      "Necessitar de apoio psicologico",
      "Compromisso com as sessoes agendadas",
    ],
    cta: { beneficiary: "/cadastro/beneficiario", volunteer: "/cadastro/voluntario" },
    color: "bg-success",
    textColor: "text-success",
  },
]

// Map API program data to display format
interface DisplayProgram {
  id: string
  icon: typeof Smile
  title: string
  subtitle: string
  description: string
  impact?: string
  highlight?: string
  benefits: string[]
  requirements: string[]
  cta: { beneficiary: string; volunteer: string }
  color: string
  textColor: string
}

function normalizeProgramKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function mapApiProgramToDisplay(apiProgram: Program, index: number): DisplayProgram {
  const icons = [Smile, Heart, Brain]
  const colors = ["bg-primary", "bg-accent", "bg-success"]
  const textColors = ["text-primary", "text-accent", "text-success"]
  const programCodeFallbackIds: Record<string, string> = {
    dentistas_do_bem: "dentista-do-bem",
    apolonias_do_bem: "apolonias-do-bem",
    psicologos_para_o_bem: "psicologo-do-bem",
  }
  const slug = (apiProgram.code && programCodeFallbackIds[apiProgram.code]) || apiProgram.slug || normalizeProgramKey(apiProgram.name)
  const fallback = (fallbackPrograms as DisplayProgram[]).find((item) => item.id === slug || normalizeProgramKey(item.title) === slug)

  return {
    id: slug,
    icon: fallback?.icon || icons[index % 3],
    title: apiProgram.name,
    subtitle: fallback?.subtitle || apiProgram.description || "Programa ativo da Turma do Bem",
    description: fallback?.description || apiProgram.longDescription || apiProgram.description,
    impact: fallback?.impact || (apiProgram.stats?.beneficiaries ? `+${apiProgram.stats.beneficiaries.toLocaleString()} atendidos` : undefined),
    highlight: fallback?.highlight,
    benefits: fallback?.benefits || apiProgram.features || ["Atendimento humanizado", "Acompanhamento especializado", "Fluxo organizado de comunicação"],
    requirements: fallback?.requirements || apiProgram.requirements || ["Cadastro completo", "Análise da elegibilidade", "Acompanhamento conforme disponibilidade do programa"],
    cta: fallback?.cta || { beneficiary: "/cadastro/beneficiario", volunteer: "/cadastro/voluntario" },
    color: fallback?.color || colors[index % 3],
    textColor: fallback?.textColor || textColors[index % 3],
  }
}

export default function ProgramasPage() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [programs, setPrograms] = useState<DisplayProgram[]>(fallbackPrograms as DisplayProgram[])
  const [isLoading, setIsLoading] = useState(true)
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true, playOnInit: true })
  )

  // Fetch programs from API
  useEffect(() => {
    async function fetchPrograms() {
      try {
        const response = await apiFetch<Program[]>("/api/public/programs")
        if (response && response.length > 0) {
          setPrograms(response.map((p, i) => mapApiProgramToDisplay(p, i)))
        } else {
          setPrograms(fallbackPrograms as DisplayProgram[])
        }
      } catch {
        // Use fallback data on error - no need to show error to user
      } finally {
        setIsLoading(false)
      }
    }
    fetchPrograms()
  }, [])

  useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => setActiveIndex(carouselApi.selectedScrollSnap())
    carouselApi.on("select", onSelect)
    onSelect()
    return () => { carouselApi.off("select", onSelect) }
  }, [carouselApi])

  const scrollTo = (index: number) => {
    carouselApi?.scrollTo(index)
    autoplayPlugin.current.reset()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-primary py-12 lg:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
              Nossos Programas
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
              Conheca as iniciativas da Turma do Bem que transformam vidas
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-center gap-3">
              {programs.map((program, index) => (
                <button
                  key={program.id}
                  onClick={() => scrollTo(index)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeIndex === index
                      ? `${program.color} text-white`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <program.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{program.title}</span>
                </button>
              ))}
            </div>

            <div className="relative mx-auto max-w-6xl">
              <Carousel setApi={setCarouselApi} opts={{ align: "center", loop: true }} plugins={[autoplayPlugin.current]} className="w-full">
                <CarouselContent>
                  {programs.map((program) => (
                    <CarouselItem key={program.id} className="md:basis-full">
                      <div className="p-2">
                        <Card className="overflow-hidden border-2">
                          <div className={`relative ${program.color} p-8 lg:p-12`}>
                            <div className="flex flex-col items-center text-center text-primary-foreground">
                              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                                <program.icon className="h-10 w-10" />
                              </div>
                              <h2 className="text-2xl font-bold lg:text-4xl">{program.title}</h2>
                              <p className="mt-2 text-sm opacity-90">{program.subtitle}</p>
                              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                {program.impact && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                                    <Award className="h-3 w-3" />
                                    {program.impact}
                                  </span>
                                )}
                                {program.highlight && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                                    <Sparkles className="h-3 w-3" />
                                    {program.highlight}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-6 lg:p-10">
                            <p className="text-center text-muted-foreground lg:text-lg">{program.description}</p>

                            <div className="mt-8 grid gap-8 lg:grid-cols-2">
                              <div>
                                <h3 className={`flex items-center gap-2 text-lg font-semibold ${program.textColor}`}>
                                  <CheckCircle2 className="h-5 w-5" />
                                  O que oferecemos
                                </h3>
                                <ul className="mt-4 space-y-2">
                                  {program.benefits.map((benefit) => (
                                    <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                                      <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${program.textColor}`} />
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                  Requisitos
                                </h3>
                                <ul className="mt-4 space-y-2">
                                  {program.requirements.map((req) => (
                                    <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                                      <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${program.color}`} />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:justify-center">
                              <Button size="lg" asChild className={`h-12 gap-2 ${program.color} hover:opacity-90`}>
                                <Link to={program.cta.beneficiary}>
                                  <Heart className="h-5 w-5" />
                                  Quero Participar
                                </Link>
                              </Button>
                              <Button size="lg" variant="outline" asChild className="h-12 gap-2">
                                <Link to={program.cta.volunteer}>
                                  <Users className="h-5 w-5" />
                                  Seja Voluntario
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 h-12 w-12 border-2 bg-background shadow-lg hover:bg-muted lg:-left-6" />
                <CarouselNext className="right-0 h-12 w-12 border-2 bg-background shadow-lg hover:bg-muted lg:-right-6" />
              </Carousel>

              <div className="mt-6 flex items-center justify-center gap-2">
                {programs.map((program, index) => (
                  <button
                    key={`indicator-${program.id}`}
                    onClick={() => scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      activeIndex === index ? `w-8 ${program.color}` : "w-2 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center rounded-xl bg-background p-6 text-center shadow-sm">
                <Smile className="mb-2 h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-foreground">+18 mil</span>
                <span className="text-sm text-muted-foreground">Dentistas voluntarios</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-background p-6 text-center shadow-sm">
                <Heart className="mb-2 h-8 w-8 text-accent" />
                <span className="text-2xl font-bold text-foreground">+90 mil</span>
                <span className="text-sm text-muted-foreground">Jovens atendidos</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-background p-6 text-center shadow-sm">
                <Users className="mb-2 h-8 w-8 text-success" />
                <span className="text-2xl font-bold text-foreground">+1.400</span>
                <span className="text-sm text-muted-foreground">Mulheres atendidas</span>
              </div>
              <div className="flex flex-col items-center rounded-xl bg-background p-6 text-center shadow-sm">
                <Award className="mb-2 h-8 w-8 text-warning" />
                <span className="text-2xl font-bold text-foreground">+1.300</span>
                <span className="text-sm text-muted-foreground">Municipios alcancados</span>
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
