import React from 'react';
import { LicitaMatchLogo } from '../ui/LicitaMatchLogo';

interface SidebarProps {
    activeView: string;
    onChangeView: (view: string) => void;
    onLogout: () => void;
    companyName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, onLogout, companyName }) => {
    const menuItems = [
        {
            id: 'dashboard', label: 'Dashboard', icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            id: 'tenders', label: 'Licitações', icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            id: 'alerts', label: 'Buscas Salvas', icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            )
        },
        {
            id: 'eligibility', label: 'Analisador (Novo)', icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            id: 'profile', label: 'Empresa', icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            id: 'settings', label: 'Configurações', icon: (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <aside className="sidebar">
            {/* Header com a logo (variante light p/ fundo Oxford Blue) */}
            <div className="sidebar-header">
                <LicitaMatchLogo variant="light" height={32} showTagline={false} />
            </div>

            <nav className="sidebar-nav">
                {menuItems.map(item => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                        onClick={(e) => { e.preventDefault(); onChangeView(item.id); }}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </a>
                ))}
            </nav>

            <div className="sidebar-footer" onClick={onLogout}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                        Empresa Ativa
                    </div>
                    <div className="company-name" style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {companyName || 'Carregando...'}
                    </div>
                </div>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-secondary)" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </div>
        </aside>
    );
};
