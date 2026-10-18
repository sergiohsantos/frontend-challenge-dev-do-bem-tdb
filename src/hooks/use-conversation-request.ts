import { useCallback, useEffect, useRef } from "react"

/** A new selection cancels earlier history requests, including on unmount. */
export function useConversationRequest() {
  const current = useRef<AbortController | null>(null)
  const begin = useCallback(() => {
    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    return controller
  }, [])
  useEffect(() => () => current.current?.abort(), [])
  return begin
}
