export interface AIHealthResponse {
  status?: string
  service?: string
  root_path?: string
}

export interface AIReadyResponse {
  status?: string
  model_loaded?: boolean
  model_name?: string
  trained_at?: string
  data_source?: "csv" | "database" | "api" | string
  selected_model?: string
  rows_used?: number
  detail?: string | null
}

export interface AIModelMetrics {
  accuracy?: number
  precision_classe_1?: number
  recall_classe_1?: number
  f1_classe_1?: number
  roc_auc?: number
}

export interface AIModelMetadata {
  model_name?: string
  trained_at?: string
  data_source?: "csv" | "database" | "api" | string
  rows_used?: number
  target_column?: string
  selected_model?: string
  metrics?: AIModelMetrics
}

export interface AIModelStatusResponse {
  model_loaded?: boolean
  model_path?: string
  metadata?: AIModelMetadata
  last_error?: string | null
}

export interface PredictRequest {
  idade: number
  programa: string
  regiao: string
  tipo_procedimento: string
  especialidade: string
  urgencia_clinica: number
  dias_ate_consulta: number
  faltas_anteriores: number
  qtd_remarcacoes: number
  tempo_medio_resposta_horas: number
  canal_preferido: string
  lembretes_enviados: number
  documentos_pendentes: number
  status_aprovacao: string
  carga_voluntario: number
}

export interface PredictResponse {
  risco_nao_comparecimento: number
  classificacao: "BAIXO" | "MEDIO" | "ALTO" | string
  recomendacao: string
}
