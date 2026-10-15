import { useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HelpButton } from "@/components/layout/help-button"

const privacyContact = {
  controller: "Sérgio Henrique da S. Santos",
  email: "sergiotraks@gmail.com",
  updatedAt: "15 de outubro de 2026",
}
const accountDeletionEmail = `mailto:${privacyContact.email}?subject=${encodeURIComponent("Exclusão de conta — Dev do Bem / Meu Atendimento TDB")}&body=${encodeURIComponent("Olá, desejo solicitar a exclusão da minha conta e dos dados associados ao projeto Dev do Bem / Meu Atendimento TDB.\n\nNome: \nE-mail ou telefone vinculado ao cadastro: \n\nPeço a confirmação do recebimento e orientação sobre a verificação de identidade. Não incluirei senha, CPF completo, documentos ou informações de saúde nesta mensagem.")}`

const sections = [
  {
    title: "1. Quem é responsável",
    paragraphs: [
      "Esta política abrange o site Dev do Bem e o aplicativo Meu Atendimento TDB. Este ambiente é um projeto acadêmico da FIAP, sob responsabilidade de Sérgio Henrique da S. Santos. Não é um serviço oficial operado pela ONG Turma do Bem.",
      "O projeto demonstra o acompanhamento de beneficiários e a comunicação entre participantes. Não substitui orientação profissional nem é um canal de urgência. Para demonstrações e testes, prefira dados fictícios.",
    ],
  },
  {
    title: "2. Dados tratados e finalidades",
    paragraphs: [
      "O cadastro pode incluir nome, CPF, nascimento, contatos, endereço, informações socioeconômicas e de responsável legal. Outros perfis podem incluir dados profissionais ou institucionais. O acompanhamento pode conter consultas, casos, documentos, mensagens e informações de saúde, que exigem cuidado adicional.",
      "Essas informações são utilizadas para identificar e autenticar participantes, analisar cadastros, organizar o acompanhamento e as consultas, compartilhar documentos com a equipe autorizada e permitir a comunicação. Dados de crianças ou adolescentes devem ser fornecidos com a participação do responsável legal.",
    ],
  },
  {
    title: "3. Acesso e prestadores de serviço",
    paragraphs: [
      "O acesso depende do perfil e dos vínculos de atendimento. Profissionais vinculados e a equipe autorizada podem acessar dados necessários às suas atividades. O app do beneficiário não apresenta mensagens internas administrativas.",
      "A operação utiliza hospedagem, banco de dados e prestadores de comunicação. Com os alertas do aparelho habilitados, identificadores da instalação e de entrega são tratados pelo Expo Push Service e pelo Google Firebase Cloud Messaging. O texto do push é genérico; o conteúdo do atendimento é consultado após entrar no app.",
      "Quando utilizado, o canal WhatsApp envolve os serviços da Meta. O site também disponibiliza o recurso externo de acessibilidade VLibras. Prestadores externos podem processar informações fora do Brasil, conforme a operação e as políticas de cada serviço.",
    ],
  },
  {
    title: "4. Dados no aparelho e permissões",
    paragraphs: [
      "O app usa armazenamento seguro do sistema para o token de acesso e não salva sua senha. A foto escolhida para o perfil fica neste aparelho, vinculada à conta local; ela não é enviada ao backend como foto de cadastro. Documentos baixados podem gerar arquivos temporários ou cópias salvas por você.",
      "Você pode escolher uma foto pelo seletor do sistema e controlar a permissão de notificações nas configurações do aparelho. Os alertas remotos também podem ser silenciados no app. Desinstalar, sair da conta ou silenciar alertas não exclui os dados do serviço.",
      "O site utiliza armazenamento do navegador para a sessão e preferências de uso. Você pode limpar esses dados nas configurações do navegador, o que pode exigir novo login. Arquivos que você salva ou compartilha fora do app permanecem sob seu controle.",
    ],
  },
  {
    title: "5. Proteção e conservação",
    paragraphs: [
      "O acesso às APIs é autenticado e a comunicação publicada usa HTTPS. Esses controles reduzem riscos, mas nenhum sistema oferece segurança absoluta. Não envie senhas, tokens, documentos ou informações de saúde por e-mail para solicitar suporte ou exclusão.",
      "Os dados não são apagados automaticamente ao sair do app. Solicitações de exclusão são analisadas manualmente pelo responsável. Se algum registro precisar ser conservado por uma obrigação aplicável, a resposta deverá explicar quais dados, a finalidade, o motivo e o prazo dessa conservação.",
    ],
  },
  {
    title: "6. Seus direitos e como solicitar",
    paragraphs: [
      "Você pode solicitar confirmação de tratamento, acesso, correção e informações sobre compartilhamento. Também pode solicitar análise de anonimização, bloqueio, eliminação, portabilidade ou revogação de consentimento, conforme as condições aplicáveis. A identidade deve ser verificada antes de divulgar ou alterar dados.",
      "Use o contato abaixo para exercer seus direitos, inclusive como responsável legal. Informe somente seu nome e um contato vinculado ao cadastro no pedido inicial. Não é necessário instalar o app ou conseguir entrar na conta para pedir exclusão.",
    ],
  },
]

