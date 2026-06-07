# DEV do BEM — Turma do Bem
### Sprint 4 — Front-End React + Vite + TypeScript integrado com APIs

![Logo](./public/images/dev-do-bem-logo.png)

## Descrição do projeto

O **DEV do BEM** é uma solução digital desenvolvida para apoiar a operação da **Turma do Bem**, conectando **beneficiários**, **voluntários** e **administradores** em uma jornada mais organizada, acompanhável e orientada por dados.

Na **Sprint 4**, o frontend evoluiu da base já componentizada da Sprint 3 para uma aplicação integrada com serviços reais de backend. A aplicação continua sendo uma **SPA (Single Page Application)** construída com **React + Vite + TypeScript**, mas agora passa a consumir APIs remotas para funcionalidades administrativas, triagem, onboarding, inteligência artificial, mensagens, dashboards, aprovações e acompanhamento operacional.

A conexão oficial do ecossistema na Sprint 4 considera o uso de **Oracle Database** na camada de persistência dos backends, com o frontend consumindo APIs publicadas e organizadas por responsabilidade:

- **Backend Core Python/FastAPI**: autenticação, beneficiários, voluntários, admin, casos, aprovações, mensagens, documentos, notificações, WhatsApp e dashboards.
- **Backend Java/Quarkus**: módulo administrativo de **triagem**, **habilitação/onboarding**, checklist, encaminhamento e match.
- **Backend IA/FastAPI**: página administrativa de **IA preditiva**, com previsão de risco e apoio à tomada de decisão.
- **Frontend React/Vite**: interface pública, dashboards por perfil e área administrativa integrada.

---

## Objetivo da Sprint 4

O objetivo principal desta etapa foi concluir o frontend como uma aplicação web profissional, mantendo a arquitetura modular criada na Sprint 3 e adicionando integração real com APIs.

A Sprint 4 reforça os seguintes pontos:

- consumo de APIs REST com **Fetch API nativa**, sem Axios;
- integração com backend Java/Quarkus nas telas administrativas de **triagem** e **onboarding**;
- integração com backend de IA na tela `/admin/ia-preditiva`;
- manutenção da integração com o backend Python/FastAPI para o core da solução;
- publicação do frontend na **Vercel**;
- uso de variáveis de ambiente para separar desenvolvimento, homologação e produção;
- tratamento de erros, loading, estados vazios e respostas inesperadas;
- responsividade com **Tailwind CSS**;
- documentação clara no README para execução e avaliação.

---

## Problema que a solução resolve

A operação da Turma do Bem envolve várias etapas: cadastro, triagem, análise, aprovação, encaminhamento para voluntários, agendamento, comunicação, acompanhamento e registro de evolução do caso.

Sem uma plataforma centralizada, surgem dificuldades como:

- baixa rastreabilidade da jornada do beneficiário;
- dificuldade para acompanhar o andamento de casos;
- comunicação fragmentada entre beneficiários, voluntários e administração;
- ausência de visão consolidada de aprovações, consultas e prontuários;
- dificuldade para priorizar atendimentos e evitar faltas;
- falta de apoio digital para triagem, onboarding e tomada de decisão administrativa.

O frontend do DEV do BEM organiza esses fluxos em uma interface única, responsiva e separada por perfis, conectada aos serviços de backend da solução.

---

## Principais funcionalidades

### Páginas públicas

- Home institucional.
- Sobre o projeto.
- Programas.
- FAQ.
- Contato.
- Integrantes.
- Ajuda, acessibilidade, comunicação, termos e privacidade.
- Página de login e cadastros.

### Área do Beneficiário

- Dashboard inicial.
- Visualização e edição do perfil.
- Acompanhamento de consultas.
- Confirmação de presença.
- Solicitação de reagendamento.
- Visualização de documentos.
- Mensagens.
- Notificações.
- Configurações e preferências.

### Área do Voluntário

