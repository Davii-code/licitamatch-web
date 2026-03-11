import { apiFetch } from './auth.service';

export const eligibilityApi = {
    /**
     * Analisa elegibilidade da empresa com base no valor de um lote
     */
    analyze: (cnpj: string, loteValue: number) =>
        apiFetch<any>(`/api/companies/${cnpj.replace(/\D/g, '')}/eligibility?loteValue=${loteValue}`, {
            method: 'GET',
        }),
};
