import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { alertApi } from '../../services/api.service';

export const SavedSearches: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isPremium = user?.role === 'PREMIUM'; 
  const maxAlerts = isPremium ? 10 : 3;

  useEffect(() => {
     alertApi.getSavedSearches().then(data => {
         setAlerts(data);
         setIsLoading(false);
     }).catch(err => {
         console.error(err);
         setIsLoading(false);
     });
  }, []);

  const toggleAlert = (id: number) => {
     const alert = alerts.find(a => a.id === id);
     if (alert) {
         setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
         alertApi.toggleAlert(id, !alert.active).catch(() => {
             // Rollback on fail
             setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
         });
     }
  };

  return (
    <div className="fade-in alerts-container">
      {/* ── Header ── */}
      <div className="alerts-header">
         <div>
            <h2 className="profile-title" style={{ fontSize: 'var(--text-xl)' }}>
               Buscas Salvas & Alertas
            </h2>
            <p className="profile-subtitle" style={{ marginTop: 'var(--space-1)' }}>
               Seja notificado por email assim que um edital perfeito for publicado.
            </p>
         </div>

         {/* ── Status do Plano ── */}
         <div className="plan-status">
            Plano Atual: 
            {isPremium ? (
              <span className="badge-premium">PREMIUM</span>
            ) : (
              <span className="badge-free">FREE</span>
            )}
         </div>
      </div>

      {isLoading && <div style={{marginTop: 20}}>Carregando alertas...</div>}

      {/* ── Banner Upgrade (se Free) ── */}
      {!isPremium && (
        <div className="upgrade-banner">
          <div className="upgrade-content">
             <h3 className="upgrade-title">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Não perca nenhum edital
             </h3>
             <p className="upgrade-desc">
               No plano FREE você pode registrar apenas <b>{maxAlerts} alertas</b> que verificam de 24 em 24h. Assine o Premium para criar até <b>10 buscas hyper-segmentadas</b> e notificações em tempo real.
             </p>
          </div>
          <button className="btn-upgrade" onClick={() => window.location.href = '#upgrade'}>
            Fazer Upgrade Agora
          </button>
        </div>
      )}

      {/* ── Contagem e Botão Adicionar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
         <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
           Meus Alertas ({alerts.length}/{maxAlerts})
         </h3>
         <button 
           className="btn btn-primary" 
           style={{ height: 38, width: 'auto', padding: '0 var(--space-4)' }}
           disabled={!isPremium && alerts.length >= maxAlerts}
           onClick={() => alert('Feature para abrir modal de criação pendente')}
         >
           + Nova Busca Salva
         </button>
      </div>

      {/* ── Lista de Alertas ── */}
      <div className="alerts-list">
         {alerts.map(alert => (
            <div className="alert-card" key={alert.id}>
               <div className="alert-info">
                  <h4 className="alert-title">{alert.name}</h4>
                  <div className="alert-filters">
                     {alert.filters?.map((f: string) => (
                       <span key={f} className="filter-tag">{f}</span>
                     ))}
                  </div>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      className="toggle-input" 
                      checked={alert.active} 
                      onChange={() => toggleAlert(alert.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  
                  <button className="btn btn-ghost" style={{ padding: '4px', height: 32, width: 32 }}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