- Dashboard do voluntário.
- Lista de pacientes vinculados.
- Prontuário do beneficiário.
- Anotações no prontuário.
- Agenda e consultas.
- Disponibilidade.
- Solicitações de procedimento.
- Comentários em solicitações.
- Mensagens.
- Notificações.
- Perfil editável.

### Área do Administrador

- Dashboard administrativo.
- Gestão de beneficiários.
- Gestão de voluntários.
- Gestão de parceiros.
- Aprovações clínicas e administrativas.
- Mensagens internas e mensagens por aprovação.
- Relatórios.
- Notificações.
- Configurações.
- Testes de WhatsApp.
- Acompanhamento de prontuários e documentos.

### Novidades da Sprint 4 no Admin

A Sprint 4 adicionou módulos administrativos específicos para tornar a solução mais completa e integrada:

#### Triagem — `/admin/triagem`

Tela integrada ao backend Java/Quarkus para apoiar a entrada e avaliação inicial de beneficiários.

Funcionalidades cobertas:

- criação manual de lead de beneficiário pelo administrador;
- listagem de leads;
- busca local;
- edição e exclusão de leads;
- registro de triagem;
- priorização de triagem;
- sugestão de encaminhamento;
- preparação do lead para onboarding;
- tratamento de loading, erros e estados vazios.

#### Onboarding — `/admin/onboarding`

Tela integrada ao backend Java/Quarkus para validar dados e documentos antes de liberar o beneficiário para atendimento.

Funcionalidades cobertas:

- visualização de leads em processo de habilitação;
- checklist documental;
- validação de cadastro;
- validação de região;
- registro de observações;
- conversão do lead para **APTO_ATENDIMENTO** quando os critérios forem atendidos;
- proteção contra conversão indevida quando houver pendência.

#### IA Preditiva — `/admin/ia-preditiva`

Tela integrada ao backend de IA/FastAPI para apoiar o administrador na leitura de risco e priorização.

Funcionalidades cobertas:

- consumo da API de predição;
- envio de dados do atendimento para análise;
- retorno de risco estimado;
- exibição de indicadores e cards de apoio;
- leitura de perfis com maior chance de não comparecimento;
- apoio à priorização de casos;
- preparação para evolução com massa real do banco Oracle.

---

## Tecnologias utilizadas

- **React**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **React Router DOM**
- **React Hook Form**
- **Lucide React**
- **Radix UI / componentes internos**
- **Sonner / toasts**
- **Fetch API nativa**
- **Node.js**
- **npm**
- **VLibras**
- **Vercel**
- **APIs REST**
- **Backend Python/FastAPI**
- **Backend Java/Quarkus**
- **Backend IA/FastAPI**
- **Oracle Database** na persistência oficial dos backends na Sprint 4
- **WhatsApp Business Platform (Cloud API)** via backend

### Observações técnicas importantes

- O projeto **não utiliza Axios**.
- O projeto **não utiliza Bootstrap, Material UI, Chakra UI ou jQuery**.
- O projeto **não utiliza templates prontos**.
- A aplicação é estruturada como **SPA**.
- O roteamento é feito com **React Router DOM**.
- A estilização é feita com **Tailwind CSS**.
- Formulários usam **React Hook Form** quando há entrada e validação de dados.
- O frontend não expõe tokens sensíveis de backend.
- As URLs das APIs são configuradas por variáveis de ambiente.

---

## Arquitetura do frontend

A aplicação é organizada de forma modular para facilitar manutenção, evolução e separação por contexto de uso.

