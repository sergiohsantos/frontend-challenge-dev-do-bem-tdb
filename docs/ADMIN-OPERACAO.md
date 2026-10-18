# Central administrativa: implantação e reversão

A central mantém fila, agenda, busca e navegação por caso. A evolução adiciona acompanhamento de pendências, capacidade declarada e histórico de entrega, além de perfil administrativo remoto e recuperação opcional. Não altera regras de agendamento, envio WhatsApp, push ou contratos JWT. Os testes usam contas fictícias e SQLite descartável, sem criar usuários em produção.

## Definições da operação

- Fila: solicitações pendentes, casos ativos sem profissional, aprovação sem consulta vinculada, reagendamento solicitado, consulta próxima sem confirmação e conversas que merecem acompanhamento. Solicitações pendentes de casos encerrados continuam visíveis para revisão.
- “Idade” é a idade do registro indicado, não um SLA. A última mensagem recebida não comprova falta de leitura ou resposta por outro canal.
- Os filtros se aplicam à fila; programa/região também filtram a agenda dos próximos sete dias. Os indicadores gerais continuam consolidados. O padrão mantém pendências antigas visíveis.
- Cobertura significa beneficiários com pelo menos um caso ativo vinculado, divididos pelos cadastrados. Não representa vagas disponíveis nem conclusão de tratamento.
- Casos, consultas e beneficiários são unidades diferentes. Média de satisfação (0–10) e NPS (-100–100) têm rótulos distintos. Ausência de respostas não recebe nota presumida.
- Tempo até o primeiro atendimento usa consultas registradas como realizadas/concluídas, sem equiparar agendamento a atendimento. Duração de caso exige abertura/encerramento válidos.

## Implantação após aprovação das PRs

1. Implantar primeiro a API Python desta evolução com os recursos opcionais desligados (padrão). Conferir os fluxos existentes e depois implantar o frontend.
2. Responsáveis/prazos e histórico de entrega dependem de duas tabelas adicionais e das flags `ADMIN_TRACKING_ENABLED` e `WHATSAPP_DELIVERY_HISTORY_ENABLED`. Não executar migração automaticamente. Seguir `docs/OPERACAO-EXTENSOES.md` e os scripts revisáveis na PR Python antes de habilitar, uma flag por vez.
3. Capacidade usa as preferências existentes do voluntário. É informativa, não representa horários livres ou bloqueio automático de encaminhamento.
4. Perfil salva nome/e-mail no servidor com confirmação da senha atual. Observações continuam locais. Recuperação por e-mail só aparece quando a API confirmar configuração SMTP/HTTPS completa; sem isso, permanece o contato manual.
5. Conferir troca rápida entre conversas públicas/internas, falha e tentativa de salvar disponibilidade, além do erro de carregamento que bloqueia sobrescrita. As telas não anunciam salvamento quando o servidor falha.

## Rollback

Desligar as flags opcionais e seguir a reversão da PR Python, mantendo as tabelas e seu histórico. Reimplantar o frontend e a imagem Python anteriores se necessário. Mudanças legítimas de perfil, senha e preferências não são apagadas. Não há merge, deploy ou DDL automático nesta entrega. A publicação do frontend continua exclusivamente manual no workflow de produção.

## Validação e evolução posterior

Python: `python -m unittest discover -s tests -p 'test_*.py' -v`.
Frontend: build, lint, testes Node e `tests/frontend-ux.e2e.mjs`. Integração real local: `tests/admin-operations.e2e.mjs`, com `TDB_PYTHON_REPO`, `TDB_PYTHON_EXECUTABLE`, Playwright e, se necessário, `TDB_PYTHON_SITE_PACKAGES` e `TDB_CHROMIUM_EXECUTABLE`.

A fila agora filtra e pagina no SQL; a comparação de leitura no Oracle preservou os resultados atuais. As atualizações periódicas de aprovações/solicitações são sequenciais, a cada 30 segundos e somente com a página visível. Ações do próprio usuário continuam atualizando imediatamente. Triagem e onboarding Java permanecem nos fluxos atuais. 2FA e restrição por IP continuam indisponíveis; não são ativadas por preferências visuais. O histórico começa na ativação, e a recuperação de senha ainda requer validação real do provedor de e-mail antes de uso produtivo.
