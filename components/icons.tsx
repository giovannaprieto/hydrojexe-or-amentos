import type { SVGProps } from "react";

/**
 * Ícones em traço (stroke), 24x24, sem dependência externa.
 * Herdam a cor do texto (`currentColor`) e o tamanho via classe.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[1.15em] shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
    <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
    <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
  </Base>
);

export const IconOrcamento = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h4" />
  </Base>
);

export const IconBuilding = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 21V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15" />
    <path d="M14 10h5a1 1 0 0 1 1 1v10" />
    <path d="M3 21h18" />
    <path d="M7.5 9h3M7.5 13h3M7.5 17h3M17 14h.01M17 18h.01" />
  </Base>
);

export const IconServicos = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
    <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" />
  </Base>
);

export const IconPrecos = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2v20" />
    <path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1-5 3 2.2 2.7 5 3.2 5 1.3 5 3.3-2.2 3.2-5 3.2-5-1.2-5-3.2" />
  </Base>
);

export const IconFormas = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
    <path d="M6.5 15h3" />
  </Base>
);

export const IconTextos = (p: IconProps) => (
  <Base {...p}>
    <path d="M15.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
    <path d="M9 8h6M9 12h5" />
    <path d="m16.5 19.5 4.5-4.5-2-2-4.5 4.5-.6 2.6z" />
  </Base>
);

export const IconUsuarios = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.8 20a6.4 6.4 0 0 1 12.4 0" />
    <path d="M16.5 5.2a3.5 3.5 0 0 1 0 6.6M18 20a6.5 6.5 0 0 0-1.6-4.3" />
  </Base>
);

export const IconPlus = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconPdf = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3v11" />
    <path d="m8 10.5 4 4 4-4" />
    <path d="M4 17.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
  </Base>
);

export const IconTrash = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 6.5h16" />
    <path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
    <path d="M6.5 6.5 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9l.9-12.5" />
    <path d="M10.5 10.5v6M13.5 10.5v6" />
  </Base>
);

export const IconRefresh = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 11a8 8 0 0 0-13.7-5.3L3 9" />
    <path d="M3 4.5V9h4.5" />
    <path d="M4 13a8 8 0 0 0 13.7 5.3L21 15" />
    <path d="M21 19.5V15h-4.5" />
  </Base>
);

export const IconObra = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3a6 6 0 0 0-6 6v2h12V9a6 6 0 0 0-6-6z" />
    <path d="M4 11h16v3H4z" />
    <path d="M12 3v4M8.5 4.2 10 7M15.5 4.2 14 7" />
    <path d="M6 14v6M18 14v6M6 20h12" />
  </Base>
);

export const IconCalculadora = (p: IconProps) => (
  <Base {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 7h8" />
    <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4" />
  </Base>
);

export const IconRelatorio = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5" />
    <path d="M8 13v4M12 11v6M16 15v2" />
  </Base>
);

export const IconSun = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Base>
);

export const IconMoon = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Base>
);

export const IconLogout = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 4h3.5A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14" />
    <path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H16" />
  </Base>
);

export const IconMenu = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const IconClose = (p: IconProps) => (
  <Base {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Base>
);

export const IconArrowLeft = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);

export const IconCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
);

export const IconTrendUp = (p: IconProps) => (
  <Base {...p}>
    <path d="m3 16.5 6-6 4 4 8-8" />
    <path d="M15 6.5h6v6" />
  </Base>
);

export const IconClock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const IconSend = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 3 10.5 13.5" />
    <path d="M21 3 14.5 21l-4-7.5L3 9.5z" />
  </Base>
);

export const IconWallet = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17a2 2 0 0 1 2 2v1" />
    <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
    <path d="M16.5 13.5h2" />
  </Base>
);

/** Gota d'água — símbolo da marca (usado no cabeçalho da sidebar). */
export const IconGota = (p: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="size-[1.15em] shrink-0"
    {...p}
  >
    <path
      d="M12 2.5c3.4 4.2 6.5 7.9 6.5 11.4A6.5 6.5 0 0 1 12 20.5a6.5 6.5 0 0 1-6.5-6.6C5.5 10.4 8.6 6.7 12 2.5Z"
      fill="currentColor"
    />
  </svg>
);
