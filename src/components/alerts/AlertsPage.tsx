import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { alertApi, type Alert, type AlertFilters } from '../../services/alert.service';
import { tenderApi, type Modalidade, type NichoOption } from '../../services/tender.service';
import { locationApi, type Estado } from '../../services/location.service';
import { ApiError } from '../../services/auth.service';
import '../../styles/alerts.css';

type Feedback = { tipo: 'ok' | 'erro'; texto: string } | null;

const FILTROS_VAZIOS: AlertFilters = {};

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR');

const formatCurrency = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

/** Descrição legível dos filtros, para o cartão do alerta. */
function descreverFiltros(filters: AlertFilters | null, nichos: NichoOption[], modalidades: Modalidade[]): string {
    if (!filters) return 'Filtros não puderam ser lidos — edite o alerta para corrigir.';

    const partes: string[] = [];

    if (filters.termo) partes.push(`termo "${filters.termo}"`);
    if (filters.nicho) {
        partes.push(nichos.find((n) => n.enum === filters.nicho)?.descricao ?? filters.nicho);
    }
    if (filters.estado) partes.push(`UF ${filters.estado}`);
    if (filters.municipio) partes.push(`município ${filters.municipio}`);
    if (filters.codigoModalidadeContratacao) {
        const modalidade = modalidades.find((m) => m.codigo === filters.codigoModalidadeContratacao);
        partes.push(modalidade?.nome ?? `modalidade ${filters.codigoModalidadeContratacao}`);
    }
    if (filters.valorMin !== undefined) partes.push(`a partir de ${formatCurrency(filters.valorMin)}`);
    if (filters.valorMax !== undefined) partes.push(`até ${formatCurrency(filters.valorMax)}`);
    if (filters.orgaoCnpj) partes.push(`órgão ${filters.orgaoCnpj}`);

    return partes.join(' · ') || 'sem filtros';
}

/**
 * Gestão de alertas de licitação (buscas salvas).
 *
 * O job `/api/cron/dispatch-alerts` avalia cada alerta ativo periodicamente e
 * notifica quando surgem licitações novas que casam com os filtros. Alertas de
 * contas que deixaram de ser PREMIUM ficam preservados, apenas não são avaliados.
 */
