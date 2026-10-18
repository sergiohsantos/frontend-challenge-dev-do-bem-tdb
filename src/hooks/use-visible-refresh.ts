import { useEffect } from "react"

/** Sequential refreshes only while the page is visible. Writes still reload immediately. */
export function useVisibleRefresh(load: (initial: boolean) => Promise<void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    let disposed = false
    let busy = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const visible = () => document.visibilityState !== "hidden"
    async function refresh(initial = false) {
      if (disposed || busy) return
      clearTimeout(timer)
      if (!visible()) return
      busy = true
      try { await load(initial) }
      finally {
        busy = false
        if (!disposed && visible()) timer = setTimeout(() => void refresh(), 30000)
      }
    }
    const visibility = () => { clearTimeout(timer); if (document.visibilityState !== "hidden") void refresh() }
    void refresh(true)
    document.addEventListener("visibilitychange", visibility)
    return () => { disposed = true; clearTimeout(timer); document.removeEventListener("visibilitychange", visibility) }
  }, [load, enabled])
}
