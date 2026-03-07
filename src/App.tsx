import React, { useState } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { type CompanyBrief } from './services/auth.service';
import './index.css';

// ── Tipos de estado da aplicação ──
type AppView = 'auth' | 'select-company' | 'dashboard';

interface AppState {
  view: AppView;
  companies: CompanyBrief[];
  token: string | null;
}

// ── Placeholder: Dashboard (implementado na Etapa 3) ──
const DashboardPlaceholder: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 'var(--space-4)',
    background: 'var(--color-bg)',
  }}>
    <div style={{
      width: 64,
      height: 64,
      background: 'var(--color-primary)',
      borderRadius: 'var(--radius-xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
    }}>⚡</div>
    <h1 style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)', fontSize: 'var(--text-2xl)' }}>
      Dashboard — Em construção
    </h1>
    <p style={{ color: 'var(--color-text-muted)', maxWidth: 360, textAlign: 'center' }}>
      Autenticação concluída com sucesso! O dashboard será implementado na Etapa 3.
    </p>
    <button
      className="btn btn-ghost"
      onClick={onLogout}
      style={{ marginTop: 'var(--space-4)' }}
    >
      Sair
    </button>
  </div>
);

// ── App ──
const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'auth',
    companies: [],
    token: null,
  });

  const handleAuthenticated = (companies: CompanyBrief[], token: string) => {
    setState({
      view: companies.length === 0 ? 'dashboard' : 'select-company',
      companies,
      token,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setState({ view: 'auth', companies: [], token: null });
  };

  if (state.view === 'auth') {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  // Etapa 2: modal de seleção de empresa (será implementado)
  // Por ora vai direto ao dashboard
  return <DashboardPlaceholder onLogout={handleLogout} />;
};

export default App;
