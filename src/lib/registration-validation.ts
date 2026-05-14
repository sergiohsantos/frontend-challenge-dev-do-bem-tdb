import { normalizeDigits } from "@/lib/api"

export function maskCpf(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

export function maskPhone(value: string): string {
  const digits = normalizeDigits(value).slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/^(\(\d{2}\) \d{4})(\d)/, "$1-$2")
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/^(\(\d{2}\) \d{5})(\d)/, "$1-$2")
}

export function maskCep(value: string): string {
  const digits = normalizeDigits(value).slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, "$1-$2")
}

export function maskCrp(value: string): string {
  const digits = normalizeDigits(value).slice(0, 7)
  if (!digits) return value.trim() ? "CRP " : ""

  const region = digits.slice(0, 2)
  const number = digits.slice(2)
  return `CRP ${region}${number ? `/${number}` : ""}`
}

export function maskCro(value: string): string {
  if (!value.trim()) return ""

  const withoutPrefix = value
    .toUpperCase()
    .replace(/^C\s*R\s*O\s*\/?\s*/, "")

  const uf = withoutPrefix.replace(/[^A-Z]/g, "").slice(0, 2)
  const digits = normalizeDigits(withoutPrefix).slice(0, 5)

  if (!uf) return "CRO/"
  return `CRO/${uf}${digits ? ` ${digits}` : ""}`
}

export function isValidCrp(value: string): boolean {
  return /^CRP \d{2}\/\d{5}$/.test(value.trim())
}

export function isValidCro(value: string): boolean {
  return /^CRO\/[A-Z]{2} \d{5}$/.test(value.trim())
}

export function isDentistType(value: string | undefined | null): boolean {
  return String(value || "").toUpperCase().startsWith("DENT")
}

export function isPsychologistType(value: string | undefined | null): boolean {
  const normalized = String(value || "").toUpperCase()
  return normalized.startsWith("PSIC")
}

export function formatProfessionalRegistration(type: string | undefined | null, value: string): string {
  if (isDentistType(type)) return maskCro(value)
  if (isPsychologistType(type)) return maskCrp(value)
  return value
}

export function professionalRegistrationError(type: string | undefined | null, value: string): string {
  if (isDentistType(type) && !isValidCro(value)) {
    return "Informe o CRO no formato CRO/SP 12345."
  }
  if (isPsychologistType(type) && !isValidCrp(value)) {
    return "Informe o CRP no formato CRP 06/12345."
  }
  return ""
}

export function normalizeRg(value: string): string {
  return value.toUpperCase().replace(/[^0-9X]/g, "").slice(0, 9)
}

export function maskRg(value: string): string {
  const rg = normalizeRg(value)
  if (rg.length <= 2) return rg
  if (rg.length <= 5) return rg.replace(/^(\d{2})(\w+)/, "$1.$2")
  if (rg.length <= 8) return rg.replace(/^(\d{2})(\d{3})(\w+)/, "$1.$2.$3")
  return rg.replace(/^(\d{2})(\d{3})(\d{3})([\dX])$/, "$1.$2.$3-$4")
}

export function maskEmail(value: string): string {
  return value.trim().toLowerCase().replace(/\s/g, "").slice(0, 255)
}

export function limitText(value: string, maxLength: number): string {
  return value.slice(0, maxLength)
}

export function formatRegistrationField(field: string, value: string): string {
  if (field.toLowerCase().includes("cpf")) return maskCpf(value)
  if (field === "rg") return maskRg(value)
  if (field === "cro") return maskCro(value)
  if (field === "crp") return maskCrp(value)
  if (field.toLowerCase().includes("cep")) return maskCep(value)
  if (field.toLowerCase().includes("telefone")) return maskPhone(value)
  if (field === "estado" || field === "estadoClinica") return value.toUpperCase().slice(0, 2)
  if (field === "numero" || field === "numeroClinica") return limitText(value, 20)
  if (field === "email") return maskEmail(value)
  if (field.toLowerCase().includes("nome")) return limitText(value, 255)
  if (field.toLowerCase().includes("observacoes")) return limitText(value, 2000)
  return value
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeDigits(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const calculateDigit = (base: string, factor: number) => {
    const total = base
      .split("")
      .reduce((sum, digit) => sum + Number(digit) * factor--, 0)
    const rest = (total * 10) % 11
    return rest === 10 ? 0 : rest
  }

  const first = calculateDigit(cpf.slice(0, 9), 10)
  const second = calculateDigit(cpf.slice(0, 10), 11)
  return first === Number(cpf[9]) && second === Number(cpf[10])
}

export function isValidBrazilPhone(value: string): boolean {
  const phone = normalizeDigits(value)
  return (phone.length === 10 || phone.length === 11) && !/^(\d)\1+$/.test(phone)
}

export function isValidCep(value: string): boolean {
  return normalizeDigits(value).length === 8
}

export function isValidRg(value: string): boolean {
  if (!value.trim()) return true
  const rg = normalizeRg(value)
  if (rg.length < 7 || rg.length > 9) return false
  if (!/^\d{7,8}[\dX]?$/.test(rg)) return false
  return !/^(\d)\1+$/.test(rg)
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function isValidDate(value: string): boolean {
  if (!value) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && date <= new Date()
}

export function friendlyRegistrationError(error: unknown): string {
  const fallback = "Nao foi possivel concluir o cadastro. Tente novamente."
  const message = error instanceof Error ? error.message : fallback
  const lower = message.toLowerCase()

  if (lower.includes("cpf") && lower.includes("cadastrado")) return "CPF ja cadastrado."
  if (lower.includes("cpf")) return "CPF invalido. Verifique os dados informados."
  if ((lower.includes("e-mail") || lower.includes("email")) && lower.includes("cadastrado")) {
    return "E-mail ja cadastrado para este tipo de usuario."
  }
  if (lower.includes("email") || lower.includes("e-mail")) return "Informe um e-mail valido."
  if (lower.includes("telefone")) return "Telefone invalido."
  if (lower.includes("cep")) return "CEP invalido."
  if (lower.includes("cro")) return "Informe o CRO no formato CRO/SP 12345."
  if (lower.includes("crp")) return "Informe o CRP no formato CRP 06/12345."
  if (lower.includes("registro profissional")) return "Informe o registro profissional no formato indicado."
  if (lower.includes("field required") || lower.includes("missing") || lower.includes("422")) {
    return "Preencha os campos obrigatorios."
  }
  if (message.trim()) return message
  return fallback
}
