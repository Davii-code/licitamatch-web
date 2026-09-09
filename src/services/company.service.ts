import { apiFetch } from './auth.service';
import type { AccessLevel, CompanyBrief } from './auth.service';

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

export interface CompanyAddress {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
}

/** Resposta de GET /api/companies/preview — dados da Receita, ainda não gravados. */
export interface CompanyPreview {
    cnpj: string;
    legalName: string;
    tradeName: string | null;
    status: string;
    size: string | null;
    taxRegime: string | null;
    capitalSocial: number | null;
    cnaePrincipal: string | null;
    cnaePrincipalDescricao: string | null;
    cnaesSecundarios: string[];
    address: CompanyAddress;
    phone: string | null;
    email: string | null;
    fonte: string;
}

export interface CompanyDetail {
    cnpj: string;
    legalName: string;
    tradeName: string | null;
    capitalSocial: number | null;
    taxRegime: string | null;
    status: string;
    size: string | null;
    cnaePrincipal: string | null;
    cnaesSecundarios: string[];
    nichoPrincipal: CompanyNiche | null;
    nichosSecundarios: CompanyNiche[];
    address: CompanyAddress;
    phone: string | null;
    email: string | null;
    website: string | null;
    lastApiSync: string | null;
    apiSyncOk: boolean;
    needsRefresh: boolean;
}

export interface CompanyMember {
    userId: string;
    name: string | null;
    /** Ausente para o nível BIDDER (minimização de dados — LGPD). */
    email?: string;
    accessLevel: AccessLevel;
    isLegalRepresentative: boolean;
    qualification: string | null;
    /** Ausente para o nível BIDDER. */
    cpfPartial?: string;
    joinedAt?: string;
}

export interface Certification {
    id: string;
    type: string;
    title: string;
    issuer: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    documentUrl: string | null;
    tags: string[];
    description: string | null;
    isActive: boolean;
    /** Calculado pela API a partir de expiresAt. */
    vencida?: boolean;
}

export interface CompanyDetailResponse {
    company: CompanyDetail;
    membership: { accessLevel: AccessLevel; isLegalRepresentative: boolean };
    members: CompanyMember[];
    certifications: Certification[];
    analysis: {
        meEppBenefit: {
            eligible: boolean;
            tiebreakPreference: boolean;
            deadlineExtension: boolean;
            message: string;
        };
        note: string;
    };
}

/** Registro de auditoria de alterações da empresa. */
export interface AuditEntry {
    id: string;
    createdAt: string;
    /** Origem da alteração: "user:<id>", "system:<origem>" ou "api:opencnpj". */
    actor: string;
    /** Código bruto do evento, ex: "api_sync". */
    event: string;
    /** Descrição legível do evento, traduzida pela API. */
    eventLabel: string;
    changedFields: unknown;
    previousValues: unknown;
    newValues: unknown;
}

export interface AuditResponse {
    registros: AuditEntry[];
    /** Passe em `getAudit` para carregar a página seguinte; null no fim da lista. */
    proximoCursor: string | null;
}

export interface CreateCompanyPayload {
    cnpj: string;
    nichoPrincipal: CompanyNiche;
    nichosSecundarios?: CompanyNiche[];
}

export interface CreateCompanyResponse {
    message: string;
    company: {
        cnpj: string;
        legalName: string;
        tradeName: string | null;
        status: string;
        size: string | null;
        nichoPrincipal: CompanyNiche;
        nichosSecundarios: CompanyNiche[];
        city: string | null;
        state: string | null;
    };
    membership: { accessLevel: AccessLevel; isLegalRepresentative: boolean };
}

/** Apenas dígitos — a API aceita ambos, mas isso evita barra e ponto na URL. */
function onlyDigits(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

export const companyApi = {
    /**
     * Prévia dos dados do CNPJ para preencher o formulário de onboarding.
     *
     * Passa pela própria API, que consulta a mesma fonte usada no cadastro
     * (OpenCNPJ). Antes esta chamada ia do navegador direto para a BrasilAPI: os
     * dados exibidos podiam divergir dos gravados, e o CNPJ do usuário era
     * enviado a um terceiro a partir do cliente.
     */
    previewCNPJ: (cnpj: string) =>
        apiFetch<CompanyPreview>(`/api/companies/preview?cnpj=${onlyDigits(cnpj)}`, {
            method: 'GET',
        }),

    /** Cadastra a empresa. Quem cadastra primeiro torna-se OWNER. */
    create: (payload: CreateCompanyPayload) =>
        apiFetch<CreateCompanyResponse>('/api/companies', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** Empresas vinculadas ao usuário autenticado. */
    list: () =>
        apiFetch<{ companies: CompanyBrief[] }>('/api/companies', { method: 'GET' }),

    /** Dados completos de uma empresa, incluindo membros e certificações. */
    get: (cnpj: string) =>
        apiFetch<CompanyDetailResponse>(`/api/companies/${onlyDigits(cnpj)}`, {
            method: 'GET',
        }),

    /** Atualiza contato e nichos. Requer nível ADMIN nesta empresa. */
    update: (
        cnpj: string,
        patch: Partial<{
            website: string | null;
            email: string | null;
            phone: string | null;
            nichoPrincipal: CompanyNiche;
            nichosSecundarios: CompanyNiche[];
        }>
    ) =>
        apiFetch<{ message: string }>(`/api/companies/${onlyDigits(cnpj)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        }),

    /** Força a sincronização com a Receita. Requer nível ADMIN nesta empresa. */
    refresh: (cnpj: string) =>
        apiFetch<{ message: string; hasChanges: boolean; changedFields: string[] }>(
            `/api/companies/${onlyDigits(cnpj)}/refresh`,
            { method: 'POST' }
        ),

    getMembers: (cnpj: string) =>
        apiFetch<{ members: CompanyMember[]; total: number }>(
            `/api/companies/${onlyDigits(cnpj)}/members`,
            { method: 'GET' }
        ),

    /** Vincula um usuário já cadastrado. Requer nível OWNER nesta empresa. */
    addMember: (cnpj: string, member: { email: string; accessLevel?: AccessLevel }) =>
        apiFetch<{ message: string }>(`/api/companies/${onlyDigits(cnpj)}/members`, {
            method: 'POST',
            body: JSON.stringify(member),
        }),

    removeMember: (cnpj: string, userId: string) =>
        apiFetch<{ message: string }>(
            `/api/companies/${onlyDigits(cnpj)}/members?userId=${encodeURIComponent(userId)}`,
            { method: 'DELETE' }
        ),

    getCertifications: (cnpj: string) =>
        apiFetch<{ certifications: Certification[]; total: number }>(
            `/api/companies/${onlyDigits(cnpj)}/certifications`,
            { method: 'GET' }
        ),

    /**
     * Histórico de auditoria da empresa. Requer nível ADMIN nesta empresa.
     * @param cursor Id do último registro da página anterior.
     */
    getAudit: (cnpj: string, cursor?: string) => {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
        return apiFetch<AuditResponse>(
            `/api/companies/${onlyDigits(cnpj)}/audit${query}`,
            { method: 'GET' }
        );
    },
};
