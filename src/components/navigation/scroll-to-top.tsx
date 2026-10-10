import { scrollToAnchor } from "@/lib/scroll-to-anchor"
import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" })
      return
    }
    let id: string
    try { id = decodeURIComponent(hash.slice(1)) } catch { return }
    const scrollToTarget = () => scrollToAnchor(id)
    if (scrollToTarget()) return
    // Routes are lazy loaded: wait for the target, with a bounded observer.
    const observer = new MutationObserver(() => { if (scrollToTarget()) observer.disconnect() })
    observer.observe(document.body, { childList: true, subtree: true })
    const timeout = window.setTimeout(() => observer.disconnect(), 5000)
    return () => { observer.disconnect(); window.clearTimeout(timeout) }
  }, [pathname, hash])
  return null
}
