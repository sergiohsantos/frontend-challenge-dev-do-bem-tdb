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

export function limitText(value: string, maxLength: number): string {
  return value.slice(0, maxLength)
}

export function formatRegistrationField(field: string, value: string): string {
  if (field.toLowerCase().includes("cpf")) return maskCpf(value)
  if (field.toLowerCase().includes("cep")) return maskCep(value)
  if (field.toLowerCase().includes("telefone")) return maskPhone(value)
  if (field === "estado" || field === "estadoClinica") return value.toUpperCase().slice(0, 2)
  if (field === "numero" || field === "numeroClinica") return limitText(value, 20)
  if (field === "email") return limitText(value, 255)
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
  if (lower.includes("field required") || lower.includes("missing") || lower.includes("422")) {
    return "Preencha os campos obrigatorios."
  }
  if (message.trim()) return message
  return fallback
}
