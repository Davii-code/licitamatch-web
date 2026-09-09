import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyRegistration } from '../components/onboarding/CompanyRegistration';
import { useAuth } from '../context/useAuth';

export const CompanyRegistrationPage: React.FC = () => {
    const navigate = useNavigate();
    const { companies, reloadSession } = useAuth();
    const [erro, setErro] = useState<string | null>(null);

    /**
     * Depois do cadastro, recarrega a sessão para que a nova empresa apareça na
     * listagem e leva o usuário à seleção.
     *
     * A versão anterior, quando essa recarga falhava, montava uma empresa
     * fictícia ("Nova empresa", status ACTIVE, OWNER) e seguia como se estivesse
     * tudo certo — a tela passava a exibir dados que não vieram de lugar nenhum.
     */
    const handleSuccess = async () => {
        try {
            await reloadSession();
            setErro(null);
            navigate('/empresas', { replace: true });
        } catch {
            setErro('Empresa cadastrada, mas não conseguimos recarregar sua lista. Atualize a página.');
        }
    };

    return (
        <>
            {erro && (
                <div className="auth-alert auth-alert-error" role="alert" style={{ margin: 'var(--space-4)' }}>
                    {erro}
                </div>
            )}
            <CompanyRegistration
                onSuccess={handleSuccess}
                allowCancel={companies.length > 0}
                onCancel={() => navigate('/empresas')}
            />
        </>
    );
};
