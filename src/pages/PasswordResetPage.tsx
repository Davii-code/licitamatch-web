import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '../components/auth/AuthShell';
import { PasswordResetConfirm } from '../components/auth/PasswordResetConfirm';

/**
 * Destino do link enviado por e-mail: /redefinir-senha?token=...
 *
 * O token vive na query string por decisão do back-end, que monta o link. Ele é
 * de uso único, expira em 30 minutos e some da barra de endereços assim que o
 * usuário sai da tela.
 */
export const PasswordResetPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <AuthShell
                title="Link inválido"
                subtitle="Este endereço não contém um token de recuperação válido."
            >
                <div className="auth-alert auth-alert-error" role="alert">
                    <span>
                        Abra o link exatamente como ele chegou no e-mail. Se ele já expirou, solicite
                        um novo na tela de login.
                    </span>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate('/entrar', { replace: true })}
                    style={{ marginTop: 'var(--space-4)' }}
                >
                    Ir para o login
                </button>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            title="Definir nova senha"
            subtitle="Escolha uma senha nova. Todas as sessões abertas serão encerradas."
        >
            <PasswordResetConfirm
                token={token}
                onConcluido={() => navigate('/entrar', { replace: true })}
            />
        </AuthShell>
    );
};
