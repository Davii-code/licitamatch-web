import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/api.service';

const MOCK_AUDIT = [
   { id: 1, date: '10/03/2026 14:30', actor: 'Davi Faria', action: 'Sincronizou dados via OpenCNPJ (Receita Federal)' },
   { id: 2, date: '08/03/2026 09:15', actor: 'Sistema', action: 'Atestado de Capacidade Técnica adicionado' },
   { id: 3, date: '08/03/2026 09:10', actor: 'Davi Faria', action: 'Empresa cadastrada no sistema' }
];

export const SettingsAccount: React.FC = () => {
   const { user } = useAuth();
   const [saving, setSaving] = useState(false);
   const [passSaving, setPassSaving] = useState(false);
   const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
   const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

   useEffect(() => {
       if (user) {
           setFormData({
               name: user.name || '',
               email: user.email || '',
               phone: '(11) 99999-9999' // mock phone since it's not in user entity
           });
       }
   }, [user]);

   const handleSave = async () => {
      setSaving(true);
      try {
          await userApi.updateProfile({ name: formData.name });
          alert('Perfil atualizado com sucesso!');
      } catch (err) {
          alert('Erro ao atualizar perfil.');
      } finally {
          setSaving(false);
      }
   };

   const handleUpdatePassword = async () => {
       if (passData.newPassword !== passData.confirmPassword) {
           alert('As senhas não coincidem!');
           return;
       }
       setPassSaving(true);
       try {
           await userApi.updatePassword({ 
             oldPassword: passData.oldPassword, 
             newPassword: passData.newPassword 
           });
           alert('Senha atualizada com sucesso!');
           setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
       } catch (err) {
           alert('Erro ao atualizar senha.');
       } finally {
           setPassSaving(false);
       }
   };

   return (
      <div className="fade-in settings-container">
         <div>
            <h2 className="profile-title" style={{ fontSize: 'var(--text-xl)' }}>
               Conta & Histórico
            </h2>
            <p className="profile-subtitle" style={{ marginTop: 'var(--space-1)' }}>
               Gerencie suas configurações pessoais e acesse logs de auditoria da sua empresa.
            </p>
         </div>

         {/* ── Perfil Pessoal ── */}
         <div className="settings-group">
            <h3 className="settings-group-title">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               Dados Pessoais
            </h3>
            <div className="settings-form-grid">
               <div className="settings-input">
                  <label>Nome Completo</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
               </div>
               <div className="settings-input">
                  <label>Telefone / WhatsApp</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
               </div>
               <div className="settings-input" style={{ gridColumn: '1 / -1' }}>
                  <label>E-mail (Login Principal)</label>
                  <input type="email" value={formData.email} disabled title="Para alterar o e-mail solicite suporte" />
               </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
               <button className="btn btn-primary" style={{ width: 'auto', padding: '0 24px', height: 40 }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
               </button>
            </div>
         </div>

         {/* ── Segurança (Senha) ── */}
         <div className="settings-group">
            <h3 className="settings-group-title" style={{ borderColor: 'var(--color-danger-dark)', color: 'var(--color-danger)' }}>
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
               Segurança
            </h3>
            <div className="settings-form-grid">
               <div className="settings-input" style={{ gridColumn: '1 / -1' }}>
                  <label>Senha Atual</label>
                  <input type="password" placeholder="Digite sua senha atual" value={passData.oldPassword} onChange={e => setPassData({...passData, oldPassword: e.target.value})} />
               </div>
               <div className="settings-input">
                  <label>Nova Senha</label>
                  <input type="password" placeholder="Digite a nova senha" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} />
               </div>
               <div className="settings-input">
                  <label>Confirmar Nova Senha</label>
                  <input type="password" placeholder="Repita a nova senha" value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} />
               </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
               <button className="btn" style={{ background: '#FEE2E2', color: 'var(--color-danger-dark)', border: 'none', width: 'auto', padding: '0 24px', height: 40 }} onClick={handleUpdatePassword} disabled={passSaving}>
                  {passSaving ? 'Atualizando...' : 'Atualizar Senha'}
               </button>
            </div>
         </div>

         {/* ── Auditoria Corporativa ── */}
         <div className="settings-group">
            <h3 className="settings-group-title">
               <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               Log de Auditoria da Empresa
            </h3>
            <div className="audit-list">
               {MOCK_AUDIT.map(log => (
                  <div key={log.id} className="audit-item">
                     <div className="audit-header">
                        <span>{log.date}</span>
                        <span>IP: 192.168.0.1</span>
                     </div>
                     <span className="audit-action">
                        <b className="audit-actor">{log.actor}</b> — {log.action}
                     </span>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};
