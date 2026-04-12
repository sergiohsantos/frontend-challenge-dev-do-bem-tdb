import { useEffect, useRef } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useTranslation } from "@/lib/i18n"

// Apoiadores e mantenedores da Turma do Bem
const supporters = [
  { name: "Surya Dental", type: "mantenedor" },
  { name: "Kess", type: "mantenedor" },
  { name: "3M", type: "apoiador" },
  { name: "Colgate", type: "apoiador" },
  { name: "Oral-B", type: "apoiador" },
  { name: "Sensodyne", type: "apoiador" },
  { name: "Dentalclean", type: "apoiador" },
  { name: "Dental Cremer", type: "apoiador" },
  { name: "Henry Schein", type: "apoiador" },
  { name: "Orthometric", type: "apoiador" },
  { name: "FGM", type: "apoiador" },
  { name: "Angelus", type: "apoiador" },
]

export function SupportersCarousel() {
  const { t } = useTranslation()
  const autoplayPlugin = useRef(
    Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  return (
    <section className="bg-muted/30 py-10 sm:py-12 lg:py-16" aria-labelledby="supporters-heading">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center sm:mb-8">
          <h2 
            id="supporters-heading"
            className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl"
          >
            {t.home.supporters?.title || "Nossos Apoiadores e Mantenedores"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:mt-2 sm:text-sm">
            {t.home.supporters?.subtitle || "Empresas que acreditam na transformacao atraves do sorriso"}
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          plugins={[autoplayPlugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {supporters.map((supporter, index) => (
              <CarouselItem 
                key={`${supporter.name}-${index}`} 
                className="basis-1/2 pl-2 sm:basis-1/3 md:basis-1/4 md:pl-4 lg:basis-1/6"
              >
                <div className="flex h-16 items-center justify-center rounded-lg border border-border/50 bg-background px-3 py-2 transition-colors hover:border-primary/30 sm:h-20 sm:px-4 sm:py-3">
                  <div className="text-center">
                    <span className="block truncate text-xs font-medium text-foreground/80 sm:text-sm">
                      {supporter.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                      {supporter.type === "mantenedor" 
                        ? (t.home.supporters?.maintainer || "Mantenedor") 
                        : (t.home.supporters?.supporter || "Apoiador")}
                    </span>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <p className="mt-4 text-center text-xs text-muted-foreground sm:mt-6">
          {t.home.supporters?.cta || "Quer ser um apoiador?"}{" "}
          <a 
            href="/contato" 
            className="font-medium text-primary hover:underline"
          >
            {t.home.supporters?.contactUs || "Entre em contato"}
          </a>
        </p>
      </div>
    </section>
  )
}
