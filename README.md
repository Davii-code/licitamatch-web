# LicitaMatch Web

Front-end do LicitaMatch, em React + Vite + TypeScript.

## Visão geral

- autenticação, cadastro e recuperação de senha;
- onboarding de empresa por CNPJ, com prévia dos dados da Receita Federal;
- seleção da empresa ativa;
- dashboard com cache local de métricas;
- busca de licitações com filtros (nicho, estado, município, período, modalidade e termo);
- alertas de oportunidades (buscas salvas, plano PREMIUM);
- análise de elegibilidade para um lote;
- perfil da empresa, membros e certificações;
- conta, dispositivos conectados e log de auditoria da empresa.

## Stack

- React 19
- React Router 7
- TypeScript
- Vite 7
- CSS por domínio (`src/styles`)

---

## Rotas

| Rota | Tela | Acesso |
|---|---|---|
| `/entrar` | Login, cadastro e pedido de recuperação | Público |
| `/redefinir-senha?token=` | Definição de nova senha | Público (destino do e-mail) |
| `/empresas` | Seleção da empresa ativa | Autenticado |
| `/empresas/nova` | Cadastro de empresa | Autenticado |
| `/painel` | Dashboard | Autenticado + empresa ativa |
| `/painel/licitacoes` | Busca de licitações | Autenticado + empresa ativa |
| `/painel/alertas` | Alertas de oportunidades | Autenticado + empresa ativa |
| `/painel/elegibilidade` | Análise de elegibilidade | Autenticado + empresa ativa |
| `/painel/empresa` | Perfil da empresa | Autenticado + empresa ativa |
| `/painel/conta` | Conta e histórico | Autenticado + empresa ativa |

Os guards estão em `src/routes/guards.tsx` e trabalham em camadas: `RequireAuth`
protege tudo que exige login e guarda o destino original para devolver o usuário
ao lugar certo depois de entrar; `RequireCompany` protege o painel, cujas telas
operam sempre no contexto de um CNPJ.

Enquanto a sessão está sendo verificada no servidor, nenhum guard decide nada —
redirecionar antes da resposta jogaria para o login todo usuário que apenas
recarregou a página.

> **Deploy:** a aplicação é uma SPA. O servidor precisa devolver `index.html`
> para qualquer rota, senão abrir `/painel/licitacoes` direto retorna 404. O
> `vercel.json` cobre a Vercel e o `public/_redirects` cobre Netlify e
> compatíveis. Em nginx: `try_files $uri /index.html;`.

---

## Sessão e autenticação

A sessão vive **inteiramente em cookies `HttpOnly`** gravados pelo servidor. O
access token não passa pelo JavaScript e não é guardado em `localStorage` — o
que o tornava legível por qualquer código injetado via XSS.

Consequência prática: o cliente não sabe quem está logado só de olhar o
navegador. Ao carregar, o `AuthProvider` pergunta ao servidor em
`GET /api/users/me`, que devolve o perfil, as empresas vinculadas e qual delas
está ativa no contexto do token.

`apiFetch` (em `src/services/auth.service.ts`) concentra quatro comportamentos:

1. **Credenciais sempre** — `credentials: 'include'` em toda chamada; sem isso nenhuma requisição autenticada funciona.
2. **Proteção contra CSRF** — envia `X-Requested-With`, que a API exige em requisições de escrita autenticadas por cookie. Um site hostil não consegue definir header customizado numa requisição cross-origin sem preflight, e o preflight só é aprovado para as origens configuradas na API.
3. **Renovação automática** — ao receber 401, chama `/api/auth/refresh` uma vez e repete a requisição. Chamadas concorrentes compartilham a mesma renovação, porque o servidor rotaciona o refresh token a cada uso e rotações paralelas derrubariam a sessão.
4. **Erros tipados e leitura tolerante** — lança `ApiError` com o status HTTP preservado, para distinguir sessão expirada (401), permissão (403) e limite de requisições (429); respostas vazias ou não-JSON viram mensagem legível em vez de `SyntaxError`.

Quando a renovação é recusada em definitivo, o `AuthContext` limpa o estado e os
guards levam o usuário de volta ao login.

### CORS entre domínios

Front e API sob o mesmo domínio registrável (`app.exemplo.com.br` e
`api.exemplo.com.br`) funcionam com a configuração padrão. Em domínios
registráveis diferentes, o back-end precisa de `COOKIE_SAMESITE=none` e HTTPS —
e a origem exata do front precisa constar em `FRONTEND_URL`.

---

## Estrutura

```text
licitamatch-web/
├── public/
│   ├── _redirects            # fallback de SPA (Netlify e compatíveis)
│   └── licitamatch-logo.svg
├── src/
│   ├── components/
│   │   ├── alerts/           # gestão de buscas salvas
│   │   ├── auth/             # login, cadastro, recuperação e moldura comum
│   │   ├── dashboard/
│   │   ├── eligibility/
│   │   ├── layout/           # MainLayout, Sidebar, ErrorBoundary
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── settings/
│   │   ├── tenders/
│   │   └── ui/
│   ├── config/feature-flags.ts
│   ├── context/
│   │   ├── auth-context.ts   # contexto puro (sem componentes)
│   │   ├── AuthContext.tsx   # AuthProvider
│   │   └── useAuth.ts        # hook de acesso
│   ├── pages/                # telas que conectam rota, contexto e componente
│   ├── routes/guards.tsx     # RequireAuth, RequireCompany
│   ├── services/
│   │   ├── alert.service.ts
│   │   ├── api.service.ts        # dashboard e perfil do usuário
│   │   ├── auth.service.ts       # apiFetch, ApiError e sessão
│   │   ├── company.service.ts
│   │   ├── eligibility.service.ts
│   │   ├── location.service.ts
│   │   └── tender.service.ts
│   ├── styles/
│   ├── utils/cnpj.ts
│   ├── App.tsx               # mapa de rotas
│   └── main.tsx
├── vercel.json               # fallback de SPA (Vercel)
└── index.html
```

