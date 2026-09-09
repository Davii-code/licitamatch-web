import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth';
import { userApi, type ActiveSession } from '../../services/api.service';
import { companyApi, type AuditEntry } from '../../services/company.service';
import { ApiError } from '../../services/auth.service';

const IconEye = () => (
   <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
   </svg>
);

const IconEyeOff = () => (
   <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path d="M9.88 9.88a3 3 0 1 0 4.243 4.243" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
   </svg>
);

type Feedback = { tipo: 'ok' | 'erro'; texto: string } | null;

type PasswordField = 'oldPassword' | 'newPassword' | 'confirmPassword';

const formatDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR');

/** Extrai um nome curto de dispositivo a partir do User-Agent. */
function describeDevice(userAgent: string | null): string {
   if (!userAgent) return 'Dispositivo não identificado';

   const navegador =
      /Edg\//.test(userAgent) ? 'Edge'
      : /Chrome\//.test(userAgent) ? 'Chrome'
      : /Firefox\//.test(userAgent) ? 'Firefox'
      : /Safari\//.test(userAgent) ? 'Safari'
      : 'Navegador';

   const sistema =
      /Windows/.test(userAgent) ? 'Windows'
      : /Android/.test(userAgent) ? 'Android'
      : /iPhone|iPad/.test(userAgent) ? 'iOS'
      : /Mac OS/.test(userAgent) ? 'macOS'
      : /Linux/.test(userAgent) ? 'Linux'
      : 'sistema desconhecido';

   return `${navegador} — ${sistema}`;
}

/**
 * Traduz o campo `actor` do log de auditoria.
 * Formatos gravados: "user:<id>", "system:<origem>", "api:opencnpj".
 */
function describeActor(actor: string): string {
   if (actor.startsWith('user:')) return 'Usuário da conta';
   if (actor.startsWith('system:')) return 'Sistema';
   if (actor.startsWith('api:')) return 'Integração com a Receita';
   return actor;
}

