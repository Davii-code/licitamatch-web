import React, { useState } from 'react';
import { authApi, ApiError } from '../../services/auth.service';

interface PasswordResetConfirmProps {
    /** Token vindo do link enviado por e-mail. */
    token: string;
    onConcluido: () => void;
}

/** Mesma política do servidor (lib/validation.ts). */
function validarSenha(senha: string): string | null {
    if (senha.length < 8) return 'A senha deve ter ao menos 8 caracteres.';
    if (!/[A-Za-zÀ-ÿ]/.test(senha)) return 'A senha deve conter ao menos uma letra.';
    if (!/[0-9]/.test(senha)) return 'A senha deve conter ao menos um número.';
    return null;
}

/**
 * Definição da nova senha a partir do token de recuperação.
 *
 * Ao concluir, o servidor revoga todas as sessões da conta — inclusive a de um
 * eventual invasor —, então o usuário precisa entrar de novo.
 */
export const PasswordResetConfirm: React.FC<PasswordResetConfirmProps> = ({ token, onConcluido }) => {
    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [concluido, setConcluido] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro(null);

        const problema = validarSenha(senha);
        if (problema) {
            setErro(problema);
            return;
        }

        if (senha !== confirmacao) {
            setErro('A confirmação não confere com a nova senha.');
            return;
        }

        setSalvando(true);
        try {
            await authApi.confirmPasswordReset(token, senha);
            setConcluido(true);
        } catch (err) {
            setErro(
                err instanceof ApiError
                    ? [err.message, ...err.fieldMessages].join(' ')
                    : 'Não foi possível redefinir a senha. Solicite um novo link.'
            );
        } finally {
            setSalvando(false);
        }
    };

    if (concluido) {
        return (
            <div className="fade-in">
                <div className="auth-alert auth-alert-success" role="status">
                    <span>Senha redefinida com sucesso. Entre com a nova senha.</span>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onConcluido}
                    style={{ marginTop: 'var(--space-4)' }}
                >
                    Ir para o login
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
                <label htmlFor="nova-senha" className="form-label">
                    Nova senha
                </label>
                <input
                    id="nova-senha"
                    type="password"
                    className="form-input"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres, com letra e número"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="confirma-senha" className="form-label">
                    Confirmar nova senha
                </label>
                <input
                    id="confirma-senha"
                    type="password"
                    className="form-input"
                    autoComplete="new-password"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    required
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={salvando || !senha}>
                {salvando ? 'Salvando...' : 'Redefinir senha'}
            </button>

            <button type="button" className="btn btn-ghost" onClick={onConcluido}>
                Cancelar
            </button>
        </form>
    );
};
