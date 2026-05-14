import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Loader2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  FolderTree,
  X,
  ChevronsDownUp,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categorias")({ component: Categories });

type Cat = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
  active: boolean;
  parent_id: string | null;
  show_in_menu: boolean;
  bestseller: boolean;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function Categories() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load(focusId?: string) {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("position");
    const list = (data as Cat[]) ?? [];
    setRows(list);
    setLoading(false);
    // expand all by default on first load so the hierarchy is visible
    setExpanded((prev) => {
      if (prev.size > 0) return prev;
      return new Set(list.filter((r) => list.some((x) => x.parent_id === r.id)).map((r) => r.id));
    });
    if (focusId) {
      // ensure ancestors are expanded
      setExpanded((prev) => {
        const next = new Set(prev);
        let cur = list.find((r) => r.id === focusId);
        while (cur?.parent_id) {
          next.add(cur.parent_id);
          cur = list.find((r) => r.id === cur!.parent_id);
        }
        return next;
      });
      setHighlightId(focusId);
      setTimeout(() => setHighlightId(null), 1800);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const tree = useMemo(() => {
    const roots = rows.filter((r) => !r.parent_id);
    const childrenOf = (id: string) => rows.filter((r) => r.parent_id === id);
    return { roots, childrenOf };
  }, [rows]);

  const stats = useMemo(() => {
    const roots = rows.filter((r) => !r.parent_id).length;
    const subs = rows.filter((r) => r.parent_id).length;
    const inactive = rows.filter((r) => !r.active).length;
    return { roots, subs, inactive, total: rows.length };
  }, [rows]);

  async function save() {
    if (!editing?.name) return toast.error("Nome obrigatório");
    setSaving(true);
    const payload: Partial<Cat> = {
      ...editing,
      slug: editing.slug || slugify(editing.name),
      parent_id: editing.parent_id || null,
    };
    if (payload.id && payload.parent_id === payload.id) {
      setSaving(false);
      return toast.error("Categoria não pode ser pai dela mesma");
    }
    if (editing.id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Categoria atualizada");
      setEditing(null);
      load(editing.id);
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert(payload as never)
        .select("id")
        .single();
      setSaving(false);
      if (error) return toast.error(error.message);
      toast.success("Categoria criada");
      const newId = (data as { id: string } | null)?.id;
      // auto-expand parent so the new child becomes visible immediately
      if (payload.parent_id) {
        setExpanded((prev) => new Set(prev).add(payload.parent_id as string));
      }
      setEditing(null);
      load(newId);
    }
  }

  async function remove(id: string) {
    const hasChildren = rows.some((r) => r.parent_id === id);
    if (hasChildren && !confirm("Esta categoria tem subcategorias. Excluir mesmo assim? (subcategorias ficarão sem pai)")) return;
    if (!hasChildren && !confirm("Excluir categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (editing?.id === id) setEditing(null);
    load();
  }

  async function move(id: string, dir: -1 | 1) {
    const cat = rows.find((r) => r.id === id);
    if (!cat) return;
    const siblings = rows.filter((r) => r.parent_id === cat.parent_id).sort((a, b) => a.position - b.position);
    const idx = siblings.findIndex((r) => r.id === id);
    const swap = siblings[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("categories").update({ position: swap.position }).eq("id", id),
      supabase.from("categories").update({ position: cat.position }).eq("id", swap.id),
    ]);
    load(id);
  }

  async function toggleActive(c: Cat) {
    await supabase.from("categories").update({ active: !c.active }).eq("id", c.id);
    load(c.id);
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(rows.filter((r) => rows.some((x) => x.parent_id === r.id)).map((r) => r.id)));
  }
  function collapseAll() {
    setExpanded(new Set());
  }

  function startNew(parent_id: string | null = null) {
    const siblings = rows.filter((r) => r.parent_id === parent_id);
    setEditing({ active: true, show_in_menu: true, bestseller: false, position: siblings.length, parent_id, name: "", slug: "", icon: "" });
  }

  // Filter logic — when searching, show matching nodes plus their ancestors
  const visibleIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const matches = rows.filter((r) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
    const keep = new Set<string>();
    for (const m of matches) {
      keep.add(m.id);
      let cur: Cat | undefined = m;
      while (cur?.parent_id) {
        keep.add(cur.parent_id);
        cur = rows.find((r) => r.id === cur!.parent_id);
      }
      // include children of matches
      const stack = [m.id];
      while (stack.length) {
        const id = stack.pop()!;
        for (const c of rows.filter((r) => r.parent_id === id)) {
          keep.add(c.id);
          stack.push(c.id);
        }
      }
    }
    return keep;
  }, [search, rows]);

  function renderRow(c: Cat, depth: number) {
    if (visibleIds && !visibleIds.has(c.id)) return null;
    const children = tree.childrenOf(c.id).sort((a, b) => a.position - b.position);
    const siblings = rows.filter((r) => r.parent_id === c.parent_id).sort((a, b) => a.position - b.position);
    const sIdx = siblings.findIndex((r) => r.id === c.id);
    const isOpen = expanded.has(c.id) || !!visibleIds;
    const isSelected = editing?.id === c.id;
    const isHighlighted = highlightId === c.id;

    return (
      <div key={c.id}>
        <div className="relative" style={{ paddingLeft: depth * 22 }}>
          {/* tree guide line */}
          {depth > 0 && (
            <span className="absolute left-0 top-0 bottom-0 border-l border-dashed border-border" style={{ left: depth * 22 - 12 }} />
          )}
          <Card
            className={`p-2.5 flex items-center gap-2 transition-all ${
              isSelected ? "ring-2 ring-primary border-primary/40" : "hover:shadow-sm"
            } ${isHighlighted ? "animate-pulse bg-primary/5" : ""} ${!c.active ? "opacity-60" : ""}`}
          >
            <button
              onClick={() => children.length && toggle(c.id)}
              className={`h-6 w-6 flex items-center justify-center rounded shrink-0 ${
                children.length ? "hover:bg-muted text-muted-foreground" : "opacity-30"
              }`}
              aria-label="Expandir"
            >
              {children.length ? (
                isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              )}
            </button>
            <div className="flex flex-col shrink-0">
              <button
                disabled={sIdx === 0}
                onClick={() => move(c.id, -1)}
                className="text-muted-foreground hover:text-primary disabled:opacity-30 leading-none"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                disabled={sIdx === siblings.length - 1}
                onClick={() => move(c.id, 1)}
                className="text-muted-foreground hover:text-primary disabled:opacity-30 leading-none"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>
            <div
              className={`h-8 w-8 rounded-md flex items-center justify-center text-sm shrink-0 ${
                depth === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              {c.icon || (depth === 0 ? "▦" : "↳")}
            </div>
            <button onClick={() => setEditing(c)} className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-sm flex items-center gap-2 truncate">
                {c.name}
                {!c.active && (
                  <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    inativa
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                /{c.slug}
                {children.length > 0 && <> · {children.length} sub</>}
              </div>
            </button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setExpanded((prev) => new Set(prev).add(c.id));
                startNew(c.id);
              }}
              title="Adicionar subcategoria"
            >
              <Plus className="h-3 w-3" /> Sub
            </Button>
            <button
              onClick={() => toggleActive(c)}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
              title={c.active ? "Desativar" : "Ativar"}
            >
              {c.active ? <Check className="h-3.5 w-3.5 text-primary" /> : <X className="h-3.5 w-3.5" />}
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(c)}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(c.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </Card>
        </div>
        {isOpen && children.map((ch) => renderRow(ch, depth + 1))}
      </div>
    );
  }

  // categorias disponíveis para "pai" (exclui a própria + descendentes)
  const parentOptions = useMemo(() => {
    if (!editing?.id) return rows;
    const blocked = new Set<string>([editing.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of rows) {
        if (r.parent_id && blocked.has(r.parent_id) && !blocked.has(r.id)) {
          blocked.add(r.id);
          changed = true;
        }
      }
    }
    return rows.filter((r) => !blocked.has(r.id));
  }, [rows, editing?.id]);

  // Build breadcrumb of selected/edited category
  const editingPath = useMemo(() => {
    if (!editing?.parent_id) return [];
    const path: Cat[] = [];
    let cur = rows.find((r) => r.id === editing.parent_id);
    while (cur) {
      path.unshift(cur);
      cur = cur.parent_id ? rows.find((r) => r.id === cur!.parent_id) : undefined;
    }
    return path;
  }, [editing?.parent_id, rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FolderTree className="h-3.5 w-3.5" /> Catálogo
          </div>
          <h1 className="font-display text-3xl mt-1">Categorias & Subcategorias</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Veja toda a hierarquia, edite e crie subcategorias sem perder o contexto.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
            <strong className="text-foreground">{stats.roots}</strong> raízes ·{" "}
            <strong className="text-foreground">{stats.subs}</strong> subs
            {stats.inactive > 0 && <> · <strong className="text-foreground">{stats.inactive}</strong> inativas</>}
          </div>
          <Button size="lg" onClick={() => startNew(null)}>
            <Plus className="h-4 w-4" /> Nova categoria
          </Button>
        </div>
      </div>

      {/* Two-column layout: tree + side editor */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* TREE */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={expandAll} className="gap-1">
              <ChevronsUpDown className="h-3.5 w-3.5" /> Expandir tudo
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1">
              <ChevronsDownUp className="h-3.5 w-3.5" /> Recolher tudo
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Carregando...
            </div>
          ) : tree.roots.length === 0 ? (
            <Card className="p-12 text-center">
              <Tag className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Nenhuma categoria ainda. Crie a primeira!</p>
              <Button onClick={() => startNew(null)}>
                <Plus className="h-4 w-4" /> Criar primeira categoria
              </Button>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {tree.roots.sort((a, b) => a.position - b.position).map((c) => renderRow(c, 0))}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            💡 Clique em qualquer categoria para editar no painel ao lado. Use{" "}
            <span className="font-mono text-foreground">+ Sub</span> para criar uma subcategoria dentro dela.
          </p>
        </div>

        {/* SIDE EDITOR */}
        <Card className="p-5 lg:sticky lg:top-4 space-y-4">
          {!editing ? (
            <div className="text-center py-8">
              <Edit className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Selecione uma categoria para editar</p>
              <Button variant="outline" size="sm" onClick={() => startNew(null)} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Nova categoria raiz
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {editing.id ? "Editando" : "Nova categoria"}
                  </div>
                  {editingPath.length > 0 && (
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                      {editingPath.map((p, i) => (
                        <span key={p.id} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight className="h-3 w-3" />}
                          <span className="text-foreground/70">{p.name}</span>
                        </span>
                      ))}
                      <ChevronRight className="h-3 w-3" />
                      <span className="font-medium text-foreground">{editing.name || "(sem nome)"}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input
                    autoFocus
                    value={editing.name ?? ""}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        name: e.target.value,
                        slug: editing.id ? editing.slug : slugify(e.target.value),
                      })
                    }
                    placeholder="Ex: Persianas Horizontais"
                  />
                </div>
                <div>
                  <Label className="text-xs">Slug (URL)</Label>
                  <Input
                    value={editing.slug ?? ""}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="persianas-horizontais"
                  />
                </div>
                <div>
                  <Label className="text-xs">Categoria pai</Label>
                  <select
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    value={editing.parent_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}
                  >
                    <option value="">— Nenhuma (categoria raiz) —</option>
                    {parentOptions.map((c) => {
                      // build label with hierarchy
                      const path: string[] = [c.name];
                      let cur = c;
                      while (cur.parent_id) {
                        const p = rows.find((r) => r.id === cur.parent_id);
                        if (!p) break;
                        path.unshift(p.name);
                        cur = p;
                      }
                      return (
                        <option key={c.id} value={c.id}>
                          {path.join(" › ")}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Ícone (emoji)</Label>
                  <Input
                    value={editing.icon ?? ""}
                    onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                    placeholder="▦  ou  🪟"
                  />
                </div>
                <div>
                  <Label className="text-xs">
                    Posição (ordem de exibição)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.position ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, position: Number(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Menor número aparece primeiro no menu e nas páginas da loja.
                    Você também pode usar as setas ↑↓ na lista ao lado.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm py-1">
                  <Switch
                    checked={!!editing.active}
                    onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                  />
                  Ativa (visível no site)
                </label>
                <label className="flex items-center gap-2 text-sm py-1">
                  <Switch
                    checked={editing.show_in_menu ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, show_in_menu: v })}
                  />
                  Mostrar na barra de categorias
                </label>
                <label className="flex items-center gap-2 text-sm py-1">
                  <Switch
                    checked={editing.bestseller ?? false}
                    onCheckedChange={(v) => setEditing({ ...editing, bestseller: v })}
                  />
                  Marcar como mais vendida
                </label>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="ghost" onClick={() => setEditing(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={save} disabled={saving} className="flex-1">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing.id ? "Salvar" : "Criar"}
                </Button>
              </div>

              {editing.id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => {
                    setExpanded((prev) => new Set(prev).add(editing.id as string));
                    startNew(editing.id as string);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar subcategoria dentro desta
                </Button>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