```bash
src/
├── components/
│   ├── accessibility/
│   ├── admin/
│   ├── beneficiario/
│   ├── home/
│   ├── layout/
│   ├── shared/
│   ├── ui/
│   └── voluntario/
├── hooks/
├── lib/
├── pages/
│   ├── admin/
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── beneficiario/
│   │   └── voluntario/
│   ├── contato/
│   ├── faq/
│   ├── home/
│   ├── integrantes/
│   ├── login/
│   ├── sobre/
│   └── ...
├── services/
│   ├── java-api/
│   │   ├── ai-risk.service.ts
│   │   ├── client.ts
│   │   ├── lead-beneficiario.service.ts
│   │   ├── onboarding.service.ts
│   │   └── triagem.service.ts
│   ├── admin-volunteers.service.ts
│   ├── aiApi.ts
│   └── ...
├── types/
│   └── java-api.ts
│   └── ai.ts
├── App.tsx
└── main.tsx
```

### Organização adotada

- **`components/`**: componentes reutilizáveis da interface.
- **`pages/`**: páginas públicas e internas.
- **`services/java-api/`**: camada isolada para integração com o backend Java/Quarkus.
- **`types/`**: tipagens compartilhadas da aplicação.
- **`lib/`**: utilitários, helpers de API, autenticação e funções auxiliares.
- **`hooks/`**: hooks reutilizáveis.
- **`App.tsx`**: definição das rotas.
- **`main.tsx`**: inicialização da aplicação e integrações globais.

---

## Rotas principais

### Rotas públicas

- `/`
- `/sobre`
- `/programas`
- `/faq`
- `/contato`
- `/integrantes`
- `/ajuda`
- `/acessibilidade`
- `/comunicacao`
- `/termos`
- `/privacidade`
- `/login`
- `/cadastro/beneficiario`
- `/cadastro/voluntario`
- `/cadastro/apolonias`

### Rotas do beneficiário

- `/dashboard/beneficiario`
- `/dashboard/beneficiario/consultas`
- `/dashboard/beneficiario/documentos`
- `/dashboard/beneficiario/mensagens`
- `/dashboard/beneficiario/notificacoes`
- `/dashboard/beneficiario/perfil`
- `/dashboard/beneficiario/configuracoes`

### Rotas do voluntário

- `/dashboard/voluntario`
- `/dashboard/voluntario/agenda`
- `/dashboard/voluntario/disponibilidade`
- `/dashboard/voluntario/mensagens`
- `/dashboard/voluntario/notificacoes`
- `/dashboard/voluntario/pacientes`
- `/dashboard/voluntario/pacientes/:id`
- `/dashboard/voluntario/perfil`
- `/dashboard/voluntario/solicitacoes`
- `/dashboard/voluntario/configuracoes`

### Rotas administrativas

- `/admin`
- `/admin/aprovacoes`
- `/admin/beneficiarios`
- `/admin/beneficiarios/:id`
- `/admin/voluntarios`
- `/admin/parceiros`
- `/admin/programas`
- `/admin/relatorios`
- `/admin/satisfacao`
- `/admin/mensagens`
- `/admin/notificacoes`
- `/admin/configuracoes`
- `/admin/triagem`
- `/admin/onboarding`
- `/admin/ia-preditiva`

---

## Integração com APIs

A Sprint 4 tem como foco o consumo de APIs e a integração entre frontend e backends. O frontend utiliza **Fetch API nativa**, com serviços separados por domínio.

### API Core Python/FastAPI

Responsável pelo núcleo da aplicação:

- autenticação;
- perfis;
- dashboards;
- beneficiários;
- voluntários;
- casos;
- consultas;
- aprovações;
- mensagens;
- documentos;
- notificações;
- relatórios;
- WhatsApp;
- preferências.

Variável de ambiente:

```env
VITE_API_URL=https://apicore-devdobem.clinicarx.dev
```

### API Java/Quarkus

Responsável pelo módulo administrativo de triagem e onboarding.

Variável de ambiente:

```env
VITE_JAVA_API_URL=https://apionboarding-devdobem.clinicarx.dev
```

Endpoints consumidos pelo frontend:

#### Leads de beneficiários

```text
GET    /api/leads-beneficiarios
GET    /api/leads-beneficiarios/{id}
POST   /api/leads-beneficiarios
PUT    /api/leads-beneficiarios/{id}
DELETE /api/leads-beneficiarios/{id}
```