export const SettingsAccount: React.FC = () => {
   const { user, currentCompany, logout } = useAuth();

   const [nome, setNome] = useState('');
   const [saving, setSaving] = useState(false);
   const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

   const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
   const [showPasswords, setShowPasswords] = useState({
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
   });
   const [passSaving, setPassSaving] = useState(false);
   const [passFeedback, setPassFeedback] = useState<Feedback>(null);

   const [sessoes, setSessoes] = useState<ActiveSession[]>([]);
   const [auditoria, setAuditoria] = useState<AuditEntry[]>([]);
   const [auditoriaErro, setAuditoriaErro] = useState<string | null>(null);

   const cnpj = currentCompany?.company?.cnpj;
   const podeVerAuditoria =
      currentCompany?.accessLevel === 'OWNER' || currentCompany?.accessLevel === 'ADMIN';

   useEffect(() => {
      setNome(user?.name ?? '');
   }, [user]);

   // Sessões ativas da conta — dado real, substitui o IP fixo que a tela exibia.
   useEffect(() => {
      userApi
         .getProfile()
         .then((response) => setSessoes(response.sessoesAtivas))
         .catch(() => setSessoes([]));
   }, []);

   const carregarAuditoria = useCallback(() => {
      if (!cnpj || !podeVerAuditoria) return;

      companyApi
         .getAudit(cnpj)
         .then((response) => {
            setAuditoria(response.registros);
            setAuditoriaErro(null);
         })
         .catch((err) =>
            setAuditoriaErro(
               err instanceof ApiError ? err.message : 'Não foi possível carregar a auditoria.'
            )
         );
   }, [cnpj, podeVerAuditoria]);

   useEffect(carregarAuditoria, [carregarAuditoria]);

   const togglePasswordVisibility = (field: PasswordField) => {
      setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
   };

   const handleSave = async () => {
      setSaving(true);
      setProfileFeedback(null);
      try {
         await userApi.updateProfile({ name: nome });
         setProfileFeedback({ tipo: 'ok', texto: 'Perfil atualizado com sucesso.' });
      } catch (err) {
         setProfileFeedback({
            tipo: 'erro',
            texto: err instanceof ApiError ? err.message : 'Erro ao atualizar perfil.',
         });
      } finally {
         setSaving(false);
      }
   };

   const handleUpdatePassword = async () => {
      setPassFeedback(null);

      if (passData.newPassword !== passData.confirmPassword) {
         setPassFeedback({ tipo: 'erro', texto: 'A confirmação não confere com a nova senha.' });
         return;
      }

      setPassSaving(true);
      try {
         await userApi.updatePassword({
            oldPassword: passData.oldPassword,
            newPassword: passData.newPassword,
         });

         setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
         setPassFeedback({
            tipo: 'ok',
            texto: 'Senha atualizada. Todas as sessões foram encerradas — faça login novamente.',
         });

         // O servidor revoga todas as sessões ao trocar a senha; manter a tela
         // aberta deixaria o usuário com uma sessão que já não renova.
         setTimeout(() => void logout(), 2000);
      } catch (err) {
         setPassFeedback({
            tipo: 'erro',
            texto:
               err instanceof ApiError
                  ? [err.message, ...err.fieldMessages].join(' ')
                  : 'Erro ao atualizar senha.',
         });
      } finally {
         setPassSaving(false);
      }
   };

   return (
      <div className="fade-in settings-container">
         <div>
            <h2 className="profile-title" style={{ fontSize: 'var(--text-xl)' }}>
               Conta e histórico
            </h2>
            <p className="profile-subtitle" style={{ marginTop: 'var(--space-1)' }}>
               Gerencie seus dados de acesso e acompanhe o histórico de alterações da empresa.
            </p>
         </div>

         {/* ── Dados pessoais ── */}
         <div className="settings-group">
            <h3 className="settings-group-title">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
               Dados pessoais
            </h3>
            <div className="settings-form-grid">
               <div className="settings-input" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="perfil-nome">Nome completo</label>
                  <input
                     id="perfil-nome"
                     type="text"
                     value={nome}
                     onChange={(e) => setNome(e.target.value)}
                  />
               </div>
               <div className="settings-input" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="perfil-email">E-mail (login principal)</label>
                  <input
                     id="perfil-email"
                     type="email"
                     value={user?.email ?? ''}
                     disabled
                     title="A troca de e-mail exige confirmação no novo endereço; solicite ao suporte."
                  />
               </div>
            </div>

            {profileFeedback && (
               <p
                  className="settings-feedback"
                  role="status"
                  style={{
                     color:
                        profileFeedback.tipo === 'ok' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
               >
                  {profileFeedback.texto}
               </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
               <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '0 24px', height: 40 }}
                  onClick={handleSave}
                  disabled={saving || nome.trim().length < 2}
               >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
               </button>
            </div>
         </div>

         {/* ── Segurança ── */}
         <div className="settings-group">
            <h3
               className="settings-group-title"
               style={{ borderColor: 'var(--color-danger-dark)', color: 'var(--color-danger)' }}
            >
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
               Segurança
            </h3>

            <div className="settings-form-grid">
               <div className="settings-input" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="senha-atual">Senha atual</label>
                  <div className="password-input-wrapper">
                     <input
                        id="senha-atual"
                        type={showPasswords.oldPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Digite sua senha atual"
                        value={passData.oldPassword}
                        onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                     />
                     <button
                        type="button"
                        className="password-eye-btn"
                        onClick={() => togglePasswordVisibility('oldPassword')}
                        aria-label={showPasswords.oldPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                     >
                        {showPasswords.oldPassword ? <IconEyeOff /> : <IconEye />}
                     </button>
                  </div>
               </div>

               <div className="settings-input">
                  <label htmlFor="senha-nova">Nova senha</label>
                  <div className="password-input-wrapper">
                     <input
                        id="senha-nova"
                        type={showPasswords.newPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres, com letra e número"
                        value={passData.newPassword}
                        onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                     />
                     <button
                        type="button"
                        className="password-eye-btn"
                        onClick={() => togglePasswordVisibility('newPassword')}
                        aria-label={showPasswords.newPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                     >
                        {showPasswords.newPassword ? <IconEyeOff /> : <IconEye />}
                     </button>
                  </div>
               </div>

               <div className="settings-input">
                  <label htmlFor="senha-confirma">Confirmar nova senha</label>
                  <div className="password-input-wrapper">
                     <input
                        id="senha-confirma"
                        type={showPasswords.confirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repita a nova senha"
                        value={passData.confirmPassword}
                        onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                     />
                     <button
                        type="button"
                        className="password-eye-btn"
                        onClick={() => togglePasswordVisibility('confirmPassword')}
                        aria-label={
                           showPasswords.confirmPassword
                              ? 'Ocultar confirmação de senha'
                              : 'Mostrar confirmação de senha'
                        }
                     >
                        {showPasswords.confirmPassword ? <IconEyeOff /> : <IconEye />}
                     </button>
                  </div>
               </div>
            </div>

            {passFeedback && (
               <p
                  className="settings-feedback"
                  role="status"
                  style={{
                     color: passFeedback.tipo === 'ok' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
               >
                  {passFeedback.texto}
               </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
               <button
                  className="btn"
                  style={{
                     background: '#FEE2E2',
                     color: 'var(--color-danger-dark)',
                     border: 'none',
                     width: 'auto',
                     padding: '0 24px',
                     height: 40,
                  }}
                  onClick={handleUpdatePassword}
                  disabled={passSaving || !passData.oldPassword || !passData.newPassword}
               >
                  {passSaving ? 'Atualizando...' : 'Atualizar senha'}
               </button>
            </div>
         </div>

         {/* ── Sessões ativas ── */}
         <div className="settings-group">
            <h3 className="settings-group-title">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
               Dispositivos conectados
            </h3>

            <div className="audit-list">
               {sessoes.length === 0 ? (
                  <p className="profile-subtitle">Nenhuma outra sessão ativa registrada.</p>
               ) : (
                  sessoes.map((sessao) => (
                     <div key={sessao.id} className="audit-item">
                        <div className="audit-header">
                           <span>Último uso: {formatDateTime(sessao.lastUsedAt)}</span>
                           {/* O IP é gravado truncado pelo servidor, por minimização de dados. */}
                           <span>{sessao.ipAddress ? `Rede: ${sessao.ipAddress}` : 'Rede não registrada'}</span>
                        </div>
                        <span className="audit-action">{describeDevice(sessao.userAgent)}</span>
                     </div>
                  ))
               )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
               <button
                  className="btn btn-ghost"
                  style={{ width: 'auto', padding: '0 24px', height: 40 }}
                  onClick={() => void logout(true)}
               >
                  Encerrar sessões em todos os dispositivos
               </button>
            </div>
         </div>

         {/* ── Auditoria da empresa ── */}
         <div className="settings-group">
            <h3 className="settings-group-title">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               Log de auditoria da empresa
            </h3>

            {!cnpj ? (
               <p className="profile-subtitle">Selecione uma empresa para ver o histórico.</p>
            ) : !podeVerAuditoria ? (
               <p className="profile-subtitle">
                  O histórico de auditoria está disponível para os níveis de acesso ADMIN e OWNER.
               </p>
            ) : auditoriaErro ? (
               <p className="profile-subtitle" style={{ color: 'var(--color-danger)' }}>
                  {auditoriaErro}
               </p>
            ) : auditoria.length === 0 ? (
               <p className="profile-subtitle">Nenhuma alteração registrada até o momento.</p>
            ) : (
               <div className="audit-list">
                  {auditoria.map((registro) => (
                     <div key={registro.id} className="audit-item">
                        <div className="audit-header">
                           <span>{formatDateTime(registro.createdAt)}</span>
                           <span>{registro.event}</span>
                        </div>
                        <span className="audit-action">
                           <b className="audit-actor">{describeActor(registro.actor)}</b> —{' '}
                           {registro.eventLabel}
                        </span>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
};
