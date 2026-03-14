import { apiFetch } from './auth.service';

export interface DashboardMetricsResponse {
    licitacoesCardLabel: string;
    totalLicitacoes: string;
    contratosAtivos: string;
    contratosEmExecucao: string;
    melhorNicho: string;
    localidade: string;
    recentesAltissimaCompatibilidade: string;
    isEppMe: boolean;
    empateFictoCount: string;
    resumoInteligente: string;
    graficos: {
        licitacoesPorDia: { label: string; value: number }[];
        distribuicaoPorNicho: { label: string; value: number }[];
        contratosPorStatus: { label: string; value: number }[];
    };
}

const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

type DashboardCacheEntry = {
    timestamp: number;
    data: DashboardMetricsResponse;
};

function getDashboardCacheKey(cnpj: string): string {
    return `dashboard:metrics:${cnpj.replace(/\D/g, '')}`;
}

function readDashboardCache(cnpj: string): DashboardCacheEntry | null {
    try {
        const raw = localStorage.getItem(getDashboardCacheKey(cnpj));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as DashboardCacheEntry;
        if (!parsed?.timestamp || !parsed?.data) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeDashboardCache(cnpj: string, data: DashboardMetricsResponse): void {
    const payload: DashboardCacheEntry = { timestamp: Date.now(), data };
    localStorage.setItem(getDashboardCacheKey(cnpj), JSON.stringify(payload));
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

    getMetrics: async (cnpj: string, options?: { forceRefresh?: boolean }): Promise<DashboardMetricsFetchResult> => {
        const forceRefresh = Boolean(options?.forceRefresh);
        const cached = readDashboardCache(cnpj);

        if (!forceRefresh && isDashboardCacheFresh(cached)) {
            return { data: cached.data, fromCache: true, fetchedAt: cached.timestamp };
        }

        const data = await apiFetch<DashboardMetricsResponse>(`/api/companies/${cnpj.replace(/\D/g, '')}/metrics`, {
            method: 'GET',
        });

        writeDashboardCache(cnpj, data);
        return { data, fromCache: false, fetchedAt: Date.now() };
    },
};

export const userApi = {
    updateProfile: (data: any) =>
        apiFetch<any>('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    updatePassword: (data: any) =>
        apiFetch<any>('/api/users/me/password', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};
