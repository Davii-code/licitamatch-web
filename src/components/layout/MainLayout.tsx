import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/useAuth';

/** Título do cabeçalho por rota. */
const TITULOS: Record<string, string> = {
    '/painel': 'Resumo e insights',
    '/painel/licitacoes': 'Descoberta de licitações',
    '/painel/alertas': 'Alertas de oportunidades',
    '/painel/elegibilidade': 'Análise de elegibilidade',
    '/painel/empresa': 'Perfil da empresa',
    '/painel/conta': 'Conta e histórico',
};

const PLANOS = {
    PREMIUM: { label: 'Plano Premium', className: 'plan-pill plan-pill-premium' },
    FREE: { label: 'Plano Free', className: 'plan-pill plan-pill-free' },
    GUEST: { label: 'Visitante', className: 'plan-pill plan-pill-guest' },
} as const;

/**
 * Moldura do painel autenticado.
 *
 * Com o roteador, o conteúdo vem por `<Outlet />` em vez de `children`: cada
 * tela é uma rota filha e ganha URL própria.
 */
export const MainLayout: React.FC = () => {
    const { user, currentCompany, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const role = user?.role ?? 'GUEST';
    const plano = PLANOS[role] ?? PLANOS.GUEST;

    const companyName =
        currentCompany?.company?.tradeName || currentCompany?.company?.legalName || 'Sua empresa';

    const handleLogout = async () => {
        await logout();
        navigate('/entrar', { replace: true });
    };

    return (
        <div className="layout-root">
            <Sidebar
                onSwitchCompany={() => navigate('/empresas')}
                companyName={companyName}
                isPremium={role === 'PREMIUM'}
            />

            <main className="main-content">
                <header className="main-header">
                    <h2 className="header-title">
                        {TITULOS[location.pathname] ?? 'Painel LicitaMatch'}
                    </h2>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className={plano.className}>{plano.label}</div>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ width: 'auto', height: 32, padding: '0 14px', fontSize: 13 }}
                            onClick={handleLogout}
                        >
                            Sair
                        </button>
                    </div>
                </header>

                <section className="content-area">
                    <Outlet />
                </section>
            </main>
        </div>
    );
};
