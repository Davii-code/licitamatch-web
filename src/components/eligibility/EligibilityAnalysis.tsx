import React, { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { eligibilityApi, type EligibilityResponse } from '../../services/eligibility.service';
import { ApiError } from '../../services/auth.service';

const formatCurrency = (value: number) =>
   new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

/** Converte "1.200.000,00" (formato brasileiro) em número. */
const parseCurrency = (value: string): number => {
   const cleanStr = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
   const parsed = parseFloat(cleanStr);
   return Number.isFinite(parsed) ? parsed : 0;
};

const RISK_LABELS: Record<string, string> = {
   LOW: 'Baixo risco',
   MEDIUM: 'Risco moderado',
   HIGH: 'Alto risco',
   CRITICAL: 'Risco crítico',
};

const IconCheck = () => (
   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
   </svg>
);

const IconAlert = () => (
   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
   </svg>
);

/**
 * Análise de elegibilidade para um lote.
 *
 * Todo número exibido aqui vem da API. A versão anterior, quando a chamada
 * falhava — o que acontecia sempre, porque enviava o parâmetro com o nome errado —
 * caía num resultado fixo de score 85 com listas inventadas de requisitos
 * cumpridos (SICAF, CNDT, atestado de "Storage"). Em um produto de conformidade,
 * exibir requisito de habilitação que ninguém verificou é pior do que não exibir
 * nada: a decisão de disputar o certame é tomada em cima disso.
 */
export const EligibilityAnalysis: React.FC = () => {
   const { currentCompany } = useAuth();

   const [loteValueRaw, setLoteValueRaw] = useState<string>('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [result, setResult] = useState<EligibilityResponse | null>(null);

   const cnpj = currentCompany?.company?.cnpj;

   const handleAnalyze = async () => {
      if (!cnpj) {
         setError('Selecione uma empresa antes de analisar.');
         return;
      }

      const valorLote = parseCurrency(loteValueRaw);
      if (valorLote <= 0) {
         setError('Informe o valor estimado do lote.');
         return;
      }

      setIsLoading(true);
      setError(null);

      try {
         setResult(await eligibilityApi.analyze(cnpj, valorLote));
      } catch (err) {
         setResult(null);
         setError(
            err instanceof ApiError
               ? err.message
               : 'Não foi possível calcular a elegibilidade. Tente novamente.'
         );
      } finally {
         setIsLoading(false);
      }
   };

   const score = result?.eligibility.overallScore ?? 0;
   const scoreColor =
      score > 70 ? 'var(--color-success)' : score > 40 ? 'var(--color-warning)' : 'var(--color-danger)';

   const capital = result?.capitalSocialAnalysis;
   const capitalOk = capital?.riskLevel === 'LOW';
   const cnaeOk = result
      ? result.cnaeMatchAnalysis.hasDirectMatch || result.cnaeMatchAnalysis.hasGroupMatch
      : false;

   return (
      <div className="fade-in eligibility-container">
         <div className="eligibility-header">
            <div>
               <h2 className="profile-title" style={{ fontSize: 'var(--text-xl)' }}>
                  Análise de edital e elegibilidade
               </h2>
               <p className="profile-subtitle" style={{ marginTop: 'var(--space-1)' }}>
                  Avalia capital social, situação cadastral e aderência de CNAE conforme a Lei 14.133/2021.
               </p>
            </div>

            <div className="eligibility-input-group">
               <label htmlFor="valor-lote">Qual o valor estimado deste lote?</label>
               <div className="currency-input">
                  <span className="currency-prefix">R$</span>
                  <input
                     id="valor-lote"
                     type="text"
                     inputMode="decimal"
                     value={loteValueRaw}
                     onChange={(e) => setLoteValueRaw(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                     placeholder="845.000,00"
                  />
                  <button
                     className="btn btn-primary"
                     style={{ padding: '0 12px', height: 32, borderRadius: 6 }}
                     onClick={handleAnalyze}
                     disabled={isLoading || !cnpj}
                  >
                     {isLoading ? 'Calculando...' : 'Calcular'}
                  </button>
               </div>
            </div>
         </div>

         {error && (
            <div className="risk-card risk-card-critical" style={{ marginTop: 'var(--space-4)' }}>
               <div className="risk-header">
                  <IconAlert /> Não foi possível calcular
               </div>
               <p className="risk-desc">{error}</p>
            </div>
         )}

         {result && capital && (
            <>
               {/* ── Score global ── */}
               <div className="score-card">
                  <div className="score-circle">
                     <svg width="100" height="100" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle
                           cx="50"
                           cy="50"
                           r="45"
                           fill="none"
                           stroke={scoreColor}
                           strokeWidth="8"
                           strokeDasharray="283"
                           strokeDashoffset={283 - (283 * score) / 100}
                           style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                     </svg>
                     <div className="score-circle-inner">
                        <span className="score-value">{score}</span>
                        <span className="score-label">Score</span>
                     </div>
                  </div>

                  <div className="score-details">
                     <h3 className="score-title">
                        {result.eligibility.canBid
                           ? score > 70
                              ? 'Boa aderência ao lote'
                              : 'Aderência com ressalvas'
                           : 'Empresa impedida de participar'}
                     </h3>
                     <p className="score-desc">
                        {result.eligibility.warnings.length > 0
                           ? result.eligibility.warnings[0]
                           : 'Nenhum impedimento identificado nos dados cadastrais analisados.'}
                     </p>
                     <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${score}%`, background: scoreColor }} />
                     </div>
                  </div>
               </div>

               <div className="risk-grid">
                  {/* Aderência de CNAE */}
                  <div className={`risk-card ${cnaeOk ? 'risk-card-low' : 'risk-card-critical'}`}>
                     <div className="risk-header">
                        {cnaeOk ? <IconCheck /> : <IconAlert />}{' '}
                        {cnaeOk ? 'Baixo risco' : 'Atenção'}
                     </div>
                     <h4 className="risk-title">Atividade econômica</h4>
                     <p className="risk-desc">
                        {result.cnaeMatchAnalysis.hasDirectMatch
                           ? 'A empresa possui CNAE idêntico ao exigido pelo objeto do edital.'
                           : result.cnaeMatchAnalysis.hasGroupMatch
                             ? 'A empresa possui CNAE do mesmo grupo do exigido. Confira se o edital aceita atividade correlata.'
                             : 'Nenhum CNAE do edital foi informado ou nenhum casou com os da empresa. Informe os CNAEs do objeto para esta análise.'}
                     </p>
                  </div>

                  {/* Capital social — Art. 69, §2º */}
                  <div className={`risk-card ${capitalOk ? 'risk-card-low' : 'risk-card-critical'}`}>
                     <div className="risk-header">
                        {capitalOk ? <IconCheck /> : <IconAlert />} {RISK_LABELS[capital.riskLevel]}
                     </div>
                     <h4 className="risk-title">Qualificação econômico-financeira</h4>
                     <p className="risk-desc">
                        O edital pode exigir capital social de até {formatCurrency(capital.requiredCapital)} (10% do
                        lote). A empresa possui{' '}
                        {result.company.capitalSocial !== null
                           ? formatCurrency(result.company.capitalSocial)
                           : 'capital social não informado na Receita'}
                        .
                     </p>
                     <p className="risk-desc" style={{ marginTop: 'var(--space-2)', opacity: 0.8 }}>
                        {capital.legalReference}
                     </p>
                  </div>

                  {/* Tratamento diferenciado ME/EPP */}
                  {result.meEppBenefits.eligible && (
                     <div className="risk-card risk-card-low">
                        <div className="risk-header" style={{ color: 'var(--color-primary-dark)' }}>
                           <IconCheck /> Tratamento diferenciado
                        </div>
                        <h4 className="risk-title">ME / EPP — LC 123/2006</h4>
                        <p className="risk-desc">{result.meEppBenefits.message}</p>
                     </div>
                  )}
               </div>

               {/* ── Pontos verificados e ressalvas ── */}
               <div className="req-grid">
                  <div className="req-column req-col-green">
                     <div className="req-col-header">
                        <IconCheck /> Verificado nos dados cadastrais
                     </div>
                     <div className="req-list">
                        <div className="req-item">
                           <IconCheck />
                           <span>
                              Situação cadastral na Receita Federal: <b>{result.company.status}</b>.
                           </span>
                        </div>
                        <div className="req-item">
                           <IconCheck />
                           <span>
                              Porte declarado: <b>{result.company.size ?? 'não informado'}</b>.
                           </span>
                        </div>
                        <div className="req-item">
                           <IconCheck />
                           <span>{capital.message}</span>
                        </div>
                     </div>
                  </div>

                  <div className="req-column req-col-red">
                     <div className="req-col-header">
                        <IconAlert /> Ressalvas ({result.eligibility.warnings.length})
                     </div>
                     <div className="req-list">
                        {result.eligibility.warnings.length === 0 ? (
                           <div className="req-item">
                              <IconCheck />
                              <span>Nenhuma ressalva nos dados analisados.</span>
                           </div>
                        ) : (
                           result.eligibility.warnings.map((warning) => (
                              <div className="req-item" key={warning}>
                                 <IconAlert />
                                 <span>{warning}</span>
                              </div>
                           ))
                        )}

                        {result.dataFreshness.requiresRefresh && (
                           <div className="req-item">
                              <IconAlert />
                              <span>
                                 Dados cadastrais com mais de 30 dias. Atualize a empresa no perfil antes de usar
                                 esta análise para habilitação.
                              </span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <p
                  className="profile-subtitle"
                  style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)' }}
               >
                  Esta análise cobre apenas os dados cadastrais disponíveis (Receita Federal e nichos configurados).
                  Regularidade fiscal, trabalhista e atestados de capacidade técnica exigidos pelo edital precisam ser
                  conferidos no instrumento convocatório.
               </p>
            </>
         )}
      </div>
   );
};
