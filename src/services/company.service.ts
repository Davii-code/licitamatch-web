import { apiFetch } from './auth.service';

export type CompanyNiche =
    | 'COMPRAS'
    | 'OBRAS'
    | 'SERVICOS'
    | 'TIC'
    | 'SAUDE'
    | 'ENGENHARIA'
    | 'MAO_DE_OBRA'
    | 'LOCACAO_IMOVEL'
    | 'EDUCACAO'
    | 'ALIMENTACAO';

export interface PublicCompanyPreview {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string | null;
    descricao_situacao_cadastral: string; // Ex: ATIVA
    cnae_fiscal: number;
    cnae_fiscal_descricao: string;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
}

export interface CreateCompanyPayload {
    cnpj: string;
    nichoPrincipal: CompanyNiche;
    nichosSecundarios?: CompanyNiche[];
}

export const companyApi = {
    /**
     * Consulta pública (sem auth) usando BrasilAPI para auto-fill na tela (preview).
     * Note: No backend usamos OpenCNPJ para popular o DB, 
     * mas na UI usamos BrasilAPI pois não há restrições de CORS.
     */
    previewCNPJ: async (cleanCnpj: string): Promise<PublicCompanyPreview> => {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        if (!res.ok) {
            if (res.status === 404) throw new Error('CNPJ não encontrado na Receita Federal.');
            if (res.status === 400) throw new Error('CNPJ inválido.');
            throw new Error('Falha ao consultar CNPJ. Tente novamente.');
        }
        return res.json();
    },

    /** Cria a empresa no banco de dados do LicitaMatch */
    create: (payload: CreateCompanyPayload) =>
        apiFetch<{ message: string; company: { cnpj: string } }>('/api/companies', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** Busca todas as empresas do usuário autenticado */
    list: () =>
        apiFetch<{ companies: any[] }>('/api/companies', {
            method: 'GET',
        }),

    /** Busca dados completos de uma empresa específica */
    get: (cnpj: string) =>
        apiFetch<any>(`/api/companies/${cnpj.replace(/\D/g, '')}`, {
            method: 'GET',
        }),

    /** Força atualização dos dados da empresa via OpenCNPJ */
    refresh: (cnpj: string) =>
        apiFetch<{ message: string, hasChanges: boolean }>(`/api/companies/${cnpj.replace(/\D/g, '')}/refresh`, {
            method: 'POST',
        }),

    /** Lista membros da empresa */
    getMembers: (cnpj: string) =>
        apiFetch<{ members: any[], total: number }>(`/api/companies/${cnpj.replace(/\D/g, '')}/members`, {
            method: 'GET',
        }),

    /** Lista certificações/atestados da empresa */
    getCertifications: (cnpj: string) =>
        apiFetch<{ certifications: any[], total: number }>(`/api/companies/${cnpj.replace(/\D/g, '')}/certifications`, {
            method: 'GET',
        }),
};
