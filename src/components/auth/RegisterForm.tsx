import React, { useState, useCallback } from 'react';
import { authApi } from '../../services/auth.service';

// ── Tipos ──
interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
}

interface RegisterFormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
    general?: string;
}

interface RegisterFormProps {
    onSuccess: (message: string) => void;
    onSwitchToLogin: () => void;
}

// ── Validação ──
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 25, label: 'Fraca', color: 'var(--color-danger)' };
    if (score === 2) return { score: 50, label: 'Regular', color: 'var(--color-warning)' };
    if (score === 3) return { score: 75, label: 'Boa', color: 'var(--color-secondary)' };
    return { score: 100, label: 'Forte', color: 'var(--color-success)' };
}

function validateRegister(data: RegisterFormData): RegisterFormErrors {
    const errors: RegisterFormErrors = {};
    if (!data.name.trim()) errors.name = 'Nome é obrigatório';
    else if (data.name.trim().length < 2) errors.name = 'Nome deve ter pelo menos 2 caracteres';

    if (!data.email) errors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'E-mail inválido';

    // Espelha a política do servidor (lib/validation.ts): 8 caracteres, com ao
    // menos uma letra e um número. Divergir daqui só produziria um 400 depois
    // de o usuário preencher o formulário inteiro.
    if (!data.password) errors.password = 'Senha é obrigatória';
    else if (data.password.length < 8) errors.password = 'Mínimo de 8 caracteres';
    else if (!/[A-Za-zÀ-ÿ]/.test(data.password)) errors.password = 'Inclua ao menos uma letra';
    else if (!/[0-9]/.test(data.password)) errors.password = 'Inclua ao menos um número';

    if (!data.confirmPassword) errors.confirmPassword = 'Confirme sua senha';
    else if (data.password !== data.confirmPassword) errors.confirmPassword = 'As senhas não coincidem';

    if (!data.acceptTerms) errors.acceptTerms = 'Você deve aceitar os termos para continuar';

    return errors;
}

// ── Ícones SVG inline ──
const IconUser = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

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
export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });
    const [errors, setErrors] = useState<RegisterFormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const strength = getPasswordStrength(formData.password);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value, type, checked } = e.target;
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
            if (errors[name as keyof RegisterFormErrors]) {
                setErrors((prev) => ({ ...prev, [name]: undefined }));
            }
        },
        [errors]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateRegister(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            await authApi.register(formData.email, formData.password, formData.name);
            onSuccess('Conta criada com sucesso! Faça login para continuar.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao criar conta';
            setErrors({ general: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit} noValidate id="register-form">
            {/* Alerta de erro geral */}
            {errors.general && (
                <div className="auth-alert auth-alert-error" role="alert">
                    <IconAlert />
                    <span>{errors.general}</span>
                </div>
            )}

            {/* Nome */}
            <div className="form-group">
                <label htmlFor="register-name" className="form-label">Nome completo</label>
                <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconUser /></span>
                    <input
                        id="register-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="João da Silva"
                        value={formData.name}
                        onChange={handleChange}
                        className={`form-input${errors.name ? ' error' : ''}`}
                    />
                </div>
                {errors.name && <span className="form-error"><IconAlert />{errors.name}</span>}
            </div>

            {/* E-mail */}
            <div className="form-group">
                <label htmlFor="register-email" className="form-label">E-mail corporativo</label>
                <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconMail /></span>
                    <input
                        id="register-email"
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
                <label htmlFor="register-password" className="form-label">Senha</label>
                <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconLock /></span>
                    <input
                        id="register-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Mínimo 6 caracteres"
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
                {formData.password && (
                    <div className="password-strength">
                        <div className="password-strength-bar">
                            <div
                                className="password-strength-fill"
                                style={{ width: `${strength.score}%`, background: strength.color }}
                            />
                        </div>
                        <span className="password-strength-label" style={{ color: strength.color }}>
                            Força da senha: {strength.label}
                        </span>
                    </div>
                )}
                {errors.password && <span className="form-error"><IconAlert />{errors.password}</span>}
            </div>

            {/* Confirmar senha */}
            <div className="form-group">
                <label htmlFor="register-confirm" className="form-label">Confirmar senha</label>
                <div className="form-input-wrapper">
                    <span className="form-input-icon"><IconLock /></span>
                    <input
                        id="register-confirm"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`form-input${errors.confirmPassword ? ' error' : ''}`}
                    />
                    <button
                        type="button"
                        className="form-input-action"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                        {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                </div>
                {errors.confirmPassword && (
                    <span className="form-error"><IconAlert />{errors.confirmPassword}</span>
                )}
            </div>

            {/* Termos */}
            <div className="form-group">
                <div className="form-checkbox-wrapper">
                    <input
                        id="register-terms"
                        name="acceptTerms"
                        type="checkbox"
                        className="form-checkbox"
                        checked={formData.acceptTerms}
                        onChange={handleChange}
                    />
                    <label htmlFor="register-terms" className="form-checkbox-label">
                        Li e concordo com os{' '}
                        <a href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a>{' '}
                        e a{' '}
                        <a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>{' '}
                        (LGPD)
                    </label>
                </div>
                {errors.acceptTerms && (
                    <span className="form-error"><IconAlert />{errors.acceptTerms}</span>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="btn btn-primary"
                id="register-submit-btn"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="btn-spinner" />
                        Criando conta...
                    </>
                ) : (
                    'Criar conta gratuita'
                )}
            </button>

            {/* Link para login */}
            <p className="auth-footer-link">
                Já tem uma conta?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
                    Entrar
                </a>
            </p>
        </form>
    );
};
