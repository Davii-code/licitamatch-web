import { apiFetch } from './auth.service';

export const locationApi = {
    getEstados: () =>
        apiFetch<any[]>('/api/localidades/estados', {
            method: 'GET',
        }),
    getMunicipios: (uf: string) =>
        apiFetch<any[]>(`/api/localidades/estados/${uf}/municipios`, {
            method: 'GET',
        }),
};
