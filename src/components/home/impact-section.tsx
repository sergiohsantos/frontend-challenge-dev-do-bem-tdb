import { Heart, Smile, Users, Building2 } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

// Impact section with i18n support
export function ImpactSection() {
  const { t } = useTranslation()
  
  const stats = [
    {
      icon: Heart,
      value: "+90.000",
      label: t.home.impact.stats.smiles,
      description: t.home.impact.stats.smilesDesc,
    },
    {
      icon: Users,
      value: "+18.000",
      label: t.home.impact.stats.volunteers,
      description: t.home.impact.stats.volunteersDesc,
    },
    {
      icon: Building2,
      value: "+1.300",
      label: t.home.impact.stats.cities,
      description: t.home.impact.stats.citiesDesc,
    },
    {
      icon: Smile,
      value: "98%",
      label: t.home.impact.stats.satisfaction,
      description: t.home.impact.stats.satisfactionDesc,
    },
  ]

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24" aria-labelledby="impact-heading">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 
            id="impact-heading"
            className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl"
          >
            {t.home.impact.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-lg">
            {t.home.impact.subtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={`stat-${index}`}
              className="group rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/30 hover:shadow-lg sm:rounded-2xl sm:p-6"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:h-14 sm:w-14">
                <stat.icon className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground sm:mt-4 sm:text-3xl lg:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground sm:mt-2 sm:text-base">
                {stat.label}
              </p>
              <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
