import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, type UserInfo, type CompanyBrief } from '../services/auth.service';

interface AuthContextType {
    user: UserInfo | null;
    currentCompany: CompanyBrief | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (token: string, user: UserInfo, companies: CompanyBrief[]) => void;
    setCurrentCompany: (company: CompanyBrief) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [currentCompany, setCurrentCompany] = useState<CompanyBrief | null>(null);
    const [token, setToken] = useState<string | null>(authApi.getStoredToken());

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                // Try to recover user from payload if available, or fetch it.
                // Assuming payload contains role, email, etc.
                setUser({
                    id: payload.id || '',
                    email: payload.email || '',
                    name: payload.name || '',
                    role: payload.role || 'GUEST',
                });
            } catch (err) {
                console.error('Invalid token');
                logout();
            }
        }
    }, [token]);

    const setAuth = (newToken: string, newUser: UserInfo, companies: CompanyBrief[]) => {
        authApi.persistSession(newToken);
        setToken(newToken);
        setUser(newUser);
        if (companies && companies.length > 0) {
            setCurrentCompany(companies[0]);
        }
    };

    const logout = () => {
        authApi.logout();
        setToken(null);
        setUser(null);
        setCurrentCompany(null);
    };

    return (
        <AuthContext.Provider value={{ user, currentCompany, token, isAuthenticated: !!token, setAuth, setCurrentCompany, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
