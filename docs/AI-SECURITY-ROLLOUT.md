# Cliente autenticado da IA — onda 2

aiApi usa o token atual de getToken() em Authorization: Bearer para chamadas à IA.
Nenhuma chave de assinatura, token de serviço ou token de retreinamento vai ao navegador.
401 e 403 geram mensagens distintas na interface existente, sem trocar o mecanismo de login.
Publicar antes da IA que passa a exigir JWT. Configure VITE_AI_API_URL para a entrada pública
aprovada, nunca para DNS privado ECS. Este PR não altera a arquitetura CloudFront.

Validação: npm ci; npm run test:ai; npm run build.
Os testes executam o módulo real pelo Vite e simulam fetch/localStorage, sem chamar produção.
Não comprovam login real, assinatura JWT ou acesso AWS; esses são smoke tests posteriores.
