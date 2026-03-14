import React, { useState, useCallback } from 'react';
import { authApi, type CompanyBrief, type UserInfo } from '../../services/auth.service';

// ── Tipos ──
interface LoginFormData {
    email: string;
    password: string;
    remember: boolean;
}

interface LoginFormErrors {
    email?: string;
    password?: string;
    general?: string;
}

interface LoginFormProps {
    onSuccess: (companies: CompanyBrief[], token: string, user: UserInfo) => void;
    onSwitchToRegister: () => void;
}

// ── Validação ──
function validateLogin(data: LoginFormData): LoginFormErrors {
    const errors: LoginFormErrors = {};
    if (!data.email) errors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'E-mail inválido';
    if (!data.password) errors.password = 'Senha é obrigatória';
    else if (data.password.length < 6) errors.password = 'Mínimo de 6 caracteres';
    return errors;
}

// ── Ícones SVG inline ──
const IconMail = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const IconLock = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconEye = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const IconEyeOff = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M9.88 9.88a3 3 0 1 0 4.243 4.243" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
);

const IconAlert = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

// ── Componente ──
export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: '',
        remember: false,
    });
    const [errors, setErrors] = useState<LoginFormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendingRecovery, setIsSendingRecovery] = useState(false);
    const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type, checked } = e.target;
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
            if (errors[name as keyof LoginFormErrors]) {
                setErrors((prev) => ({ ...prev, [name]: undefined }));
            }
        },
        [errors]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateLogin(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await authApi.login(formData.email, formData.password);
            authApi.persistSession(response.accessToken);
            onSuccess(response.companies, response.accessToken, response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao fazer login';
            setErrors({ general: message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (!formData.email) {
            setErrors((prev) => ({ ...prev, email: 'Informe seu e-mail para recuperar a senha' }));
            return;
        }

        setIsSendingRecovery(true);
        setRecoveryMessage(null);

        try {
            const response = await authApi.forgotPassword(formData.email);
            setRecoveryMessage(response.message);
        } catch (err) {
            setRecoveryMessage(err instanceof Error ? err.message : 'Erro ao solicitar recuperação de senha.');
        } finally {
            setIsSendingRecovery(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate id="login-form">
            {/* Alerta de erro geral */}
            {errors.general && (
                <div className="auth-alert auth-alert-error" role="alert">
                    <IconAlert />
                    <span>{errors.general}</span>
                </div>
            )}

            {/* E-mail */}
            <div className="form-group">
                <label htmlFor="login-email" className="form-label">E-mail</label>
                <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconMail /></span>
                    <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="voce@empresa.com.br"
                        value={formData.email}
                        onChange={handleChange}
                        className={`form-input${errors.email ? ' error' : ''}`}
                    />
                </div>
                {errors.email && <span className="form-error"><IconAlert />{errors.email}</span>}
            </div>

            {/* Senha */}
            <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="login-password" className="form-label">Senha</label>
                    <a
                        href="#"
                        style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
                        onClick={handleForgotPassword}
                        tabIndex={-1}
                    >
                        {isSendingRecovery ? 'Enviando...' : 'Esqueci minha senha'}
                    </a>
                </div>
                <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconLock /></span>
                    <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className={`form-input${errors.password ? ' error' : ''}`}
                    />
                    <button
                        type="button"
                        className="form-input-action"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                </div>
                {errors.password && <span className="form-error"><IconAlert />{errors.password}</span>}
            </div>

            {/* Lembrar-me */}
            <div className="form-checkbox-wrapper">
                <input
                    id="login-remember"
                    name="remember"
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.remember}
                    onChange={handleChange}
                />
                <label htmlFor="login-remember" className="form-checkbox-label">
                    Manter sessão ativa por 7 dias
                </label>
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="btn btn-primary"
                id="login-submit-btn"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="btn-spinner" />
                        Entrando...
                    </>
                ) : (
                    'Entrar na plataforma'
                )}
            </button>

            {recoveryMessage && (
                <div className="auth-alert auth-alert-success" role="status" style={{ marginTop: 'var(--space-3)' }}>
                    <span>{recoveryMessage}</span>
                </div>
            )}

            {/* Link para cadastro */}
            <p className="auth-footer-link">
                Não tem conta?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
                    Criar conta gratuita
                </a>
            </p>
        </form>
    );
};
