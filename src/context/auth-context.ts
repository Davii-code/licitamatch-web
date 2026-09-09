import { createContext } from 'react';
import type { UserInfo, CompanyBrief } from '../services/auth.service';

export interface AuthContextType {
    user: UserInfo | null;
    /** Empresas em que o usuário tem vínculo. */
    companies: CompanyBrief[];
    /** Empresa ativa no contexto da sessão, confirmada pelo servidor. */
    currentCompany: CompanyBrief | null;
    isAuthenticated: boolean;
    /** Verdadeiro enquanto a sessão está sendo verificada no servidor. */
    isRestoring: boolean;
    /** Registra a sessão após um login bem-sucedido. */
    setAuth: (user: UserInfo, companies: CompanyBrief[]) => void;
    /** Seleciona a empresa ativa; o contexto no servidor já foi trocado. */
    setCurrentCompany: (company: CompanyBrief | null) => void;
    /** Recarrega a sessão a partir do servidor. */
    reloadSession: () => Promise<void>;
    /** Revoga a sessão no servidor e limpa o estado local. */
    logout: (todosDispositivos?: boolean) => Promise<void>;
}

/**
 * Contexto de autenticação.
 *
 * Fica em arquivo próprio, sem componentes: um módulo que exporta componentes e
 * valores ao mesmo tempo quebra o Fast Refresh do Vite, que passa a recarregar a
 * página inteira a cada edição.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
