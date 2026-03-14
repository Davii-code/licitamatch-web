import React, { useEffect, useState } from 'react';
import { companyApi } from '../../services/company.service';
import { formatCNPJ } from '../../utils/cnpj';

interface CompanyProfileProps {
    cnpj: string;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ cnpj }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Estados locais para tabs simples (Perfil / Membros / Atestados)
    const [activeTab, setActiveTab] = useState<'info' | 'members' | 'certifications'>('info');

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await companyApi.get(cnpj);
            setData(res);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar dados da empresa');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cnpj) {
            fetchData();
        }
    }, [cnpj]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await companyApi.refresh(cnpj);
            await fetchData(); // Recarrega os dados após sincronizar
        } catch (err: any) {
            alert(err.message || 'Erro ao sincronizar com OpenCNPJ');
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="skeleton" style={{ width: '30%', height: 32 }} />
                <div className="skeleton" style={{ width: '100%', height: 300 }} />
            </div>
        );
    }

    if (error || !data || !data.company) {
        return <div className="auth-alert auth-alert-error fade-in">{error || 'Empresa não encontrada.'}</div>;
    }

    const { company, membership = {}, members = [], certifications = [] } = data;
    const isOwner = membership.accessLevel === 'OWNER';

    return (
        <div className="fade-in profile-container">
            {/* ── Cabeçalho do Perfil ── */}
            <div className="profile-header">
                <div className="profile-title-group">
                    <h2 className="profile-title">{company.tradeName || company.legalName}</h2>
                    <span className="profile-subtitle">CNPJ {formatCNPJ(company.cnpj)}</span>
                </div>
                <div>
                    <button
                        className="btn btn-ghost"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        style={{ height: 38, padding: '0 var(--space-4)' }}
                    >
                        {refreshing ? (
                            <><div className="btn-spinner" style={{ borderColor: 'rgba(0,85,90,0.3)', borderTopColor: 'var(--color-primary)', width: 14, height: 14 }} /> Sincronizando...</>
                        ) : (
                            <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Atualizar Dados</>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Tabs Simples ── */}
            <div className="auth-tabs" style={{ maxWidth: 400, margin: 0 }}>
                <button className={`auth-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>Dados Cadastrais</button>
                <button className={`auth-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Membros</button>
                <button className={`auth-tab ${activeTab === 'certifications' ? 'active' : ''}`} onClick={() => setActiveTab('certifications')}>Certificações</button>
            </div>

            {/* ── TAB: Dados Cadastrais ── */}
            {activeTab === 'info' && (
                <div className="fade-in profile-section">
                    <div className="profile-section-header">
                        <h3 className="profile-section-title">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-secondary)" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Informações Gerais
                        </h3>
                        {company.status === 'ACTIVE' ? <span className="badge badge-success">Ativa</span> : <span className="badge badge-warning">{company.status}</span>}
                    </div>

                    <div className="data-grid">
                        <div className="data-item">
                            <span className="data-label">Razão Social</span>
                            <span className="data-value">{company.legalName}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Porte da Empresa</span>
                                <span className="data-value">{company.size || 'Não informado'}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Situação Cadastral</span>
                            <span className="data-value">{company.status || 'Não informado'}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Capital Social</span>
                            <span className="data-value">{company.capitalSocial ? `R$ ${Number(company.capitalSocial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">CNAE Principal</span>
                            <span className="data-value">{company.cnaePrincipal || 'N/A'}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">CNAEs Secundários</span>
                            <span className="data-value">{company.cnaesSecundarios?.length || 0} atividades registradas</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Localização</span>
                            <span className="data-value">{company.address?.city} - {company.address?.state}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Telefone</span>
                            <span className="data-value">{company.phone || 'Não informado'}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Email</span>
                            <span className="data-value">{company.email || 'Não informado'}</span>
                        </div>
                        <div className="data-item">
                            <span className="data-label">Regime Tributário</span>
                            <span className="data-value">{company.taxRegime || 'Não informado'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB: Membros ── */}
            {activeTab === 'members' && (
                <div className="fade-in profile-section">
                    <div className="profile-section-header">
                        <h3 className="profile-section-title">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-secondary)" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Equipe e Acessos
                        </h3>
                        {isOwner && (
                            <button className="btn btn-primary" style={{ height: 32, padding: '0 16px', fontSize: 13, width: 'auto' }}>
                                + Adicionar Membro
                            </button>
                        )}
                    </div>
                    <div className="list-container">
                        {members.map((m: any) => (
                            <div className="list-item" key={m.userId}>
                                <div className="member-info">
                                    <span className="member-name">{m.name} {m.isLegalRepresentative && <span className="badge badge-primary" style={{ marginLeft: 8 }}>Rep. Legal</span>}</span>
                                    <span className="member-email">{m.email || 'Acesso restrito (somente via Sócios)'}</span>
                                </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span className="badge badge-neutral">{m.accessLevel}</span>
                    {isOwner && (
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '4px', height: 28, width: 28 }}
                        onClick={() => {
                          if (members.length === 1) {
                            alert("⚠️ Ação não permitida!\n\nA empresa precisa ter pelo menos 1 membro com acesso. Você não pode remover o único usuário existente.");
                            return;
                          }
                          // lógica de exclusão caso haja + de 1 (em breve)
                          if(window.confirm(`Tem certeza que deseja remover o acesso de ${m.name}?`)) {
                             alert("Função de exclusão será ativada junto à API em breve.");
                          }
                        }}
                      >
                         <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TAB: Certificações ── */}
            {activeTab === 'certifications' && (
                <div className="fade-in profile-section">
                    <div className="profile-section-header">
                        <h3 className="profile-section-title">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-secondary)" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            Atestados e Certificações
                        </h3>
                        {['OWNER', 'ADMIN'].includes(membership.accessLevel) && (
                            <button className="btn btn-primary" style={{ height: 32, padding: '0 16px', fontSize: 13, width: 'auto' }}>
                                + Novo Atestado
                            </button>
                        )}
                    </div>
                    <div className="list-container">
                        {certifications.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Nenhuma certificação/atestado cadastrado.</p>
                        ) : (
                            certifications.map((cert: any) => (
                                <div className="list-item" key={cert.id}>
                                    <div className="cert-info">
                                        <span className="cert-title">{cert.title}</span>
                                        <span className="cert-meta">Adicionado em: {new Date(cert.createdAt).toLocaleDateString()}</span>
                                        <div className="cert-tags">
                                            {cert.tags.map((tag: string) => (
                                                <span key={tag} className="cert-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="badge badge-primary">{cert.type}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
