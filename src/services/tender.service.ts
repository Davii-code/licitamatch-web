import { apiFetch } from './auth.service';

type TenderQueryParamValue = string | number | boolean;

export interface TenderListItem {
    id: string | number;
    numeroControlePNCP?: string | null;
    title?: string;
    publicationDate?: string;
    uf?: string;
    municipio?: string;
    orgao?: string;
    valorEstimado?: number | null;
    modalidade?: string;
    nicho?: string | null;
    nichos?: string[];
    externalLink?: string | null;
    linkEdital?: string | null;
}

export interface PremiumTendersResponse {
    data: TenderListItem[];
    totalRecords: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    nicheFallback?: boolean;
    nichoInfo?: string;
    ftsUsed?: boolean;
    searchInfo?: string;
    ftsFeatureEnabled?: boolean;
    paywall: boolean;
    paywallMessage?: string;
}

export const tenderApi = {
    /**
     * Busca licitações paginadas (Aberto para PREMIUM, restrito para FREE/GUEST).
     */
    getPremiumTenders: (params: Record<string, TenderQueryParamValue>) => {
        const urlParams = new URLSearchParams(
            Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
            }, {})
        ).toString();
        return apiFetch<PremiumTendersResponse>(`/api/tenders/premium?${urlParams}`, {
            method: 'GET',
        });
    },

    /**
     * Busca detalhe de uma licitação
     */
    getTenderDetail: (id: string | number) =>
        apiFetch<Record<string, unknown>>(`/api/tenders/detail/${id}`, {
            method: 'GET',
        }),

    /**
     * Busca modalidades de licitações
     */
    getModalities: () =>
        apiFetch<{ modalidades: { label: string, value: number, isLicitacao: boolean }[] }>('/api/tenders/modalidades', {
            method: 'GET',
        }),
};
