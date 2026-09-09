import React from 'react';
import { CompanyProfile } from '../components/profile/CompanyProfile';
import { useAuth } from '../context/useAuth';

/**
 * Perfil da empresa ativa.
 *
 * O CNPJ vem do contexto, não de prop. Antes ele descia de `App` e chegava como
 * string vazia sempre que a empresa ativa não estava carregada — o guard
 * `RequireCompany` agora garante que ela existe antes desta tela renderizar.
 */
export const CompanyProfilePage: React.FC = () => {
    const { currentCompany } = useAuth();

    return <CompanyProfile cnpj={currentCompany!.company.cnpj} />;
};
