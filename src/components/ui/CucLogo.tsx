import React from 'react';

interface CucLogoProps {
  /**
   * Según el Manual de Marca CUC (pág. 12):
   * - 'white': Imagotipo blanco, OBLIGATORIO sobre fondo Auburn (#A3161A) o fondos oscuros.
   * - 'auburn': Imagotipo rojo Auburn (#A3161A), OBLIGATORIO sobre fondo blanco limpio (#FFFFFF).
   * - 'isotipo-white' / 'isotipo-auburn': Solo el isotipo (la U con bombilla interior, págs. 8 y 9).
   */
  variant?: 'white' | 'auburn' | 'isotipo-white' | 'isotipo-auburn';
  className?: string;
  showCobranding?: boolean;
  cobrandingSubtitle?: string;
}

export function CucLogo({
  variant = 'white',
  className = 'h-9',
  showCobranding = false,
  cobrandingSubtitle = 'BECATRACK · GESTIÓN DE BECARIOS',
}: CucLogoProps) {
  const fill = variant.includes('white') ? '#FFFFFF' : '#A3161A';

  if (variant === 'isotipo-white' || variant === 'isotipo-auburn') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 80 80"
        fill="none"
        className={className}
        aria-label="Isotipo CUC"
      >
        <path
          d="M6 16C6 10.4772 10.4772 6 16 6H32V28.5C25.2 31.6 20.5 38.4 20.5 46.3C20.5 57.0696 29.2304 65.8 40 65.8C50.7696 65.8 59.5 57.0696 59.5 46.3C59.5 38.4 54.8 31.6 48 28.5V6H64C69.5228 6 74 10.4772 74 16V64C74 69.5228 69.5228 74 64 74H16C10.4772 74 6 69.5228 6 64V16Z"
          fill={fill}
        />
      </svg>
    );
  }

  return (
    <div className="inline-flex items-center gap-4 select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 430 88"
        fill="none"
        className={className}
        aria-label="CUC Universidad de la Costa"
      >
        {/* C */}
        <path
          d="M8 20C8 13.3726 13.3726 8 20 8H66C72.6274 8 78 13.3726 78 20V33C78 36.3137 75.3137 39 72 39H56C52.6863 39 50 36.3137 50 33V31C50 28.7909 48.2091 27 46 27H36C30.4772 27 26 31.4772 26 37V51C26 56.5228 30.4772 61 36 61H46C48.2091 61 50 59.2091 50 57V55C50 51.6863 52.6863 49 56 49H72C75.3137 49 78 51.6863 78 55V68C78 74.6274 72.6274 80 66 80H20C13.3726 80 8 74.6274 8 68V20Z"
          fill={fill}
        />
        {/* U (Isotipo oficial con curvas exteriores y cavidad circular) */}
        <path
          d="M86 20C86 13.3726 91.3726 8 98 8H113V30.5C106.5 33.4 102 39.9 102 47.5C102 57.7173 110.283 66 120.5 66C130.717 66 139 57.7173 139 47.5C139 39.9 134.5 33.4 128 30.5V8H143C149.627 8 155 13.3726 155 20V68C155 74.6274 149.627 80 143 80H98C91.3726 80 86 74.6274 86 68V20Z"
          fill={fill}
        />
        {/* C */}
        <path
          d="M163 20C163 13.3726 168.373 8 175 8H221C227.627 8 233 13.3726 233 20V33C233 36.3137 230.314 39 227 39H211C207.686 39 205 36.3137 205 33V31C205 28.7909 203.209 27 201 27H191C185.477 27 181 31.4772 181 37V51C181 56.5228 185.477 61 191 61H201C203.209 61 205 59.2091 205 57V55C205 51.6863 207.686 49 211 49H227C230.314 49 233 51.6863 233 55V68C233 74.6274 227.627 80 221 80H175C168.373 80 163 74.6274 163 68V20Z"
          fill={fill}
        />
        {/* UNIVERSIDAD DE LA COSTA */}
        <text
          x="248"
          y="39"
          fill={fill}
          fontFamily="var(--font-red-hat), sans-serif"
          fontSize="26"
          fontWeight="400"
          letterSpacing="1.2"
        >
          UNIVERSIDAD
        </text>
        <text
          x="248"
          y="73"
          fill={fill}
          fontFamily="var(--font-red-hat), sans-serif"
          fontSize="26"
          fontWeight="400"
          letterSpacing="1.2"
        >
          DE LA COSTA
        </text>
      </svg>

      {showCobranding && (
        <>
          <span
            className="h-8 w-px opacity-60"
            style={{ backgroundColor: fill }}
            aria-hidden="true"
          />
          <div className="flex flex-col justify-center leading-tight">
            <span
              className="text-base font-bold tracking-wider"
              style={{ color: fill }}
            >
              BECATRACK
            </span>
            <span
              className="text-[10px] font-medium tracking-widest uppercase opacity-90"
              style={{ color: fill }}
            >
              {cobrandingSubtitle}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