export const AlertsPage: React.FC = () => {
    const { user } = useAuth();
    const isPremium = user?.role === 'PREMIUM';

    const [alertas, setAlertas] = useState<Alert[]>([]);
    const [limite, setLimite] = useState(10);
    const [carregando, setCarregando] = useState(true);
    const [feedback, setFeedback] = useState<Feedback>(null);

    const [nichos, setNichos] = useState<NichoOption[]>([]);
    const [modalidades, setModalidades] = useState<Modalidade[]>([]);
    const [estados, setEstados] = useState<Estado[]>([]);

    const [criando, setCriando] = useState(false);
    const [nome, setNome] = useState('');
    const [filtros, setFiltros] = useState<AlertFilters>(FILTROS_VAZIOS);
    const [salvando, setSalvando] = useState(false);

    const carregar = useCallback(async () => {
        if (!isPremium) {
            setCarregando(false);
            return;
        }

        try {
            const resposta = await alertApi.list();
            setAlertas(resposta.alerts);
            setLimite(resposta.limite);
            setFeedback(null);
        } catch (err) {
            setFeedback({
                tipo: 'erro',
                texto: err instanceof ApiError ? err.message : 'Não foi possível carregar os alertas.',
            });
        } finally {
            setCarregando(false);
        }
    }, [isPremium]);

    useEffect(() => {
        void carregar();
    }, [carregar]);

    // Opções dos filtros. Falha aqui não impede gerenciar alertas existentes,
    // então o erro é silencioso e os selects ficam vazios.
    useEffect(() => {
        tenderApi
            .getModalities()
            .then((resposta) => {
                setNichos(resposta.nichos);
                setModalidades(resposta.modalidades);
            })
            .catch(() => undefined);

        locationApi.getEstados().then(setEstados).catch(() => undefined);
    }, []);

    const ativos = alertas.filter((a) => a.isActive).length;
    const atingiuLimite = ativos >= limite;

    const temAlgumFiltro = Object.values(filtros).some(
        (valor) => valor !== undefined && valor !== '' && valor !== null
    );

    const resetarFormulario = () => {
        setNome('');
        setFiltros(FILTROS_VAZIOS);
        setCriando(false);
    };

    const handleCriar = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        setFeedback(null);

        try {
            await alertApi.create({ name: nome.trim(), filters: filtros });
            resetarFormulario();
            await carregar();
            setFeedback({ tipo: 'ok', texto: 'Alerta criado. Você será avisado sobre novas licitações.' });
        } catch (err) {
            setFeedback({
                tipo: 'erro',
                texto:
                    err instanceof ApiError
                        ? [err.message, ...err.fieldMessages].join(' ')
                        : 'Não foi possível criar o alerta.',
            });
        } finally {
            setSalvando(false);
        }
    };

    const alternarAtivo = async (alerta: Alert) => {
        setFeedback(null);
        try {
            await alertApi.update(alerta.id, { isActive: !alerta.isActive });
            await carregar();
        } catch (err) {
            setFeedback({
                tipo: 'erro',
                texto: err instanceof ApiError ? err.message : 'Não foi possível atualizar o alerta.',
            });
        }
    };

    const remover = async (alerta: Alert) => {
        setFeedback(null);
        try {
            await alertApi.remove(alerta.id);
            await carregar();
            setFeedback({ tipo: 'ok', texto: 'Alerta removido.' });
        } catch (err) {
            setFeedback({
                tipo: 'erro',
                texto: err instanceof ApiError ? err.message : 'Não foi possível remover o alerta.',
            });
        }
    };

    /** Atualiza um campo do formulário, descartando valor vazio. */
    const setFiltro = <K extends keyof AlertFilters>(campo: K, valor: AlertFilters[K] | '') => {
        setFiltros((atual) => {
            const proximo = { ...atual };
            if (valor === '' || valor === undefined || Number.isNaN(valor)) {
                delete proximo[campo];
            } else {
                proximo[campo] = valor as AlertFilters[K];
            }
            return proximo;
        });
    };

    if (!isPremium) {
        return (
            <div className="fade-in alerts-container">
                <div className="alerts-paywall">
                    <h2 className="profile-title" style={{ fontSize: 'var(--text-xl)' }}>
                        Alertas são exclusivos do plano PREMIUM
                    </h2>
                    <p className="profile-subtitle" style={{ marginTop: 'var(--space-2)' }}>
                        Salve buscas com os filtros que importam para sua empresa e receba aviso assim que uma
                        licitação nova compatível for publicada — sem precisar reabrir a plataforma todo dia.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in alerts-container">
            <div className="alerts-header">
                <div>
                    <h2 className="profile-title" style={{ fontSize: 'var(--text-xl)' }}>
                        Alertas de oportunidades
                    </h2>
                    <p className="profile-subtitle" style={{ marginTop: 'var(--space-1)' }}>
                        {ativos} de {limite} alertas ativos. Cada alerta é avaliado periodicamente contra as
                        licitações recém-indexadas.
                    </p>
                </div>

                {!criando && (
                    <button
                        className="btn btn-primary"
                        style={{ width: 'auto', padding: '0 20px', height: 40 }}
                        onClick={() => setCriando(true)}
                        disabled={atingiuLimite}
                        title={atingiuLimite ? 'Desative ou remova um alerta para criar outro.' : undefined}
                    >
                        Novo alerta
                    </button>
                )}
            </div>

            {feedback && (
                <div
                    className={`auth-alert ${feedback.tipo === 'ok' ? 'auth-alert-success' : 'auth-alert-error'}`}
                    role="status"
                >
                    <span>{feedback.texto}</span>
                </div>
            )}

            {criando && (
                <form className="alerts-form" onSubmit={handleCriar}>
                    <h3 className="settings-group-title">Novo alerta</h3>

                    <div className="settings-form-grid">
                        <div className="settings-input" style={{ gridColumn: '1 / -1' }}>
                            <label htmlFor="alerta-nome">Nome do alerta</label>
                            <input
                                id="alerta-nome"
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Notebooks em Pernambuco"
                                required
                                minLength={3}
                                maxLength={80}
                            />
                        </div>

                        <div className="settings-input">
                            <label htmlFor="alerta-termo">Termo de busca</label>
                            <input
                                id="alerta-termo"
                                type="text"
                                value={filtros.termo ?? ''}
                                onChange={(e) => setFiltro('termo', e.target.value)}
                                placeholder="Mínimo 3 caracteres"
                            />
                        </div>

                        <div className="settings-input">
                            <label htmlFor="alerta-nicho">Nicho</label>
                            <select
                                id="alerta-nicho"
                                value={filtros.nicho ?? ''}
                                onChange={(e) => setFiltro('nicho', e.target.value)}
                            >
                                <option value="">Todos</option>
                                {nichos.map((n) => (
                                    <option key={n.enum} value={n.enum}>
                                        {n.descricao}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="settings-input">
                            <label htmlFor="alerta-uf">Estado</label>
                            <select
                                id="alerta-uf"
                                value={filtros.estado ?? ''}
                                onChange={(e) => setFiltro('estado', e.target.value)}
                            >
                                <option value="">Todos</option>
                                {estados.map((uf) => (
                                    <option key={uf.sigla} value={uf.sigla}>
                                        {uf.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="settings-input">
                            <label htmlFor="alerta-modalidade">Modalidade</label>
                            <select
                                id="alerta-modalidade"
                                value={filtros.codigoModalidadeContratacao ?? ''}
                                onChange={(e) =>
                                    setFiltro(
                                        'codigoModalidadeContratacao',
                                        e.target.value ? Number(e.target.value) : ''
                                    )
                                }
                            >
                                <option value="">Todas</option>
                                {modalidades.map((m) => (
                                    <option key={m.codigo} value={m.codigo}>
                                        {m.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="settings-input">
                            <label htmlFor="alerta-valor-min">Valor mínimo (R$)</label>
                            <input
                                id="alerta-valor-min"
                                type="number"
                                min={0}
                                step={1000}
                                value={filtros.valorMin ?? ''}
                                onChange={(e) =>
                                    setFiltro('valorMin', e.target.value ? Number(e.target.value) : '')
                                }
                            />
                        </div>

                        <div className="settings-input">
                            <label htmlFor="alerta-valor-max">Valor máximo (R$)</label>
                            <input
                                id="alerta-valor-max"
                                type="number"
                                min={0}
                                step={1000}
                                value={filtros.valorMax ?? ''}
                                onChange={(e) =>
                                    setFiltro('valorMax', e.target.value ? Number(e.target.value) : '')
                                }
                            />
                        </div>
                    </div>

                    {!temAlgumFiltro && (
                        <p className="alerts-hint">
                            Informe ao menos um filtro. Um alerta sem filtro casaria com todas as licitações do
                            país e viraria spam.
                        </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                        <button type="button" className="btn btn-ghost" onClick={resetarFormulario}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0 20px', height: 40 }}
                            disabled={salvando || nome.trim().length < 3 || !temAlgumFiltro}
                        >
                            {salvando ? 'Salvando...' : 'Criar alerta'}
                        </button>
                    </div>
                </form>
            )}

            {carregando ? (
                <div className="skeleton" style={{ width: '100%', height: 120 }} />
            ) : alertas.length === 0 ? (
                <p className="profile-subtitle">
                    Nenhum alerta cadastrado. Crie o primeiro para ser avisado sobre novas licitações.
                </p>
            ) : (
                <div className="alerts-list">
                    {alertas.map((alerta) => (
                        <article
                            key={alerta.id}
                            className={`alert-card ${alerta.isActive ? '' : 'alert-card-inactive'}`}
                        >
                            <div className="alert-card-main">
                                <h4 className="alert-card-title">{alerta.name}</h4>
                                <p className="alert-card-filters">
                                    {descreverFiltros(alerta.filters, nichos, modalidades)}
                                </p>
                                <p className="alert-card-meta">
                                    {alerta.lastNotifiedAt
                                        ? `Última notificação em ${formatDateTime(alerta.lastNotifiedAt)}`
                                        : 'Ainda sem notificações'}
                                </p>
                            </div>

                            <div className="alert-card-actions">
                                <span className={`badge ${alerta.isActive ? 'badge-primary' : 'badge-neutral'}`}>
                                    {alerta.isActive ? 'Ativo' : 'Pausado'}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => void alternarAtivo(alerta)}
                                    disabled={!alerta.isActive && atingiuLimite}
                                    title={
                                        !alerta.isActive && atingiuLimite
                                            ? 'Limite de alertas ativos atingido.'
                                            : undefined
                                    }
                                >
                                    {alerta.isActive ? 'Pausar' : 'Reativar'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost alert-card-remove"
                                    onClick={() => void remover(alerta)}
                                >
                                    Remover
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
