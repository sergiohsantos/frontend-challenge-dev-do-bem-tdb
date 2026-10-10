export function SkipLink() {
  return (
    <a
      href="#main-content"
      onClick={(event) => {
        const content = document.querySelector<HTMLElement>('main')
        if (!content) return
        event.preventDefault()
        content.tabIndex = -1
        content.focus({ preventScroll: true })
        content.scrollIntoView({ block: 'start', behavior: 'instant' })
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Pular para conteúdo
    </a>
  )
}

