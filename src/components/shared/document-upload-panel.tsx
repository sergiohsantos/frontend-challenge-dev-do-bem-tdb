import { useState } from "react"
import { Paperclip, UploadCloud, AlertCircle, Eye, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(",")

export interface DocumentUploadFormState {
  file: File | null
  title: string
  category: string
  notes: string
  visibleToBeneficiary: boolean
}

interface DocumentUploadPanelProps {
  value: DocumentUploadFormState
  onChange: (next: DocumentUploadFormState) => void
  onSubmit: () => void
  submitting?: boolean
  submitLabel?: string
  helperText?: string
  error?: string | null
}

function isAllowedFile(file: File): boolean {
  const lower = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function DocumentUploadPanel({ value, onChange, onSubmit, submitting = false, submitLabel = "Enviar documento", helperText, error }: DocumentUploadPanelProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  const handleFileChange = (file: File | null) => {
    onChange({ ...value, file })
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Paperclip className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">Anexar arquivo ao prontuário</h3>
          <p className="text-sm text-muted-foreground">
            {helperText || "Envie documentos clínicos, exames, evidências e arquivos pessoais relevantes ao caso."}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed bg-background p-4">
        <Label htmlFor="document-upload" className="mb-2 block text-sm font-medium">Arquivo</Label>
        <label htmlFor="document-upload" className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-background px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UploadCloud className="h-4 w-4 text-primary" />
              {value.file ? value.file.name : "Selecionar arquivo"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Formatos permitidos: PDF, JPG, JPEG, PNG, WEBP, DOC e DOCX</p>
          </div>
          <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Escolher</span>
        </label>
        <input
          id="document-upload"
          type="file"
          className="sr-only"
          accept={ACCEPT_ATTR}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            if (!file) {
              setLocalError(null)
              handleFileChange(null)
              return
            }
            if (!isAllowedFile(file)) {
              setLocalError("Arquivo não permitido. Use PDF, JPG, JPEG, PNG, WEBP, DOC ou DOCX.")
              handleFileChange(null)
              return
            }
            setLocalError(null)
            handleFileChange(file)
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="document-title">Título</Label>
          <Input id="document-title" value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder="Ex.: Radiografia panorâmica" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document-category">Categoria</Label>
          <Input id="document-category" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })} placeholder="Ex.: exame" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="document-notes">Observações</Label>
        <Textarea id="document-notes" value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value })} placeholder="Descreva o contexto do arquivo para facilitar a análise." rows={4} />
      </div>

      <label className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4 text-primary" />
        <input type="checkbox" checked={value.visibleToBeneficiary} onChange={(event) => onChange({ ...value, visibleToBeneficiary: event.target.checked })} />
        Também disponibilizar este documento para o beneficiário
      </label>

      {(localError || error) && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {localError || error}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={!value.file || submitting}>
          <FileUp className="mr-2 h-4 w-4" />
          {submitting ? "Enviando..." : submitLabel}
        </Button>
      </div>
    </div>
  )
}

export function getFriendlyUploadError(errorMessage: string): string {
  if (/formato de arquivo/i.test(errorMessage) || /tipo de arquivo/i.test(errorMessage)) {
    return "Arquivo não permitido. Use PDF, JPG, JPEG, PNG, WEBP, DOC ou DOCX."
  }
  if (/arquivo vazio/i.test(errorMessage)) {
    return "O arquivo selecionado está vazio. Escolha outro arquivo e tente novamente."
  }
  if (/413|too large|muito grande/i.test(errorMessage)) {
    return "O arquivo é muito grande para envio. Tente um arquivo menor."
  }
  return errorMessage
}
