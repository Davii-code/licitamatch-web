import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TenderList } from './components/tenders/TenderList';
import { AlertsPage } from './components/alerts/AlertsPage';
import { EligibilityAnalysis } from './components/eligibility/EligibilityAnalysis';
import { SettingsAccount } from './components/settings/SettingsAccount';
import { CompanyProfilePage } from './pages/CompanyProfilePage';
import { LoginPage } from './pages/LoginPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { CompanySelectionPage } from './pages/CompanySelectionPage';
import { CompanyRegistrationPage } from './pages/CompanyRegistrationPage';
import { RequireAuth, RequireCompany, RedirectIfAuthenticated } from './routes/guards';
import './index.css';
import './styles/dashboard.css';
import './styles/profile.css';
import './styles/eligibility.css';
import './styles/settings.css';

/**
 * Mapa de rotas da aplicação.
 *
 * A navegação era estado em memória (`useState<AppView>`), o que deixava toda a
 * aplicação numa única URL: não dava para compartilhar link de tela, o botão
 * voltar saía do sistema e recarregar perdia o lugar. Cada tela agora tem
 * endereço próprio.
 *
 * Guards em camadas: `RequireAuth` cobre tudo que exige login; `RequireCompany`
 * cobre o painel, cujas telas operam sempre no contexto de um CNPJ.
 */
const App: React.FC = () => (
    <ErrorBoundary>
        <Routes>
            {/* ── Público ── */}
            <Route
                path="/entrar"
                element={
                    <RedirectIfAuthenticated>
                        <LoginPage />
                    </RedirectIfAuthenticated>
                }
            />
            {/* Destino do link enviado no e-mail de recuperação. */}
            <Route path="/redefinir-senha" element={<PasswordResetPage />} />

            {/* ── Autenticado, ainda sem empresa ativa ── */}
            <Route element={<RequireAuth />}>
                <Route path="/empresas" element={<CompanySelectionPage />} />
                <Route path="/empresas/nova" element={<CompanyRegistrationPage />} />

                {/* ── Painel: exige empresa ativa ── */}
                <Route element={<RequireCompany />}>
                    <Route path="/painel" element={<MainLayout />}>
                        <Route index element={<DashboardOverview />} />
                        <Route path="licitacoes" element={<TenderList />} />
                        <Route path="alertas" element={<AlertsPage />} />
                        <Route path="elegibilidade" element={<EligibilityAnalysis />} />
                        <Route path="empresa" element={<CompanyProfilePage />} />
                        <Route path="conta" element={<SettingsAccount />} />
                    </Route>
                </Route>
            </Route>

            {/* A raiz manda para o painel; o guard redireciona quem não tem sessão. */}
            <Route path="/" element={<Navigate to="/painel" replace />} />

            {/* Qualquer outro endereço volta para a raiz em vez de renderizar vazio. */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </ErrorBoundary>
);

export default App;
