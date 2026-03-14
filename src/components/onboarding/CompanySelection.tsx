import React, { useState } from 'react';
import { type CompanyBrief, authApi } from '../../services/auth.service';
import '../../styles/onboarding.css';

interface CompanySelectionProps {
    companies: CompanyBrief[];
    onSelect: (token: string, company: CompanyBrief) => void;
    onNewCompany: () => void;
    onLogout: () => void;
}

export const CompanySelection: React.FC<CompanySelectionProps> = ({
    companies,
    onSelect,
    onNewCompany,
    onLogout
}) => {
    const [loadingCnpj, setLoadingCnpj] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSelect = async (cnpj: string) => {
        setLoadingCnpj(cnpj);
        setError(null);

        try {
            const response = await authApi.selectCompany(cnpj);
            // Salva o novo token devolvido pela API com o contexto de empresa
            authApi.persistSession(response.accessToken);
            const normalizedCompany: CompanyBrief = {
                cnpj: response.company.cnpj,
                accessLevel: response.membership.accessLevel,
                isLegalRepresentative: response.membership.isLegalRepresentative,
                company: {
                    cnpj: response.company.cnpj,
                    legalName: response.company.legalName,
                    tradeName: response.company.tradeName,
                    status: response.company.status,
                    size: response.company.size,
                    nichoPrincipal: response.company.nichoPrincipal,
                    nichosSecundarios: response.company.nichosSecundarios,
                    city: null,
                    state: null,
                },
            };
            onSelect(response.accessToken, normalizedCompany);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao selecionar empresa.');
        } finally {
            setLoadingCnpj(null);
        }
    };

    const IconBuilding = () => (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-primary-light)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );

    return (
        <div className="onboarding-root">
            <div className="onboarding-header">
                <h1 className="onboarding-title">Selecione sua Empresa</h1>
                <p className="onboarding-subtitle">
                    Você possui vínculos com uma ou mais empresas. Escolha qual contexto deseja ativar para continuar.
                </p>
            </div>

            <div className="onboarding-container">
                {error && (
                    <div className="auth-alert auth-alert-error" style={{ marginBottom: 'var(--space-6)' }}>
                        <span>{error}</span>
                    </div>
                )}

                <div className="company-list">
                    {companies.map((rel) => {
                        const isActive = rel.company.status === 'ACTIVE';
                        return (
                            <button
                                key={rel.cnpj}
                                className="company-item fade-in"
                                onClick={() => handleSelect(rel.cnpj)}
                                disabled={loadingCnpj !== null}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                    <div style={{ padding: 12, background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)' }}>
                                        {loadingCnpj === rel.cnpj ? (
                                            <span className="btn-spinner" style={{ borderColor: 'var(--color-primary-light)', borderTopColor: 'transparent', width: 24, height: 24 }} />
                                        ) : (
                                            <IconBuilding />
                                        )}
                                    </div>

                                    <div className="company-item-main" style={{ textAlign: 'left' }}>
                                        <span className="company-item-name">{rel.company.tradeName || rel.company.legalName}</span>
                                        <span className="company-item-cnpj">CNPJ: {rel.cnpj}</span>
                                        <div className="company-item-role">
                                            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{rel.accessLevel}</span>
                                            {rel.isLegalRepresentative && (
                                                <>
                                                    &bull;
                                                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Sócio/Representante</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <span className={`status-badge ${isActive ? 'active' : 'suspended'}`}>
                                    {rel.company.status}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                    <button className="btn btn-ghost" onClick={onLogout} disabled={loadingCnpj !== null}>
                        Sair da conta
                    </button>

                    <button className="btn btn-primary" onClick={onNewCompany} disabled={loadingCnpj !== null}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar Nova Empresa
                    </button>
                </div>
            </div>
        </div>
    );
};
