import { Link } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
  className?: string
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav
      aria-label="Navegação de localização"
      className={cn("mb-6", className)}
    >
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        <li className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            aria-label="Página inicial"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Início</span>
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          
          return (
            <li key={index} className="flex items-center">
              <ChevronRight 
                className="mx-1 h-4 w-4 text-muted-foreground/50" 
                aria-hidden="true" 
              />
              {isLast || !item.href ? (
                <span
                  className={cn(
                    "flex items-center gap-1",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Simplified location indicator for mobile
interface LocationIndicatorProps {
  currentPage: string
  parentPage?: string
  className?: string
}

export function LocationIndicator({ currentPage, parentPage, className }: LocationIndicatorProps) {
  return (
    <div 
      className={cn("mb-4 flex items-center gap-2 text-sm text-muted-foreground", className)}
      role="navigation"
      aria-label="Você está em"
    >
      <span className="font-medium text-primary">Você está em:</span>
      {parentPage && (
        <>
          <span>{parentPage}</span>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </>
      )}
      <span className="font-medium text-foreground">{currentPage}</span>
    </div>
  )
}
