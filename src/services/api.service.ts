import { apiFetch } from './auth.service';

export const alertApi = {
    getSavedSearches: () =>
        apiFetch<any[]>('/api/tenders/saved-searches', {
            method: 'GET',
        }),
    toggleAlert: (id: number | string, active: boolean) =>
        apiFetch<any>(`/api/tenders/saved-searches/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ active }),
        }),
    createAlert: (alertData: any) =>
        apiFetch<any>('/api/tenders/saved-searches', {
            method: 'POST',
            body: JSON.stringify(alertData),
        }),
};

export const dashboardApi = {
    getMetrics: (cnpj: string) =>
        apiFetch<any>(`/api/companies/${cnpj.replace(/\D/g, '')}/metrics`, {
            method: 'GET',
        }),
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
