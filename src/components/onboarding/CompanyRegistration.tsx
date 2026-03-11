import React, { useState, useEffect } from 'react';
import { stripCNPJ, formatCNPJ, validateCNPJ } from '../../utils/cnpj';
import { companyApi, type PublicCompanyPreview } from '../../services/company.service';
import '../../styles/onboarding.css';

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

    // Preview
    const [preview, setPreview] = useState<PublicCompanyPreview | null>(null);
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
        if (!isValid || !preview) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await companyApi.create(stripCNPJ(cnpj));
            onSuccess(response.company);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Falha ao vincular empresa.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                    <span className="preview-label">Razão Social</span>
                                    <span className="preview-value">{preview.razao_social}</span>
                                </div>

                                <div className="preview-field">
                                    <span className="preview-label">Status Receita</span>
                                    <span className={`status-badge ${preview.descricao_situacao_cadastral === 'ATIVA' ? 'active' : 'suspended'}`}>
                                        {preview.descricao_situacao_cadastral}
                                    </span>
                                </div>

                                <div className="preview-field">
                                    <span className="preview-label">Nome Fantasia</span>
                                    <span className="preview-value">{preview.nome_fantasia || '—'}</span>
                                </div>

                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <span className="preview-label">Atividade Principal (CNAE)</span>
                                    <span className="preview-value">{preview.cnae_fiscal} — {preview.cnae_fiscal_descricao}</span>
                                </div>

                                <div className="preview-field" style={{ gridColumn: 'span 2' }}>
                                    <span className="preview-label">Endereço</span>
                                    <span className="preview-value">
                                        {preview.logradouro}, {preview.numero} — {preview.bairro}, {preview.municipio} - {preview.uf}
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
                                disabled={!isValid || !preview || isSubmitting || isLoadingPreview}
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
