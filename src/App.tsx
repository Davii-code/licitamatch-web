import React, { useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { CompanySelection } from './components/onboarding/CompanySelection';
import { CompanyRegistration } from './components/onboarding/CompanyRegistration';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TenderList } from './components/tenders/TenderList';
import { CompanyProfile } from './components/profile/CompanyProfile';
import { EligibilityAnalysis } from './components/eligibility/EligibilityAnalysis';
import { SettingsAccount } from './components/settings/SettingsAccount';
import { type CompanyBrief, type UserInfo } from './services/auth.service';
import { companyApi } from './services/company.service';
import { useAuth } from './context/AuthContext';
import './index.css';
import './styles/dashboard.css';
import './styles/profile.css';
import './styles/eligibility.css';
import './styles/settings.css';

// ── Tipos de estado da aplicação ──
type AppView = 'auth' | 'select-company' | 'register-company' | 'dashboard' | 'tenders' | 'eligibility' | 'profile' | 'settings';

// ── App ──
const App: React.FC = () => {
  const [view, setView] = useState<AppView>('auth');
  const [companies, setCompanies] = useState<CompanyBrief[]>([]);

  const { token, setAuth, setCurrentCompany, logout, currentCompany } = useAuth();

  const handleAuthenticated = (fetchedCompanies: CompanyBrief[], newToken: string, user: UserInfo) => {
    // AuthContext parsea o user a partir do token de qualquer forma.
    setAuth(newToken, user, fetchedCompanies);
    setCompanies(fetchedCompanies);
    setView(fetchedCompanies.length === 0 ? 'register-company' : 'select-company');
  };

  const handleLogout = () => {
    logout();
    setView('auth');
    setCompanies([]);
  };

  const handleCompanySelected = (_newToken: string, company: CompanyBrief) => {
    // select-company agora já entrega CompanyBrief normalizado
    setCurrentCompany(company);
    setView('dashboard');
  };

  const handleCompanyRegistered = async (newCompany: { cnpj: string }) => {
    try {
      const response = await companyApi.list();
      setCompanies(response.companies);
      setView('select-company');
    } catch (err) {
      console.error(err);
      const fallbackCompany: CompanyBrief = {
        cnpj: newCompany.cnpj,
        accessLevel: 'OWNER',
        isLegalRepresentative: true,
        company: {
          cnpj: newCompany.cnpj,
          legalName: 'Nova empresa',
          tradeName: null,
          status: 'ACTIVE',
          size: null,
          nichoPrincipal: null,
          nichosSecundarios: [],
          city: null,
          state: null,
        },
      };
      handleCompanySelected(token!, fallbackCompany);
    }
  };

  // Se for uma das views autenticadas, monta o MainLayout
  const renderAppContent = () => {
    if (view === 'auth') {
      return <AuthPage onAuthenticated={handleAuthenticated} />;
    }

    if (view === 'select-company') {
      return (
        <CompanySelection
          companies={companies}
          onSelect={handleCompanySelected}
          onNewCompany={() => setView('register-company')}
          onLogout={handleLogout}
        />
      );
    }

    if (view === 'register-company') {
      return (
        <CompanyRegistration
          onSuccess={handleCompanyRegistered}
          allowCancel={companies.length > 0}
          onCancel={() => setView('select-company')}
        />
      );
    }

    // A partir daqui, as views rodam dentro do MainLayout (Painel Completo)
    const activeCompanyName = currentCompany?.company?.tradeName || currentCompany?.company?.legalName || 'Sua Empresa';

    return (
      <MainLayout
        activeView={view}
        onChangeView={(v) => setView(v as AppView)}
        onLogout={handleLogout}
        companyName={activeCompanyName}
      >
        {view === 'dashboard' && <DashboardOverview />}
        {view === 'tenders' && <TenderList />}
        {view === 'eligibility' && <EligibilityAnalysis />}
        {view === 'profile' &&
          <CompanyProfile cnpj={currentCompany?.company?.cnpj || ''} />
        }
        {view === 'settings' && <SettingsAccount />}
      </MainLayout>
    );
  };

  return <>{renderAppContent()}</>;

};

export default App;
