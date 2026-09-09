import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordResetRequest } from './PasswordResetRequest';
import { AuthShell } from './AuthShell';
import { type CompanyBrief, type UserInfo } from '../../services/auth.service';

type AuthTab = 'login' | 'register' | 'reset-request';

interface AuthPageProps {
    onAuthenticated: (companies: CompanyBrief[], user: UserInfo) => void;
}

const TEXTOS: Record<AuthTab, { title: string; subtitle: string }> = {
    login: {
        title: 'Bem-vindo de volta',
        subtitle: 'Entre na plataforma para acessar as licitações compatíveis com sua empresa.',
    },
    register: {
        title: 'Comece gratuitamente',
        subtitle: 'Crie sua conta e descubra licitações que combinam com o perfil da sua empresa.',
    },
    'reset-request': {
        title: 'Recuperar acesso',
        subtitle: 'Informe o e-mail da conta e enviaremos um link para definir uma nova senha.',
    },
};

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const trocarAba = (tab: AuthTab) => {
        setActiveTab(tab);
        setSuccessMessage(null);
    };

    const handleRegisterSuccess = (message: string) => {
        setSuccessMessage(message);
        setActiveTab('login');
    };

    // As abas só aparecem nos dois modos principais; a recuperação de senha é um
    // desvio do fluxo, não uma terceira opção de entrada.
    const tabs =
        activeTab === 'reset-request' ? null : (
            <div className="auth-tabs" role="tablist" aria-label="Modo de acesso">
                <button
                    id="tab-login"
                    role="tab"
                    aria-selected={activeTab === 'login'}
                    className={`auth-tab${activeTab === 'login' ? ' active' : ''}`}
                    onClick={() => trocarAba('login')}
                >
                    Entrar
                </button>
                <button
                    id="tab-register"
                    role="tab"
                    aria-selected={activeTab === 'register'}
                    className={`auth-tab${activeTab === 'register' ? ' active' : ''}`}
                    onClick={() => trocarAba('register')}
                >
                    Criar conta
                </button>
            </div>
        );

    const banner = successMessage ? (
        <div
            className="auth-alert auth-alert-success"
            role="status"
            style={{ marginBottom: 'var(--space-4)' }}
        >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
        </div>
    ) : null;

    return (
        <AuthShell
            title={TEXTOS[activeTab].title}
            subtitle={TEXTOS[activeTab].subtitle}
            tabs={tabs}
            banner={banner}
        >
            {activeTab === 'login' && (
                <LoginForm
                    onSuccess={onAuthenticated}
                    onSwitchToRegister={() => trocarAba('register')}
                    onForgotPassword={() => trocarAba('reset-request')}
                />
            )}

            {activeTab === 'register' && (
                <RegisterForm
                    onSuccess={handleRegisterSuccess}
                    onSwitchToLogin={() => trocarAba('login')}
                />
            )}

            {activeTab === 'reset-request' && (
                <PasswordResetRequest onBackToLogin={() => trocarAba('login')} />
            )}
        </AuthShell>
    );
};
