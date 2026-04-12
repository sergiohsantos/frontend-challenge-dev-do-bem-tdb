import { API_BASE_URL } from "@/lib/api"

function parseFileName(disposition: string | null, fallback: string) {
  if (!disposition) return fallback
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1])
  const match = disposition.match(/filename=([^;]+)/i)
  if (match?.[1]) return match[1].replace(/"/g, '').trim()
  return fallback
}

function buildDownloadUrl(path: string) {
  if (!path) return API_BASE_URL
  if (/^https?:\/\//i.test(path)) return path
  if (path.startsWith(API_BASE_URL)) return path
  const base = API_BASE_URL.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export async function downloadFromApi(path: string, token?: string | null, fallbackName = 'download.bin') {
  if (!path) {
    throw new Error('Arquivo indisponível para download.')
  }

  const response = await fetch(buildDownloadUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  })

  if (!response.ok) {
    let message = `Erro ao baixar arquivo (${response.status})`
    try {
      const data = await response.json()
      if (data?.detail && typeof data.detail === 'string') message = data.detail
    } catch {}
    throw new Error(message)
  }

  const blob = await response.blob()
  const fileName = parseFileName(response.headers.get('Content-Disposition'), fallbackName)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
