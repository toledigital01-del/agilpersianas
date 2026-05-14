/**
 * Premium SVG icons for the BuyBox option groups.
 * Hand-drawn, monochromatic line-art on currentColor — works on light/dark
 * backgrounds. Sized 1em by default; pass className for custom sizing.
 */
import type { SVGProps } from "react";

const base = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/* ---------- Lado da cordinha ---------- */
export const CordLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="12" y="14" width="40" height="8" rx="1.5" />
    <path d="M14 22h36M14 28h36M14 34h36M14 40h36" opacity=".55" />
    <path d="M16 22v22" />
    <circle cx="16" cy="46" r="2.4" fill="currentColor" stroke="none" />
  </svg>
);
export const CordRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="12" y="14" width="40" height="8" rx="1.5" />
    <path d="M14 22h36M14 28h36M14 34h36M14 40h36" opacity=".55" />
    <path d="M48 22v22" />
    <circle cx="48" cy="46" r="2.4" fill="currentColor" stroke="none" />
  </svg>
);

/* ---------- Acabamentos ---------- */
export const NoBando = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="12" y="14" width="40" height="6" rx="1.5" />
    <path d="M14 22h36M14 28h36M14 34h36M14 40h36M14 46h36" opacity=".55" />
  </svg>
);
export const WithBando = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="10" y="12" width="44" height="10" rx="1.5" fill="currentColor" stroke="none" opacity=".85" />
    <path d="M14 24h36M14 30h36M14 36h36M14 42h36M14 48h36" opacity=".55" />
  </svg>
);

/* ---------- Acionamento ---------- */
export const HandManual = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="14" y="12" width="36" height="6" rx="1.5" />
    <path d="M16 18h32M16 24h32M16 30h32" opacity=".55" />
    <path d="M40 18v18" />
    <circle cx="40" cy="38" r="2.2" fill="currentColor" stroke="none" />
    <path d="M44 30c4 1 6 4 6 8s-3 7-7 7-7-3-7-7" />
  </svg>
);
export const MotorRf = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="12" y="12" width="40" height="8" rx="1.5" />
    <path d="M14 20h36M14 26h36M14 32h36" opacity=".55" />
    <rect x="36" y="40" width="14" height="18" rx="2" />
    <circle cx="43" cy="46" r="2" />
    <path d="M40 52h6M40 55h6" />
  </svg>
);
export const MotorWifi = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="12" y="18" width="40" height="8" rx="1.5" />
    <path d="M14 26h36M14 32h36M14 38h36" opacity=".55" />
    <path d="M22 14c6-5 14-5 20 0" />
    <path d="M26 10c4-3 8-3 12 0" />
    <circle cx="32" cy="8" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

/* ---------- Tipo de instalação ---------- */
export const MountInside = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="8" y="8" width="48" height="48" rx="2" />
    <rect x="16" y="16" width="32" height="6" rx="1" fill="currentColor" stroke="none" opacity=".85" />
    <path d="M18 24h28M18 30h28M18 36h28M18 42h28" opacity=".55" />
  </svg>
);
export const MountOutside = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="14" y="14" width="36" height="36" rx="1.5" opacity=".55" />
    <rect x="8" y="8" width="48" height="6" rx="1" fill="currentColor" stroke="none" opacity=".85" />
    <path d="M10 16h44M10 22h44M10 28h44M10 34h44M10 40h44M10 46h44" opacity=".4" />
  </svg>
);

/* ---------- Como medir (banner) ---------- */
export const RulerWindow = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}>
    <rect x="14" y="10" width="36" height="44" rx="2" />
    <path d="M32 10v44M14 32h36" opacity=".55" />
    <path d="M6 10v44M3 14h6M3 22h6M3 30h6M3 38h6M3 46h6" />
  </svg>
);
