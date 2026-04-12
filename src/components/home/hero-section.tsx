import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Heart, Users } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function HeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-primary py-16 lg:py-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="hero-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-pattern)" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground">
            <Heart className="h-4 w-4" aria-hidden="true" />
            <span>{t.home.hero.badge}</span>
          </div>

          {/* Main Heading */}
          <h1 className="max-w-4xl text-balance text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            {t.home.hero.title}{" "}
            <span className="text-accent">{t.home.hero.highlight}</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-pretty text-lg text-primary-foreground/90 sm:text-xl">
            {t.home.hero.description}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex w-full max-w-md flex-col items-center gap-3 px-4 sm:mt-10 sm:flex-row sm:justify-center sm:max-w-none sm:px-0">
            <Button 
              size="lg" 
              asChild
              className="h-14 w-full gap-2 bg-accent text-accent-foreground text-base font-semibold hover:bg-accent/90 sm:w-auto sm:min-w-[200px] sm:text-lg"
            >
              <Link to="/cadastro/beneficiario">
                <Heart className="h-5 w-5" aria-hidden="true" />
                {t.home.hero.cta}
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              asChild
              className="h-14 w-full gap-2 border-primary-foreground/30 bg-transparent text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto sm:min-w-[200px] sm:text-lg"
            >
              <Link to="/cadastro/voluntario">
                <Users className="h-5 w-5" aria-hidden="true" />
                {t.home.hero.ctaVolunteer}
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-primary-foreground/20 pt-8 sm:mt-12 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8">
            <div className="flex flex-col items-center rounded-lg bg-primary-foreground/5 p-3 sm:bg-transparent sm:p-0">
              <span className="text-2xl font-bold text-primary-foreground sm:text-3xl">+90 mil</span>
              <span className="text-xs text-primary-foreground/80 sm:text-sm">{t.home.hero.statsYouth}</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-primary-foreground/5 p-3 sm:bg-transparent sm:p-0">
              <span className="text-2xl font-bold text-primary-foreground sm:text-3xl">+18 mil</span>
              <span className="text-xs text-primary-foreground/80 sm:text-sm">{t.home.hero.statsDentists}</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-primary-foreground/5 p-3 sm:bg-transparent sm:p-0">
              <span className="text-2xl font-bold text-primary-foreground sm:text-3xl">+1.300</span>
              <span className="text-xs text-primary-foreground/80 sm:text-sm">{t.home.hero.statsCities}</span>
            </div>
            <div className="flex flex-col items-center rounded-lg bg-primary-foreground/5 p-3 sm:bg-transparent sm:p-0">
              <span className="text-2xl font-bold text-primary-foreground sm:text-3xl">+1,2 mil</span>
              <span className="text-xs text-primary-foreground/80 sm:text-sm">{t.home.hero.statsWomen}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
