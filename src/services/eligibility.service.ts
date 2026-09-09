import { apiFetch } from './auth.service';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CapitalSocialAnalysis {
    isEligible: boolean;
    riskLevel: RiskLevel;
    /** capital social / valor do lote (0.12 = 12%). */
    ratio: number;
    /** Capital mínimo que o edital pode exigir: 10% do valor do lote. */
    requiredCapital: number;
    message: string;
    valorLote: number;
    legalReference: string;
}

export interface MEEPPBenefit {
    eligible: boolean;
    /** Empate ficto — LC 123/2006, Arts. 44 e 45. */
    tiebreakPreference: boolean;
    /** Prazo para regularização fiscal — LC 123/2006, Art. 43, §1º. */
    deadlineExtension: boolean;
    message: string;
}

export interface CnaeMatch {
    cnae: string;
    relevanceScore: number;
    description?: string;
}

export interface EligibilityResponse {
    company: {
        cnpj: string;
        legalName: string;
        status: string;
        size: string | null;
        capitalSocial: number | null;
    };
    eligibility: {
        overallScore: number;
        canBid: boolean;
        warnings: string[];
    };
    capitalSocialAnalysis: CapitalSocialAnalysis;
    meEppBenefits: MEEPPBenefit;
    cnaeMatchAnalysis: {
        matches: CnaeMatch[];
        hasDirectMatch: boolean;
        hasGroupMatch: boolean;
    };
    dataFreshness: {
        lastApiSync: string | null;
        requiresRefresh: boolean;
        refreshEndpoint: string;
    };
}

export const eligibilityApi = {
    /**
     * Analisa a elegibilidade da empresa para um lote de determinado valor.
     *
     * O parâmetro é `valorLote`. Antes era enviado como `loteValue`, nome que a
     * API não conhece: toda chamada respondia 400 e a tela caía num cálculo local
     * de fachada. Se algum cliente antigo ainda mandar `loteValue`, a API aceita
     * como apelido.
     *
     * @param tenderCnaes CNAEs do objeto do edital, para o cruzamento de atividade.
     */
    analyze: (cnpj: string, valorLote: number, tenderCnaes: string[] = []) => {
        const params = new URLSearchParams({ valorLote: String(valorLote) });
        if (tenderCnaes.length > 0) {
            params.set('tenderCnaes', tenderCnaes.join(','));
        }

        return apiFetch<EligibilityResponse>(
            `/api/companies/${cnpj.replace(/\D/g, '')}/eligibility?${params.toString()}`,
            { method: 'GET' }
        );
    },
};
