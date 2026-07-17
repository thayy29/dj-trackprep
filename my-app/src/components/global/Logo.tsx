export function Logo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-action-primary to-action-secondary flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
        {/* T para TrackPrep - feito com barras musicais estilizadas */}
        <g>
          {/* Barra superior do T */}
          <rect x="3" y="2" width="18" height="2.5" rx="1" />
          {/* Haste vertical do T */}
          <rect x="10" y="4.5" width="4" height="12" rx="1.5" />
          {/* Notas musicais ao lado */}
          <circle cx="7" cy="11" r="1.5" opacity="0.8" />
          <circle cx="17" cy="13" r="1.2" opacity="0.7" />
          {/* Linha ondulada (onda sonora) */}
          <path
            d="M 4 18 Q 6 16 8 18 T 12 18 T 16 18 T 20 18"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
