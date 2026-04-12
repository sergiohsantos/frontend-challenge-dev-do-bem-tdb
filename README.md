# DEV do BEM — Turma do Bem  
### Sprint 3 — Front-End com React + Vite + TypeScript

![Logo](./public/images/dev-do-bem-logo.png)

## Descrição do projeto

O **DEV do BEM** é a solução digital desenvolvida para a ONG **Turma do Bem**, com o objetivo de melhorar a comunicação, a organização e o acompanhamento entre **beneficiários**, **voluntários** e **administradores**.

Nesta **Sprint 3**, o projeto evoluiu de uma base anterior para uma aplicação moderna em **React + Vite + TypeScript**, com estrutura de **SPA (Single Page Application)**, rotas organizadas, componentização, responsividade e melhor experiência de navegação para os diferentes perfis do sistema.

A aplicação contempla páginas públicas institucionais e também áreas autenticadas com funcionalidades específicas para cada perfil.

Além disso, nesta etapa foram incorporadas integrações complementares voltadas à **acessibilidade** e à **comunicação com usuários**, com destaque para:
- integração com a **API oficial do WhatsApp Business Platform (Cloud API)** via backend;
- inclusão do **VLibras**, biblioteca pública de acessibilidade em Libras para navegação no frontend.

---

## Objetivo da Sprint 3

O foco desta Sprint foi realizar a **migração do frontend para React + Vite + TypeScript**, organizando a aplicação em componentes reutilizáveis, utilizando navegação com **React Router**, estilização com **Tailwind CSS** e formulários com **React Hook Form**, conforme solicitado na proposta da disciplina.

Além da migração estrutural, a Sprint também consolidou melhorias visuais e funcionais nas áreas internas do sistema, especialmente em dashboards, mensagens, prontuários, perfis e páginas institucionais.

Também foram realizados ajustes para:
- melhorar a **acessibilidade da navegação**;
- preparar o sistema para **envio de notificações automatizadas via WhatsApp**;
- reforçar a integração entre frontend e backend sem alterar a estrutura já consolidada do projeto.

---

## Problema que a solução resolve

A Turma do Bem possui uma operação social que depende de comunicação clara entre diferentes perfis envolvidos no atendimento. Antes da solução proposta, o processo apresentava limitações como:

- dificuldade de comunicação entre os participantes;
- pouco controle sobre solicitações e aprovações;
- baixa centralização de informações;
- dificuldade para acompanhamento de beneficiários;
- pouca organização de prontuários, documentos e histórico;
- experiência digital limitada para navegação e uso do sistema.

O sistema proposto busca resolver esse cenário com uma plataforma centralizada, responsiva e organizada por perfis.

---

## Principais funcionalidades do frontend

### Páginas públicas
- Home
- Sobre
- FAQ
- Contato
- Integrantes
- Página da solução / apresentação do projeto

### Área do Beneficiário
- dashboard inicial
- visualização de perfil
- edição dos próprios dados com modo controlado de edição
- notificações
- mensagens
- acompanhamento de consultas e prontuário

### Área do Voluntário
- dashboard do voluntário
- gestão de pacientes
- visualização de prontuário
- visualização completa de dados do beneficiário
- registro de anotações no prontuário
- disponibilidade
- perfil editável com botão para habilitar edição
- mensagens
- notificações

### Área do Administrador
- dashboard administrativo
- gestão de beneficiários
- gestão de voluntários
- gestão de parceiros
- aprovações
- relatórios
- mensagens internas e de aprovação unificadas
- visualização e gestão de prontuários
- perfil editável
- notificações

### Acessibilidade e apoio ao usuário
- integração com **VLibras**
- suporte à navegação com tradução automática de conteúdo para Libras
- componente carregado globalmente no frontend
- posicionamento do widget ajustado para não conflitar com botões flutuantes já existentes

---

## Tecnologias utilizadas

Este projeto foi desenvolvido com as seguintes tecnologias:

- **React**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **React Router DOM**
- **React Hook Form**
- **Lucide React**
- **Fetch API nativa**
- **Node.js / npm**
- **VLibras**
- **WhatsApp Business Platform (Cloud API)** via backend

