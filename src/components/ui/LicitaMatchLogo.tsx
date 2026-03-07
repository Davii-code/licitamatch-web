import React from 'react';

interface LicitaMatchLogoProps {
    /** Variante de cor: 'dark' = texto escuro (fundo claro) | 'light' = texto branco (fundo escuro) */
    variant?: 'dark' | 'light';
    /** Altura da logo em px (mantém proporção automaticamente) */
    height?: number;
    /** Exibe a tagline "Sua licitação, nossa conexão" */
    showTagline?: boolean;
    className?: string;
}

export const LicitaMatchLogo: React.FC<LicitaMatchLogoProps> = ({
    variant = 'dark',
    height = 48,
    showTagline = false,
    className,
}) => {
    const textPrimary = variant === 'dark' ? '#00555A' : '#FFFFFF';
    const textAccent = '#06D6A0'; // Victory Green — sempre visível em qualquer fundo
    const iconTeal = variant === 'dark' ? '#00555A' : '#FFFFFF';
    const iconOrange = '#ED680E'; // Sunset Orange — checkmark
    const taglineColor = variant === 'dark' ? '#6B7280' : 'rgba(255,255,255,0.65)';

    // Proporção: 220 × (showTagline ? 64 : 48) → escala pelo height
    const baseH = showTagline ? 64 : 48;
    const baseW = 230;
    const scale = height / baseH;
    const width = baseW * scale;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${baseW} ${baseH}`}
            width={width}
            height={height}
            className={className}
            aria-label="LicitaMatch"
            role="img"
        >
            {/* ── ÍCONE (esquerda) ── */}

            {/* Documento de fundo (deslocado p/ baixo-direita) */}
            <rect
                x="10" y="6"
                width="22" height="28"
                rx="3"
                fill={iconTeal}
                opacity="0.35"
            />

            {/* Documento principal */}
            <rect
                x="4" y="2"
                width="24" height="30"
                rx="3"
                fill={iconTeal}
            />

            {/* Linhas de texto no documento */}
            <rect x="8" y="8" width="16" height="2" rx="1" fill="white" opacity="0.9" />
            <rect x="8" y="13" width="12" height="2" rx="1" fill="white" opacity="0.9" />
            <rect x="8" y="18" width="14" height="2" rx="1" fill="white" opacity="0.9" />
            <rect x="8" y="23" width="10" height="2" rx="1" fill="white" opacity="0.9" />

            {/* Checkmark em laranja (sobrepõe o documento) */}
            <polyline
                points="6,30 13,38 28,18"
                fill="none"
                stroke={iconOrange}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* ── TEXTO (direita) ── */}

            {/* "Licita" */}
            <text
                x="38"
                y={showTagline ? "30" : "34"}
                fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
                fontWeight="800"
                fontSize="26"
                fill={textPrimary}
                letterSpacing="-0.5"
            >
                Licita
            </text>

            {/* "Match" (accent color) */}
            <text
                x="109"
                y={showTagline ? "30" : "34"}
                fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
                fontWeight="800"
                fontSize="26"
                fill={textAccent}
                letterSpacing="-0.5"
            >
                Match
            </text>

            {/* Tagline (opcional) */}
            {showTagline && (
                <text
                    x="38"
                    y="48"
                    fontFamily="'Inter', sans-serif"
                    fontWeight="400"
                    fontSize="11"
                    fill={taglineColor}
                    letterSpacing="0.2"
                >
                    Sua licitação, nossa conexão
                </text>
            )}
        </svg>
    );
};