#### Triagens

```text
GET  /api/triagens
POST /api/triagens
POST /api/triagens/{id}/priorizar
```

#### Encaminhamentos

```text
POST /api/encaminhamentos/sugerir/{leadId}
```

#### Onboarding e checklist

```text
POST /api/checklists
POST /api/checklists/{leadId}/validar
POST /api/leads-beneficiarios/{id}/converter
```

### API de IA/FastAPI

Responsável por apoiar a página administrativa de IA preditiva.

Variável de ambiente:

```env
VITE_AI_API_URL=https://apichatbot-devdobem.clinicarx.dev/ai
```

Uso esperado no frontend:

```text
POST ${VITE_AI_API_URL}/predict
```

A tela `/admin/ia-preditiva` utiliza essa integração para exibir previsões e indicadores de apoio à decisão administrativa.

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto frontend.

### Desenvolvimento local

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_JAVA_API_URL=http://127.0.0.1:8080
VITE_AI_API_URL=http://127.0.0.1:8001/ai
```

### Produção / Vercel

```env
VITE_API_URL=https://apicore-devdobem.clinicarx.dev
VITE_JAVA_API_URL=https://apionboarding-devdobem.clinicarx.dev
VITE_AI_API_URL=https://apichatbot-devdobem.clinicarx.dev/ai
```

> Em produção, as variáveis devem ser cadastradas no painel da Vercel. Os fallbacks para `localhost` devem ser usados apenas em desenvolvimento.

---

## Tratamento de erros e resiliência

As integrações da Sprint 4 foram organizadas para evitar que respostas inesperadas quebrem a interface.

Foram aplicados cuidados como:

- loading em telas com consumo de API;
- estados vazios;
- mensagens amigáveis de erro;
- toasts de sucesso e falha;
- botões desabilitados durante envio;
- tratamento de respostas inconsistentes;
- proteção contra renderização de dados nulos;
- separação dos serviços de API por domínio;
- manutenção do shell administrativo mesmo quando uma API específica falha.

---

## Componentização e reutilização

O projeto reutiliza componentes como:

- Header;
- Footer;
- AdminHeader;
- AdminSidebar;
- DashboardHeader;
- cards;
- tabelas;
- badges;
- botões;
- inputs;
- selects;
- textareas;
- modais;
- toasts;
- alertas;
- loaders;
- componentes de mensagens;
- componentes administrativos;
- componentes de acessibilidade.

A componentização reduz repetição, melhora a padronização visual e facilita a evolução dos módulos de triagem, onboarding e IA.

---

## Hooks e comportamento dinâmico

O frontend utiliza recursos do React para controlar navegação, dados e estados:

- **`useState`** para estados locais;
- **`useEffect`** para carregamento de dados;
- **`useMemo`** para cálculos e filtros;
- **`useNavigate`** para navegação programática;
- **`useParams`** para rotas dinâmicas;
- **`useForm()`** para formulários com validação;
- hooks e helpers internos para autenticação, perfil e chamadas de API.

---

## Formulários com React Hook Form

A aplicação utiliza **React Hook Form** em formulários com validação, como:

- login;
- contato;
- cadastros;
- dados de triagem;
- etapas de onboarding;
- telas com entrada administrativa.

O uso de formulários tipados contribui para validação mais clara, menor repetição de código e melhor experiência do usuário.

---

## Estilização e responsividade

A interface foi construída com **Tailwind CSS** e testada para diferentes resoluções.

A aplicação contempla:

- mobile até 480px;
- tablet em torno de 768px;
- desktop a partir de 992px;
- cards responsivos;
- tabelas e listas adaptadas;
- grids flexíveis;
- navegação administrativa organizada;
- botões e formulários ajustados para telas menores;
- manutenção da identidade visual da Turma do Bem.

---

## Acessibilidade

O projeto mantém a integração com **VLibras**, ferramenta pública de acessibilidade em Libras.

A integração considera:

- carregamento global do widget;
- componente isolado de acessibilidade;
- cuidado para não conflitar com botões flutuantes;
- melhoria da navegação para usuários surdos;
- reforço do caráter social e inclusivo da solução.

---

## Integração com WhatsApp Business Platform

O frontend preserva a integração indireta com a **WhatsApp Business Platform (Cloud API)** por meio do backend Python/FastAPI.

A regra adotada é:

- o token da Meta não fica no frontend;
- o envio é feito pelo backend;
- o frontend aciona ações administrativas ou transacionais;
- o backend decide quando enviar notificações.

Eventos previstos:

- solicitação criada pelo voluntário;
- solicitação aprovada pelo administrador;
- consulta agendada;
- beneficiário solicitado para confirmação;
- pedido de reagendamento.

---

## Como executar localmente

### Pré-requisitos

- **Node.js** 18 ou superior.
- **npm** 9 ou superior.
- Backend Python/FastAPI disponível.
- Backend Java/Quarkus disponível para triagem e onboarding.
- Backend IA/FastAPI disponível para IA preditiva.

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/sergiohsantos/frontend-challenge-dev-do-bem-tdb

# 2. Acesse a pasta do frontend
cd frontend-challenge-dev-do-bem-tdb

# 3. Instale as dependências
npm install

# 4. Crie o arquivo .env
cp .env.example .env
```

