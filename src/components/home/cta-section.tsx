import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Heart, Users, Phone } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function CTASection() {
  const { t } = useTranslation()
  
  return (
    <section className="bg-primary py-12 sm:py-16 lg:py-24" aria-labelledby="cta-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 
            id="cta-heading"
            className="text-xl font-bold text-primary-foreground sm:text-2xl md:text-3xl lg:text-4xl"
          >
            {t.home.cta.title}
          </h2>
          <p className="mt-3 text-base text-primary-foreground/90 sm:mt-4 sm:text-lg">
            {t.home.cta.subtitle}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 px-4 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4 sm:px-0">
            <Button 
              size="lg" 
              asChild
              className="h-14 w-full gap-2 bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90 sm:w-auto sm:min-w-[200px] sm:text-lg"
            >
              <Link to="/cadastro/beneficiario">
                <Heart className="h-5 w-5" aria-hidden="true" />
                {t.home.cta.participate}
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
                {t.home.cta.volunteer}
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-1 text-sm text-primary-foreground/80 sm:mt-10 sm:gap-2 sm:text-base">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span>{t.home.cta.needHelp}</span>
            <a 
              href="tel:08007777766" 
              className="font-semibold text-primary-foreground hover:underline"
            >
              0800 777 7766
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
