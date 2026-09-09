import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    authApi,
    setSessionExpiredHandler,
    type UserInfo,
    type CompanyBrief,
} from '../services/auth.service';
import { AuthContext } from './auth-context';

interface SessionState {
    user: UserInfo | null;
    companies: CompanyBrief[];
    currentCompany: CompanyBrief | null;
}

const SESSAO_VAZIA: SessionState = { user: null, companies: [], currentCompany: null };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<SessionState>(SESSAO_VAZIA);
    const [isRestoring, setIsRestoring] = useState(true);

    // Evita atualizar estado depois que o provider foi desmontado, o que
    // aconteceria se a resposta de /api/users/me chegasse após a navegação.
    const montado = useRef(true);

    const clearLocalSession = useCallback(() => {
        if (montado.current) setSession(SESSAO_VAZIA);
    }, []);

    /**
     * Busca a sessão no servidor.
     *
     * Com o token em cookie `HttpOnly`, o JavaScript não consegue lê-lo — e é
     * exatamente esse o ponto: um XSS não tem como exfiltrar a credencial. Em
     * troca, quem está logado só é descoberto perguntando ao servidor.
     */
    const carregarSessao = useCallback(async () => {
        try {
            const dados = await authApi.getSession();
            if (!montado.current) return;

            setSession({
                user: dados.user,
                companies: dados.companies,
                currentCompany:
                    dados.companies.find((c) => c.cnpj === dados.empresaAtiva) ?? null,
            });
        } catch {
            // 401 sem cookie válido é o caso normal de visitante não autenticado.
            clearLocalSession();
        }
    }, [clearLocalSession]);

    useEffect(() => {
        montado.current = true;

        // A verificação da sessão é uma chamada de rede: todo setState acontece
        // depois do await, nunca no corpo síncrono do efeito.
        void (async () => {
            await carregarSessao();
            if (montado.current) setIsRestoring(false);
        })();

        return () => {
            montado.current = false;
        };
    }, [carregarSessao]);

    // A camada de API avisa quando a renovação do token foi recusada em definitivo.
    useEffect(() => {
        setSessionExpiredHandler(clearLocalSession);
        return () => setSessionExpiredHandler(null);
    }, [clearLocalSession]);

    const setAuth = useCallback((user: UserInfo, companies: CompanyBrief[]) => {
        // Nenhuma empresa é marcada como ativa aqui, nem quando existe só uma.
        // O contexto empresarial vive no token emitido por select-company; marcar
        // localmente deixaria cliente e servidor discordando sobre qual empresa
        // está ativa. Quem resolve isso é a tela de seleção, que chama a API.
        setSession({ user, companies, currentCompany: null });
    }, []);

    const setCurrentCompany = useCallback((company: CompanyBrief | null) => {
        setSession((atual) => ({ ...atual, currentCompany: company }));
    }, []);

    const logout = useCallback(
        async (todosDispositivos = false) => {
            // Revoga o refresh token no servidor; sem isso o cookie continuaria
            // válido por 7 dias mesmo depois de o usuário sair.
            await authApi.logout(todosDispositivos);
            clearLocalSession();
        },
        [clearLocalSession]
    );

    const value = useMemo(
        () => ({
            user: session.user,
            companies: session.companies,
            currentCompany: session.currentCompany,
            isAuthenticated: Boolean(session.user),
            isRestoring,
            setAuth,
            setCurrentCompany,
            reloadSession: carregarSessao,
            logout,
        }),
        [session, isRestoring, setAuth, setCurrentCompany, carregarSessao, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
