import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export type SpecItem = { label: string; value: string };

const PRESETS: SpecItem[] = [
  { label: "Largura do Suporte", value: "" },
  { label: "Largura do Tecido", value: "" },
  { label: "Profundidade", value: "" },
  { label: "Altura Total", value: "" },
  { label: "Área Mínima Cobrada", value: "" },
  { label: "Tempo de envio", value: "" },
];

export function SpecsEditor({
  items,
  onChange,
}: {
  items: SpecItem[];
  onChange: (items: SpecItem[]) => void;
}) {
  function update(i: number, patch: Partial<SpecItem>) {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function add(preset?: SpecItem) {
    onChange([...(items ?? []), preset ?? { label: "", value: "" }]);
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="rounded-lg border p-4 bg-sand/30 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="font-semibold text-sm">Ficha técnica do produto</h4>
          <p className="text-[11px] text-muted-foreground">
            Aparece como aviso premium na página do produto. Ex.:{" "}
            <em>Largura do Suporte: 0.40m</em>.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => add(p)}
            >
              + {p.label}
            </Button>
          ))}
          <Button type="button" size="sm" onClick={() => add()}>
            <Plus className="h-3.5 w-3.5" /> Item
          </Button>
        </div>
      </div>

      {(!items || items.length === 0) ? (
        <p className="text-xs text-muted-foreground">
          Nenhum item. Use os botões acima para adicionar rapidamente.
        </p>
      ) : (
        <div className="grid gap-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border bg-card p-2">
              <Input
                value={it.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Rótulo (ex: Largura do Suporte)"
                className="h-9 flex-1"
              />
              <Input
                value={it.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="Valor (ex: 0.40m)"
                className="h-9 flex-1"
              />
              <div className="flex items-center">
                <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
