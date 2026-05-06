import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown
    }
    __vlibrasWidgetInitialized?: boolean
  }
}

export function VLibrasWidget() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/admin")
  const containerRef = useRef<HTMLDivElement | null>(null)
  const accessButtonRef = useRef<HTMLDivElement | null>(null)
  const pluginWrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isAdminRoute) {
      return
    }

    containerRef.current?.setAttribute("vw", "")
    accessButtonRef.current?.setAttribute("vw-access-button", "")
    pluginWrapperRef.current?.setAttribute("vw-plugin-wrapper", "")

    if (window.__vlibrasWidgetInitialized) {
      return
    }

    const initializeWidget = () => {
      if (window.__vlibrasWidgetInitialized) {
        return
      }

      if (!window.VLibras?.Widget) {
        return
      }

      const existingContainer = document.querySelector("[vw]")
      if (!existingContainer) {
        return
      }

      new window.VLibras.Widget("https://vlibras.gov.br/app")
      window.__vlibrasWidgetInitialized = true
    }

    const existingScript = document.getElementById(
      "vlibras-plugin-script",
    ) as HTMLScriptElement | null

    if (existingScript) {
      if (window.VLibras?.Widget) {
        initializeWidget()
      } else {
        existingScript.addEventListener("load", initializeWidget, { once: true })
      }

      return () => {
        existingScript.removeEventListener("load", initializeWidget)
      }
    }

    const script = document.createElement("script")
    script.id = "vlibras-plugin-script"
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js"
    script.async = true
    script.onload = initializeWidget

    document.body.appendChild(script)

    return () => {
      script.removeEventListener("load", initializeWidget)
    }
  }, [isAdminRoute])

  if (isAdminRoute) {
    return null
  }

  return (
    <div ref={containerRef} className="enabled notranslate">
      <div ref={accessButtonRef} className="active" />
      <div ref={pluginWrapperRef}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  )
}