O contexto de autenticação está dividido em três arquivos de propósito: um
módulo que exporta componentes e valores ao mesmo tempo quebra o Fast Refresh do
Vite, que passa a recarregar a página inteira a cada edição.

---

## Requisitos

- Node.js 20+
- back-end do projeto rodando

## Instalação

```bash
npm install
```

```bash
npm run dev
```

---

## Variáveis de ambiente

Crie `licitamatch-web/.env`:

```env
# Em desenvolvimento, deixe vazio para usar o proxy do Vite (/api/* → localhost:3000).
# Em produção, informe a origem da API.
VITE_API_URL=

# Expõe o campo de busca textual por termo na tela de licitações.
# Mantenha alinhado com FF_TENDER_FTS_SEARCH no back-end.
VITE_FF_TENDER_FTS_SEARCH=true
```

---

## Serviços

Todos usam `apiFetch` e devolvem tipos explícitos. Os endpoints estão
documentados no Swagger da API, em `/api/docs`.

### `auth.service.ts`

`login` · `register` · `selectCompany` · `getSession` · `logout(todosDispositivos?)` · `requestPasswordReset` · `confirmPasswordReset`

### `company.service.ts`

`previewCNPJ` · `create` · `list` · `get` · `update` · `refresh` · `getMembers` · `addMember` · `removeMember` · `getCertifications` · `getAudit`

A prévia do CNPJ passa pela própria API, que consulta a mesma fonte usada no
cadastro. Antes essa chamada ia do navegador direto para a BrasilAPI, o que
produzia duas fontes de verdade e enviava o CNPJ do usuário a um terceiro a
partir do cliente.

### `tender.service.ts`

`getTenders(params)` · `getTenderDetail(id)` · `getModalities()`

O detalhe precisa apenas do identificador — a API resolve o registro pelo id.

### `alert.service.ts`

`list` · `create` · `update` · `remove`

### `eligibility.service.ts`

`analyze(cnpj, valorLote, tenderCnaes?)`

### `location.service.ts`

`getEstados()` · `getMunicipios(uf, nome?)` — ambos devolvem o array já
desembrulhado do envelope da API.

### `api.service.ts`

`dashboardApi.getMetrics(cnpj, { forceRefresh? })` · `getCachedMetrics` · `clearCache`
`userApi.getProfile()` · `updateProfile` · `updatePassword`

O cache do dashboard vive em `localStorage` com TTL de 2 horas e é versionado:
mudanças no formato do payload invalidam entradas antigas em vez de servir
campos que não existem mais.

---

## Sobre os dados exibidos

A interface mostra apenas o que vem da API. Telas que antes preenchiam lacunas
com valores fixos — score de elegibilidade, lista de requisitos de habilitação,
log de auditoria, contagem de empate ficto — passaram a exibir o dado real ou a
informar que ele não está disponível.

Especificamente sobre ME/EPP: o dashboard conta **licitações exclusivas**
(LC 123/2006, Art. 48, I — contratações de até R$ 80.000), que é calculável a
partir do valor estimado. O **empate ficto** (Arts. 44 e 45) depende das
propostas apresentadas na sessão de disputa e não existe na fase de divulgação
do edital, então é descrito como direito aplicável, sem número associado.

---

## Build

```bash
npm run build
```

```bash
npm run lint
```

---

## Problemas comuns

### Dashboard sem dados

- confira se há empresa selecionada;
- use o botão de recarregar para ignorar o cache de 2 horas;
- se a lista de licitações também estiver vazia, o problema é a ingestão no back-end (veja `GET /api/cron/status`).

### Sessão caindo ao recarregar

O cookie de sessão não está chegando à API. Confira:

- `FRONTEND_URL` no back-end lista a origem exata do front;
- em domínios registráveis diferentes, `COOKIE_SAMESITE=none` e HTTPS;
- em produção, a API precisa estar sob HTTPS — o cookie é `Secure`.

### 403 "Requisições de escrita autenticadas por cookie exigem o header X-Requested-With"

Alguma chamada está saindo fora do `apiFetch`. Todas as requisições devem passar
por ele: é onde o header é adicionado.

### 404 ao abrir uma rota direto ou recarregar

Falta o fallback de SPA no servidor. Veja a nota de deploy na seção de rotas.

### Erro ao buscar municípios

Valide se o back-end está no ar e se a rota
`/api/localidades/estados/{uf}/municipios` responde. A API do IBGE pode estar
indisponível — nesse caso a resposta é 502 ou 504.

---

## Roadmap sugerido

- testes de interface para os fluxos críticos (login, seleção de empresa, busca);
- edição de alertas existentes (hoje é possível criar, pausar e remover);
- paginação do log de auditoria na tela de conta (a API já devolve cursor).

## Licença

Uso interno do projeto LicitaMatch.
