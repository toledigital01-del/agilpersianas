import { Ruler, Maximize2, Move, ArrowUp, Layers, Truck } from "lucide-react";

export type ProductSpec = { label: string; value: string };

const ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  largura: Ruler,
  largura_suporte: Ruler,
  largura_tecido: Ruler,
  profundidade: Move,
  altura: ArrowUp,
  altura_total: ArrowUp,
  area: Maximize2,
  area_minima: Maximize2,
  tempo: Truck,
  tempo_envio: Truck,
  envio: Truck,
};

function pickIcon(label: string) {
  const k = label.toLowerCase();
  for (const key of Object.keys(ICONS)) {
    if (k.includes(key)) return ICONS[key];
  }
  return Layers;
}

export function ProductSpecsBox({ items }: { items: ProductSpec[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-sand/40 p-5 shadow-card">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
      <div className="flex items-center gap-2 mb-4">
        <span className="h-1.5 w-8 rounded-full bg-gradient-to-r from-primary to-primary/40" />
        <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-primary">
          Ficha técnica
        </h3>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 relative">
        {items.map((it, i) => {
          const Icon = pickIcon(it.label);
          return (
            <div
              key={i}
              className="flex items-start gap-3 group"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary ring-1 ring-primary/15 transition-all group-hover:bg-primary/15 group-hover:scale-105">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  {it.label}
                </dt>
                <dd className="text-sm font-semibold text-foreground leading-snug mt-0.5">
                  {it.value}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
