import React from 'react';
import { LicitaMatchLogo } from '../ui/LicitaMatchLogo';
import '../../styles/auth.css';

/**
 * Painel de marca da coluna esquerda.
 * `aria-hidden` porque é decorativo: nada aqui é necessário para operar a tela.
 */
const BrandPanel: React.FC = () => (
    <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand-logo">
            <LicitaMatchLogo variant="light" height={44} showTagline={false} />
        </div>

        <div className="auth-brand-body">
            <h1 className="auth-brand-tagline">
                Encontre licitações<br />
                <span>feitas para você.</span>
            </h1>
            <p className="auth-brand-desc">
                Analisamos editais, validamos sua empresa e calculamos compatibilidade
                com base nas regras da{' '}
                <strong style={{ color: 'rgba(255,255,255,.9)' }}>Lei 14.133/2021</strong>,
                com dados direto da Receita Federal e do PNCP.
            </p>
        </div>

        <p className="auth-brand-footer">
            © {new Date().getFullYear()} LicitaMatch · Todos os direitos reservados
        </p>
    </aside>
);

interface AuthShellProps {
    title: string;
    subtitle: string;
    /** Abas de login/cadastro, quando a tela as tiver. */
    tabs?: React.ReactNode;
    /** Mensagem de status acima do cabeçalho. */
    banner?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Moldura das telas de autenticação.
 *
 * Extraída porque login, cadastro e os dois passos da recuperação de senha
 * compartilham o mesmo enquadramento — e, com o roteador, cada um vive numa
 * rota diferente.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, tabs, banner, children }) => (
    <div className="auth-root">
        <BrandPanel />

        <main className="auth-form-panel">
            <div className="auth-form-container fade-in">
                <div className="auth-mobile-logo">
                    <LicitaMatchLogo variant="dark" height={36} showTagline={false} />
                </div>

                {tabs}
                {banner}

                <div className="auth-form-header">
                    <h2 className="auth-form-title">{title}</h2>
                    <p className="auth-form-subtitle">{subtitle}</p>
                </div>

                {children}
            </div>
        </main>
    </div>
);