Configure o `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_JAVA_API_URL=http://127.0.0.1:8080
VITE_AI_API_URL=http://127.0.0.1:8001/ai
```

Rode o frontend:

```bash
npm run dev
```

Abra no navegador:

```text
http://localhost:3000
```

ou, se o Vite subir em outra porta:

```text
http://localhost:5173
```

### Build de produção

```bash
npm run build
```

### Preview do build

```bash
npm run preview
```

---

## Como executar os backends usados pelo frontend

### Backend Python/FastAPI — Core

```bash
cd ../pythonCore_backend
python3 -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\activate
pip3 install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### Backend Java/Quarkus — Triagem e Onboarding

```bash
cd ../tdb-onboarding-api
./mvnw quarkus:dev
```

No Windows:

```bash
cd ..\tdb-onboarding-api
mvnw.cmd quarkus:dev
```

Swagger:

```text
http://localhost:8080/q/swagger-ui
```

### Backend IA/FastAPI — IA Preditiva

```bash
cd ../chatbotAI_backend
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

Endpoint esperado pelo frontend:

```text
http://127.0.0.1:8001/ai/predict
```

---

## Scripts do projeto

```bash
npm run dev
# inicia o ambiente de desenvolvimento

npm run build
# gera a build de produção

npm run preview
# visualiza localmente a build gerada
```

---

## Credenciais de demonstração

### Admin

```text
Login: fiap.admin@tdb.org.br
Senha: mesma_senha_da_banca
```

### Beneficiário

```text
Login: fiap.beneficiario@tdb.org.br
Senha: mesma_senha_da_banca
```

### Voluntário

```text
Login: fiap.dentista@tdb.org.br
Senha: mesma_senha_da_banca
```

---

## Deploy

### Vercel

URL pública da aplicação:

```text
https://frontend-challenge-dev-do-bem-tdb.vercel.app
```

URL de login:

```text
https://frontend-challenge-dev-do-bem-tdb.vercel.app/login
```

Área administrativa:

```text
https://frontend-challenge-dev-do-bem-tdb.vercel.app/admin
```

### Variáveis necessárias na Vercel

```env
VITE_API_URL=https://apicore-devdobem.clinicarx.dev
VITE_JAVA_API_URL=https://apionboarding-devdobem.clinicarx.dev
VITE_AI_API_URL=https://apichatbot-devdobem.clinicarx.dev/ai
```

---

## Repositório GitHub

```text
https://github.com/sergiohsantos/frontend-challenge-dev-do-bem-tdb
```

