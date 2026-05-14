/**
 * Paletas de cores reais dos tecidos da Ágil Persianas.
 * Mapeamento por modelo/tecido — usado no Simulador de Ambiente
 * para garantir que o cliente veja exatamente as cores disponíveis
 * para cada produto (em vez de cores genéricas).
 */

export type FabricColor = {
  name: string;
  hex: string;
  /** Caminho público para a foto da amostra real (quando houver). */
  swatch?: string;
};

/** Texturizado / Translúcida (rolô, romana, painel) — exceto Tecido Liso. */
export const TEXTURIZADO: FabricColor[] = [
  { name: "Branco", hex: "#F4F0E7", swatch: "/fabrics/tex-strip-1.jpeg" },
  { name: "Off-white", hex: "#E6DFD0", swatch: "/fabrics/tex-strip-1.jpeg" },
  { name: "Bege Claro", hex: "#D9C7A9", swatch: "/fabrics/tex-strip-1.jpeg" },
  { name: "Bege Areia", hex: "#C2A77F", swatch: "/fabrics/tex-strip-2.jpeg" },
  { name: "Cinza", hex: "#A8A6A2", swatch: "/fabrics/tex-strip-2.jpeg" },
];

/** Cortina Rolô Blackout — Tecido Liso (Pinpoint). */
export const PINPOINT: FabricColor[] = [
  { name: "Branco", hex: "#F2F2EE", swatch: "/fabrics/pin-branco.jpeg" },
  { name: "Bege", hex: "#E5DDCC", swatch: "/fabrics/pin-bege.jpeg" },
  { name: "Cinza", hex: "#BFC0BE", swatch: "/fabrics/pin-cinza.jpeg" },
  { name: "Marrom", hex: "#A39A8C", swatch: "/fabrics/pin-marrom.jpeg" },
  { name: "Preto", hex: "#33373B", swatch: "/fabrics/pin-preto.jpeg" },
];

/** Tela Solar — todos os modelos (rolô, romana, painel). */
export const TELA_SOLAR: FabricColor[] = [
  { name: "Branco", hex: "#EDEDE7", swatch: "/fabrics/pin-branco.jpeg" },
  { name: "Bege", hex: "#D6C9A9", swatch: "/fabrics/pin-bege.jpeg" },
  { name: "Cinza", hex: "#9B9C99", swatch: "/fabrics/pin-cinza.jpeg" },
  { name: "Bronze", hex: "#7A6852", swatch: "/fabrics/pin-marrom.jpeg" },
  { name: "Grafite", hex: "#3A3D40", swatch: "/fabrics/pin-preto.jpeg" },
];

/** União de todas as opções — usada para Vedação Total. */
export const VEDACAO_TOTAL: FabricColor[] = (() => {
  const seen = new Set<string>();
  const out: FabricColor[] = [];
  for (const c of [...TEXTURIZADO, ...PINPOINT, ...TELA_SOLAR]) {
    const key = c.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
})();

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Decide qual paleta usar a partir do nome (e descrição) do produto.
 * Se nada bater, retorna `null` para o caller usar o fallback do banco.
 */
export function paletteFor(productName: string, extra?: string): FabricColor[] | null {
  const t = norm(`${productName} ${extra ?? ""}`);

  // Vedação Total é o mais permissivo — mostra tudo.
  if (t.includes("vedacao") || t.includes("vedação")) return VEDACAO_TOTAL;

  // Tela Solar / Solar Screen (todos os modelos).
  if (t.includes("tela solar") || t.includes("solar")) return TELA_SOLAR;

  // Tecido Liso / Pinpoint (apenas no Rolô Blackout Tecido Liso).
  if (t.includes("tecido liso") || t.includes("pinpoint") || t.includes("liso"))
    return PINPOINT;

  // Texturizado e Translúcida nos modelos rolô / romana / painel.
  if (t.includes("texturizado") || t.includes("translucid")) return TEXTURIZADO;

  return null;
}