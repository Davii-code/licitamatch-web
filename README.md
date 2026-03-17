# LicitaMatch Web

Front-end do LicitaMatch, desenvolvido com React + Vite + TypeScript.

## Visao Geral

A aplicação web oferece:

- autenticação e onboarding de empresa;
- seleção de empresa ativa por CNPJ;
- dashboard com cache local de métricas;
- busca de licitações com filtros (nicho, estado, município, datas e modalidade);
- tela de perfil e segurança (inclusive atualização de senha).

## Stack

- React 19
- TypeScript
- Vite 7
- CSS modular por domínio (`src/styles`)

## Estrutura

```text
licitamatch-web/
├── public/
│   └── licitamatch-logo.svg
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── tenders/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── api.service.ts
│   │   ├── company.service.ts
│   │   ├── location.service.ts
│   │   └── tender.service.ts
│   ├── styles/
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── onboarding.css
│   │   ├── profile.css
│   │   └── settings.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── package.json
```

## Requisitos

- Node.js 20+
- back-end do projeto rodando

## Instalacao

```bash
npm install
```

## Variaveis de Ambiente

Crie `licitamatch-web/.env` (opcional em dev, obrigatório em alguns cenários de deploy):

```env
# Em desenvolvimento, pode ficar vazio para usar proxy do Vite
VITE_API_URL=

# Feature flag para busca textual por termo na tela de licitações
VITE_FF_TENDER_FTS_SEARCH=false
```

- Em desenvolvimento: a app usa `/api/*` via proxy.
- Em produção: defina `VITE_API_URL=https://seu-backend.com`.
- A busca textual por termo só aparece quando `VITE_FF_TENDER_FTS_SEARCH=true`
  e o backend estiver com `FF_TENDER_FTS_SEARCH=true`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Como Rodar (Dev)

No terminal 1 (back-end):

```bash
cd back-end
npm run dev
```

No terminal 2 (front-end):

```bash
cd licitamatch-web
npm run dev
```

## Fluxo de Usuario

### 1) Login e Sessao

- Login em `AuthPage` (`/` no app).
- Token salvo em `localStorage` por `authApi.persistSession`.
- `AuthContext` mantém usuário e empresa atual.

### 2) Onboarding

- Se usuário não possui empresas vinculadas:
  - tela de cadastro por CNPJ;
  - seleção de `nichoPrincipal` e `nichosSecundarios`.

### 3) Selecao de Empresa

- Usuário escolhe empresa na `CompanySelection`.
- Front chama `POST /api/auth/select-company`.
- Novo token com contexto empresarial é persistido.

### 4) Dashboard

- `DashboardOverview` chama métricas por CNPJ.
- Cache local por 2h (`dashboardApi.getMetrics` / `getCachedMetrics`).
- Botão "Recarregar dashboard" força atualização.

### 5) Licitacoes

Na tela `TenderList`:

- filtros por modalidade, nicho, UF, município e período;
- match dinâmico por nicho + descrição do edital;
- botão `Ver Detalhes` abre link oficial;
- fallback para busca no PNCP quando link externo não existir.

## Servicos de API (Resumo)

### `auth.service.ts`

- `login(email, password)`
- `register(email, password, name?)`
- `selectCompany(cnpj)`

### `api.service.ts`

- `dashboardApi.getMetrics(cnpj, { forceRefresh? })`
- `dashboardApi.getCachedMetrics(cnpj)`
- `userApi.updateProfile(...)`
- `userApi.updatePassword(...)`

### `tender.service.ts`

- `getPremiumTenders(params)`
- `getTenderDetail(id)`
- `getModalities()`

### `company.service.ts`

- `previewCNPJ(cleanCnpj)`
- `create(payload)`
- `list()`
- `get(cnpj)`

### `location.service.ts`

- `getEstados()`
- `getMunicipios(uf)`

## UX e Interface

- favicon customizado em `public/licitamatch-logo.svg`;
- badge de plano no header (`Visitante`, `Plano Free`, `Plano Premium`);
- remoção do ícone de notificação mock no header;
- campo de senha com ícone de olho na aba de configurações.

## Build

```bash
npm run build
```

## Problemas Comuns

### Tela sem dados no dashboard

- confira se empresa está selecionada;
- verifique token em `localStorage`;
- use botão de recarregar para ignorar cache.

### Erro ao buscar municípios

- valide se o back-end está ativo;
- verifique rota `/api/localidades/estados/{uf}/municipios`.

## Roadmap Sugerido

- tipagem estrita para todos os DTOs de API;
- testes de interface para fluxos críticos (login, seleção de empresa, busca).

## Licenca

Uso interno do projeto LicitaMatch.