export default function PrivacidadePage() {
  useEffect(() => {
    if (window.location.hash === "#exclusao") {
      const section = document.getElementById("exclusao")
      section?.scrollIntoView()
      section?.focus({ preventScroll: true })
    }
  }, [])
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="bg-primary px-4 py-12 text-center text-primary-foreground lg:py-16">
          <p className="mb-3 text-sm font-semibold">Dev do Bem · Meu Atendimento TDB</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Política de Privacidade</h1>
          <p className="mt-4">Projeto acadêmico · Atualizada em {privacyContact.updatedAt}</p>
        </section>
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} className="leading-7 text-muted-foreground">{paragraph}</p>)}
            </section>
          ))}
          <section id="exclusao" tabIndex={-1} className="scroll-mt-24 space-y-4 rounded-2xl border border-border bg-card p-6" aria-labelledby="exclusao-titulo">
            <h2 id="exclusao-titulo" className="text-xl font-semibold">7. Solicitar exclusão da conta e dos dados</h2>
            <p className="leading-7 text-muted-foreground">Você pode solicitar a exclusão mesmo sem o aplicativo instalado ou sem conseguir entrar na conta. O pedido é recebido e tratado manualmente por {privacyContact.controller}.</p>
            <ol className="list-decimal space-y-3 pl-6 leading-7 text-muted-foreground">
              <li>Envie um e-mail para <a className="break-all font-semibold text-primary underline" href={`mailto:${privacyContact.email}`}>{privacyContact.email}</a> com o assunto “Exclusão de conta — Dev do Bem / Meu Atendimento TDB”.</li>
              <li>Informe seu nome e o e-mail ou telefone vinculado ao cadastro. Não envie senha, CPF completo, documentos ou informações de saúde no pedido inicial.</li>
              <li>Aguarde as orientações de verificação pelo contato cadastrado. Pedidos de responsável legal também precisam dessa verificação.</li>
            </ol>
            <a href={accountDeletionEmail} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Preparar e-mail de solicitação</a>
            <p className="text-sm leading-6 text-muted-foreground">O botão abre um rascunho no aplicativo de e-mail. Revise e envie para concluir o pedido. Se não abrir, escreva diretamente para o endereço acima pelo serviço de e-mail que utiliza. O envio do e-mail não apaga dados automaticamente.</p>
            <p className="leading-7 text-muted-foreground">O prazo previsto para concluir o pedido é de até 30 dias após a confirmação da identidade. A análise abrange o acesso à conta, dados cadastrais, vínculos de dispositivo, mensagens, documentos e registros associados ao acompanhamento. Você receberá a confirmação da conclusão ou uma explicação de eventual impedimento justificado e do prazo de atendimento.</p>
            <p className="leading-7 text-muted-foreground">Se alguma informação precisar ser conservada por obrigação aplicável ou para proteção de direitos, a resposta identificará a categoria, o motivo e o prazo de conservação. Cópias de segurança, quando existentes, também devem ser consideradas no atendimento: eventual conservação e seu prazo serão informados, com restrição de uso e prevenção da reativação de dados excluídos numa restauração.</p>
            <p className="leading-7 text-muted-foreground">Após a confirmação da exclusão, a conta deixa de permitir acesso. Sair, silenciar alertas ou desinstalar o app não exclui dados do serviço. Para solicitar acesso, correção ou exclusão apenas de dados específicos, use o mesmo contato e descreva o que deseja.</p>
          </section>
          <section className="space-y-3 rounded-2xl border border-border bg-card p-6" aria-labelledby="contato-privacidade">
            <h2 id="contato-privacidade" className="text-xl font-semibold">Contato do responsável</h2>
            <p className="leading-7">{privacyContact.controller}</p>
            <a className="inline-flex min-h-11 items-center break-all font-semibold text-primary underline" href={`mailto:${privacyContact.email}`}>{privacyContact.email}</a>
            <p className="leading-7 text-muted-foreground">Os pedidos são tratados manualmente. A resposta informará a verificação necessária, o encaminhamento e eventual conservação justificada. O envio do pedido não apaga dados automaticamente.</p>
            <a href="#exclusao" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Como solicitar exclusão da conta</a>
            <p className="text-sm leading-6 text-muted-foreground">Consulte também as <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares" className="underline" target="_blank" rel="noopener noreferrer">orientações da ANPD sobre direitos dos titulares</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
      <HelpButton />
    </div>
  )
}
