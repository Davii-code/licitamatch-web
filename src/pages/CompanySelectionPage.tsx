import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanySelection } from '../components/onboarding/CompanySelection';
import { useAuth } from '../context/useAuth';
import { companyApi } from '../services/company.service';
import { authApi, ApiError, type CompanyBrief } from '../services/auth.service';

export const CompanySelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { companies, setCurrentCompany, logout } = useAuth();

    // Empresas buscadas sob demanda quando a sessão veio sem nenhuma — caso de
    // cadastro recém-concluído, antes de a sessão ser recarregada.
    const [buscadas, setBuscadas] = useState<CompanyBrief[] | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    // Derivado, não copiado para estado: espelhar `companies` num useState
    // criaria uma segunda fonte de verdade que precisaria ser sincronizada.
    // O useMemo mantém a referência estável entre renders, para o efeito de
    // seleção automática não disparar de novo a cada renderização.
    const lista = useMemo(
        () => (companies.length > 0 ? companies : (buscadas ?? [])),
        [companies, buscadas]
    );

    // Garante uma única tentativa de seleção automática por montagem.
    const autoSelecionou = useRef(false);

    useEffect(() => {
        if (companies.length > 0) return;

        companyApi
            .list()
            .then((response) => {
                setBuscadas(response.companies);
                setErro(null);
            })
            .catch(() => setErro('Não foi possível carregar suas empresas.'));
    }, [companies.length]);

    const selecionar = useCallback(
        (company: CompanyBrief) => {
            setCurrentCompany(company);
            navigate('/painel', { replace: true });
        },
        [navigate, setCurrentCompany]
    );

    /**
     * Com uma única empresa vinculada, escolhe por conta própria.
     *
     * A seleção precisa passar pela API mesmo assim: é `select-company` que
     * emite o token com `companyId`. Marcar a empresa só no cliente deixaria a
     * interface achando que há contexto ativo enquanto o servidor não tem.
     */
    useEffect(() => {
        if (autoSelecionou.current || lista.length !== 1) return;

        autoSelecionou.current = true;
        const unica = lista[0];

        authApi
            .selectCompany(unica.cnpj)
            .then(() => selecionar(unica))
            .catch((err) => {
                // Falhou: o usuário decide na tela, que já está renderizada.
                autoSelecionou.current = false;
                setErro(
                    err instanceof ApiError ? err.message : 'Não foi possível abrir sua empresa.'
                );
            });
    }, [lista, selecionar]);

    const handleLogout = async () => {
        await logout();
        navigate('/entrar', { replace: true });
    };

    return (
        <>
            {erro && (
                <div className="auth-alert auth-alert-error" role="alert" style={{ margin: 'var(--space-4)' }}>
                    {erro}
                </div>
            )}
            <CompanySelection
                companies={lista}
                onSelect={selecionar}
                onNewCompany={() => navigate('/empresas/nova')}
                onLogout={handleLogout}
            />
        </>
    );
};
