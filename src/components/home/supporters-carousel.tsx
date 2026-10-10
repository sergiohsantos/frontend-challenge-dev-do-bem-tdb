import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"

const supporters = [
  { name: "Surya Dental", type: "mantenedor" },
  { name: "Colgate", type: "apoiador" },
  { name: "Kess", type: "mantenedor" },
  { name: "3M", type: "apoiador" },
  { name: "Dentalclean", type: "apoiador" },
  { name: "Dental Cremer", type: "apoiador" },
  { name: "Henry Schein", type: "apoiador" },
  { name: "Sensodyne", type: "apoiador" },
  { name: "Orthometric", type: "apoiador" },
  { name: "FGM", type: "apoiador" },
  { name: "Oral-B", type: "apoiador" },
  { name: "Angelus", type: "apoiador" },
]

export function SupportersCarousel() {

  return (
    <section className="bg-muted/30 py-10 sm:py-12 lg:py-16" aria-labelledby="supporters-heading">
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center sm:mb-8">
          <h2 id="supporters-heading" className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Apoiadores e mantenedores</h2>
          <p className="mt-2 text-sm text-muted-foreground">Empresas que acreditam na transformação por meio do sorriso.</p>
        </div>
        <Carousel opts={{ align: "start", loop: true, dragFree: true }} className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {supporters.map((supporter) => (
              <CarouselItem key={supporter.name} className="basis-1/2 pl-2 sm:basis-1/3 md:basis-1/4 md:pl-4 lg:basis-1/6">
                <div className="flex h-20 items-center justify-center rounded-2xl border border-border/60 bg-background px-3 py-2 shadow-sm transition-colors hover:border-primary/30 sm:h-24 sm:px-4 sm:py-3">
                  <div className="text-center"><span className="block truncate text-sm font-bold text-foreground/80">{supporter.name}</span><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{supporter.type === "mantenedor" ? "Mantenedor" : "Apoiador"}</span></div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-4 flex justify-center gap-3">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
        <p className="mt-6 text-center text-xs text-muted-foreground">Quer ser um apoiador? <a href="/contato" className="font-bold text-primary hover:underline">Entre em contato</a></p>
      </div>
    </section>
  )
}

