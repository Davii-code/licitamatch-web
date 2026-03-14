import React, { useState, useEffect } from 'react';
import { tenderApi } from '../../services/tender.service';
import { locationApi } from '../../services/location.service';
import { useAuth } from '../../context/AuthContext';

type MunicipioOption = {
    id: number | string;
    nome: string;
};

type TenderItem = {
    id: string | number;
    numeroControlePNCP?: string | null;
    title?: string;
    date?: string;
    publicationDate?: string;
    uf?: string;
    state?: string;
    orgao?: string;
    agency?: string;
    valorEstimado?: number | null;
    value?: string;
    modality?: string;
    modalidade?: string;
    nicho?: string | null;
    nichos?: string[];
    externalLink?: string | null;
    linkEdital?: string | null;
    locked?: boolean;
    match?: number;
};

const STATES = [
    { value: '', label: 'Qualquer Estado' },
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
];

const NICHES = [
    { value: '', label: 'Todos os nichos' },
    { value: 'OBRAS', label: 'Obras e Infraestrutura' },
    { value: 'SERVICOS', label: 'Servicos Gerais' },
    { value: 'TIC', label: 'Tecnologia (TIC)' },
    { value: 'SAUDE', label: 'Saude' },
    { value: 'ENGENHARIA', label: 'Engenharia' },
    { value: 'MAO_DE_OBRA', label: 'Mao de Obra Terceirizada' },
    { value: 'LOCACAO_IMOVEL', label: 'Locacao de Imoveis' },
    { value: 'EDUCACAO', label: 'Educacao e Treinamentos' },
    { value: 'ALIMENTACAO', label: 'Alimentacao e Merenda' },
];

// Função auxiliar para formatar datas
const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'Data não informada';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // Se for formato YYYYMMDD
            const year = dateStr.substring(0, 4);
            const month = dateStr.substring(4, 6);
            const day = dateStr.substring(6, 8);
            const d = new Date(`${year}-${month}-${day}`);
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

