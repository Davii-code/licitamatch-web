// ── Centraliza URLs da API ──
// Em dev: deixe VITE_API_URL vazio — o proxy do vite.config.ts redireciona /api/* para localhost:3000
// Em produção: defina VITE_API_URL=https://api.seudominio.com no .env
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ── Tipos de resposta ──
export type UserRole = 'GUEST' | 'FREE' | 'PREMIUM';
export type AccessLevel = 'OWNER' | 'ADMIN' | 'BIDDER';

export interface UserInfo {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
}

export interface CompanySummary {
    cnpj: string;
    legalName: string;
    tradeName: string | null;
    status: string;
    size: string | null;
    nichoPrincipal: string | null;
    nichosSecundarios: string[];
    city: string | null;
    state: string | null;
}

export interface CompanyBrief {
    cnpj: string;
    accessLevel: AccessLevel;
    isLegalRepresentative: boolean;
    company: CompanySummary;
}

export interface LoginResponse {
    message: string;
    user: UserInfo;
    companies: CompanyBrief[];
    nextStep: string;
}

export interface SelectedCompany {
    cnpj: string;
    legalName: string;
    tradeName: string | null;
    status: string;
    size: string | null;
    nichoPrincipal: string | null;
    nichosSecundarios: string[];
    needsRefresh: boolean;
}

export interface SelectCompanyResponse {
    company: SelectedCompany;
    membership: { accessLevel: AccessLevel; isLegalRepresentative: boolean };
    warnings: string[];
}

export interface RegisterResponse {
    message: string;
    user: UserInfo;
}

/** Sessão atual, do ponto de vista do servidor. */
export interface SessionResponse {
    user: UserInfo & { createdAt: string; updatedAt: string; totalEmpresas: number };
    companies: CompanyBrief[];
    /** CNPJ da empresa ativa no contexto do token, ou null. */
    empresaAtiva: string | null;
    sessoesAtivas: {
        id: string;
        userAgent: string | null;
        ipAddress: string | null;
        createdAt: string;
        lastUsedAt: string;
    }[];
}

/** Formato de erro devolvido pela API. */
export interface ApiErrorBody {
    error: string;
    message?: string;
    details?: Record<string, string[]>;
    paywall?: boolean;
    retryAfter?: number;
}

/**
 * Erro de requisição com o status HTTP preservado.
 *
 * A versão anterior lançava `new Error(mensagem)`, e a interface não conseguia
 * distinguir "sessão expirada" (401) de "sem permissão" (403) ou "limite
 * excedido" (429) — todos viravam a mesma faixa vermelha genérica.
 */
export class ApiError extends Error {
    readonly status: number;
    readonly details?: Record<string, string[]>;
    readonly paywall: boolean;
    readonly retryAfter?: number;

    constructor(status: number, body: Partial<ApiErrorBody>) {
        super(body.error ?? body.message ?? 'Não foi possível concluir a operação.');
        this.name = 'ApiError';
        this.status = status;
        this.details = body.details;
        this.paywall = body.paywall === true;
        this.retryAfter = body.retryAfter;
    }

    /** Erros de validação achatados numa lista para exibição em formulário. */
    get fieldMessages(): string[] {
        if (!this.details) return [];
        return Object.values(this.details).flat();
    }
}

/**
 * Header exigido pelo servidor em requisições de escrita autenticadas por cookie.
 *
 * É a proteção contra CSRF: o navegador não permite que um site hostil defina
 * um header customizado numa requisição cross-origin sem preflight, e o
 * preflight só é aprovado para as origens configuradas na API.
 */
const CSRF_HEADER = { 'X-Requested-With': 'licitamatch-web' };

/** Chamado quando a sessão termina de forma irreversível (refresh recusado). */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;

/**
 * Registra o que fazer quando a sessão expira de vez.
 * O AuthContext usa isso para limpar o estado e voltar à tela de login.
 */
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
    onSessionExpired = handler;
}

