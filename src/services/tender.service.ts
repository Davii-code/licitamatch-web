import { apiFetch } from './auth.service';

type TenderQueryParamValue = string | number | boolean;

export interface TenderDocument {
    tipoDocumentoId: number;
    tipoDocumentoNome: string;
    url: string | null;
    titulo?: string;
}

export interface TenderListItem {
    id: string;
    numeroControlePNCP?: string | null;
    title: string;
    source: string;
    publicationDate: string;
    uf?: string;
    municipio?: string;
    esfera?: string;
    orgao?: string;
    unidade?: string;
    modalidade?: string;
    situacao?: string;
    srp?: boolean;
    /** Ausente nas respostas dos planos GUEST e FREE (sanitizadas). */
    valorEstimado?: number | null;
    valorHomologado?: number | null;
    dataAberturaProposta?: string | null;
    dataEncerramentoProposta?: string | null;
    nicho?: string | null;
    nichos?: string[];
    externalLink?: string | null;
    linkEdital?: string | null;
    semEdital?: boolean;
    documentos?: TenderDocument[] | null;
    /** Momento em que este registro foi sincronizado com a fonte. */
    sincronizadoEm?: string;
}

export interface PaginatedTendersResponse {
    data: TenderListItem[];
    totalRecords: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    /** Verdadeiro quando a busca textual usou o índice Full-Text Search. */
    ftsUsed: boolean;
    searchInfo?: string;
    /** Data da última ingestão bem-sucedida, ou null se nunca rodou. */
    ultimaSincronizacao: string | null;
    ftsFeatureEnabled?: boolean;
    paywall: boolean;
    paywallMessage?: string;
    role?: 'FREE' | 'PREMIUM';
}

export interface TenderDetailResponse {
    data: TenderListItem;
    role: 'FREE' | 'PREMIUM';
    isPremium: boolean;
}

export interface Modalidade {
    /** Nome do enum, ex: PREGAO_ELETRONICO. */
    enum: string;
    /** Código numérico usado pelo PNCP, ex: 6. */
    codigo: number;
    /** Nome legível, ex: "Pregão - Eletrônico". */
    nome: string;
    /** Falso para dispensa, inexigibilidade e procedimentos auxiliares. */
    isLicitacao: boolean;
}

export interface NichoOption {
    enum: string;
    descricao: string;
}

export interface ModalidadesResponse {
    modalidades: Modalidade[];
    nichos: NichoOption[];
}

/** Remove chaves vazias para não enviar `?estado=&nicho=` à API. */
function buildQuery(params: Record<string, TenderQueryParamValue | undefined | null>): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        search.set(key, String(value));
    }

    return search.toString();
}

export const tenderApi = {
    /**
     * Lista licitações. PREMIUM recebe tudo; FREE recebe prévia de 3 sanitizada.
     */
    getTenders: (params: Record<string, TenderQueryParamValue | undefined | null>) =>
        apiFetch<PaginatedTendersResponse>(`/api/tenders/premium?${buildQuery(params)}`, {
            method: 'GET',
        }),

    /**
     * Detalhe de uma licitação.
     *
     * Só o identificador é necessário. A versão anterior omitia dataInicial,
     * dataFinal e modalidade, que a API exigia — toda chamada respondia 400.
     * Hoje a API resolve o registro pelo próprio id.
     */
    getTenderDetail: (id: string) =>
        apiFetch<TenderDetailResponse>(`/api/tenders/detail/${encodeURIComponent(id)}`, {
            method: 'GET',
        }),

    /** Modalidades e nichos disponíveis para os filtros. */
    getModalities: () =>
        apiFetch<ModalidadesResponse>('/api/tenders/modalidades', { method: 'GET' }),
};
