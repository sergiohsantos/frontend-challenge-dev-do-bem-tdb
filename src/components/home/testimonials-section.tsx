import { Quote } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

export function TestimonialsSection() {
  const { t } = useTranslation()
  
  const testimonials = [
    {
      id: 1,
      quote: t.home.testimonials.items.maria.quote,
      author: t.home.testimonials.items.maria.author,
      role: t.home.testimonials.items.maria.role,
      location: "São Paulo, SP",
    },
    {
      id: 2,
      quote: t.home.testimonials.items.ana.quote,
      author: t.home.testimonials.items.ana.author,
      role: t.home.testimonials.items.ana.role,
      location: "Rio de Janeiro, RJ",
    },
    {
      id: 3,
      quote: t.home.testimonials.items.francisca.quote,
      author: t.home.testimonials.items.francisca.author,
      role: t.home.testimonials.items.francisca.role,
      location: "Salvador, BA",
    },
  ]

  return (
    <section className="bg-secondary py-12 sm:py-16 lg:py-24" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 
            id="testimonials-heading"
            className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl lg:text-4xl"
          >
            {t.home.testimonials.title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:mt-4 sm:text-lg">
            {t.home.testimonials.subtitle}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote 
              key={testimonial.id}
              className="flex flex-col rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6"
            >
              <Quote className="h-6 w-6 text-primary/30 sm:h-8 sm:w-8" aria-hidden="true" />
              
              <p className="mt-3 flex-1 text-base text-foreground leading-relaxed sm:mt-4 sm:text-lg">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              <footer className="mt-4 flex items-center gap-3 border-t border-border pt-4 sm:mt-6 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary sm:h-12 sm:w-12 sm:text-lg">
                  {testimonial.author.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{testimonial.author}</p>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {testimonial.role} • {testimonial.location}
                  </p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