### Observações técnicas importantes
- O projeto **não utiliza Axios**
- O projeto **não utiliza Bootstrap, Material UI, Chakra UI ou frameworks proibidos**
- A navegação foi estruturada no modelo **SPA**
- Os formulários contam com **validação usando React Hook Form**
- O layout foi ajustado com foco em **responsividade**
- A comunicação com o WhatsApp foi preparada usando a **API oficial da Meta**, sem bibliotecas não oficiais

---

## Arquitetura e organização do projeto

A aplicação foi organizada em estrutura modular, priorizando reutilização e legibilidade.

```bash
src/
├── components/
│   ├── layout/
│   ├── ui/
│   ├── home/
│   ├── admin/
│   ├── beneficiario/
│   ├── voluntario/
│   ├── accessibility/
│   └── shared/
├── pages/
│   ├── home/
│   ├── sobre/
│   ├── faq/
│   ├── contato/
│   ├── integrantes/
│   ├── login/
│   ├── dashboard/
│   │   ├── admin/
│   │   ├── beneficiario/
│   │   └── voluntario/
│   └── ...
├── lib/
├── hooks/
├── assets/
├── styles/
├── App.tsx
└── main.tsx
```

### Organização adotada
- **`components/`**: componentes reutilizáveis da interface
- **`components/accessibility/`**: componentes relacionados à acessibilidade, incluindo o widget do VLibras
- **`pages/`**: páginas e rotas da aplicação
- **`lib/`**: utilitários e integrações
- **`hooks/`**: hooks auxiliares
- **`assets/`**: imagens, logos e mídias
- **`App.tsx`**: configuração das rotas
- **`main.tsx`**: inicialização da aplicação e carregamento global de integrações como o VLibras

---

## Componentização e reutilização

O projeto foi estruturado com foco em reutilização de componentes, incluindo:

- Header
- Footer
- Menu lateral
- Botões
- Inputs
- Textarea
- Select
- Cards
- Tabelas
- Alertas
- Componentes de layout por perfil
- Componentes de mensagens e notificações
- Componente de acessibilidade do **VLibras**

Essa abordagem melhora a manutenção do projeto, facilita a evolução das páginas e garante padronização visual.

---

## Navegação e rotas

A aplicação utiliza **React Router DOM** para navegação entre páginas públicas e privadas.

### Exemplos de rotas públicas
- `/`
- `/sobre`
- `/faq`
- `/contato`
- `/integrantes`

### Exemplos de rotas autenticadas
- `/dashboard/admin`
- `/dashboard/beneficiario`
- `/dashboard/voluntario`
- `/dashboard/voluntario/pacientes/:id`
- `/admin/beneficiarios/:id`

Foram utilizados recursos como:
- `useNavigate`
- `useParams`
- rotas estáticas
- rotas dinâmicas

---

## Hooks e comportamento dinâmico

O projeto utiliza hooks do React para controle de estado e comportamento da aplicação:

- **`useState`** para estados locais
- **`useEffect`** para efeitos e carregamento de dados
- **`useNavigate`** para navegação programática
- **`useParams`** para captura de parâmetros em rotas dinâmicas
- **`useForm()`** com React Hook Form para formulários com validação

### Formulários com React Hook Form
Para atender à Sprint 3, o projeto utiliza **React Hook Form**, com destaque para formulários como:
- página de **Contato**
- página de **Login**

Isso garante validação mais organizada, tipagem e melhor controle dos dados enviados.

---

## Estilização e responsividade

A interface foi desenvolvida com **Tailwind CSS**, buscando:

- layout profissional
- boa legibilidade
- organização visual
- consistência entre páginas
- adaptação para diferentes tamanhos de tela

### Responsividade aplicada em:
- **mobile**
- **tablet**
- **desktop**

Foram feitos ajustes de:
- alinhamento de botões
- grid responsivo
- sidebar e navegação
- cards e formulários
- páginas públicas e internas
- posicionamento do widget de acessibilidade para não conflitar com outros elementos fixos

---

## Experiência do usuário (UX)

A experiência do usuário foi tratada como parte central da Sprint. Foram realizados ajustes em:

- fluxo de mensagens
- organização de prontuários
- visualização de dados por perfil
- correção de downloads
- feedback visual em formulários
- organização dos dashboards
- consistência entre páginas administrativas
- navegação institucional mais clara
- bloqueio inicial de edição em páginas de perfil, com botão explícito para habilitar alterações
- inclusão de recurso de acessibilidade com Libras

---

## Integração com backend

O frontend se comunica com o backend para operações como:

- autenticação
- consulta de dashboards
- mensagens
- notificações
- perfil do usuário
- prontuários
- anotações
- relatórios
- disponibilidade do voluntário
- contato institucional

A comunicação foi feita com **Fetch API nativa**, respeitando a proposta da sprint e evitando bibliotecas não permitidas.

---

## Integração com WhatsApp Business Platform

Durante a evolução do projeto, foi realizada a integração com a **API oficial do WhatsApp Business Platform (Cloud API)**, utilizando a conta de testes da Meta.

### Objetivo da integração
Permitir que eventos relevantes do fluxo da ONG também possam gerar notificações por WhatsApp, reforçando a comunicação entre os perfis do sistema.

### Eventos de notificação planejados
- solicitação gerada/aberta pelo voluntário;
- solicitação aprovada pelo administrador;
- solicitação de agendamento de consulta para o beneficiário;
- solicitação aprovada pelo beneficiário;
- solicitação de reagendamento pelo beneficiário.

### Regras adotadas na integração
- uso da **API oficial da Meta**
- não utilização de bibliotecas não oficiais
- integração feita via **backend FastAPI**
- frontend preservado no seu formato original, sem exposição de token
- envio contendo o payload real de referência da solicitação, por exemplo: **SOL-xxxx-x**

### Observações importantes do ambiente de teste
Durante os testes acadêmicos foi utilizado o número de teste da Meta e o template padrão **`hello_world`** para validação inicial da integração.

Também foi validado que:
- mensagens de template funcionam normalmente no fluxo de teste;
- mensagens de texto livre dependem da **janela de atendimento** aberta pelo usuário no WhatsApp e fluxos reais de backend **janela de atendimento**;


### Benefícios da integração
- reforço da comunicação do processo
- maior visibilidade dos eventos importantes
- apoio ao acompanhamento de solicitações e consultas
- preparo do sistema para futuras automações transacionais

---

## Integração com VLibras

Como parte das melhorias de acessibilidade, o projeto passou a incluir o **VLibras**, ferramenta pública do governo brasileiro para tradução de conteúdos digitais em português para Libras.

### Como foi aplicado
- integração do widget oficial no frontend
- carregamento global do componente em `main.tsx`
- isolamento da lógica em componente próprio
- cuidado para não quebrar a estrutura já existente
- ajuste de posicionamento do widget para evitar conflito com botões flutuantes da aplicação

### Benefícios
- ampliação da acessibilidade para usuários surdos
- reforço do compromisso social e inclusivo do projeto
- melhoria da experiência de navegação em páginas públicas e privadas

---

## Perfis de acesso

O sistema possui três perfis principais:

### Beneficiário
Visualiza informações do atendimento, mensagens, notificações, perfil e acompanhamento do processo.

### Voluntário
Gerencia pacientes, prontuários, anotações, disponibilidade, mensagens e dados do próprio perfil.

### Administrador
Controla beneficiários, voluntários, parceiros, aprovações, relatórios, mensagens, prontuários e visão geral da operação.

---

## Diferenciais da solução

Comparado a soluções genéricas, o projeto apresenta como diferenciais:

- foco específico no contexto social da ONG Turma do Bem
- separação de fluxos por perfil
- centralização de comunicação e prontuário
- interface moderna em SPA
- organização modular e escalável
- preocupação com acessibilidade, clareza e usabilidade
- páginas institucionais integradas ao ecossistema do sistema
- comunicação via WhatsApp oficial
- inclusão de acessibilidade com VLibras

---

## Imagens e identidade visual

### Logo do projeto
![Logo](./public/images/dev-do-bem-logo.png)

### Integrantes
As imagens dos integrantes foram integradas ao projeto na página pública de equipe.

#### Sérgio Henrique S
![Sérgio](./public/team/Sergio.jpg)

#### Icaro Nascimento
![Icaro](./public/team/Icaro.png)

---

## Como executar localmente

### Pré-requisitos
Antes de iniciar, você precisa ter instalado:

- **Node.js** 18 ou superior
- **npm** 9 ou superior

### Passo a passo

```bash
# 1. Clone o repositório
git clone <URL_DO_SEU_REPOSITORIO>

# 2. Acesse a pasta do projeto
cd nome-do-projeto

# 3. Instale as dependências
npm install

# 4. Rode o projeto em ambiente de desenvolvimento
npm run dev
```

