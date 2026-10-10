export function getPythonApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL
  if (configured) return configured
  if (import.meta.env.DEV) return "http://localhost:8000"
  throw new Error("VITE_API_URL precisa ser configurada para o build de produção.")
}