/** Lê o corpo da resposta com tolerância a 204 e a respostas não-JSON. */
async function readBody(res: Response): Promise<unknown> {
    if (res.status === 204) return null;

    const text = await res.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        // Proxy fora do ar, 502 do gateway ou página de erro em HTML: sem isso,
        // o `res.json()` estourava um SyntaxError sem relação com o problema real.
        return { error: `Resposta inesperada do servidor (HTTP ${res.status}).` };
    }
}

/**
 * Renovação de sessão compartilhada.
 *
 * Se três chamadas receberem 401 ao mesmo tempo, todas aguardam a mesma promessa
 * em vez de disparar três rotações de refresh token — o servidor revoga o token
 * a cada rotação, então chamadas concorrentes derrubariam a sessão.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...CSRF_HEADER },
            });

            // O servidor grava os cookies novos na própria resposta; não há token
            // para o cliente guardar.
            return res.ok;
        } catch {
            return false;
        } finally {
            refreshInFlight = null;
        }
    })();

    return refreshInFlight;
}

/** Endpoints que não devem disparar renovação automática ao responder 401. */
const NO_RETRY_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/auth/password-reset',
];

function request(path: string, options: RequestInit): Promise<Response> {
    return fetch(`${API_BASE}${path}`, {
        ...options,
        // A sessão inteira vive em cookies HttpOnly: sem isto, nenhuma chamada
        // autenticada funciona.
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...CSRF_HEADER,
            ...options.headers,
        },
    });
}

/**
 * Faz uma chamada autenticada à API.
 *
 * A sessão é mantida em cookies `HttpOnly` gravados pelo servidor. O access
 * token não passa pelo JavaScript e não é guardado em `localStorage` — o que o
 * tornava legível por qualquer código injetado via XSS.
 *
 * Ao receber 401, tenta renovar a sessão uma única vez e repete a requisição. O
 * access token dura 1 hora; sem essa renovação o usuário era deslogado no meio
 * do trabalho mesmo com o refresh token válido por 7 dias.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    let res = await request(path, options);

    if (res.status === 401 && !NO_RETRY_PATHS.some((p) => path.startsWith(p))) {
        if (await refreshSession()) {
            res = await request(path, options);
        } else {
            onSessionExpired?.();
        }
    }

    const body = await readBody(res);

    if (!res.ok) {
        throw new ApiError(res.status, (body ?? {}) as Partial<ApiErrorBody>);
    }

    return body as T;
}

// ── Auth Service ──
export const authApi = {
    login: (email: string, password: string) =>
        apiFetch<LoginResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    register: (email: string, password: string, name?: string) =>
        apiFetch<RegisterResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        }),

    /**
     * Ativa uma empresa no contexto da sessão.
     * O servidor emite o cookie novo com `companyId` — nada a guardar aqui.
     */
    selectCompany: (cnpj: string) =>
        apiFetch<SelectCompanyResponse>('/api/auth/select-company', {
            method: 'POST',
            body: JSON.stringify({ cnpj }),
        }),

    /** Sessão atual segundo o servidor. Base da restauração ao recarregar. */
    getSession: () => apiFetch<SessionResponse>('/api/users/me', { method: 'GET' }),

    /** Solicita o link de recuperação de senha. */
    requestPasswordReset: (email: string) =>
        apiFetch<{ message: string }>('/api/auth/password-reset', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    /** Define a nova senha a partir do token recebido por e-mail. */
    confirmPasswordReset: (token: string, password: string) =>
        apiFetch<{ message: string }>('/api/auth/password-reset/confirm', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        }),

    /** Encerra a sessão no servidor, revogando o refresh token e limpando os cookies. */
    logout: async (todosDispositivos = false): Promise<void> => {
        try {
            await apiFetch<{ message: string }>('/api/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ todosDispositivos }),
            });
        } catch {
            // Falha de rede não pode impedir a saída: o usuário clicou em sair e
            // o estado local precisa ser descartado de qualquer forma.
        }
    },
};
