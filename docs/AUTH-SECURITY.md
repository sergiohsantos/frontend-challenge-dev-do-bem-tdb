# Sessão persistente sem JWT no localStorage

O login do navegador usa POST /api/auth/browser/login. Python define a sessão
persistente em cookie __Host-tdb_session: HttpOnly, Secure, SameSite=Strict, Path=/,
sem Domain. O frontend recebe um JWT de acesso de até cinco minutos e o mantém
somente em memória. Perfil de autenticação também fica em memória. Dados de
perfil/cadastro do armazenamento de outras features não foram migrados nesta PR.

GET /api/auth/session restaura a sessão ao recarregar e renova o acesso antes de
expirar, sem prolongar o cookie. Requisições concorrentes compartilham uma única
renovação. As páginas públicas carregam imediatamente; rotas protegidas aguardam
a inicialização para não redirecionar incorretamente ao login. Timeout de oito
segundos evita espera indefinida se a API estiver indisponível.

Os clientes Python, Java e IA continuam usando Bearer e renovam centralmente;
não enviam cookies nas chamadas comuns. Downloads externos não recebem Bearer.
Não foi criado BFF, Redis, tabela, novo serviço AWS ou segredo adicional.

POST /api/auth/logout apaga o cookie via servidor. Os três botões de saída
aguardam sucesso antes de navegar. Falha permite tentar novamente; não simula
logout local com cookie ainda ativo. BroadcastChannel comunica a saída às outras
abas modernas. Uma renovação iniciada antes da saída não repopula a memória.

## Implantação coordenada

1. Aprovar/deployar Python #31 primeiro (inclui a antiga #32).
2. Infra #16 contém CSP, WAF opcional e testes do cache/transporte da sessão;
   aplicar após plan. WAF só existe se enable_waf=true; ver LOGIN-WAF.md.
3. Deployar frontend #56 e invalidar pelo pipeline usual. Sessões antigas que
   só tinham JWT em localStorage exigirão novo login; o valor antigo é apagado.

Vars frontend permanecem VITE_API_URL=https://devdobem.clinicarx.dev,
VITE_JAVA_API_URL=https://devdobem.clinicarx.dev/java e
VITE_AI_API_URL=https://devdobem.clinicarx.dev/ai. Python deve ter ENV=prod,
CORS_ORIGINS incluindo exatamente https://devdobem.clinicarx.dev e o mesmo segredo
JWT forte usado por Java/IA. Não rotacionar apenas uma API. Nenhum secret foi lido
ou alterado por esta PR. Vercel com API de outra origem não é suportado por este
fluxo de cookie Strict; a produção alvo é o domínio único CloudFront combinado.

Para desenvolvimento usar localhost em frontend e Python, sem misturar com
127.0.0.1. ENV=dev usa tdb_dev_session HttpOnly/Strict sem Secure, exclusivo local.
Java/IA locais continuam recebendo Bearer. Não desabilitar Secure em produção.

## Segurança e limites

O navegador não grava JWT em localStorage/sessionStorage ou cookie JavaScript.
A sessão exige header X-TDB-CSRF e valida Origin contra a lista exata; requisições
cross-site são rejeitadas. As respostas de sessão são no-store; CloudFront deve
continuar com CachingDisabled + AllViewer nas APIs.

Isto resolve persistência de token legível por JavaScript, NÃO elimina XSS.
Código malicioso executando na origem pode agir como o usuário e obter o JWT
curto. CSP restritiva/VLibras continua uma etapa separada a validar. Sessões são
stateless: logout apaga o cookie, mas um token de acesso já copiado vale até
expirar (máximo cinco minutos para novos logins browser). Cookie roubado fora do
JavaScript não tem revogação individual antecipada. O endpoint Bearer legado
/api/auth/login permanece para compatibilidade e usa o TTL existente.

## Validação

node --test tests/auth-storage.test.mjs tests/ai-api.test.mjs
npm run build

Teste real em Chromium: tests/browser-session.e2e.mjs, usando fixture sintética
Python tests/browser_fixture.py via HTTPS localhost:8443. O script cobre login,
HttpOnly, Web Storage limpo, reload, refresh, CSRF, logout e redirecionamento.
Requer Playwright instalado no ambiente de teste. Nunca usar a fixture com banco
ou credenciais reais; ela não é incluída na imagem Python de produção. O TTL de
40s é exclusivo da fixture para acelerar o teste; produção permanece 300s.
Os testes não equivalem a validação implantada na AWS nem a pentest completo.
