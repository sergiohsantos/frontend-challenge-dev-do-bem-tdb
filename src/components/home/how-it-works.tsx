import { ClipboardList, UserCheck, Calendar, Smile } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function HowItWorks() {
  const { t } = useTranslation()
  
  const steps = [
    {
      number: 1,
      icon: ClipboardList,
      title: t.home.howItWorks.steps.register.title,
      description: t.home.howItWorks.steps.register.description,
    },
    {
      number: 2,
      icon: UserCheck,
      title: t.home.howItWorks.steps.confirmation.title,
      description: t.home.howItWorks.steps.confirmation.description,
    },
    {
      number: 3,
      icon: Calendar,
      title: t.home.howItWorks.steps.schedule.title,
      description: t.home.howItWorks.steps.schedule.description,
    },
    {
      number: 4,
      icon: Smile,
      title: t.home.howItWorks.steps.treatment.title,
      description: t.home.howItWorks.steps.treatment.description,
    },
  ]

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 
            id="how-it-works-heading"
            className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl"
          >
            {t.home.howItWorks.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-lg">
            {t.home.howItWorks.subtitle}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-12 sm:gap-8 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div 
                  className="absolute left-[calc(50%+40px)] top-10 hidden h-0.5 w-[calc(100%-80px)] bg-border lg:block"
                  aria-hidden="true"
                />
              )}
              
              {/* Step Number */}
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground sm:h-20 sm:w-20">
                  <step.icon className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                </div>
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground sm:h-8 sm:w-8 sm:text-sm">
                  {step.number}
                </span>
              </div>

              <h3 className="mt-4 text-base font-bold text-foreground sm:mt-6 sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed sm:mt-2 sm:text-base">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
