import { apiFetch, authApi, type SessionResponse } from './auth.service';

export interface ChartPoint {
    label: string;
    value: number;
}

export interface DashboardMetricsResponse {
    licitacoesCardLabel: string;
    totalLicitacoes: string;
    contratosAtivos: string;
    contratosEmExecucao: string;
    melhorNicho: string;
    localidade: string;
    recentesAltissimaCompatibilidade: string;
    isEppMe: boolean;
    /**
     * Licitações abertas dentro do teto de R$ 80.000, exclusivas para ME/EPP
     * (LC 123/2006, Art. 48, I).
     *
     * Substitui o antigo `empateFictoCount`, que era estimado como 60% das
     * oportunidades. Empate ficto depende das propostas apresentadas na sessão,
     * dado que não existe na fase de divulgação do edital.
     */
    licitacoesExclusivasMeEpp: string;
    resumoInteligente: string;
    /** Data da última sincronização do índice de licitações, ou null. */
    ultimaSincronizacao: string | null;
    graficos: {
        licitacoesPorDia: ChartPoint[];
        distribuicaoPorNicho: ChartPoint[];
        contratosPorStatus: ChartPoint[];
    };
}

const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

/** Versão do formato do cache. Incrementar invalida entradas antigas. */
const DASHBOARD_CACHE_VERSION = 2;

interface DashboardCacheEntry {
    version: number;
    timestamp: number;
    data: DashboardMetricsResponse;
}

function getDashboardCacheKey(cnpj: string): string {
    return `dashboard:metrics:${cnpj.replace(/\D/g, '')}`;
}

function readDashboardCache(cnpj: string): DashboardCacheEntry | null {
    try {
        const raw = localStorage.getItem(getDashboardCacheKey(cnpj));
        if (!raw) return null;

        const parsed = JSON.parse(raw) as DashboardCacheEntry;
        if (!parsed?.timestamp || !parsed?.data) return null;

        // Entrada gravada por uma versão anterior tem outro formato de payload;
        // servi-la faria a tela ler campos que não existem mais.
        if (parsed.version !== DASHBOARD_CACHE_VERSION) return null;

        return parsed;
    } catch {
        return null;
    }
}

function writeDashboardCache(cnpj: string, data: DashboardMetricsResponse): void {
    try {
        const payload: DashboardCacheEntry = {
            version: DASHBOARD_CACHE_VERSION,
            timestamp: Date.now(),
            data,
        };
        localStorage.setItem(getDashboardCacheKey(cnpj), JSON.stringify(payload));
    } catch {
        // QuotaExceededError, ou navegação privada com storage bloqueado.
        // O cache é uma conveniência: falhar em gravá-lo não pode derrubar a tela.
    }
}

function isDashboardCacheFresh(entry: DashboardCacheEntry | null): entry is DashboardCacheEntry {
    if (!entry) return false;
    return Date.now() - entry.timestamp < DASHBOARD_CACHE_TTL_MS;
}

export interface DashboardMetricsFetchResult {
    data: DashboardMetricsResponse;
    fromCache: boolean;
    fetchedAt: number;
}

export const dashboardApi = {
    getCachedMetrics: (cnpj: string): DashboardMetricsFetchResult | null => {
        const cache = readDashboardCache(cnpj);
        if (!isDashboardCacheFresh(cache)) return null;
        return { data: cache.data, fromCache: true, fetchedAt: cache.timestamp };
    },

    getMetrics: async (
        cnpj: string,
        options?: { forceRefresh?: boolean }
    ): Promise<DashboardMetricsFetchResult> => {
        const cached = readDashboardCache(cnpj);

        if (!options?.forceRefresh && isDashboardCacheFresh(cached)) {
            return { data: cached.data, fromCache: true, fetchedAt: cached.timestamp };
        }

        const data = await apiFetch<DashboardMetricsResponse>(
            `/api/companies/${cnpj.replace(/\D/g, '')}/metrics`,
            { method: 'GET' }
        );

        writeDashboardCache(cnpj, data);
        return { data, fromCache: false, fetchedAt: Date.now() };
    },

    /** Descarta o cache de uma empresa — usado ao trocar de empresa ativa. */
    clearCache: (cnpj: string): void => {
        try {
            localStorage.removeItem(getDashboardCacheKey(cnpj));
        } catch {
            // Storage indisponível: nada a limpar.
        }
    },
};

export interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: 'GUEST' | 'FREE' | 'PREMIUM';
    createdAt: string;
    updatedAt: string;
    totalEmpresas: number;
}

export interface ActiveSession {
    id: string;
    userAgent: string | null;
    /** IP truncado pelo servidor (sem o último octeto), por minimização de dados. */
    ipAddress: string | null;
    createdAt: string;
    lastUsedAt: string;
}

export const userApi = {
    /**
     * Sessão atual: perfil, empresas e dispositivos conectados.
     *
     * Delega para `authApi.getSession` em vez de redeclarar o formato da
     * resposta — duas descrições do mesmo endpoint acabariam divergindo.
     */
    getProfile: (): Promise<SessionResponse> => authApi.getSession(),

    updateProfile: (data: { name: string }) =>
        apiFetch<{ message: string; user: UserProfile }>('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    /**
     * Troca a senha. Todas as sessões são revogadas no servidor, então o cliente
     * precisa redirecionar para o login em seguida.
     */
    updatePassword: (data: { oldPassword: string; newPassword: string }) =>
        apiFetch<{ message: string; sessoesRevogadas: number }>('/api/users/me/password', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};
