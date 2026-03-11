import React, { useState, useEffect } from 'react';
import { tenderApi } from '../../services/tender.service';

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

export const TenderList: React.FC = () => {
    const [filter, setFilter] = useState('ALL');
    const [stateFilter, setStateFilter] = useState('');
    const [municipioFilter, setMunicipioFilter] = useState('');
    const [dataInicial, setDataInicial] = useState('2026-01-01');
    const [dataFinal, setDataFinal] = useState('2026-12-31');
    const [tenders, setTenders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [paywallData, setPaywallData] = useState<{ active: boolean, message?: string }>({ active: false });

    // Initial fetch
    useEffect(() => {
        handleSearch();
    }, []);

    const handleSearch = async () => {
        setIsLoading(true);
        setErrorMsg('');
        setTenders([]); // clear previous
        try {
            const params: any = {
                modalidade: filter === 'ALL' ? '6' : filter,
                dataInicial: dataInicial.replace(/-/g, ''),
                dataFinal: dataFinal.replace(/-/g, '')
            };
            if (stateFilter) params.estado = stateFilter;
            if (municipioFilter) params.municipio = municipioFilter;

            const res = await tenderApi.getPremiumTenders(params);
            setTenders(res.data || []);
            setPaywallData({ active: res.paywall, message: res.paywallMessage });
        } catch (err: any) {
            console.error('Erro ao buscar editais', err);
            setErrorMsg(err.message || 'Erro ao buscar editais');
        } finally {
            setIsLoading(false);
        }
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
                
                <select className="filter-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                    {STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <input type="text" className="filter-select" placeholder="Cód. IBGE Município"
                    value={municipioFilter} onChange={(e) => setMunicipioFilter(e.target.value)} style={{ width: 160 }} />

                <input title="Data Inicial" type="date" className="filter-select" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
                <input title="Data Final" type="date" className="filter-select" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />

                <button className="btn btn-primary" style={{ height: 38, padding: '0 var(--space-4)', width: 'auto' }} onClick={handleSearch} disabled={isLoading}>
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

            {/* ── Lista de Editais ── */}
            {isLoading ? <div style={{padding: '2rem 0'}}>Buscando licitações...</div> :
            <div className="tender-list">
                {tenders.map((tender) => (
                    <div key={tender.id} className="tender-card" style={{ position: 'relative', overflow: 'hidden' }}>
                        <div className={`tender-card-header ${tender.locked ? 'paywall-blur' : ''}`}>
                            {/* Esquerda: infos da licitação */}
                            <div style={{ flex: 1, paddingRight: 'var(--space-6)' }}>
                                <div className="tender-tags">
                                    <span className="tender-tag">{tender.modality ?? 'Modalidade não informada'}</span>
                                    <span className="tender-tag">Data: {tender.date ?? tender.publicationDate ?? 'N/A'}</span>
                                    <span className="tender-tag">{tender.uf ?? tender.state ?? 'N/A'}</span>
                                    <span className="tender-tag" style={{ background: '#FEF3C7', color: '#D97706' }}>
                                        UASG: {tender.id.split('-').pop() ?? tender.id}
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
                                <div className="match-badge" title="Score de Compatibilidade baseado em CNAE e capacidade técnica">
                                    <span className="match-badge-score">{tender.match ?? 100}%</span>
                                    <span className="match-badge-label">Match</span>
                                </div>
                                <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 13, height: 32 }}>
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
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Nenhum edital encontrado</h3>
                        <p style={{ marginTop: 'var(--space-2)' }}>Tente ajustar os filtros acima para encontrar mais oportunidades.</p>
                    </div>
                )}
            </div>}
            
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

