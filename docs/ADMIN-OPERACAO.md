# Central administrativa: implantação e reversão

Esta entrega corrige indicadores e adiciona fila, agenda, busca e navegação por caso. Não altera Oracle, autenticação, WhatsApp, push, IA ou regras de agendamento. Os testes usam Admin fictício e SQLite descartável, sem criar usuários em produção.

## Definições da operação

- Fila: solicitações pendentes, casos ativos sem profissional, aprovação sem consulta vinculada, reagendamento solicitado, consulta próxima sem confirmação e conversas que merecem acompanhamento. Solicitações pendentes de casos encerrados continuam visíveis para revisão.
- “Idade” é a idade do registro indicado, não um SLA. A última mensagem recebida não comprova falta de leitura ou resposta por outro canal.
- Os filtros se aplicam à fila; programa/região também filtram a agenda dos próximos sete dias. Os indicadores gerais continuam consolidados. O padrão mantém pendências antigas visíveis.
- Cobertura significa beneficiários com pelo menos um caso ativo vinculado, divididos pelos cadastrados. Não representa vagas disponíveis nem conclusão de tratamento.
- Casos, consultas e beneficiários são unidades diferentes. Média de satisfação (0–10) e NPS (-100–100) têm rótulos distintos. Ausência de respostas não recebe nota presumida.
- Tempo até o primeiro atendimento usa consultas registradas como realizadas/concluídas, sem equiparar agendamento a atendimento. Duração de caso exige abertura/encerramento válidos.

## Implantação após aprovação das PRs

1. Implantar primeiro a PR Python. Os endpoints e schemas anteriores continuam presentes; as novas rotas exigem ADMIN. Nenhuma variável nova ou migração de banco é necessária.
2. Validar login e os fluxos atuais. As novas rotas são GET `/api/admin/operations`, GET `/api/admin/search?q=...` e GET `/api/admin/beneficiaries/{id}/cases/{case_id}`.
3. Implantar a PR frontend. Abrir a central, filtrar pendências, abrir uma solicitação, pesquisar uma referência e trocar o caso no beneficiário.
4. Conferir que a vinculação de profissional e o upload mantêm o caso exibido. O upload com contexto usa POST `/api/admin/beneficiaries/{id}/cases/{case_id}/documents`; o endpoint anterior continua disponível.

Se o backend ainda não estiver atualizado, fila/busca apresentam indisponibilidade e os menus anteriores continuam acessíveis. O frontend recusa operar um caso selecionado cuja identidade não tenha sido confirmada pela API.

## Rollback

Reimplantar primeiro o frontend anterior e depois a imagem Python anterior. Não há DDL, backfill ou conversão de registros nesta entrega; a reversão não exige restauração do Oracle. Operações de negócio feitas por usuários continuam registradas e não devem ser apagadas pelo rollback. O deploy não é executado pela abertura das PRs.

## Validação e evolução posterior

Python: `python -m unittest discover -s tests -p 'test_*.py' -v`.
Frontend: build, lint, testes Node e `tests/frontend-ux.e2e.mjs`. Integração real local: `tests/admin-operations.e2e.mjs`, com `TDB_PYTHON_REPO`, `TDB_PYTHON_EXECUTABLE`, Playwright e, se necessário, `TDB_PYTHON_SITE_PACKAGES` e `TDB_CHROMIUM_EXECUTABLE`.

Responsáveis administrativos, prazos persistidos, vagas dos profissionais e histórico de entrega WhatsApp precisam de contratos/modelagem próprios; não são inferidos de texto ou criados nesta entrega. Triagem e onboarding Java continuam nos fluxos atuais, sem presumir equivalência entre IDs de leads e casos. A fila atual consolida os registros em memória antes de paginar; volumes muito superiores aos atuais exigem agregação/paginação no banco antes de expandir a operação.
