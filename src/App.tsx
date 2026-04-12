import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { getToken, getUser, normalizeRole } from '@/lib/auth'

const HomePage = lazy(() => import('./pages/home/index'))
const LoginPage = lazy(() => import('./pages/login/index'))
const RecuperarSenhaPage = lazy(() => import('./pages/recuperar-senha/index'))
const AcessibilidadePage = lazy(() => import('./pages/acessibilidade/index'))
const AjudaPage = lazy(() => import('./pages/ajuda/index'))
const FaqPage = lazy(() => import('./pages/faq/index'))
const ContatoPage = lazy(() => import('./pages/contato/index'))
const ComunicacaoPage = lazy(() => import('./pages/comunicacao/index'))
const ProgramasPage = lazy(() => import('./pages/programas/index'))
const SobrePage = lazy(() => import('./pages/sobre/index'))
const IntegrantesPage = lazy(() => import('./pages/integrantes/index'))
const TermosPage = lazy(() => import('./pages/termos/index'))
const PrivacidadePage = lazy(() => import('./pages/privacidade/index'))

const CadastroBeneficiarioPage = lazy(() => import('./pages/cadastro/beneficiario/index'))
const CadastroVoluntarioPage = lazy(() => import('./pages/cadastro/voluntario/index'))
const CadastroApoloniasPage = lazy(() => import('./pages/cadastro/apolonias/index'))

const BeneficiarioDashboardPage = lazy(() => import('./pages/dashboard/beneficiario/index'))
const BeneficiarioConsultasPage = lazy(() => import('./pages/dashboard/beneficiario/consultas/index'))
const BeneficiarioDocumentosPage = lazy(() => import('./pages/dashboard/beneficiario/documentos/index'))
const BeneficiarioMensagensPage = lazy(() => import('./pages/dashboard/beneficiario/mensagens/index'))
const BeneficiarioNotificacoesPage = lazy(() => import('./pages/dashboard/beneficiario/notificacoes/index'))
const BeneficiarioPerfilPage = lazy(() => import('./pages/dashboard/beneficiario/perfil/index'))
const BeneficiarioConfiguracoesPage = lazy(() => import('./pages/dashboard/beneficiario/configuracoes/index'))

const VoluntarioDashboardPage = lazy(() => import('./pages/dashboard/voluntario/index'))
const VoluntarioAgendaPage = lazy(() => import('./pages/dashboard/voluntario/agenda/index'))
const VoluntarioAgendaNovoPage = lazy(() => import('./pages/dashboard/voluntario/agenda/novo/index'))
const VoluntarioDisponibilidadePage = lazy(() => import('./pages/dashboard/voluntario/disponibilidade/index'))
const VoluntarioMensagensPage = lazy(() => import('./pages/dashboard/voluntario/mensagens/index'))
const VoluntarioNotificacoesPage = lazy(() => import('./pages/dashboard/voluntario/notificacoes/index'))
const VoluntarioPacientesPage = lazy(() => import('./pages/dashboard/voluntario/pacientes/index'))
const VoluntarioPacienteDetailPage = lazy(() => import('./pages/dashboard/voluntario/pacientes/[id]/index'))
const VoluntarioPerfilPage = lazy(() => import('./pages/dashboard/voluntario/perfil/index'))
const VoluntarioConfiguracoesPage = lazy(() => import('./pages/dashboard/voluntario/configuracoes/index'))
const VoluntarioSolicitacoesPage = lazy(() => import('./pages/dashboard/voluntario/solicitacoes/index'))
const VoluntarioSolicitacaoDetailPage = lazy(() => import('./pages/dashboard/voluntario/solicitacoes/[id]/index'))
const VoluntarioSolicitacaoNovaPage = lazy(() => import('./pages/dashboard/voluntario/solicitacoes/nova/index'))

const AdminLoginPage = lazy(() => import('./pages/admin/login/index'))
const AdminRecuperarSenhaPage = lazy(() => import('./pages/admin/recuperar-senha/index'))
const AdminDashboardPage = lazy(() => import('./pages/admin/index'))
const AdminAprovacoesPage = lazy(() => import('./pages/admin/aprovacoes/index'))
const AdminAprovacaoDetailPage = lazy(() => import('./pages/admin/aprovacoes/[id]/index'))
const AdminBeneficiariosPage = lazy(() => import('./pages/admin/beneficiarios/index'))
const AdminBeneficiarioDetailPage = lazy(() => import('./pages/admin/beneficiarios/[id]/index'))
const AdminVoluntariosPage = lazy(() => import('./pages/admin/voluntarios/index'))
const AdminVoluntarioDetailPage = lazy(() => import('./pages/admin/voluntarios/[id]/index'))
const AdminParceirosPage = lazy(() => import('./pages/admin/parceiros/index'))
const AdminParceiroDetailPage = lazy(() => import('./pages/admin/parceiros/[id]/index'))
const AdminProgramasPage = lazy(() => import('./pages/admin/programas/index'))
const AdminRegionalPage = lazy(() => import('./pages/admin/regional/index'))
const AdminRelatoriosPage = lazy(() => import('./pages/admin/relatorios/index'))
const AdminSatisfacaoPage = lazy(() => import('./pages/admin/satisfacao/index'))
const AdminMensagensPage = lazy(() => import('./pages/admin/mensagens/index'))
const AdminNotificacoesPage = lazy(() => import('./pages/admin/notificacoes/index'))
const AdminConfiguracoesPage = lazy(() => import('./pages/admin/configuracoes/index'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  )
}

