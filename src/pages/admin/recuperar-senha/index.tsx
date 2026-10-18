import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminRecuperarSenhaPage() {
  const [token] = useState(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || ""
    if (value) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)
    return value
  })
  const [available, setAvailable] = useState<boolean | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    apiFetch<{ available: boolean }>("/api/auth/admin-recovery/status", { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setAvailable(value.available) }).catch(() => { if (!controller.signal.aborted) setAvailable(false) })
    return () => controller.abort()
  }, [])
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || !available) return
    setError(""); setMessage("")
    if (token && password !== confirmation) { setError("As senhas precisam ser iguais."); return }
    setBusy(true)
    try {
      const value = await apiFetch<{ detail: string }>(`/api/auth/admin-recovery/${token ? "reset" : "request"}`, { method: "POST", body: JSON.stringify(token ? { token, password } : { email }) })
      setMessage(value.detail); setPassword(""); setConfirmation("")
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir. Tente novamente.") }
    finally { setBusy(false) }
  }
  return <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-background p-4"><Card className="w-full max-w-lg"><CardHeader><CardTitle><h1>Recuperar acesso administrativo</h1></CardTitle></CardHeader><CardContent className="space-y-5">
    {available === null ? <p role="status">Verificando recuperação...</p> : available ? <form className="space-y-4" onSubmit={event => void submit(event)}><p>{token ? "Defina uma nova senha com pelo menos 12 caracteres. O link vale por 15 minutos e pode ser usado uma vez." : "Informe o e-mail cadastrado na sua conta administrativa."}</p><fieldset disabled={busy || Boolean(token && message)} className="space-y-4">{token ? <><label className="grid gap-2">Nova senha<Input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label><label className="grid gap-2">Confirmar nova senha<Input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label></> : <label className="grid gap-2">E-mail da conta<Input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>}<Button type="submit">{busy ? "Processando..." : token ? "Atualizar senha" : "Solicitar recuperação"}</Button></fieldset></form> : <p>A recuperação automática por e-mail não está habilitada neste ambiente. Entre em contato com a equipe responsável para confirmar sua identidade e seu vínculo administrativo.</p>}
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p className="text-sm text-muted-foreground">Não compartilhe senha, link ou códigos de acesso. Após recuperar a conta, use o login novamente.</p><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/contato">Entrar em contato</Link></Button><Button asChild variant="outline"><Link to="/admin/login">Voltar ao login</Link></Button></div>
  </CardContent></Card></main>
}