---

## Vídeo da apresentação

```text
https://www.youtube.com/watch?v=JYhQrmlqUK0
```

---

## Estrutura de entrega da Sprint 4

O projeto foi preparado para atender ao padrão solicitado na disciplina de **Front-End Design Engineering**.

Itens contemplados:

- React + Vite + TypeScript;
- SPA com React Router;
- componentização;
- Tailwind CSS;
- responsividade;
- hooks e rotas dinâmicas;
- formulários com React Hook Form;
- consumo de APIs REST;
- integração com API Java;
- tratamento de erros;
- README completo;
- link do GitHub;
- link do vídeo;
- URL da Vercel;
- histórico Git;
- ausência de `node_modules` no `.zip`;
- não utilização de bibliotecas proibidas.

---

## Checklist técnico da Sprint 4

- [x] Aplicação React + Vite + TypeScript.
- [x] Arquitetura SPA.
- [x] Componentização aplicada.
- [x] Tailwind CSS aplicado.
- [x] React Router DOM implementado.
- [x] Rotas públicas e privadas.
- [x] Rotas dinâmicas.
- [x] React Hook Form em formulários.
- [x] Fetch API nativa.
- [x] Sem Axios.
- [x] Sem frameworks de UI proibidos.
- [x] Integração com backend Python/FastAPI.
- [x] Integração com backend Java/Quarkus.
- [x] Tela administrativa de Triagem.
- [x] Tela administrativa de Onboarding.
- [x] Tela administrativa de IA Preditiva.
- [x] Integração indireta com WhatsApp via backend.
- [x] VLibras integrado.
- [x] Heurísticas de Nielsen aplicadas nas melhorias de Voluntário e Beneficiário, com feedback visual, estados vazios, prevenção de erro, navegação clara e próxima ação recomendada.
- [x] Variáveis de ambiente documentadas.
- [x] Deploy na Vercel.
- [x] README atualizado para entrega final.

---

## Integrantes da equipe

### Sérgio Henrique S

- **RM:** RM567254
- **Turma:** 1TDS Agosto
- **Áreas:** Frontend, Python, IA Chatbot
- **LinkedIn:** [linkedin.com/in/sergiohenriquessantos](https://www.linkedin.com/in/sergiohenriquessantos/)
- **GitHub:** [github.com/sergiohsantos](https://github.com/sergiohsantos)

### Icaro Nascimento

- **RM:** RM567386
- **Turma:** 1TDS Agosto
- **Áreas:** Java, Database, Business Model
- **LinkedIn:** [linkedin.com/in/icaronascimento-](https://www.linkedin.com/in/icaronascimento-/)
- **GitHub:** [github.com/IcaroNscS](https://github.com/IcaroNscS)

---

## Créditos

Projeto acadêmico desenvolvido para o Challenge da **FIAP**, em parceria com a **Turma do Bem**, dentro da disciplina de **Front-End Design Engineering**.

---

## Contato da equipe

- **Sérgio Henrique S**  
  LinkedIn: [linkedin.com/in/sergiohenriquessantos](https://www.linkedin.com/in/sergiohenriquessantos/)  
  GitHub: [github.com/sergiohsantos](https://github.com/sergiohsantos)

- **Icaro Nascimento**  
  LinkedIn: [linkedin.com/in/icaronascimento-](https://www.linkedin.com/in/icaronascimento-/)  
  GitHub: [github.com/IcaroNscS](https://github.com/IcaroNscS)

---

## Status do projeto

✅ Sprint 3 concluída  
✅ Sprint 4 concluída  
✅ Frontend integrado com API Core Python  
✅ Frontend integrado com API Java/Quarkus  
✅ Frontend integrado com API de IA  
✅ Triagem administrativa implementada  
✅ Onboarding administrativo implementado  
✅ IA preditiva integrada ao Admin  
✅ Deploy preparado para Vercel  
✅ README atualizado para entrega final
