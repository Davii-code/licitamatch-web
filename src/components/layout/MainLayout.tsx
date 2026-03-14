import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MainLayoutProps {
    children: React.ReactNode;
    activeView: string;
    onChangeView: (view: string) => void;
    onLogout: () => void;
    companyName?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeView, onChangeView, onLogout, companyName }) => {
    const { user } = useAuth();

    // Title map para o Header Principal
    const getTitle = () => {
        switch (activeView) {
            case 'dashboard': return 'Resumo e Insights';
            case 'tenders': return 'Descoberta de Licitações';
            case 'profile': return 'Perfil da Empresa (CNAEs, Documentos)';
            case 'settings': return 'Configurações e Assinatura';
            default: return 'Painel LicitaMatch';
        }
    };

    const role = user?.role ?? 'GUEST';
    const planLabel = role === 'PREMIUM' ? 'Plano Premium' : role === 'FREE' ? 'Plano Free' : 'Visitante';
    const planClass = role === 'PREMIUM' ? 'plan-pill plan-pill-premium' : role === 'FREE' ? 'plan-pill plan-pill-free' : 'plan-pill plan-pill-guest';

    return (
        <div className="layout-root">
            <Sidebar
                activeView={activeView}
                onChangeView={onChangeView}
                onLogout={onLogout}
                companyName={companyName}
            />
            <main className="main-content">
                <header className="main-header">
                    <h2 className="header-title">{getTitle()}</h2>
                    <div className={planClass}>
                        {planLabel}
                    </div>
                </header>

                <section className="content-area">
                    {children}
                </section>
            </main>
        </div>
    );
};
