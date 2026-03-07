// ── Centraliza URLs da API ──
// Em dev: deixe VITE_API_URL vazio — o proxy do vite.config.ts redireciona /api/* para localhost:3000
// Em produção: defina VITE_API_URL=https://api.seudominio.com no .env
const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ── Tipos de resposta ──
export interface AuthTokens {
    accessToken: string;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string | null;
    role: 'GUEST' | 'FREE' | 'PREMIUM';
}

export interface CompanyBrief {
    cnpj: string;
    accessLevel: 'OWNER' | 'ADMIN' | 'BIDDER';
    isLegalRepresentative: boolean;
    company: {
        cnpj: string;
        legalName: string;
        tradeName: string | null;
        status: string;
        size: string | null;
        city: string | null;
        state: string | null;
    };
}

export interface LoginResponse extends AuthTokens {
    message: string;
    user: UserInfo;
    companies: CompanyBrief[];
    nextStep: string;
}

export interface RegisterResponse {
    message: string;
    user: UserInfo;
}

export interface ApiError {
    error: string;
    details?: Record<string, string[]>;
}

// ── Utilitário de fetch ──
async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('accessToken');

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: 'include', // envia cookies httpOnly (refreshToken)
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    const data = await res.json();

    if (!res.ok) {
        const err: ApiError = data;
        throw new Error(err.error ?? 'Erro desconhecido');
    }

    return data as T;
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

    selectCompany: (cnpj: string) =>
        apiFetch<{ accessToken: string; company: object; membership: object; warnings: string[] }>(
            '/api/auth/select-company',
            { method: 'POST', body: JSON.stringify({ cnpj }) }
        ),

    /** Salva o token no localStorage e retorna o usuário decodificado simplificado */
    persistSession: (token: string) => {
        localStorage.setItem('accessToken', token);
    },

    logout: () => {
        localStorage.removeItem('accessToken');
    },

    getStoredToken: (): string | null => {
        return localStorage.getItem('accessToken');
    },

    isAuthenticated: (): boolean => {
        const token = localStorage.getItem('accessToken');
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },
};
