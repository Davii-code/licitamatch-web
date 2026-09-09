import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/** Tela de espera enquanto o servidor confirma a sessão. */
const Carregando: React.FC<{ mensagem: string }> = ({ mensagem }) => (
    <div className="app-loading" role="status" aria-live="polite">
        {mensagem}
    </div>
);

/**
 * Exige sessão autenticada.
 *
 * Enquanto `isRestoring` é verdadeiro, nada é decidido: a sessão vive em cookie
 * `HttpOnly` e só o servidor sabe se ela é válida. Redirecionar antes da
 * resposta jogaria para o login todo usuário que apenas recarregou a página.
 *
 * O destino original vai em `state.from`, para o login devolver o usuário ao
 * lugar que ele tentou abrir.
 */
export const RequireAuth: React.FC = () => {
    const { isAuthenticated, isRestoring } = useAuth();
    const location = useLocation();

    if (isRestoring) return <Carregando mensagem="Carregando sua sessão..." />;

    if (!isAuthenticated) {
        return <Navigate to="/entrar" replace state={{ from: location }} />;
    }

    return <Outlet />;
};

/**
 * Exige empresa ativa, além da sessão.
 *
 * As telas do painel operam sempre no contexto de um CNPJ. Sem empresa
 * selecionada, o `CompanyProfile` recebia string vazia e o dashboard consultava
 * métricas de lugar nenhum.
 */
export const RequireCompany: React.FC = () => {
    const { currentCompany, isRestoring } = useAuth();

    if (isRestoring) return <Carregando mensagem="Carregando sua empresa..." />;

    if (!currentCompany) {
        return <Navigate to="/empresas" replace />;
    }

    return <Outlet />;
};

/**
 * Bloqueia telas de autenticação para quem já está logado.
 * Evita que o botão voltar recoloque o usuário no formulário de login.
 */
export const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isRestoring } = useAuth();

    if (isRestoring) return <Carregando mensagem="Carregando..." />;
    if (isAuthenticated) return <Navigate to="/empresas" replace />;

    return <>{children}</>;
};
