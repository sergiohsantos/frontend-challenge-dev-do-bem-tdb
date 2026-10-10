# Revisão de UX e acessibilidade

Esta alteração corrige problemas reproduzidos na interface, sem modificar contratos de API, infraestrutura, permissões de acesso ou o transporte de sessão HttpOnly.

## Comportamentos corrigidos

- Botões outline têm cor de texto explícita e hover legível nos dois temas. CTAs laranja/verde usam texto escuro; textos de estado têm cores próprias, sem mudar a cor das superfícies da marca.
- Gráficos e estilos usam tokens CSS completos diretamente, evitando fallback preto causado por `hsl(oklch(...))`.
- Indicador de etapas se adapta ao celular, mantém os nomes completos e informa progresso aos leitores de tela. Abas de aprovação cabem na largura disponível.
- Links, seletores, switches e abas móveis têm nomes acessíveis. “Pular para conteúdo” leva o foco ao conteúdo principal. Seletores de visualização da agenda são botões pressionáveis, sem referências a painéis inexistentes.
- Falhas em dashboard, aprovações, programas e relatórios exibem erro com nova tentativa; não são apresentadas como ausência de dados.
- Falha ao carregar configurações bloqueia edição e salvamento. Perfil, configurações e status do WhatsApp são carregados independentemente; serviço indisponível não equivale a configuração desativada.
- Recuperação administrativa orienta contato com suporte. O formulário anterior apenas simulava envio de e-mail.
- Filtros sem integração no dashboard ficam indisponíveis, com explicação de que os dados são consolidados. Filtros funcionais das demais páginas foram preservados.
- Perfil administrativo informa persistência local no navegador. O campo de permissão é somente leitura. Preferências de 2FA/IP não são apresentadas como controles de segurança efetivamente ativados.
- Login pode retornar à rota solicitada, preservando query/hash apenas dentro da área do perfil autenticado. URLs externas, travessias e outras áreas são rejeitadas.
- Links para programas selecionam o slide correspondente. Carrosséis usam navegação manual para não movimentar o conteúdo durante leitura ou navegação por teclado. Controles estão em português.
- Endereços desconhecidos têm página 404 com caminho de recuperação.

## Resultado da validação local

| Verificação | Resultado |
| --- | --- |
| TypeScript e build Vite de produção | Aprovados |
| Lint | 0 erros; 23 avisos preexistentes |
| Testes de autenticação e cliente de IA | 11 aprovados |
| Regressões de interface em Chromium | 18 cenários aprovados (16 fluxos + 2 verificações de gráficos) |
| Matriz de rotas | 57 rotas × 3 variações = 171 verificações |
| Páginas com dados sintéticos carregados | 8 rotas × 3 variações = 24 verificações |
| Links diretos para programas | 3 programas × 3 variações = 9 verificações |

Nas matrizes executadas, não foram detectados erros JavaScript não tratados, overflow horizontal da página ou violações automatizadas dos critérios WCAG 2 A/AA e 2.1 AA selecionados no axe-core. A aprovação automatizada não equivale a uma certificação de acessibilidade. Estados com APIs indisponíveis geram erros de rede esperados e mensagens da aplicação.

## Reproduzir as verificações

```sh
npm ci
npm run lint
node --test tests/auth-storage.test.mjs tests/ai-api.test.mjs
VITE_API_URL=https://example.invalid \
VITE_JAVA_API_URL=https://example.invalid/java \
VITE_AI_API_URL=https://example.invalid/ai npm run build
```

Testes de navegador usam dados sintéticos, interceptam as APIs e bloqueiam requisições externas. Não usam contas, banco, WhatsApp ou gravações de produção. Instale Playwright em uma pasta de ferramentas separada:

```sh
npm install --prefix /tmp/tdb-browser-test playwright@1.51.1
/tmp/tdb-browser-test/node_modules/.bin/playwright install chromium
TDB_PLAYWRIGHT_MODULE=/tmp/tdb-browser-test/node_modules/playwright npm run test:ux
```

O teste abre um servidor local na porta 5187 e o encerra ao terminar. Também é possível usar uma instalação local de `playwright` sem definir `TDB_PLAYWRIGHT_MODULE`.

## Limites da verificação

A matriz visual cobre rotas públicas e privadas com sessão sintética, desktop claro/escuro e celular de 390 px. Estados carregados e falhas de serviços são verificados separadamente. Isso não substitui uma homologação com permissões, dados e integrações reais. Chat e VLibras externos não são exercitados pelos testes isolados.

Os 23 avisos de lint já existentes (dependências de hooks e Fast Refresh) permanecem visíveis. Não foram suprimidos nem tratados com alterações especulativas em consultas e polling. Não há novos erros de lint.

Esta PR não implementa envio de recuperação de senha, filtros no servidor ou atualização remota de perfil: essas capacidades precisam de contratos de backend antes de serem habilitadas.