Depois disso, abra no navegador:
```bash
http://localhost:3000
```

Para acessar o ADMIN, abra no navegador:
```bash
http://localhost:3000/admin
```

### Build de produção

```bash
npm run build
```

### Preview local do build

```bash
npm run preview
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
## Rodar Backend localmente

```bash
python3 -m venv .venv
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\activate
pip3 install -r requirements.txt
cp .env.example .env
python3 -m app.seed
uvicorn app.main:app --reload
```

Swagger:
- http://127.0.0.1:8000/docs

## Credenciais seed

### Beneficiário
- login: `12345678900`
- senha: `123456`

### Voluntário
- login: `maria.santos@turmadobem.org.br`
- senha: `123456`

### Admin
- login: `ana.admin@turmadobem.org.br`
- senha: `123456`

---

## Estrutura de entrega da Sprint 3

O projeto foi preparado para atender ao padrão solicitado na disciplina:

- projeto em **React + Vite + TypeScript**
- estrutura organizada em componentes e páginas
- uso de **Tailwind CSS**
- uso de **React Router**
- uso de **React Hook Form**
- histórico de versionamento no **GitHub**
- README com informações técnicas
- sem pasta `node_modules` no envio do `.zip`

Além disso, o projeto passou a contar com:
- integração de acessibilidade com **VLibras**
- preparação de integração com **WhatsApp Cloud API**
- padronização visual e estrutural das principais páginas internas

---

## Repositório GitHub

**Link do repositório:**

```txt
https://github.com/sergiohsantos/frontend-challenge-dev-do-bem-sprint3
```

---

## Vídeo da apresentação

**Link do vídeo no YouTube:**

```txt

```

Exemplo:
```txt

```

---

## Integrantes da equipe

### 1. Sérgio Henrique S
- **RM:** RM567254
- **Turma:** 1TDS Agosto
- **Áreas:** Frontend, Python, IA Chatbot
- **LinkedIn:** [linkedin.com/in/sergiohenriquessantos](https://www.linkedin.com/in/sergiohenriquessantos/)
- **GitHub:** [github.com/sergiohsantos](https://github.com/sergiohsantos)

### 2. Icaro Nascimento
- **RM:** RM567386
- **Turma:** 1TDS Agosto
- **Áreas:** Java, Database, Business Model
- **LinkedIn:** [linkedin.com/in/icaronascimento-](https://www.linkedin.com/in/icaronascimento-/)
- **GitHub:** [github.com/IcaroNscS](https://github.com/IcaroNscS)

---

## Créditos

Projeto acadêmico desenvolvido para a disciplina de **Front-End Design Engineering**, dentro do Challenge da **FIAP**, em parceria com a **Turma do Bem**.

---

## Contato da equipe

Para dúvidas sobre o projeto, entre em contato com a equipe pelos links abaixo:

- **Sérgio Henrique S**  
  LinkedIn: [linkedin.com/in/sergiohenriquessantos](https://www.linkedin.com/in/sergiohenriquessantos/)  
  GitHub: [github.com/sergiohsantos](https://github.com/sergiohsantos)

- **Icaro Nascimento**  
  LinkedIn: [linkedin.com/in/icaronascimento-](https://www.linkedin.com/in/icaronascimento-/)  
  GitHub: [github.com/IcaroNscS](https://github.com/IcaroNscS)

---

## Observações finais

Este projeto representa a evolução da solução proposta nas sprints anteriores, consolidando a migração para um frontend moderno, componentizado e escalável.

A Sprint 3 foi fundamental para:
- transformar a base em uma SPA
- consolidar uma arquitetura profissional com React
- melhorar a navegação
- padronizar a interface
- reforçar a experiência do usuário
- preparar a aplicação para integração e expansão nas próximas etapas
- ampliar a acessibilidade com VLibras
- estruturar a comunicação transacional via WhatsApp oficial

---

## Status do projeto

✅ Sprint 3 concluída  
✅ Aplicação migrada para React + Vite + TypeScript  
✅ Componentização aplicada  
✅ React Router implementado  
✅ Tailwind CSS aplicado  
✅ React Hook Form utilizado  
✅ README técnico estruturado  
✅ Integração com VLibras adicionada  
✅ Integração com WhatsApp Cloud API preparada  
✅ Projeto pronto para entrega acadêmica
