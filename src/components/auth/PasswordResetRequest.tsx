import React, { useState } from 'react';
import { authApi, ApiError } from '../../services/auth.service';

interface PasswordResetRequestProps {
    onBackToLogin: () => void;
}

/**
 * Solicitação do link de recuperação de senha.
 *
 * A API responde igual exista ou não a conta, para não permitir descobrir quais
 * e-mails estão cadastrados. A mensagem de sucesso aqui reflete isso: ela não
 * afirma que o e-mail foi enviado a uma conta existente.
 */
export const PasswordResetRequest: React.FC<PasswordResetRequestProps> = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);
        setEnviando(true);

        try {
            await authApi.requestPasswordReset(email);
            setEnviado(true);
        } catch (err) {
            setErro(
                err instanceof ApiError
                    ? [err.message, ...err.fieldMessages].join(' ')
                    : 'Não foi possível processar a solicitação. Tente novamente.'
            );
        } finally {
            setEnviando(false);
        }
    };

    if (enviado) {
        return (
            <div className="fade-in">
                <div className="auth-alert auth-alert-success" role="status">
                    <span>
                        Se houver uma conta com este e-mail, as instruções de recuperação chegarão em instantes.
                        O link vale por 30 minutos.
                    </span>
                </div>
                <button type="button" className="btn btn-ghost" onClick={onBackToLogin} style={{ marginTop: 'var(--space-4)' }}>
                    Voltar para o login
                </button>
            </div>
        );
    }

    return (
        <form className="auth-form fade-in" onSubmit={handleSubmit} noValidate>
            {erro && (
                <div className="auth-alert auth-alert-error" role="alert">
                    <span>{erro}</span>
                </div>
            )}

            <div className="form-group">
                <label htmlFor="reset-email" className="form-label">
                    E-mail da conta
                </label>
                <input
                    id="reset-email"
                    type="email"
                    className="form-input"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={enviando || !email}>
                {enviando ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>

            <button type="button" className="btn btn-ghost" onClick={onBackToLogin}>
                Voltar para o login
            </button>
        </form>
    );
};
