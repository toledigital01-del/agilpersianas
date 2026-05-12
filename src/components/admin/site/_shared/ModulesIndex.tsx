import { useState } from "react";

export type ModuleEntry = {
  id: string;
  num: number;
  label: string;
  available: boolean;
};

export const ALL_MODULES: ModuleEntry[] = [
  { id: "mod-hero", num: 1, label: "Hero", available: true },
  { id: "mod-banners", num: 2, label: "Carrossel", available: true },
  { id: "mod-promo", num: 3, label: "Faixa de benefícios", available: true },
  { id: "mod-bestsellers", num: 4, label: "Mais vendidos", available: true },
  { id: "mod-featured", num: 6, label: "Produtos em destaque", available: true },
  { id: "mod-beforeafter", num: 7, label: "Antes/Depois", available: true },
  { id: "mod-mosquito", num: 8, label: "Mosquiteira", available: true },
  { id: "mod-automation", num: 9, label: "Automação", available: true },
  { id: "mod-testimonials", num: 10, label: "Depoimentos", available: true },
  { id: "mod-coupon", num: 11, label: "Cupom", available: false },
  { id: "mod-lumi", num: 12, label: "Lumi · IA", available: false },
  { id: "mod-socialproof", num: 13, label: "Social proof", available: false },
  { id: "mod-contact", num: 14, label: "Contato", available: true },
  { id: "mod-footer", num: 15, label: "Footer", available: true },
  { id: "mod-seo", num: 16, label: "SEO", available: true },
];

export function ModulesIndex() {
  const [active, setActive] = useState<string | null>(null);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        Índice rápido
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {ALL_MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => m.available && jumpTo(m.id)}
            disabled={!m.available}
            title={m.available ? `Ir para ${m.label}` : "Disponível em breve"}
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
              !m.available
                ? "cursor-not-allowed border-dashed border-muted-foreground/20 text-muted-foreground/40"
                : active === m.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary hover:text-primary"
            }`}
          >
            <span className="mr-1 opacity-60">{m.num}</span>
            {m.label}
            {!m.available && <span className="ml-1.5 opacity-60">·em breve</span>}
          </button>
        ))}
      </div>
    </div>
  );
}