# Frontend na AWS

## Branches e validação

`main` é a branch de produção AWS. `develop` continua disponível para desenvolvimento.
PRs para ambas e commits em main executam testes do cliente IA, testes isolados do script
de deploy e build TypeScript/Vite. PRs e pushes não publicam na AWS nem recebem credenciais.
O deploy AWS é manual: Actions → Validate and deploy to AWS → Run workflow → main.
O job de deploy exige todos os testes e usa OIDC, sem access keys permanentes.

A branch padrão ainda é develop. Depois do merge desta promoção, altere a branch padrão
para main em Settings → Default branch, para o workflow_dispatch aparecer em Actions.
Não é necessário remover develop nem alterar o histórico para fazer isso.

## Configuração antes do primeiro deploy

No repositório frontend, Settings → Environments → production:
restrinja Deployment branches and tags a main e configure as Variables:

| Variable | Valor |
| --- | --- |
| AWS_REGION | us-east-1 |
| AWS_ACCOUNT_ID | 131365648091 |
| AWS_ROLE_ARN | output da role de deploy do frontend, não a role da infraestrutura |
| PRODUCTION_BRANCH | main |
| S3_BUCKET | tdb-frontend-fiap |
| CLOUDFRONT_DISTRIBUTION_ID | ID da distribuição do frontend retornado pelo Terraform |
| VITE_API_URL | URL HTTPS pública da entrada Python, sem /api se os endpoints já o incluem |
| VITE_JAVA_API_URL | URL HTTPS pública da entrada Java conforme o roteamento implantado |
| VITE_AI_API_URL | URL HTTPS pública da entrada IA, com /ai conforme o roteamento implantado |

No repositório tdb-infra, altere `frontend_production_branch` para `main` no TF_CONFIG_JSON
existente e aplique a infraestrutura para atualizar a restrição de branch da role OIDC.
Preserve os demais campos e secrets. A role/Environment da infraestrutura continua separada.
A mudança de default no Terraform não substitui um valor develop explicitamente salvo no JSON.

VITE_* é público, incorporado no bundle durante o build: nunca inclua senhas, SECRET_KEY,
AI_SERVICE_TOKEN ou AI_ADMIN_TOKEN. O navegador envia somente o JWT de login.
Não use DNS privado *.tdb.internal: esses endereços são exclusivos da comunicação entre tasks.
Use os outputs reais do Terraform; esta promoção não unifica distribuições nem altera rotas da infra.

## Hospedagem oficial: AWS S3 + CloudFront

O frontend é publicado exclusivamente na AWS usando o bucket S3 privado, Origin Access Control e a distribuição CloudFront descritos no repositório de infraestrutura `tdb-infra`.
A aplicação é uma SPA: o fallback de rotas deve ser tratado pelo CloudFront; não existe configuração de rewrite em outro provedor.
O deploy permanece manual pela GitHub Action `Validate and deploy to AWS` na branch `main`, usando OIDC e sem chaves estáticas.
Validar login, navegação direta em rotas profundas, dashboards de todos os perfis, IA, mensagens e downloads pela URL CloudFront.
A origem `https://devdobem.clinicarx.dev` deve apontar para a distribuição CloudFront com certificado ACM adequado, e os CORS dos backends devem aceitar essa origem.

## Publicação e rollback

O script compila com as VITE_* de production e salva a versão em releases/COMMIT.
Publica assets antes do index.html, preserva assets antigos e invalida o CloudFront.
Falhas de build impedem uploads; falhas de upload impedem os passos posteriores.
A publicação multi-arquivo não é uma transação: uma falha posterior pode deixar arquivos
já enviados. Após falha de invalidação, repita a invalidação ou o deploy antes de considerar concluído.
Rollback: restaure o conteúdo da versão desejada de releases/COMMIT para a raiz,
com assets primeiro e index.html por último, e invalide o CloudFront.
Não exclua assets antigos sem avaliar cache e janela de rollback.

Os testes usam comandos AWS simulados: verificam ordem e interrupção em falhas, mas
não comprovam IAM, distribuição, DNS ou integração com APIs reais. O primeiro deploy e
os smoke tests na AWS continuam necessários.
