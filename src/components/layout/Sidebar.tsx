import React from 'react';
import { NavLink } from 'react-router-dom';
import { LicitaMatchLogo } from '../ui/LicitaMatchLogo';

interface SidebarProps {
    onSwitchCompany: () => void;
    companyName?: string;
    /** Itens exclusivos do plano PREMIUM ganham selo. */
    isPremium: boolean;
}

interface MenuItem {
    to: string;
    label: string;
    /** `end` evita que a rota índice fique ativa em todas as filhas. */
    end?: boolean;
    premium?: boolean;
    icon: React.ReactNode;
}

const MENU: MenuItem[] = [
    {
        to: '/painel',
        label: 'Dashboard',
        end: true,
        icon: (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        to: '/painel/licitacoes',
        label: 'Licitações',
        icon: (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
    },
    {
        to: '/painel/alertas',
        label: 'Alertas',
        premium: true,
        icon: (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    },
    {
        to: '/painel/elegibilidade',
        label: 'Elegibilidade',
        icon: (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        to: '/painel/empresa',
        label: 'Empresa',
        icon: (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    {
        to: '/painel/conta',
        label: 'Configurações',
        icon: (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

export const Sidebar: React.FC<SidebarProps> = ({ onSwitchCompany, companyName, isPremium }) => (
    <aside className="sidebar">
        <div className="sidebar-header">
            <LicitaMatchLogo variant="light" height={32} showTagline={false} />
        </div>

        <nav className="sidebar-nav">
            {MENU.map((item) => (
                // NavLink gera links de verdade: o menu passa a funcionar com
                // botão do meio, "abrir em nova aba" e o histórico do navegador.
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.premium && !isPremium && (
                        <span className="nav-badge" title="Exclusivo do plano PREMIUM">
                            PRO
                        </span>
                    )}
                </NavLink>
            ))}
        </nav>

        <button type="button" className="sidebar-footer" onClick={onSwitchCompany}>
            <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                <div
                    style={{
                        fontSize: 11,
                        color: 'var(--color-text-light)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                    }}
                >
                    Empresa ativa
                </div>
                <div
                    className="company-name"
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                    }}
                >
                    {companyName || 'Carregando...'}
                </div>
            </div>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--color-secondary)" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        </button>
    </aside>
);
