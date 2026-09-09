import { apiFetch } from './auth.service';

/** Filtros de uma busca salva. Espelha `alertFiltersSchema` no back-end. */
export interface AlertFilters {
    /** Sigla da UF, 2 letras. */
    estado?: string;
    /** Código IBGE do município, 7 dígitos. */
    municipio?: string;
    nicho?: string;
    codigoModalidadeContratacao?: number;
    /** Mínimo de 3 caracteres. */
    termo?: string;
    valorMin?: number;
    valorMax?: number;
    orgaoCnpj?: string;
}

export interface Alert {
    id: string;
    name: string;
    /** Null quando os filtros gravados não puderam ser lidos. */
    filters: AlertFilters | null;
    isActive: boolean;
    /** Última vez que o alerta gerou notificação. */
    lastNotifiedAt: string | null;
    createdAt: string;
}

export interface AlertListResponse {
    alerts: Alert[];
    total: number;
    /** Máximo de alertas ativos permitido por conta. */
    limite: number;
}

export const alertApi = {
    /** Lista os alertas do usuário. Exclusivo do plano PREMIUM. */
    list: () => apiFetch<AlertListResponse>('/api/alerts', { method: 'GET' }),

    create: (payload: { name: string; filters: AlertFilters }) =>
        apiFetch<{ message: string; alert: Alert }>('/api/alerts', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    update: (id: string, patch: { name?: string; filters?: AlertFilters; isActive?: boolean }) =>
        apiFetch<{ message: string; alert: Alert }>(`/api/alerts/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        }),

    remove: (id: string) =>
        apiFetch<{ message: string }>(`/api/alerts/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        }),
};
