import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
    activeView: string;
    onChangeView: (view: string) => void;
    onLogout: () => void;
    companyName?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, activeView, onChangeView, onLogout, companyName }) => {
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                        {/* Notificações mock */}
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--color-text-muted)" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--color-warning)', borderRadius: '50%' }}></span>
                        </button>

                        <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 13, height: 32 }}>
                            Plano Free
                        </button>
                    </div>
                </header>

                <section className="content-area">
                    {children}
                </section>
            </main>
        </div>
    );
};
