import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../services/api.service';

type DashboardMetricsResult = Awaited<ReturnType<typeof dashboardApi.getMetrics>>;
type DashboardMetricsResponse = DashboardMetricsResult['data'];

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

const BarChartCard: React.FC<{
    title: string;
    data: { label: string; value: number }[];
    color: string;
}> = ({ title, data, color }) => {
    const max = Math.max(1, ...data.map((d) => d.value));
    return (
        <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ marginBottom: 'var(--space-4)', color: 'var(--color-primary-dark)', fontSize: 'var(--text-base)', fontWeight: 700 }}>{title}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {data.map((item) => (
                    <div key={item.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--text-sm)' }}>
                            <span style={{ color: 'var(--color-text)' }}>{item.label}</span>
                            <b style={{ color: 'var(--color-primary-dark)' }}>{item.value}</b>
                        </div>
                        <div style={{ width: '100%', height: 8, borderRadius: 999, background: '#e5e7eb' }}>
                            <div
                                style={{
                                    width: `${(item.value / max) * 100}%`,
                                    height: '100%',
                                    borderRadius: 999,
                                    background: color,
                                    transition: 'width .4s ease'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const DashboardOverview: React.FC = () => {
    const { currentCompany } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
    const [cacheInfo, setCacheInfo] = useState<string>('');

    const currentCnpj = currentCompany?.company?.cnpj;

    const loadMetrics = async (forceRefresh = false) => {
        if (!currentCnpj) return;

        setError('');
        if (forceRefresh) {
            setRefreshing(true);
        } else if (!metrics) {
            setLoading(true);
        }

        try {
            const result = await dashboardApi.getMetrics(currentCnpj, { forceRefresh });
            setMetrics(result.data);
            setLastFetchedAt(result.fetchedAt);
            setCacheInfo(result.fromCache ? 'Dados em cache (validos por 2h)' : 'Dados atualizados agora');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!currentCnpj) return;

        const cached = dashboardApi.getCachedMetrics(currentCnpj);
        if (cached) {
            setMetrics(cached.data);
            setLastFetchedAt(cached.fetchedAt);
            setCacheInfo('Dados em cache (validos por 2h)');
            setLoading(false);
            setError('');
            return;
        }

        loadMetrics(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCnpj]);

    const formatUpdatedAt = (ts: number | null) => {
        if (!ts) return 'Sem historico de busca';
        return new Date(ts).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--space-8)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span className="btn-spinner" style={{ width: 20, height: 20 }} />
                <span>Carregando indicadores do dashboard...</span>
            </div>
        );
    }

    if (error) {
        return <div className="auth-alert auth-alert-error">{error}</div>;
    }

    if (!metrics) {
        return <div className="auth-alert">Selecione uma empresa para visualizar os indicadores.</div>;
    }

    return (
        <div className="fade-in">
            <section className="dashboard-hero">
                <div>
                    <h3 className="dashboard-hero-title">Visao Geral de Oportunidades</h3>
                    <p className="dashboard-hero-subtitle">
                        Atualizado em {formatUpdatedAt(lastFetchedAt)}. {cacheInfo}
                    </p>
                </div>
                <button className="btn btn-primary dashboard-refresh-btn" onClick={() => loadMetrics(true)} disabled={refreshing}>
                    {refreshing ? (
                        <><span className="btn-spinner" /> Atualizando...</>
                    ) : (
                        'Recarregar dashboard'
                    )}
                </button>
            </section>

            {/* ── Cards de Resumo ── */}
            <div className="dash-grid">
                <StatCard
                    label={metrics.licitacoesCardLabel || 'Licitacoes Compativeis'}
                    value={metrics.totalLicitacoes}
                    color="var(--color-primary)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Contratos Ativos"
                    value={metrics.contratosAtivos}
                    color="var(--color-success)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Em Execução"
                    value={metrics.contratosEmExecucao}
                    color="var(--color-warning)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    }
                />
                <StatCard
                    label="Melhor Nicho"
                    value={metrics.melhorNicho}
                    color="var(--color-secondary)"
                    icon={
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.959a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.447a1 1 0 00-1.175 0l-3.367 2.447c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.364-1.118L2.98 9.386c-.783-.57-.38-1.81.588-1.81H7.73a1 1 0 00.95-.69l1.286-3.959z" />
                        </svg>
                    }
                />
            </div>

            {/* ── Bloco central: Destaques ── */}
            <div className="dashboard-summary-card">
                <h3 className="dashboard-summary-title">
                    Resumo Inteligente
                </h3>
                <p className="dashboard-summary-text">
                    {metrics.resumoInteligente}
                    <br /><br />
                    Sua empresa {metrics.isEppMe ? 'está qualificada como EPP/ME, garantindo o' : 'não possui qualificação EPP/ME; para ME/EPPs existe o'} beneficio do empate ficto em {metrics.empateFictoCount} desses editais.
                    <br />
                    Localidade validada: <b>{metrics.localidade}</b>.
                </p>
            </div>

            <div className="dash-grid dashboard-charts-grid">
                <BarChartCard
                    title="Licitacoes por dia (ultimos 7 dias)"
                    data={metrics.graficos.licitacoesPorDia}
                    color="var(--color-primary)"
                />
                <BarChartCard
                    title="Distribuicao por nicho"
                    data={metrics.graficos.distribuicaoPorNicho}
                    color="var(--color-secondary)"
                />
                <BarChartCard
                    title="Contratos por status"
                    data={metrics.graficos.contratosPorStatus}
                    color="var(--color-success)"
                />
            </div>
        </div>
    );
};
