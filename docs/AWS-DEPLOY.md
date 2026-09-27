# Deploy AWS — frontend

Base analisada: `develop`. Nenhuma publicação automática por push foi habilitada.
Revise e faça merge deste PR na branch que será usada em produção.
O workflow_dispatch precisa existir na branch padrão do repositório para aparecer no menu Actions.
No Python a branch padrão observada é master (vazia); o código analisado está em develop.
Antes do primeiro disparo, defina a branch de produção e publique o workflow também na branch padrão se forem diferentes.

## Configuração
Crie o Environment `production` e suas Variables (não são credenciais):

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `AWS_ACCOUNT_ID`
- `PRODUCTION_BRANCH`
- `S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_URL`
- `VITE_JAVA_API_URL`
- `VITE_AI_API_URL`

`PRODUCTION_BRANCH` deve ser a branch efetivamente implantada, não presumir que seja a branch padrão.
O OIDC da role precisa permitir apenas este repositório e o Environment production.
Restrinja também as branches permitidas no Environment; use reviewers se o plano GitHub permitir.
Configuração das APIs usa ENV comuns na Task Definition, sem Secrets Manager/Parameter Store. Valores privados podem entrar por Secret do GitHub APP_ENVIRONMENTS_JSON na esteira de infraestrutura; não colocar em VITE_*.

## Operação
Abra Actions → Validate and deploy to AWS → Run workflow e selecione a branch configurada.
O frontend será compilado com as VITE_* do Environment e publicado no S3.
Os arquivos de cada versão ficam em releases/COMMIT. O index.html é publicado por último.
Rollback: restaure uma versão de releases/COMMIT para a raiz (sem apagar assets antigos) e invalide o CloudFront.
Não configure lifecycle para excluir assets antigos sem avaliar o tempo de cache e a janela de rollback.

## Validação
PRs não recebem credenciais AWS. O build usa os Dockerfiles existentes (APIs) ou npm ci + build (frontend).
Ações externas estão fixadas por SHA. Configure permissões de Actions compatíveis com esses fornecedores.
Nenhum acesso ao banco de produção é necessário para os testes de CI.
