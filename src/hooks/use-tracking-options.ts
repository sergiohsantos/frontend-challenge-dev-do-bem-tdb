import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"
import type { Owner } from "@/components/admin/operation-tracking"
export function useTrackingOptions() {
  const [options, setOptions] = useState<{ available: boolean; owners: Owner[] }>({ available: false, owners: [] })
  useEffect(() => {
    const controller = new AbortController()
    apiFetch<typeof options>("/api/admin/operation-tracking", { signal: controller.signal }, getToken()).then(value => { if (!controller.signal.aborted) setOptions(value) }).catch(() => {})
    return () => controller.abort()
  }, [])
  return options
}
