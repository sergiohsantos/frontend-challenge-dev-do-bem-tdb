

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
