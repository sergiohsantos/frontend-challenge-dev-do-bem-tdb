import { apiFetch } from "@/lib/api"
import { downloadCsv, downloadTextFile, flattenRow, timestampFile } from "@/lib/admin-utils"

function safeSlug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "relatorio"
  )
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function sanitizePdfText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
}

function wrapText(text: string, maxLen = 92) {
  const source = sanitizePdfText(text)
  if (!source) return [""]
  const words = source.split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxLen) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : [""]
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function downloadBlob(fileName: string, blob: Blob) {
  if (typeof window === "undefined") return
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function buildExcelHtml(title: string, rows: unknown[]) {
  const flatRows = rows.map((row) => flattenRow(row))
  const headers = Array.from(new Set(flatRows.flatMap((row) => Object.keys(row))))
  const headerHtml = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")
  const bodyHtml = flatRows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`)
    .join("")

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
body { font-family: Arial, sans-serif; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: left; }
th { background: #e2e8f0; font-weight: 700; }
h1 { font-size: 16px; margin-bottom: 12px; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<table>
<thead><tr>${headerHtml}</tr></thead>
<tbody>${bodyHtml}</tbody>
</table>
</body>
</html>`
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).length
}

function buildPdfBlob(title: string, rows: unknown[]) {
  const lines: string[] = []
  lines.push(...wrapText(title, 70))
  lines.push("")

  const flatRows = rows.map((row) => flattenRow(row))
  if (!flatRows.length) lines.push("Sem dados")

  flatRows.forEach((row, index) => {
    lines.push(...wrapText(`Registro ${index + 1}`, 70))
    Object.entries(row).forEach(([key, value]) => {
      wrapText(`${key}: ${String(value ?? "")}`, 92).forEach((line) => lines.push(line))
    })
    lines.push("")
  })

  const pageLineLimit = 46
  const pages: string[][] = []
  for (let i = 0; i < lines.length; i += pageLineLimit) {
    pages.push(lines.slice(i, i + pageLineLimit))
  }
  if (!pages.length) pages.push(["Sem dados"])

  const objects: string[] = []
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, idx) => `${4 + idx * 2} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`)
  objects.push("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

  pages.forEach((pageLines, index) => {
    const pageObj = 4 + index * 2
    const contentObj = 5 + index * 2
    const streamLines = ["BT", "/F1 16 Tf", "40 800 Td"]

    pageLines.forEach((line, lineIndex) => {
      streamLines.push(`(${escapePdfText(line)}) Tj`)
      if (lineIndex === 0) {
        streamLines.push("/F1 11 Tf")
        streamLines.push("0 -24 Td")
      } else {
        streamLines.push("0 -14 Td")
      }
    })

    streamLines.push("ET")
    const stream = streamLines.join("\n")

    objects.push(`${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`)
    objects.push(`${contentObj} 0 obj\n<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`)
  })

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(byteLength(pdf))
    pdf += obj
  }

  const xrefOffset = byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" })
}

function normalizeRows(source: unknown) {
  if (Array.isArray(source)) return source
  if (!source || typeof source !== "object") return []
  return [source]
}

async function fetchReportRows(reportId: string, token?: string | null) {
  switch (reportId) {
    case "beneficiaries": {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/beneficiaries", {}, token)
      return normalizeRows(data.items ?? data.beneficiaries)
    }
    case "volunteers": {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/volunteers", {}, token)
      return normalizeRows(data.items ?? data.volunteers)
    }
    case "partners": {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/partners", {}, token)
      return normalizeRows(data.items ?? data.partners)
    }
    case "regional": {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/regional", {}, token)
      return [
        ...normalizeRows(data.regionSummary).map((item) => ({ secao: "regiao", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.stateData).map((item) => ({ secao: "estado", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.alertRegions).map((item) => ({ secao: "alerta", ...(item as Record<string, unknown>) })),
      ]
    }
    case "programs": {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/programs", {}, token)
      return normalizeRows(data.programs)
    }
    case "satisfaction": {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/satisfaction", {}, token)
      return [
        {
          secao: "resumo",
          overallScore: data.overallScore ?? 0,
          previousScore: data.previousScore ?? 0,
          promoters: data.promoters ?? 0,
          neutrals: data.neutrals ?? 0,
          detractors: data.detractors ?? 0,
        },
        ...normalizeRows(data.trendData).map((item) => ({ secao: "tendencia", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.byProgram).map((item) => ({ secao: "programa", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.byRegion).map((item) => ({ secao: "regiao", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.recentFeedback).map((item) => ({ secao: "feedback", ...(item as Record<string, unknown>) })),
      ]
    }
    case "impact": {
      const [dashboard, satisfaction] = await Promise.all([
        apiFetch<Record<string, unknown>>("/api/admin/dashboard", {}, token),
        apiFetch<Record<string, unknown>>("/api/admin/satisfaction", {}, token),
      ])
      return [
        { secao: "kpis", ...((dashboard.kpis as Record<string, unknown>) || {}) },
        {
          secao: "satisfacao",
          overallScore: satisfaction.overallScore ?? 0,
          promoters: satisfaction.promoters ?? 0,
          detractors: satisfaction.detractors ?? 0,
        },
        ...normalizeRows(dashboard.insights).map((item) => ({ secao: "insight", ...(item as Record<string, unknown>) })),
        ...normalizeRows(dashboard.regional).map((item) => ({ secao: "regional", ...(item as Record<string, unknown>) })),
        ...normalizeRows(dashboard.programs).map((item) => ({ secao: "programa", ...(item as Record<string, unknown>) })),
      ]
    }
    case "executive":
    default: {
      const data = await apiFetch<Record<string, unknown>>("/api/admin/dashboard", {}, token)
      return [
        { secao: "kpis", ...((data.kpis as Record<string, unknown>) || {}) },
        ...normalizeRows(data.alerts).map((item) => ({ secao: "alerta", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.insights).map((item) => ({ secao: "insight", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.pipeline).map((item) => ({ secao: "pipeline", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.regional).map((item) => ({ secao: "regional", ...(item as Record<string, unknown>) })),
        ...normalizeRows(data.programs).map((item) => ({ secao: "programa", ...(item as Record<string, unknown>) })),
      ]
    }
  }
}

const TITLES: Record<string, string> = {
  executive: "Relatório Executivo",
  regional: "Análise Regional",
  programs: "Comparativo de Programas",
  beneficiaries: "Lista de Beneficiários",
  volunteers: "Lista de Voluntários",
  partners: "Lista de Parceiros",
  satisfaction: "Pesquisa de Satisfação",
  impact: "Relatório de Impacto",
}

export async function downloadAdminReportLocally(reportId: string, format: string, token?: string | null) {
  const title = TITLES[reportId] || "Relatório"
  const rows = await fetchReportRows(reportId, token)
  const slug = safeSlug(title)

  if (format === "csv") {
    downloadCsv(timestampFile(slug, "csv"), rows)
    return { extension: "csv" as const }
  }

  if (format === "xlsx") {
    const html = buildExcelHtml(title, rows)
    downloadTextFile(timestampFile(slug, "xls"), html, "application/vnd.ms-excel;charset=utf-8")
    return { extension: "xls" as const }
  }

  if (format === "pdf") {
    const blob = buildPdfBlob(title, rows)
    downloadBlob(timestampFile(slug, "pdf"), blob)
    return { extension: "pdf" as const }
  }

  throw new Error("Formato não suportado")
}
