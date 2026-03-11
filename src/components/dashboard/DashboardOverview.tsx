import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/api.service';

// Card simples de resumo estatístico
const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className="dash-card">
        <div className="dash-card-icon" style={{ background: `${color}1A`, color }}>
            {icon}
        </div>
        <div className="dash-card-info">
            <span className="dash-card-label">{label}</span>
            <span className="dash-card-value">{value}</span>
        </div>
    </div>
);

export const DashboardOverview: React.FC = () => {
    const { currentCompany } = useAuth();
    const [metrics, setMetrics] = useState({
        totalLicitacoes: '...',
        contratos: '...',
        alertas: '...',
        recentesAltissimaCompatibilidade: '...',
        isEppMe: false,
        empateFictoCount: '...'
    });

    useEffect(() => {
        if (currentCompany?.company?.cnpj) {
            dashboardApi.getMetrics(currentCompany.company.cnpj).then(data => {
                setMetrics(data);
            }).catch(() => {
                // Fallback / log
                console.warn('Fallback: endpoint de metadados não implementado ainda');
            });
        }
    }, [currentCompany]);

    return (
        <div className="fade-in">
            {/* ── Cards de Resumo ── */}
            <div className="dash-grid">
                <StatCard
                    label="Licitações Compatíveis"
                    value={metrics.totalLicitacoes}
                    color="var(--color-primary)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Em Contratos"
                    value={metrics.contratos}
                    color="var(--color-success)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Alertas Ativos"
                    value={metrics.alertas}
                    color="var(--color-warning)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    }
                />
            </div>

            {/* ── Bloco central: Destaques ── */}
            <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-2)' }}>
                    Resumo Inteligente
                </h3>
                <p style={{ color: 'var(--color-text)', lineHeight: 1.6, maxWidth: 800 }}>
                    Com base na <b>Lei 14.133/2021</b> e nos seus CNAEs ativos, encontramos <strong style={{ color: 'var(--color-primary)' }}>{metrics.recentesAltissimaCompatibilidade} editais de altíssima compatibilidade</strong> publicados nos últimos 7 dias.
                    <br /><br />
                    Sua empresa {metrics.isEppMe ? 'está qualificada como EPP/ME, garantindo o' : 'não possui qualificação EPP/ME; para ME/EPPs existe o'} benefício do empate ficto em {metrics.empateFictoCount} desses editais.
                </p>
            </div>
        </div>
    );
};
