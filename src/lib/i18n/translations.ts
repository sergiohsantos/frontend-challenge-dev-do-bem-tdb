

export const text = {
  header: {
    logoAlt: "Turma do Bem - Pelo direito de sorrir",
    tagline: "Pelo direito de sorrir",
  },
  common: {
    loading: "Carregando...",
    back: "Voltar",
    help: "Precisa de ajuda",
  },
  nav: {
    beneficiary: "Beneficiário",
    volunteer: "Voluntário",
    login: "Entrar",
  },
  login: {
    welcomeBack: "Bem-vindo de volta",
    subtitle: "Entre para acompanhar sua jornada na Turma do Bem.",
    title: "Entrar",
    selectProfile: "Selecione seu perfil para acessar a plataforma.",
    noAccount: "Ainda não tem acesso?",
    beneficiaryProfile: "Cadastro beneficiário",
    volunteerProfile: "Cadastro voluntário",
  },
  forms: {
    cpf: "CPF",
    email: "E-mail",
    password: "Senha",
    forgotPassword: "Esqueci minha senha",
    requiredField: "Campo obrigatório",
    invalidEmail: "Informe um e-mail válido",
  },
}

export type Locale = "pt-BR"

export type Translations = typeof text

export function setLocale() {
  return undefined
}

export function useI18n() {
  return { locale: "pt-BR" as Locale, setLocale, t: text }
}

export function useTranslation() {
  return { t: text }
}
