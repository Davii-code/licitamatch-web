import React, { useState, useEffect } from 'react';
import { stripCNPJ, formatCNPJ, validateCNPJ } from '../../utils/cnpj';
import { companyApi, type CompanyPreview, type CompanyNiche, type CompanyAddress } from '../../services/company.service';
import '../../styles/onboarding.css';

/** Situação cadastral vinda da Receita, já normalizada pela API. */
const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Ativa',
    SUSPENDED: 'Suspensa',
    CANCELLED: 'Baixada',
    IRREGULAR: 'Inapta',
    UNKNOWN: 'Não informada',
};

/** Monta o endereço pulando os campos que a Receita não devolveu. */
function formatAddress(address: CompanyAddress): string {
    const linha = [address.street, address.number].filter(Boolean).join(', ');
    const bairro = address.neighborhood;
    const cidade = [address.city, address.state].filter(Boolean).join(' - ');

    const partes = [linha, bairro, cidade].filter(Boolean);
    return partes.length > 0 ? partes.join(' — ') : 'Endereço não informado';
}

const NICHE_OPTIONS: Array<{ value: CompanyNiche; label: string }> = [
    { value: 'COMPRAS', label: 'Compras e Suprimentos' },
    { value: 'OBRAS', label: 'Obras e Infraestrutura' },
    { value: 'SERVICOS', label: 'Servicos Gerais' },
    { value: 'TIC', label: 'Tecnologia (TIC)' },
    { value: 'SAUDE', label: 'Saude' },
    { value: 'ENGENHARIA', label: 'Engenharia' },
    { value: 'MAO_DE_OBRA', label: 'Mao de Obra Terceirizada' },
    { value: 'LOCACAO_IMOVEL', label: 'Locacao de Imoveis' },
    { value: 'EDUCACAO', label: 'Educacao e Treinamentos' },
    { value: 'ALIMENTACAO', label: 'Alimentacao e Merenda' },
];

interface CompanyRegistrationProps {
    onSuccess: (company: { cnpj: string }) => void;
    onCancel?: () => void;
    allowCancel?: boolean;
}

