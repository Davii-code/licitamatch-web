import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { LicitaMatchLogo } from '../ui/LicitaMatchLogo';
import { type CompanyBrief } from '../../services/auth.service';
import '../../styles/auth.css';

// ── Tipos ──
type AuthTab = 'login' | 'register';

interface AuthPageProps {
    onAuthenticated: (companies: CompanyBrief[], token: string) => void;
}

// ── Brand Panel ──
const BrandPanel: React.FC = () => (
    <aside className="auth-brand" aria-hidden="true">
        {/* Logo — variante light (branco) sobre fundo escuro */}
        <div className="auth-brand-logo">
            <LicitaMatchLogo variant="light" height={44} showTagline={false} />
        </div>

        {/* Tagline */}
        <div className="auth-brand-body">
            <h1 className="auth-brand-tagline">
                Encontre licitações<br />
                <span>feitas para você.</span>
            </h1>
            <p className="auth-brand-desc">
                Analisamos editais, validamos sua empresa e calculamos compatibilidade
                com base nas regras da{' '}
                <strong style={{ color: 'rgba(255,255,255,.9)' }}>Lei 14.133/2021</strong>.
                Tudo em segundos, com dados direto da Receita Federal.
            </p>

            {/* Stats */}
            <div className="auth-brand-stats">
                <div className="auth-stat-card">
                    <span className="auth-stat-value">+47k</span>
                    <span className="auth-stat-label">Editais ativos</span>
                </div>
                <div className="auth-stat-card">
                    <span className="auth-stat-value">98%</span>
                    <span className="auth-stat-label">Dados atualizados</span>
                </div>
                <div className="auth-stat-card">
                    <span className="auth-stat-value">R$2bi</span>
                    <span className="auth-stat-label">Em contratos</span>
                </div>
            </div>
        </div>

        {/* Footer */}
        <p className="auth-brand-footer">
            © {new Date().getFullYear()} LicitaMatch · Todos os direitos reservados
        </p>
    </aside>
);

// ── Página principal ──
export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleRegisterSuccess = (message: string) => {
        setSuccessMessage(message);
        setActiveTab('login');
    };

    return (
        <div className="auth-root">
            {/* Painel esquerdo — Brand */}
            <BrandPanel />

            {/* Painel direito — Formulário */}
            <main className="auth-form-panel">
                <div className="auth-form-container fade-in">
                    {/* Logo mobile — variante dark (cores originais) sobre fundo claro */}
                    <div className="auth-mobile-logo">
                        <LicitaMatchLogo variant="dark" height={36} showTagline={false} />
                    </div>

                    {/* Tabs: Login / Cadastro */}
                    <div className="auth-tabs" role="tablist" aria-label="Modo de acesso">
                        <button
                            id="tab-login"
                            role="tab"
                            aria-selected={activeTab === 'login'}
                            className={`auth-tab${activeTab === 'login' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('login'); setSuccessMessage(null); }}
                        >
                            Entrar
                        </button>
                        <button
                            id="tab-register"
                            role="tab"
                            aria-selected={activeTab === 'register'}
                            className={`auth-tab${activeTab === 'register' ? ' active' : ''}`}
                            onClick={() => { setActiveTab('register'); setSuccessMessage(null); }}
                        >
                            Criar conta
                        </button>
                    </div>

                    {/* Mensagem de sucesso (ex: após cadastro) */}
                    {successMessage && (
                        <div className="auth-alert auth-alert-success" role="status" style={{ marginBottom: 'var(--space-4)' }}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Cabeçalho do formulário */}
                    <div className="auth-form-header">
                        {activeTab === 'login' ? (
                            <>
                                <h2 className="auth-form-title">Bem-vindo de volta</h2>
                                <p className="auth-form-subtitle">
                                    Entre na plataforma para acessar as licitações compatíveis com sua empresa.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="auth-form-title">Comece gratuitamente</h2>
                                <p className="auth-form-subtitle">
                                    Crie sua conta e descubra licitações que combinam com o perfil da sua empresa.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Formulários */}
                    {activeTab === 'login' ? (
                        <LoginForm
                            onSuccess={onAuthenticated}
                            onSwitchToRegister={() => setActiveTab('register')}
                        />
                    ) : (
                        <RegisterForm
                            onSuccess={handleRegisterSuccess}
                            onSwitchToLogin={() => setActiveTab('login')}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};
