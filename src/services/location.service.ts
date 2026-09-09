import { apiFetch } from './auth.service';

export interface Estado {
    /** Código IBGE do estado, ex: 26 para Pernambuco. */
    id: number;
    /** Sigla da UF, ex: "PE". É o valor esperado pelo filtro ?estado=. */
    sigla: string;
    nome: string;
}

export interface Municipio {
    /** Código IBGE de 7 dígitos. É o valor esperado pelo filtro ?municipio=. */
    id: number;
    nome: string;
    uf: string;
}

/**
 * A API devolve os dados dentro de um envelope com metadados.
 *
 * Os tipos anteriores diziam `any[]`, como se a resposta fosse o array direto.
 * Cada consumidor então precisava adivinhar o formato — o filtro de municípios
 * chegou a checar `Array.isArray(response.data)` em tempo de execução para
 * contornar isso.
 */
interface LocalidadesEnvelope<T> {
    total: number;
    data: T[];
    fonte: string;
}

interface MunicipiosEnvelope extends LocalidadesEnvelope<Municipio> {
    uf: string;
    filtroPorNome?: string;
    dica: string;
}

export const locationApi = {
    /** Lista as 27 UFs, ordenadas por nome. */
    getEstados: async (): Promise<Estado[]> => {
        const response = await apiFetch<LocalidadesEnvelope<Estado>>(
            '/api/localidades/estados',
            { method: 'GET' }
        );
        return response.data;
    },

    /**
     * Lista os municípios de uma UF.
     * @param uf   Sigla (ex: "PE") ou código IBGE do estado (ex: "26").
     * @param nome Filtro parcial opcional por nome, sem sensibilidade a acentos.
     */
    getMunicipios: async (uf: string, nome?: string): Promise<Municipio[]> => {
        const query = nome ? `?nome=${encodeURIComponent(nome)}` : '';
        const response = await apiFetch<MunicipiosEnvelope>(
            `/api/localidades/estados/${encodeURIComponent(uf)}/municipios${query}`,
            { method: 'GET' }
        );
        return response.data;
    },
};
