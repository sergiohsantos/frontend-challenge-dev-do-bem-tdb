import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const emptyVariants = cva(
  'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-xl p-6 text-center text-balance md:p-12',
  {
    variants: {
      variant: {
        default: 'border border-dashed border-border/60 bg-muted/20',
        card: 'bg-card border border-border shadow-sm',
        subtle: 'bg-transparent',
        highlight: 'bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface EmptyProps extends React.ComponentProps<'div'>, VariantProps<typeof emptyVariants> {}

function Empty({ className, variant, ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(emptyVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        'flex max-w-sm flex-col items-center gap-2 text-center',
        className,
      )}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center mb-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 transition-transform',
  {
    variants: {
      variant: {
        default: 'bg-transparent text-muted-foreground [&_svg]:h-12 [&_svg]:w-12',
        icon: "bg-gradient-to-br from-muted to-muted/50 text-muted-foreground flex size-16 shrink-0 items-center justify-center rounded-2xl shadow-sm [&_svg:not([class*='size-'])]:size-7",
        primary: "bg-gradient-to-br from-primary/10 to-primary/5 text-primary flex size-16 shrink-0 items-center justify-center rounded-2xl [&_svg:not([class*='size-'])]:size-7",
        accent: "bg-gradient-to-br from-accent/10 to-accent/5 text-accent flex size-16 shrink-0 items-center justify-center rounded-2xl [&_svg:not([class*='size-'])]:size-7",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-lg font-semibold tracking-tight text-foreground', className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
        className,
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
