import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Search, X } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/auth"

type SearchItem = { id: string; type: string; label: string; targetUrl: string }

export function AdminSearch() {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<SearchItem[]>([])
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle")
  useEffect(() => {
    const controller = new AbortController()
    setItems([])
    if (query.trim().length < 2) { setState("idle"); return }
    setState("loading")
    const timer = window.setTimeout(() => {
      apiFetch<{ items: SearchItem[] }>(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal, cache: "no-store" }, getToken())
        .then(data => { if (!controller.signal.aborted) { setItems(data.items); setState("ready") } })
        .catch(() => { if (!controller.signal.aborted) setState("error") })
    }, 350)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query])
  return <div className="relative w-full max-w-md">
    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    <input type="search" aria-label="Busca administrativa" aria-controls="admin-search-results" className="h-10 w-full rounded-full border border-input bg-background py-2 pl-10 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Nome ou referência SOL..." value={query} maxLength={80} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape") setQuery("") }} />
    {query && <button type="button" aria-label="Limpar busca administrativa" className="absolute right-2 top-2 rounded-full p-1" onClick={() => setQuery("")}><X className="h-4 w-4" /></button>}
    {state !== "idle" && <div id="admin-search-results" className="absolute left-0 right-0 top-12 z-50 max-h-80 overflow-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl">
      {state === "loading" && <p role="status" className="p-3 text-sm">Buscando...</p>}
      {state === "error" && <p role="alert" className="p-3 text-sm">Busca indisponível. Use as listas pelo menu.</p>}
      {state === "ready" && (items.length ? <ul aria-label="Resultados da busca administrativa">{items.map(item => <li key={item.id}><Link className="block break-words rounded-lg p-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to={item.targetUrl} onClick={() => setQuery("")}><span className="block text-xs text-muted-foreground">{item.type}</span>{item.label}</Link></li>)}</ul> : <p role="status" className="p-3 text-sm">Nenhum resultado encontrado.</p>)}
    </div>}
  </div>
}
