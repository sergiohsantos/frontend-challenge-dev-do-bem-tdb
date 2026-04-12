export function flattenRow(input: unknown, prefix = ""): Record<string, string | number | boolean | null> {
  if (input === null || input === undefined) return {}
  if (typeof input !== "object") return prefix ? { [prefix]: String(input) } : { value: String(input) }

  const out: Record<string, string | number | boolean | null> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value === null || value === undefined) {
      out[fullKey] = null
      continue
    }
    if (Array.isArray(value)) {
      out[fullKey] = value.map((item) => {
        if (item === null || item === undefined) return ""
        if (typeof item === "object") return JSON.stringify(item)
        return String(item)
      }).join(" | ")
      continue
    }
    if (typeof value === "object") {
      Object.assign(out, flattenRow(value, fullKey))
      continue
    }
    out[fullKey] = value as string | number | boolean
  }
  return out
}

export function rowsToCsv(rows: unknown[]): string {
  if (!rows.length) return ""
  const flatRows = rows.map((row) => flattenRow(row))
  const headers = Array.from(new Set(flatRows.flatMap((row) => Object.keys(row))))
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
  const lines = [headers.join(",")]
  for (const row of flatRows) {
    lines.push(headers.map((header) => escape(row[header] ?? "")).join(","))
  }
  return lines.join("\n")
}

export function downloadTextFile(filename: string, content: string, type = "text/plain;charset=utf-8") {
  if (typeof window === "undefined") return
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadCsv(filename: string, rows: unknown[]) {
  downloadTextFile(filename, rowsToCsv(rows), "text/csv;charset=utf-8")
}

export function timestampFile(prefix: string, extension: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  return `${prefix}-${stamp}.${extension}`
}
