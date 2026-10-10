# Segurança de sessão: primeira etapa

O frontend é uma SPA estática. Não há SSR/middleware que precise dos cookies
`tdb_token` e `tdb_role`. Removemos sua criação/leitura e expiramos os cookies
legados, preservando login, refresh da página e chamadas Bearer às três APIs.
Uma sessão antiga que só exista no cookie exige novo login.

**O JWT ainda está no localStorage e continua acessível a XSS. Esta alteração
não resolve o achado de roubo de sessão por JavaScript.** Remover a duplicação
evita também enviar o JWT como cookie em requisições que não precisam dele.
A classificação de risco desse achado deve permanecer aberta.

Cookie `HttpOnly` só pode ser definido pelo servidor (`Set-Cookie`). A próxima
etapa exige contrato coordenado de login/me/logout no backend, proteção CSRF,
cookies Secure/SameSite, ajuste das três APIs ou um BFF que encaminhe Bearer,
e testes de login por perfil, refresh, expiração, logout e chamadas Java/IA.
Não basta adicionar o texto HttpOnly em document.cookie nem trocar localStorage
por sessionStorage. Não migrar o contrato sem esses testes integrados.

Perfis armazenados no frontend só controlam apresentação. A autorização efetiva
continua sendo obrigação das APIs, com assinatura, expiração e privilégios.

Testes: `node --test tests/auth-storage.test.mjs` e `npm run test:ai`.
