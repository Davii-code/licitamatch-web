import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './auth-context';

/** Acessa o contexto de autenticação. Lança se usado fora do AuthProvider. */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth precisa ser usado dentro de um AuthProvider.');
    }

    return context;
}
