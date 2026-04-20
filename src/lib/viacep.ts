import { normalizeDigits } from "@/lib/api"

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

export interface ViaCepAddress {
  cep: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
}

export async function fetchAddressByCep(rawCep: string, signal?: AbortSignal): Promise<ViaCepAddress | null> {
  const cep = normalizeDigits(rawCep)
  if (cep.length !== 8) {
    return null
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal })
  if (!response.ok) {
    throw new Error("Falha ao consultar o CEP.")
  }

  const data = (await response.json()) as ViaCepResponse
  if (data.erro) {
    return null
  }

  return {
    cep: normalizeDigits(data.cep || cep),
    endereco: data.logradouro?.trim() || "",
    bairro: data.bairro?.trim() || "",
    cidade: data.localidade?.trim() || "",
    estado: data.uf?.trim() || "",
  }
}
