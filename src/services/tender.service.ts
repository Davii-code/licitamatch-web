import { apiFetch } from './auth.service';

export const tenderApi = {
    /**
     * Busca licitações paginadas (Aberto para PREMIUM, restrito para FREE/GUEST).
     */
    getPremiumTenders: (params: Record<string, string | number>) => {
        const urlParams = new URLSearchParams(params as Record<string, string>).toString();
        return apiFetch<{ data: any[], totalRecords: number, paywall: boolean, paywallMessage?: string }>(`/api/tenders/premium?${urlParams}`, {
            method: 'GET',
        });
    },

    /**
     * Busca detalhe de uma licitação
     */
    getTenderDetail: (id: string | number) =>
        apiFetch<any>(`/api/tenders/detail/${id}`, {
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
