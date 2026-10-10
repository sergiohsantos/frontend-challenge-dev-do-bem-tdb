import { scrollToAnchor } from "@/lib/scroll-to-anchor"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { Smile, Brain, Heart, Users, CheckCircle2, Award, Sparkles, Loader2, ArrowRight } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useLocation } from "react-router-dom"
import { apiFetch, type Program } from "@/lib/api"

const fallbackPrograms = [
  {
    id: "dentista-do-bem",
    icon: Smile,
    title: "Dentista do Bem",
    subtitle: "Tratamento odontológico gratuito para jovens",
    description: "O programa Dentista do Bem oferece tratamento odontológico completo e gratuito para crianças e adolescentes de 11 a 17 anos em situação de vulnerabilidade social.",
    impact: "+90 mil jovens atendidos",
    benefits: [
      "Tratamento odontológico completo sem custo",
      "Acompanhamento até os 18 anos",
      "Dentistas voluntários qualificados",
      "Atendimento humanizado",
    ],
    requirements: [
      "Ter entre 11 e 17 anos",
      "Estar em situação de vulnerabilidade social",
      "Apresentar documentos solicitados",
    ],
    cta: { beneficiary: "/cadastro/beneficiario", volunteer: "/cadastro/voluntario" },
    color: "bg-primary",
    textColor: "text-primary",
  },
  {
    id: "apolonias-do-bem",
    icon: Heart,
    title: "Apolônias do Bem",
    subtitle: "Reconstruindo sorrisos e restaurando vidas",
    description: "O programa Apolônias do Bem oferece tratamento odontológico gratuito para mulheres que tiveram a dentição afetada por situações de violência.",
    impact: "+1,2 mil mulheres acolhidas",
    highlight: "Acolhimento especializado",
    benefits: [
      "Tratamento odontológico completo e gratuito",
      "Atendimento humanizado e sigiloso",
      "Reconstrução dentária especializada",
      "Apoio à autoestima",
    ],
    requirements: [
      "Ser mulher cis ou trans",
      "Ter sofrido violência que afetou a dentição",
      "Compromisso com o tratamento",
    ],
    cta: { beneficiary: "/cadastro/apolonias", volunteer: "/cadastro/voluntario" },
    color: "bg-accent",
    textColor: "text-accent",
  },
  {
    id: "psicologo-do-bem",
    icon: Brain,
    title: "Psicólogos para o Bem",
    subtitle: "Apoio psicológico gratuito",
    description: "O programa Psicólogos para o Bem oferece suporte emocional e psicológico gratuito para jovens que necessitam de acompanhamento.",
    benefits: [
      "Atendimento psicológico individual gratuito",
      "Profissionais voluntários especializados",
      "Acolhimento humanizado e sigiloso",
      "Orientação para famílias",
    ],
    requirements: [
      "Ser beneficiário do Dentista do Bem ou indicado",
      "Necessitar de apoio psicológico",
      "Compromisso com as sessões agendadas",
    ],
    cta: { beneficiary: "/cadastro/beneficiario", volunteer: "/cadastro/voluntario" },
    color: "bg-success",
    textColor: "text-success",
  },
]

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
    .replace(/[\u0300-\u036f]/g, "")
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
    impact: fallback?.impact || (apiProgram.stats?.beneficiaries ? `+${apiProgram.stats.beneficiaries.toLocaleString("pt-BR")} atendidos` : undefined),
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
  
  const { hash } = useLocation()
  useEffect(() => {
    if (!carouselApi || !hash) return
    let target: string
    try { target = decodeURIComponent(hash.slice(1)) } catch { return }
    const index = programs.findIndex(program => program.id === target)
    if (index < 0) return
    carouselApi.scrollTo(index, true)
    const frame = requestAnimationFrame(() => scrollToAnchor(target))
    return () => cancelAnimationFrame(frame)
  }, [carouselApi, hash, programs])

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
        setPrograms(fallbackPrograms as DisplayProgram[])
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
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="tdb-premium-shell relative overflow-hidden bg-primary py-16 text-primary-foreground sm:py-20 lg:py-28">
          <div className="tdb-orb left-[-5rem] top-12 h-72 w-72 bg-secondary" aria-hidden="true" />
          <div className="tdb-orb tdb-orb-delayed bottom-[-5rem] right-[-5rem] h-80 w-80 bg-accent" aria-hidden="true" />
          <div className="container relative mx-auto grid gap-10 px-4 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="tdb-reveal text-center lg:text-left">
              <span className="inline-flex rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Programas Turma do Bem</span>
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-7xl">Caminhos diferentes, uma mesma rede de cuidado.</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-primary-foreground/86 sm:text-lg lg:mx-0">Conheça as iniciativas que conectam beneficiários, voluntários e equipe TDB em jornadas de atendimento claras, acolhedoras e acompanhadas.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Button size="lg" asChild className="h-14 gap-2 rounded-full bg-accent px-7 text-base font-black text-accent-foreground hover:bg-accent/90"><Link to="/cadastro/beneficiario">Começar cadastro<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
                <Button size="lg" variant="outline" asChild className="h-14 gap-2 rounded-full border-primary-foreground/30 bg-transparent px-7 text-base font-black text-primary-foreground hover:bg-primary-foreground/10"><Link to="/cadastro/voluntario"><Users className="h-5 w-5" aria-hidden="true" />Atuar como voluntário</Link></Button>
              </div>
            </div>

            <div className="tdb-reveal tdb-reveal-delay-2 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Smile, value: "+90 mil", label: "jovens atendidos" },
                { icon: Users, value: "+18 mil", label: "dentistas voluntários" },
                { icon: Heart, value: "+1,2 mil", label: "mulheres acolhidas" },
                { icon: Award, value: "+1.300", label: "municípios alcançados" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-5 text-left backdrop-blur">
                  <stat.icon className="h-7 w-7 text-secondary" aria-hidden="true" />
                  <p className="mt-4 text-3xl font-black tracking-tight">{stat.value}</p>
                  <p className="mt-1 text-sm font-semibold text-primary-foreground/76">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center tdb-reveal">
              <span className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-sm font-extrabold uppercase tracking-[0.22em] text-accent">Jornadas de atendimento</span>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">Escolha um programa e entenda como a rede acompanha cada etapa.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Cada frente de cuidado tem critérios, contexto e orientação próprios, preservando a identidade dos programas da Turma do Bem.</p>
            </div>

            {isLoading ? (
              <div className="mt-10 flex items-center justify-center rounded-[2rem] border border-border bg-card p-8 text-muted-foreground">
                <Loader2 className="mr-3 h-5 w-5 animate-spin" aria-hidden="true" />Carregando programas...
              </div>
            ) : (
              <>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  {programs.map((program, index) => (
                    <button
                      key={program.id}
                      onClick={() => scrollTo(index)}
                      aria-pressed={activeIndex === index}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all ${
                        activeIndex === index
                          ? `${program.color} ${program.color === "bg-primary" ? "text-primary-foreground" : program.color === "bg-accent" ? "text-accent-foreground" : "text-success-foreground"} shadow-lg shadow-primary/10`
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <program.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{program.title}</span>
                    </button>
                  ))}
                </div>

                <div className="relative mx-auto mt-8 max-w-6xl">
                  <Carousel setApi={setCarouselApi} opts={{ align: "center", loop: true }} className="w-full">
                    <CarouselContent>
                      {programs.map((program) => (
                        <CarouselItem key={program.id} className="md:basis-full">
                          <div className="p-2">
                            <Card id={program.id} className="tdb-polished-card overflow-hidden rounded-[2.5rem] border border-border/70 shadow-2xl shadow-primary/5">
                              <div className={`relative ${program.color} p-8 lg:p-12`}>
                                <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
                                <div className={`relative flex flex-col items-center text-center ${program.color === "bg-primary" ? "text-primary-foreground" : program.color === "bg-accent" ? "text-accent-foreground" : "text-success-foreground"}`}>
                                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
                                    <program.icon className="h-10 w-10" aria-hidden="true" />
                                  </div>
                                  <h2 className="text-3xl font-black tracking-tight lg:text-5xl">{program.title}</h2>
                                  <p className="mt-3 max-w-2xl text-sm font-semibold opacity-90 sm:text-base">{program.subtitle}</p>
                                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                    {program.impact && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-xs font-black backdrop-blur">
                                        <Award className="h-3.5 w-3.5" aria-hidden="true" />
                                        {program.impact}
                                      </span>
                                    )}
                                    {program.highlight && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-xs font-black backdrop-blur">
                                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                        {program.highlight}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <CardContent className="p-6 lg:p-10">
                                <p className="mx-auto max-w-3xl text-center text-base leading-8 text-muted-foreground lg:text-lg">{program.description}</p>

                                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                                  <div className="rounded-[2rem] bg-muted/40 p-5">
                                    <h3 className={`flex items-center gap-2 text-lg font-black ${program.textColor}`}>
                                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                                      O que oferecemos
                                    </h3>
                                    <ul className="mt-4 space-y-3">
                                      {program.benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-start gap-2 text-sm leading-6 text-foreground">
                                          <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${program.textColor}`} aria-hidden="true" />
                                          {benefit}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div className="rounded-[2rem] bg-muted/40 p-5">
                                    <h3 className="flex items-center gap-2 text-lg font-black text-foreground">
                                      <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                      Critérios e orientação
                                    </h3>
                                    <ul className="mt-4 space-y-3">
                                      {program.requirements.map((req) => (
                                        <li key={req} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                                          <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${program.color}`} aria-hidden="true" />
                                          {req}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:justify-center">
                                  <Button size="lg" asChild className={`h-12 gap-2 rounded-full font-black ${program.color} hover:opacity-90`}>
                                    <Link to={program.cta.beneficiary}>
                                      <Heart className="h-5 w-5" aria-hidden="true" />
                                      Quero participar
                                    </Link>
                                  </Button>
                                  <Button size="lg" variant="outline" asChild className="h-12 gap-2 rounded-full font-black">
                                    <Link to={program.cta.volunteer}>
                                      <Users className="h-5 w-5" aria-hidden="true" />
                                      Seja voluntário
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
                      aria-pressed={activeIndex === index}
                        className={`h-2 rounded-full transition-all ${
                          activeIndex === index ? `w-8 ${program.color}` : "w-2 bg-muted-foreground/30"
                        }`}
                        aria-label={`Ver ${program.title}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}

