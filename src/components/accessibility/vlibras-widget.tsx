import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown
    }
    __vlibrasWidgetInitialized?: boolean
    __vlibrasCacheResetPromise?: Promise<void>
  }
}

const VLIBRAS_APP_URL = "https://vlibras.gov.br/app"
const VLIBRAS_SCRIPT_URL = `${VLIBRAS_APP_URL}/vlibras-plugin.js`
const VLIBRAS_CACHE_RESET_KEY = "tdb-vlibras-unity-cache-reset-20260510"

function hasResetVlibrasCache(): boolean {
  try {
    return window.localStorage.getItem(VLIBRAS_CACHE_RESET_KEY) === "ok"
  } catch {
    return false
  }
}

function markVlibrasCacheAsReset() {
  try {
    window.localStorage.setItem(VLIBRAS_CACHE_RESET_KEY, "ok")
  } catch {
    // Accessibility should keep loading even when storage is blocked.
  }
}

function deleteIndexedDb(databaseName: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve()
      return
    }

    let resolved = false
    const finish = () => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    }

    const timeout = window.setTimeout(finish, 1500)
    const request = window.indexedDB.deleteDatabase(databaseName)

    request.onsuccess = () => {
      window.clearTimeout(timeout)
      finish()
    }
    request.onerror = finish
    request.onblocked = finish
  })
}

function resetVlibrasUnityCacheOnce(): Promise<void> {
  if (!window.indexedDB) return Promise.resolve()
  if (hasResetVlibrasCache()) return Promise.resolve()

  if (!window.__vlibrasCacheResetPromise) {
    window.__vlibrasCacheResetPromise = deleteIndexedDb("UnityCache").finally(() => {
      markVlibrasCacheAsReset()
    })
  }

  return window.__vlibrasCacheResetPromise
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

    if (window.__vlibrasWidgetInitialized) return

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

      new window.VLibras.Widget(VLIBRAS_APP_URL)
      window.__vlibrasWidgetInitialized = true
    }

    let disposed = false
    let removeScriptLoadListener: (() => void) | undefined

    const loadPluginScript = () => {
      if (disposed || window.__vlibrasWidgetInitialized) return

      const existingScript = document.getElementById(
        "vlibras-plugin-script",
      ) as HTMLScriptElement | null

      if (existingScript) {
        if (window.VLibras?.Widget) {
          initializeWidget()
        } else {
          existingScript.addEventListener("load", initializeWidget, { once: true })
          removeScriptLoadListener = () => {
            existingScript.removeEventListener("load", initializeWidget)
          }
        }

        return
      }

      const script = document.createElement("script")
      script.id = "vlibras-plugin-script"
      script.src = VLIBRAS_SCRIPT_URL
      script.async = true
      script.onload = initializeWidget

      document.body.appendChild(script)
      removeScriptLoadListener = () => {
        script.removeEventListener("load", initializeWidget)
      }
    }

    resetVlibrasUnityCacheOnce().then(loadPluginScript).catch(loadPluginScript)

    return () => {
      disposed = true
      removeScriptLoadListener?.()
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