export const CompanyRegistration: React.FC<CompanyRegistrationProps> = ({
    onSuccess,
    onCancel,
    allowCancel
}) => {
    const [cnpj, setCnpj] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [nichoPrincipal, setNichoPrincipal] = useState<CompanyNiche | ''>('');
    const [nichosSecundarios, setNichosSecundarios] = useState<CompanyNiche[]>([]);

    // Preview
    const [preview, setPreview] = useState<CompanyPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Submit
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Auto-fetch profile
    useEffect(() => {
        const raw = stripCNPJ(cnpj);
        if (raw.length === 14) {
            if (validateCNPJ(raw)) {
                setIsValid(true);
                fetchPreview(raw);
            } else {
                setIsValid(false);
                setPreview(null);
                setPreviewError('CNPJ inválido (dígitos verificadores incorretos).');
            }
        } else {
            setIsValid(null);
            setPreview(null);
            setPreviewError(null);
        }
    }, [cnpj]);

    const fetchPreview = async (cleanCnpj: string) => {
        setIsLoadingPreview(true);
        setPreviewError(null);
        try {
            const data = await companyApi.previewCNPJ(cleanCnpj);
            setPreview(data);
        } catch (err) {
            setPreview(null);
            setPreviewError(err instanceof Error ? err.message : 'Erro ao consultar Receita.');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Aplica máscara em tempo real
        setCnpj(formatCNPJ(e.target.value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || !preview || !nichoPrincipal) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await companyApi.create({
                cnpj: stripCNPJ(cnpj),
                nichoPrincipal,
                nichosSecundarios,
            });
            onSuccess(response.company);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Falha ao vincular empresa.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSecondaryNiche = (niche: CompanyNiche) => {
        setNichosSecundarios((current) => {
            if (current.includes(niche)) return current.filter((item) => item !== niche);
            return [...current, niche];
        });
    };

    useEffect(() => {
        if (!nichoPrincipal) return;
        setNichosSecundarios((current) => current.filter((n) => n !== nichoPrincipal));
    }, [nichoPrincipal]);

    return (
        <div className="onboarding-root">
            <div className="onboarding-header">
                <h1 className="onboarding-title">Cadastre sua Empresa</h1>
                <p className="onboarding-subtitle">
                    Informe o CNPJ para integrar os dados da Receita Federal e calcular
                    nossos <em>Matching Scores</em> com editais.
                </p>
            </div>

            <div className="onboarding-container">
                <div className="onboarding-card">

                    <form onSubmit={handleSubmit}>
                        <div className="cnpj-input-wrapper">
                            <input
                                type="text"
                                className={`cnpj-input ${isValid === false ? 'error' : ''} ${isValid ? 'success' : ''}`}
                                placeholder="00.000.000/0000-00"
                                value={cnpj}
                                onChange={handleChange}
                                maxLength={18}
                                autoFocus
                            />
                            {previewError && <span className="form-error" style={{ justifyContent: 'center', marginTop: 8 }}>{previewError}</span>}
                        </div>

                        {/* Skeleton de carregamento */}
                        {isLoadingPreview && (
                            <div className="preview-grid fade-in">
                                <div className="preview-field">
                                    <div className="skeleton skeleton-box" style={{ width: 80, marginBottom: 4 }}></div>
                                    <div className="skeleton skeleton-box" style={{ width: '80%', height: 24 }}></div>
                                </div>
                                <div className="preview-field">
                                    <div className="skeleton skeleton-box" style={{ width: 60, marginBottom: 4 }}></div>
                                    <div className="skeleton skeleton-box" style={{ width: '60%', height: 24 }}></div>
                                </div>
                                <div className="preview-field">
                                    <div className="skeleton skeleton-box" style={{ width: '100%', height: 24 }}></div>
                                </div>
                            </div>
                        )}

                        {/* Box de dados da empresa preenchidos */}
                        {preview && !isLoadingPreview && (
                            <div className="preview-grid fade-in">
                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <label className="preview-label" htmlFor="nicho-principal">Nicho principal</label>
                                    <select
                                        id="nicho-principal"
                                        className="niche-select"
                                        value={nichoPrincipal}
                                        onChange={(e) => setNichoPrincipal(e.target.value as CompanyNiche | '')}
                                        required
                                    >
                                        <option value="">Selecione o nicho principal</option>
                                        {NICHE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <span className="preview-label">Nichos secundarios (opcional)</span>
                                    <div className="niche-checkbox-grid">
                                        {NICHE_OPTIONS.filter((option) => option.value !== nichoPrincipal).map((option) => (
                                            <label key={option.value} className="niche-checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    checked={nichosSecundarios.includes(option.value)}
                                                    onChange={() => toggleSecondaryNiche(option.value)}
                                                />
                                                <span>{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <span className="preview-label">Razão Social</span>
                                    <span className="preview-value">{preview.legalName}</span>
                                </div>

                                <div className="preview-field">
                                    <span className="preview-label">Status Receita</span>
                                    <span className={`status-badge ${preview.status === 'ACTIVE' ? 'active' : 'suspended'}`}>
                                        {STATUS_LABELS[preview.status] ?? preview.status}
                                    </span>
                                </div>

                                <div className="preview-field">
                                    <span className="preview-label">Nome Fantasia</span>
                                    <span className="preview-value">{preview.tradeName || '—'}</span>
                                </div>

                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <span className="preview-label">Atividade Principal (CNAE)</span>
                                    <span className="preview-value">{preview.cnaePrincipal ?? '—'} — {preview.cnaePrincipalDescricao ?? 'Atividade não informada'}</span>
                                </div>

                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <span className="preview-label">Endereço</span>
                                    <span className="preview-value">
                                        {formatAddress(preview.address)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)' }}>
                            {allowCancel && (
                                <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isSubmitting}>
                                    Voltar
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={!isValid || !preview || !nichoPrincipal || isSubmitting || isLoadingPreview}
                            >
                                {isSubmitting ? (
                                    <><span className="btn-spinner" /> Registrando...</>
                                ) : (
                                    'Confirmar e Cadastrar'
                                )}
                            </button>
                        </div>

                        {submitError && (
                            <div className="auth-alert auth-alert-error fade-in" style={{ marginTop: 'var(--space-4)' }}>
                                <span>{submitError}</span>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};
