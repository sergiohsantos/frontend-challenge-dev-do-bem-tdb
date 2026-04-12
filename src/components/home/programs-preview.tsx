import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowRight, Smile, Heart } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function ProgramsPreview() {
  const { t } = useTranslation()
  
  const programs = [
    {
      id: "dentista-do-bem",
      icon: Smile,
      title: t.home.programs.dentista.title,
      description: t.home.programs.dentista.description,
      features: [
        t.home.programs.dentista.features.treatment,
        t.home.programs.dentista.features.followup,
        t.home.programs.dentista.features.location,
      ],
      href: "/programas#dentista-do-bem",
      color: "bg-primary",
    },
    {
      id: "apolonias-do-bem",
      icon: Heart,
      title: t.home.programs.apolonias.title,
      description: t.home.programs.apolonias.description,
      features: [
        t.home.programs.apolonias.features.women,
        t.home.programs.apolonias.features.smile,
        t.home.programs.apolonias.features.impact,
      ],
      href: "/programas#apolonias-do-bem",
      color: "bg-accent",
    },
  ]

  return (
    <section className="bg-secondary py-12 sm:py-16 lg:py-24" aria-labelledby="programs-heading">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 
              id="programs-heading"
              className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl"
            >
              {t.home.programs.title}
            </h2>
            <p className="mt-1 text-base text-muted-foreground sm:mt-2 sm:text-lg">
              {t.home.programs.subtitle}
            </p>
          </div>
          <Button variant="outline" size="default" asChild className="gap-2 sm:size-lg">
            <Link to="/programas">
              {t.home.programs.viewAll}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:mt-10 sm:gap-6 md:grid-cols-2">
          {programs.map((program) => (
            <article 
              key={program.id}
              className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg sm:rounded-2xl sm:p-6"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${program.color} text-primary-foreground sm:h-14 sm:w-14 sm:rounded-xl`}>
                <program.icon className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
              
              <h3 className="mt-4 text-lg font-bold text-foreground sm:mt-5 sm:text-xl">
                {program.title}
              </h3>
              
              <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed sm:mt-3 sm:text-base">
                {program.description}
              </p>

              <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                {program.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-foreground sm:text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary sm:mt-1.5" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link 
                to={program.href}
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:mt-6"
              >
                {t.home.programs.learnMore}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
