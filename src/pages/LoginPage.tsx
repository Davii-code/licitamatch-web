import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthPage } from '../components/auth/AuthPage';
import { useAuth } from '../context/useAuth';
import type { CompanyBrief, UserInfo } from '../services/auth.service';

/** Destino guardado pelo guard quando o usuário caiu aqui por falta de sessão. */
interface LocationState {
    from?: { pathname: string };
}

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useAuth();

    const handleAuthenticated = (companies: CompanyBrief[], user: UserInfo) => {
        setAuth(user, companies);

        // Com uma única empresa, o contexto já foi resolvido pelo AuthProvider —
        // mas o servidor ainda não sabe disso, então a seleção precisa acontecer
        // na tela própria para emitir o token com companyId.
        if (companies.length === 0) {
            navigate('/empresas/nova', { replace: true });
            return;
        }

        const destino = (location.state as LocationState | null)?.from?.pathname;
        navigate(destino ?? '/empresas', { replace: true });
    };

    return <AuthPage onAuthenticated={handleAuthenticated} />;
};