export const TenderList: React.FC = () => {
    const { currentCompany } = useAuth();
    const PAGE_SIZE = 10;

    const [filter, setFilter] = useState('PREGAO_ELETRONICO');
    const [stateFilter, setStateFilter] = useState('');
    const [municipioFilter, setMunicipioFilter] = useState('');
    const [nicheFilter, setNicheFilter] = useState('');
    const [municipios, setMunicipios] = useState<MunicipioOption[]>([]);
    const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false);
    const [dataInicial, setDataInicial] = useState('2026-01-01');
    const [dataFinal, setDataFinal] = useState('2026-12-31');
    const [tenders, setTenders] = useState<TenderItem[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [paywallData, setPaywallData] = useState<{ active: boolean, message?: string }>({ active: false });
    const [nicheInfo, setNicheInfo] = useState<string | null>(null);

    // Carregar municípios quando estado mudar
    useEffect(() => {
        if (stateFilter) {
            loadMunicipios(stateFilter);
        } else {
            setMunicipios([]);
            setMunicipioFilter('');
        }
    }, [stateFilter]);

    const loadMunicipios = async (uf: string) => {
        try {
            setIsLoadingMunicipios(true);
            const response = await locationApi.getMunicipios(uf);
            const data = Array.isArray(response)
                ? response
                : (response && typeof response === 'object' && Array.isArray((response as { data?: unknown[] }).data)
                    ? (response as { data: unknown[] }).data
                    : []);
            setMunicipios(data as MunicipioOption[]);
        } catch (err) {
            console.error('Erro ao carregar municípios', err);
            setMunicipios([]);
        } finally {
            setIsLoadingMunicipios(false);
        }
    };

    // Initial fetch
    // useEffect(() => {
    //     handleSearch();
    // }, []);

    const handleSearch = async (targetPage = 1) => {
        setIsLoading(true);
        setHasSearched(true);
        setErrorMsg('');
        setTenders([]); // clear previous
        try {
            const params: Record<string, string | number> = {
                dataInicial: dataInicial.replace(/-/g, ''),
                dataFinal: dataFinal.replace(/-/g, ''),
                page: targetPage,
                limit: PAGE_SIZE,
            };
            if (filter !== 'ALL') params.modalidade = filter;
            if (stateFilter) params.estado = stateFilter;
            if (municipioFilter) params.municipio = municipioFilter;
            if (nicheFilter) params.nicho = nicheFilter;

            const res = await tenderApi.getPremiumTenders(params);
            setTenders(res.data || []);
            setCurrentPage(res.page || targetPage);
            setTotalPages(res.totalPages || 0);
            setTotalRecords(res.totalRecords || 0);
            setHasNextPage(Boolean(res.hasNextPage));
            setPaywallData({ active: res.paywall, message: res.paywallMessage });
            setNicheInfo(res.nicheFallback ? (res.nichoInfo || null) : null);
        } catch (err: unknown) {
            console.error('Erro ao buscar editais', err);
            setErrorMsg(err instanceof Error ? err.message : 'Erro ao buscar editais');
            setTotalPages(0);
            setTotalRecords(0);
            setHasNextPage(false);
            setNicheInfo(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setCurrentPage(1);
        handleSearch(1);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1 && !isLoading) {
            handleSearch(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (hasNextPage && !isLoading) {
            handleSearch(currentPage + 1);
        }
    };

    const NICHE_KEYWORDS: Record<string, string[]> = {
        COMPRAS: ['aquisi', 'fornecimento', 'material', 'insumo', 'produto', 'compra'],
        OBRAS: ['obra', 'constr', 'reforma', 'pavimenta', 'infraestrutura'],
        SERVICOS: ['servico', 'manutencao', 'limpeza', 'vigilancia', 'apoio'],
        TIC: ['software', 'sistema', 'tecnologia', 'informatica', 'licenca', 'ti'],
        SAUDE: ['saude', 'hospital', 'medic', 'laboratorio', 'medicamento'],
        ENGENHARIA: ['engenharia', 'projeto', 'arquitetura', 'estrutural', 'eletrica'],
        MAO_DE_OBRA: ['mao de obra', 'terceir', 'posto', 'profissional', 'operador'],
        LOCACAO_IMOVEL: ['locacao', 'imovel', 'aluguel', 'predio', 'sala'],
        EDUCACAO: ['educacao', 'curso', 'treinamento', 'capacitacao', 'ensino'],
        ALIMENTACAO: ['aliment', 'merenda', 'refeicao', 'genero alimenticio', 'nutricao'],
    };

    const getTargetNiches = (): string[] => {
        if (nicheFilter) return [nicheFilter];

        const principal = currentCompany?.company?.nichoPrincipal;
        const secundarios = currentCompany?.company?.nichosSecundarios ?? [];
        const base = [principal, ...secundarios].filter(Boolean) as string[];
        return base.length > 0 ? base : [];
    };

    const getTenderNiches = (tender: TenderItem): string[] => {
        if (Array.isArray(tender.nichos)) return tender.nichos;
        if (tender.nicho) return [tender.nicho];
        return [];
    };

    const calculateMatch = (tender: TenderItem): number => {
        const targetNiches = getTargetNiches();
        const tenderNiches = getTenderNiches(tender);
        const title = String(tender.title ?? '').toLowerCase();

        if (targetNiches.length === 0) {
            return Math.min(85, 40 + Math.min(20, tenderNiches.length * 8));
        }

        let score = 25;
        const nicheMatches = targetNiches.filter((n) => tenderNiches.includes(n)).length;

        if (nicheMatches > 0) {
            score += Math.min(55, Math.round((nicheMatches / targetNiches.length) * 55));
        }

        for (const niche of targetNiches) {
            const keywords = NICHE_KEYWORDS[niche] ?? [];
            if (keywords.some((kw) => title.includes(kw))) {
                score += 12;
                break;
            }
        }

        if ((tender.modality ?? tender.modalidade) && nicheMatches > 0) {
            score += 6;
        }

        return Math.max(15, Math.min(96, score));
    };

    const isValidExternalLink = (urlLike: string): boolean => {
        try {
            const parsed = new URL(urlLike);
            if (!['http:', 'https:'].includes(parsed.protocol)) return false;
            // Evita abrir link interno do próprio app quando o objetivo é abrir fonte oficial.
            return parsed.host !== window.location.host;
        } catch {
            return false;
        }
    };

    const buildPncpFallbackUrl = (tender: TenderItem): string => {
        const baseUrl = new URL('https://pncp.gov.br/app/editais');
        // Força status em "Todos" para não perder resultados por filtro padrão do portal.
        baseUrl.searchParams.set('status', 'todos');
        baseUrl.searchParams.set('situacao', 'todos');

        if (tender.numeroControlePNCP) {
            baseUrl.searchParams.set('q', tender.numeroControlePNCP);
            return baseUrl.toString();
        }

        const terms = [tender.title, tender.orgao, tender.publicationDate]
            .filter(Boolean)
            .join(' ')
            .trim();

        if (terms) {
            baseUrl.searchParams.set('q', terms);
        }

        return baseUrl.toString();
    };

    const handleOpenTender = (tender: TenderItem) => {
        const candidates = [tender.externalLink, tender.linkEdital].filter((v): v is string => Boolean(v));
        const officialLink = candidates.find(isValidExternalLink);

        window.open(officialLink ?? buildPncpFallbackUrl(tender), '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fade-in">
            {/* ── Filtros Rápidos ── */}
            <div className="tender-filters" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="ALL">Todas as modalidades</option>
                    <option value="PREGAO_ELETRONICO">Pregão Eletrônico</option>
                    <option value="CONCORRENCIA_ELETRONICA">Concorrência - Eletrônica</option>
                    <option value="CONCORRENCIA_PRESENCIAL">Concorrência - Presencial</option>
                    <option value="DISPENSA_LICITACAO">Dispensa de Licitação</option>
                </select>

                <select className="filter-select" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
                    {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                </select>
                
                <select className="filter-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    {STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                {/* Select de Municípios Dinâmico */}
                <select 
                    className="filter-select" 
                    value={municipioFilter} 
                    onChange={(e) => setMunicipioFilter(e.target.value)}
                    disabled={!stateFilter || isLoadingMunicipios}
                    style={{ width: 200 }}
                >
                    <option value="">
                        {isLoadingMunicipios ? 'Carregando...' : stateFilter ? 'Selecionar Município' : 'Escolha um Estado'}
                    </option>
                    {municipios.map((m) => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                    ))}
                </select>

                <input title="Data Inicial" type="date" className="filter-select tender-date-input" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
                <input title="Data Final" type="date" className="filter-select tender-date-input" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />

                <button className="btn btn-primary" style={{ height: 38, padding: '0 var(--space-4)', width: 'auto' }} onClick={handleApplyFilters} disabled={isLoading}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    {isLoading ? 'Buscando...' : 'Aplicar Filtros'}
                </button>
            </div>

            {errorMsg && (
                <div className="auth-alert auth-alert-error" style={{ marginTop: 'var(--space-4)' }}>
                    {errorMsg}
                </div>
            )}

            {nicheInfo && !errorMsg && (
                <div className="auth-alert" style={{ marginTop: 'var(--space-4)' }}>
                    {nicheInfo}
                </div>
            )}

            {/* ── Lista de Editais ── */}
            {isLoading ? (
                <div style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                    <div className="btn-spinner" style={{ width: 20, height: 20, borderColor: 'rgba(0,85,90,0.2)', borderTopColor: 'var(--color-primary)' }} />
                    <span>Buscando licitações...</span>
                </div>
            ) :
            <div className="tender-list">
                {tenders.map((tender) => (
                    <div key={tender.id} className="tender-card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div className={`tender-card-header ${tender.locked ? 'paywall-blur' : ''}`}>
                            {/* Esquerda: infos da licitação */}
                            <div style={{ flex: 1, paddingRight: 'var(--space-6)' }}>
                                <div className="tender-tags">
                                    <span className="tender-tag">{tender.modality ?? 'Modalidade não informada'}</span>
                                    <span className="tender-tag">📅 {formatDate(tender.date ?? tender.publicationDate ?? 'N/A')}</span>
                                    <span className="tender-tag">{tender.uf ?? tender.state ?? 'N/A'}</span>
                                    <span className="tender-tag" style={{ background: '#FEF3C7', color: '#D97706' }}>
                                        UASG: {typeof tender.id === 'string' ? tender.id.split('-').pop() : tender.id ?? 'N/A'}
                                    </span>
                                </div>
                                <h2 className="tender-title" style={{ marginTop: 'var(--space-2)' }}>{tender.title}</h2>
                                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
                                    Órgão: <b>{tender.orgao ?? tender.agency ?? 'Não informado'}</b>
                                </p>
                                <div className="tender-meta">
                                    <div className="tender-meta-item">
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Valor do Lote</span>
                                        <span className="tender-value">{tender.valorEstimado ? `R$ ${tender.valorEstimado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : tender.value ?? 'Sigiloso'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Direita: Score e Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
                                {/* Badge de Match */}
                                <div className="match-badge" title="Score de compatibilidade por nicho e descrição da licitação">
                                    <span className="match-badge-score">{calculateMatch(tender)}%</span>
                                    <span className="match-badge-label">Match</span>
                                </div>
                                <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13, height: 32 }} onClick={() => handleOpenTender(tender)}>
                                    Ver Detalhes &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {!isLoading && !errorMsg && tenders.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto var(--space-4)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                            {hasSearched ? 'Nenhum edital encontrado' : 'Nenhuma busca realizada'}
                        </h3>
                        <p style={{ marginTop: 'var(--space-2)' }}>
                            {hasSearched
                                ? 'Tente ajustar os filtros acima para encontrar mais oportunidades.'
                                : 'Escolha os filtros acima e clique em "Aplicar Filtros" para descobrir licitações.'}
                        </p>
                    </div>
                )}
            </div>}

            {!isLoading && hasSearched && totalRecords > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                        {totalRecords} licitação(ões) encontradas
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <button
                            className="btn btn-ghost"
                            style={{ height: 34, width: 'auto', padding: '0 var(--space-3)' }}
                            onClick={handlePreviousPage}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            Anterior
                        </button>
                        <span style={{ minWidth: 120, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                            Página {currentPage} de {Math.max(totalPages, 1)}
                        </span>
                        <button
                            className="btn btn-ghost"
                            style={{ height: 34, width: 'auto', padding: '0 var(--space-3)' }}
                            onClick={handleNextPage}
                            disabled={!hasNextPage || isLoading}
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
            
            {/* O Modal/Mensagem de paywall na base da página p/ caso de paywall global */}
            {!isLoading && paywallData.active && (
                <div className="paywall-overlay fade-in" style={{ borderRadius: 'var(--radius-lg)', marginTop: 24, position: 'relative' }}>
                    <div className="paywall-icon">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        Conteúdo Premium
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 'var(--space-2) 0', maxWidth: 320 }}>
                        {paywallData.message ?? 'Parece que este edital se encaixa perfeitamente no seu perfil, mas seu limite do plano FREE expirou.'}
                    </p>
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '0 var(--space-8)' }}>
                        Fazer Upgrade
                    </button>
                </div>
            )}
        </div>
    );
};

