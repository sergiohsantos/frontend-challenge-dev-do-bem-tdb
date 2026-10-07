import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeneficiaryPageHeroProps {
  eyebrow: string
  title: string
  description: string
  icon: ReactNode
  backTo?: string
  backLabel?: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  meta?: ReactNode
}

export function BeneficiaryPageHero({
  eyebrow,
  title,
  description,
  icon,
  backTo = "/dashboard/beneficiario",
  backLabel = "Voltar ao painel",
  primaryAction,
  secondaryAction,
  meta,
}: BeneficiaryPageHeroProps) {
  return (
    <section className="tdb-premium-shell relative mb-8 min-h-[21.5rem] overflow-hidden rounded-[2.5rem] bg-primary p-6 text-primary-foreground shadow-2xl shadow-primary/20 lg:p-8">
      <div className="tdb-orb -left-16 top-4 h-56 w-56 bg-secondary" aria-hidden="true" />
      <div className="tdb-orb tdb-orb-delayed -right-16 bottom-0 h-64 w-64 bg-accent" aria-hidden="true" />

      <div className="relative grid h-full gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-10 rounded-full px-3 font-bold text-primary-foreground/86 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to={backTo}>
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {backLabel}
              </Link>
            </Button>

            <div className="inline-flex h-10 items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-4 text-sm font-black uppercase tracking-[0.18em] text-accent">
              {icon}
              {eyebrow}
            </div>
          </div>

          <h1 className="max-w-3xl text-3xl font-black leading-[1.02] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-primary-foreground/84">{description}</p>

          {meta ? <div className="tdb-beneficiary-hero-meta mt-6 flex flex-wrap items-center gap-2 text-sm text-primary-foreground/82">{meta}</div> : null}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="tdb-beneficiary-hero-actions flex w-full flex-wrap gap-3 lg:w-auto lg:min-w-[360px] lg:justify-end">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </div>
    </section>
  )
}