function RequireRole({ children, role, loginPath }: { children: ReactNode; role: 'admin' | 'beneficiario' | 'voluntario'; loginPath: string }) {
  const location = useLocation()
  const token = getToken()
  const user = getUser()

  if (!token) return <Navigate to={loginPath} replace state={{ from: location.pathname }} />

  const normalized = normalizeRole(user?.role || '')
  if (normalized !== role) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
        <Route path="/acessibilidade" element={<AcessibilidadePage />} />
        <Route path="/ajuda" element={<AjudaPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contato" element={<ContatoPage />} />
        <Route path="/comunicacao" element={<ComunicacaoPage />} />
        <Route path="/programas" element={<ProgramasPage />} />
        <Route path="/sobre" element={<SobrePage />} />
        <Route path="/integrantes" element={<IntegrantesPage />} />
        <Route path="/termos" element={<TermosPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />

        <Route path="/cadastro/beneficiario" element={<CadastroBeneficiarioPage />} />
        <Route path="/cadastro/voluntario" element={<CadastroVoluntarioPage />} />
        <Route path="/cadastro/apolonias" element={<CadastroApoloniasPage />} />

        <Route path="/dashboard/beneficiario" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioDashboardPage /></RequireRole>} />
        <Route path="/dashboard/beneficiario/consultas" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioConsultasPage /></RequireRole>} />
        <Route path="/dashboard/beneficiario/documentos" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioDocumentosPage /></RequireRole>} />
        <Route path="/dashboard/beneficiario/mensagens" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioMensagensPage /></RequireRole>} />
        <Route path="/dashboard/beneficiario/notificacoes" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioNotificacoesPage /></RequireRole>} />
        <Route path="/dashboard/beneficiario/perfil" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioPerfilPage /></RequireRole>} />
        <Route path="/dashboard/beneficiario/configuracoes" element={<RequireRole role="beneficiario" loginPath="/login"><BeneficiarioConfiguracoesPage /></RequireRole>} />

        <Route path="/dashboard/voluntario" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioDashboardPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/agenda" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioAgendaPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/agenda/novo" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioAgendaNovoPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/disponibilidade" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioDisponibilidadePage /></RequireRole>} />
        <Route path="/dashboard/voluntario/mensagens" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioMensagensPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/notificacoes" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioNotificacoesPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/pacientes" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioPacientesPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/pacientes/:id" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioPacienteDetailPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/perfil" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioPerfilPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/configuracoes" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioConfiguracoesPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/solicitacoes" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioSolicitacoesPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/solicitacoes/nova" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioSolicitacaoNovaPage /></RequireRole>} />
        <Route path="/dashboard/voluntario/solicitacoes/:id" element={<RequireRole role="voluntario" loginPath="/login"><VoluntarioSolicitacaoDetailPage /></RequireRole>} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/recuperar-senha" element={<AdminRecuperarSenhaPage />} />
        <Route path="/admin" element={<RequireRole role="admin" loginPath="/admin/login"><AdminDashboardPage /></RequireRole>} />
        <Route path="/admin/aprovacoes" element={<RequireRole role="admin" loginPath="/admin/login"><AdminAprovacoesPage /></RequireRole>} />
        <Route path="/admin/aprovacoes/:id" element={<RequireRole role="admin" loginPath="/admin/login"><AdminAprovacaoDetailPage /></RequireRole>} />
        <Route path="/admin/beneficiarios" element={<RequireRole role="admin" loginPath="/admin/login"><AdminBeneficiariosPage /></RequireRole>} />
        <Route path="/admin/beneficiarios/:id" element={<RequireRole role="admin" loginPath="/admin/login"><AdminBeneficiarioDetailPage /></RequireRole>} />
        <Route path="/admin/voluntarios" element={<RequireRole role="admin" loginPath="/admin/login"><AdminVoluntariosPage /></RequireRole>} />
        <Route path="/admin/voluntarios/:id" element={<RequireRole role="admin" loginPath="/admin/login"><AdminVoluntarioDetailPage /></RequireRole>} />
        <Route path="/admin/parceiros" element={<RequireRole role="admin" loginPath="/admin/login"><AdminParceirosPage /></RequireRole>} />
        <Route path="/admin/parceiros/:id" element={<RequireRole role="admin" loginPath="/admin/login"><AdminParceiroDetailPage /></RequireRole>} />
        <Route path="/admin/programas" element={<RequireRole role="admin" loginPath="/admin/login"><AdminProgramasPage /></RequireRole>} />
        <Route path="/admin/regional" element={<RequireRole role="admin" loginPath="/admin/login"><AdminRegionalPage /></RequireRole>} />
        <Route path="/admin/relatorios" element={<RequireRole role="admin" loginPath="/admin/login"><AdminRelatoriosPage /></RequireRole>} />
        <Route path="/admin/satisfacao" element={<RequireRole role="admin" loginPath="/admin/login"><AdminSatisfacaoPage /></RequireRole>} />
        <Route path="/admin/mensagens" element={<RequireRole role="admin" loginPath="/admin/login"><AdminMensagensPage /></RequireRole>} />
        <Route path="/admin/notificacoes" element={<RequireRole role="admin" loginPath="/admin/login"><AdminNotificacoesPage /></RequireRole>} />
        <Route path="/admin/configuracoes" element={<RequireRole role="admin" loginPath="/admin/login"><AdminConfiguracoesPage /></RequireRole>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
