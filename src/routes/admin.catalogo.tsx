import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Package, ExternalLink, Loader2, AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { FileUpload } from "@/components/admin/FileUpload";
import { GalleryEditor, type GalleryItem } from "@/components/admin/GalleryEditor";
import { FeaturesEditor } from "@/components/admin/FeaturesEditor";
import { FAQEditor, type FAQItem } from "@/components/admin/FAQEditor";
import { SpecsEditor, type SpecItem } from "@/components/admin/SpecsEditor";
import { SortableList } from "@/components/admin/site/_shared/SortableList";

export const Route = createFileRoute("/admin/catalogo")({ component: Catalog });

type Category = { id: string; name: string; slug: string; parent_id: string | null };
type Color = { name: string; hex: string; price_delta?: number };

type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  installation: string | null;
  category_id: string | null;
  cover_image: string | null;
  gallery: GalleryItem[];
  product_type: string;
  price: number;
  sale_price: number | null;
  price_per_sqm: number;
  stock: number;
  stock_min: number;
  processing_days: number;
  min_area: number;
  min_width_cm: number;
  max_width_cm: number;
  min_height_cm: number;
  max_height_cm: number;
  motor_manual_price: number;
  motor_rf_price: number;
  motor_wifi_price: number;
  bando_price: number;
  weight_kg: number;
  package_length_cm: number;
  package_width_cm: number;
  package_height_cm: number;
  tags: string[];
  video_url: string | null;
  manual_pdf_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  colors: Color[];
  features: string[];
  faq: FAQItem[];
  specs: SpecItem[];
  active: boolean;
  featured: boolean;
  bestseller: boolean;
  position: number;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const NEW_PRODUCT: Partial<Product> = {
  name: "",
  slug: "",
  sku: "",
  short_description: "",
  description: "",
  installation: "",
  category_id: null,
  cover_image: "",
  gallery: [],
  product_type: "simples",
  price: 0,
  sale_price: null,
  price_per_sqm: 0,
  stock: 0,
  stock_min: 0,
  processing_days: 0,
  min_area: 1,
  min_width_cm: 40,
  max_width_cm: 300,
  min_height_cm: 40,
  max_height_cm: 300,
  motor_manual_price: 0,
  motor_rf_price: 0,
  motor_wifi_price: 0,
  bando_price: 0,
  weight_kg: 2,
  package_length_cm: 60,
  package_width_cm: 15,
  package_height_cm: 15,
  tags: [],
  video_url: "",
  manual_pdf_url: "",
  seo_title: "",
  seo_description: "",
  active: true,
  featured: false,
  bestseller: false,
  features: [],
  faq: [],
  specs: [],
  colors: [
    { name: "Branco", hex: "#FFFFFF" },
    { name: "Bege", hex: "#D7C4A3" },
    { name: "Cinza", hex: "#7E8794" },
  ],
};

function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [editingExtraCats, setEditingExtraCats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name,slug,parent_id").order("position"),
    ]);
    setProducts((p ?? []) as unknown as Product[]);
    setCats((c as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter((p) => {
    const okSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const okCat = !filterCat || p.category_id === filterCat;
    return okSearch && okCat;
  });

  const catLabel = (id: string | null) => {
    if (!id) return "Sem categoria";
    const c = cats.find((x) => x.id === id);
    if (!c) return "—";
    if (c.parent_id) {
      const parent = cats.find((x) => x.id === c.parent_id);
      return `${parent?.name ?? ""} › ${c.name}`;
    }
    return c.name;
  };

  async function startEdit(p: Product) {
    setEditing(p);
    const { data } = await supabase.from("product_categories").select("category_id").eq("product_id", p.id);
    setEditingExtraCats((data ?? []).map((r) => r.category_id));
  }

  function startNew() {
    setEditing({ ...NEW_PRODUCT, category_id: cats[0]?.id ?? null });
    setEditingExtraCats([]);
  }

  async function save() {
    if (!editing?.name) return toast.error("Nome obrigatório");
    setSaving(true);
    const payload = { ...editing, slug: editing.slug || slugify(editing.name) };
    const { data, error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id).select("id").single()
      : await supabase.from("products").insert(payload as never).select("id").single();
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }
    const productId = data?.id ?? editing.id;

    // sync product_categories (extra/secondary)
    if (productId) {
      await supabase.from("product_categories").delete().eq("product_id", productId);
      if (editingExtraCats.length) {
        await supabase.from("product_categories").insert(editingExtraCats.map((cid) => ({ product_id: productId, category_id: cid })));
      }
    }
    setSaving(false);
    toast.success("Produto salvo!");
    setEditing(null);
    setEditingExtraCats([]);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído");
    load();
  }

  async function duplicate(p: Product) {
    const baseSlug = `${p.slug}-copia`;
    let slug = baseSlug;
    let n = 2;
    // ensure unique slug
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: ex } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
      if (!ex) break;
      slug = `${baseSlug}-${n++}`;
    }
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = p as Product & { created_at?: string; updated_at?: string };
    void _id; void _ca; void _ua;
    const payload = {
      ...rest,
      name: `${p.name} (cópia)`,
      slug,
      sku: p.sku ? `${p.sku}-COPY` : null,
      featured: false,
      bestseller: false,
      position: (p.position ?? 0) + 1,
    };
    const { data: created, error } = await supabase.from("products").insert(payload as never).select("id").single();
    if (error) return toast.error(error.message);
    // copy product_categories
    if (created?.id) {
      const { data: cats } = await supabase.from("product_categories").select("category_id").eq("product_id", p.id);
      if (cats && cats.length) {
        await supabase.from("product_categories").insert(cats.map((c) => ({ product_id: created.id, category_id: c.category_id })));
      }
    }
    toast.success("Produto duplicado");
    load();
  }

  async function reorder(next: Product[]) {
    setProducts(next);
    const updates = next.map((p, idx) => ({ id: p.id, position: idx + 1 }));
    // Update only items whose position actually changed
    const changed = updates.filter((u) => {
      const orig = products.find((x) => x.id === u.id);
      return !orig || orig.position !== u.position;
    });
    for (const u of changed) {
      await supabase.from("products").update({ position: u.position }).eq("id", u.id);
    }
    if (changed.length) toast.success("Ordem atualizada");
  }

  const lowStock = products.filter((p) => p.product_type === "simples" && p.stock <= p.stock_min && p.active).length;
  const canReorder = !search && !filterCat;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Produtos</div>
          <h1 className="font-display text-3xl mt-1">Produtos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastre, organize e venda. Editor completo com fotos, medidas, frete, SEO e mais.
          </p>
        </div>
        <Button onClick={startNew} size="lg" className="shadow-glow">
          <Plus className="h-4 w-4" /> Novo produto
        </Button>
      </div>

      {lowStock > 0 && (
        <Card className="p-3 border-amber-300 bg-amber-50 text-amber-900 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {lowStock} produto(s) com estoque abaixo do mínimo.
        </Card>
      )}

      <Card className="p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent_id ? "↳ " : ""}{c.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} de {products.length}</span>
      </Card>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Carregando...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground -mt-1">
            {canReorder
              ? "Arraste pelo ícone à esquerda para reordenar os produtos. A ordem é refletida no site."
              : "Limpe a busca e o filtro para reordenar os produtos arrastando."}
          </p>
          <SortableList
            items={filtered}
            getId={(p) => p.id}
            onReorder={(next) => canReorder && reorder(next)}
            renderItem={(p, _idx, handle) => {
              const lowS = p.product_type === "simples" && p.stock <= p.stock_min && p.active;
              const finalPrice = p.sale_price && p.sale_price > 0 ? p.sale_price : p.price;
              return (
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition">
                  {canReorder ? handle : <div className="w-8" aria-hidden />}
                  <div className="h-16 w-16 rounded-lg bg-sand overflow-hidden shrink-0">
                    {p.cover_image && <img src={p.cover_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      {p.featured && <Badge className="bg-primary/10 text-primary border-0">Destaque</Badge>}
                      {!p.active && <Badge variant="secondary">Inativo</Badge>}
                      {lowS && <Badge className="bg-amber-100 text-amber-900 border-0">Estoque baixo</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                      <span>{catLabel(p.category_id)}</span>
                      <span>·</span>
                      {p.product_type === "metro_quadrado" ? (
                        <span>R$ {Number(p.price_per_sqm).toFixed(2)} /m²</span>
                      ) : (
                        <span>
                          R$ {Number(finalPrice).toFixed(2)}
                          {p.sale_price && p.sale_price > 0 && p.sale_price < p.price && (
                            <span className="line-through ml-1 opacity-60">R$ {Number(p.price).toFixed(2)}</span>
                          )}
                        </span>
                      )}
                      {p.sku && <><span>·</span><span>SKU {p.sku}</span></>}
                      {p.product_type === "simples" && <><span>·</span><span>Estoque: {p.stock}</span></>}
                    </div>
                  </div>
                  <Link to="/produto/$slug" params={{ slug: p.slug }} className="text-muted-foreground hover:text-primary" title="Ver na loja">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Editar">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicate(p)} title="Duplicar produto">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)} title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Card>
              );
            }}
          />
        </>
      )}

      <ProductEditor
        open={!!editing}
        editing={editing}
        setEditing={setEditing}
        cats={cats}
        extraCats={editingExtraCats}
        setExtraCats={setEditingExtraCats}
        saving={saving}
        onSave={save}
        onClose={() => {
          setEditing(null);
          setEditingExtraCats([]);
        }}
      />
    </div>
  );
}

/* ───────────────────── Editor em abas ───────────────────── */

type EditorProps = {
  open: boolean;
  editing: Partial<Product> | null;
  setEditing: (p: Partial<Product> | null) => void;
  cats: Category[];
  extraCats: string[];
  setExtraCats: (ids: string[]) => void;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
};

function ProductEditor({ open, editing, setEditing, cats, extraCats, setExtraCats, saving, onSave, onClose }: EditorProps) {
  const grouped = useMemo(() => {
    const roots = cats.filter((c) => !c.parent_id);
    return roots.map((r) => ({ root: r, children: cats.filter((c) => c.parent_id === r.id) }));
  }, [cats]);

  if (!editing) return null;
  const e = editing;
  const set = (patch: Partial<Product>) => setEditing({ ...e, ...patch });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-display text-2xl">{e.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          <p className="text-xs text-muted-foreground">Preencha cada aba. Tudo é salvo de uma vez no botão "Salvar produto".</p>
        </DialogHeader>

        <Tabs defaultValue="produto" className="px-6 pt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40">
            <TabsTrigger value="produto">Produto</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="conteudo">Características & FAQ</TabsTrigger>
            <TabsTrigger value="ficha">Ficha técnica</TabsTrigger>
            <TabsTrigger value="precos">Preços & Estoque</TabsTrigger>
            <TabsTrigger value="medidas">Medidas (m²)</TabsTrigger>
            <TabsTrigger value="entrega">Entrega</TabsTrigger>
            <TabsTrigger value="cores">Cores</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="publicacao">Publicação</TabsTrigger>
          </TabsList>

          {/* ── PRODUTO ── */}
          <TabsContent value="produto" className="space-y-4 pt-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>* Nome do produto</Label>
                <Input
                  value={e.name ?? ""}
                  onChange={(ev) => set({ name: ev.target.value, slug: e.slug || slugify(ev.target.value) })}
                  placeholder="Ex: Persiana Rolô Blackout"
                />
              </div>
              <div>
                <Label>Link do produto (slug)</Label>
                <Input value={e.slug ?? ""} onChange={(ev) => set({ slug: ev.target.value })} placeholder="persiana-rolo-blackout" />
                <p className="text-[11px] text-muted-foreground mt-1">URL: /produto/<strong>{e.slug || "..."}</strong></p>
              </div>
            </div>

            <div>
              <Label>Descrição curta</Label>
              <Textarea value={e.short_description ?? ""} onChange={(ev) => set({ short_description: ev.target.value })} rows={2} placeholder="Resumo de 1–2 linhas que aparece no card e no topo do produto." />
            </div>

            <div>
              <Label>Detalhes do produto</Label>
              <Textarea value={e.description ?? ""} onChange={(ev) => set({ description: ev.target.value })} rows={6} placeholder="Descreva o produto: materiais, acabamento, benefícios..." />
            </div>

            <div>
              <Label>Instalação</Label>
              <Textarea value={e.installation ?? ""} onChange={(ev) => set({ installation: ev.target.value })} rows={5} placeholder="Passo a passo de instalação (opcional)." />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Tags (separe por vírgula)</Label>
                <Input
                  value={(e.tags ?? []).join(", ")}
                  onChange={(ev) => set({ tags: ev.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  placeholder="blackout, sala, escritório"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Auxiliam na busca e SEO.</p>
              </div>
              <div>
                <Label>URL do vídeo (YouTube/Vimeo)</Label>
                <Input value={e.video_url ?? ""} onChange={(ev) => set({ video_url: ev.target.value })} placeholder="https://youtu.be/..." />
              </div>
            </div>

            <FileUpload
              label="Manual do produto (PDF)"
              accept="application/pdf"
              folder="manuals"
              value={e.manual_pdf_url ?? null}
              onChange={(url) => set({ manual_pdf_url: url })}
            />

            <div className="grid sm:grid-cols-2 gap-4 rounded-lg border p-4 bg-sand/30">
              <div>
                <Label>* Categoria principal</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm mt-1"
                  value={e.category_id ?? ""}
                  onChange={(ev) => set({ category_id: ev.target.value || null })}
                >
                  <option value="">Sem categoria</option>
                  {grouped.map(({ root, children }) => (
                    <optgroup key={root.id} label={root.name}>
                      <option value={root.id}>{root.name}</option>
                      {children.map((ch) => (
                        <option key={ch.id} value={ch.id}>↳ {ch.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <Label>Categorias adicionais</Label>
                <div className="mt-1 max-h-40 overflow-y-auto rounded-md border bg-background p-2 text-sm space-y-0.5">
                  {grouped.map(({ root, children }) => (
                    <div key={root.id}>
                      <CatCheck id={root.id} label={root.name} bold checked={extraCats.includes(root.id)} onToggle={(v) => setExtraCats(v ? [...extraCats, root.id] : extraCats.filter((x) => x !== root.id))} />
                      {children.map((ch) => (
                        <CatCheck
                          key={ch.id}
                          id={ch.id}
                          label={`— ${ch.name}`}
                          checked={extraCats.includes(ch.id)}
                          onToggle={(v) => setExtraCats(v ? [...extraCats, ch.id] : extraCats.filter((x) => x !== ch.id))}
                        />
                      ))}
                    </div>
                  ))}
                  {grouped.length === 0 && <p className="text-xs text-muted-foreground">Crie categorias primeiro.</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── FOTOS ── */}
          <TabsContent value="fotos" className="space-y-6 pt-5">
            <div className="grid md:grid-cols-[260px_1fr] gap-6">
              <div className="space-y-3">
                <ImageUpload
                  label="Foto de capa"
                  folder="covers"
                  value={e.cover_image ?? null}
                  onChange={(url) => set({ cover_image: url ?? "" })}
                  recommendedSize="1200 × 1200 px"
                />
              </div>
              <div className="border-l md:pl-6">
                <GalleryEditor items={e.gallery ?? []} onChange={(items) => set({ gallery: items })} />
              </div>
            </div>
          </TabsContent>

          {/* ── CONTEÚDO (features + FAQ) ── */}
          <TabsContent value="conteudo" className="space-y-6 pt-5">
            <FeaturesEditor items={e.features ?? []} onChange={(features) => set({ features })} />
            <FAQEditor items={e.faq ?? []} onChange={(faq) => set({ faq })} />
          </TabsContent>

          {/* ── FICHA TÉCNICA ── */}
          <TabsContent value="ficha" className="space-y-4 pt-5">
            <SpecsEditor items={e.specs ?? []} onChange={(specs) => set({ specs })} />
          </TabsContent>

          {/* ── PREÇOS & ESTOQUE ── */}
          <TabsContent value="precos" className="space-y-4 pt-5">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Tipo do produto</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  value={e.product_type ?? "simples"}
                  onChange={(ev) => set({ product_type: ev.target.value })}
                >
                  <option value="simples">Simples (preço fixo)</option>
                  <option value="metro_quadrado">Metro Quadrado (calculado)</option>
                </select>
              </div>
              <div>
                <Label>SKU / Referência</Label>
                <Input value={e.sku ?? ""} onChange={(ev) => set({ sku: ev.target.value })} placeholder="REF-12345" />
              </div>
              <div>
                <Label>Tempo de processamento (dias)</Label>
                <NumericInput step="1" value={e.processing_days} onValueChange={(value) => set({ processing_days: value ?? 0 })} />
              </div>
            </div>

            {e.product_type === "metro_quadrado" ? (
              <div className="rounded-lg border p-4 bg-sand/30">
                <h4 className="font-semibold text-sm mb-3">Preço por m²</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Preço por m² (R$)</Label>
                    <NumericInput decimal value={e.price_per_sqm} onValueChange={(value) => set({ price_per_sqm: value ?? 0 })} />
                  </div>
                  <div>
                    <Label className="text-xs">Área mínima (m²)</Label>
                    <NumericInput decimal value={e.min_area} onValueChange={(value) => set({ min_area: value ?? 0 })} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Preço normal (R$)</Label>
                  <NumericInput decimal value={e.price} onValueChange={(value) => set({ price: value ?? 0 })} />
                </div>
                <div>
                  <Label>Preço de oferta (R$) <span className="text-muted-foreground text-xs">— opcional</span></Label>
                  <NumericInput decimal value={e.sale_price} onValueChange={(value) => set({ sale_price: value })} placeholder="0,00" />
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Estoque atual</Label>
                <NumericInput step="1" value={e.stock} onValueChange={(value) => set({ stock: value ?? 0 })} />
              </div>
              <div>
                <Label>Estoque mínimo (alerta)</Label>
                <NumericInput step="1" value={e.stock_min} onValueChange={(value) => set({ stock_min: value ?? 0 })} />
              </div>
            </div>
          </TabsContent>

          {/* ── MEDIDAS (m²) ── */}
          <TabsContent value="medidas" className="space-y-4 pt-5">
            <p className="text-xs text-muted-foreground">Limites usados quando o produto é do tipo <strong>Metro Quadrado</strong>.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label className="text-xs">Largura mín (cm)</Label><NumericInput decimal step="0.01" value={e.min_width_cm} onValueChange={(value) => set({ min_width_cm: value ?? 0 })} /></div>
              <div><Label className="text-xs">Largura máx (cm)</Label><NumericInput decimal step="0.01" value={e.max_width_cm} onValueChange={(value) => set({ max_width_cm: value ?? 0 })} /></div>
              <div><Label className="text-xs">Altura mín (cm)</Label><NumericInput decimal step="0.01" value={e.min_height_cm} onValueChange={(value) => set({ min_height_cm: value ?? 0 })} /></div>
              <div><Label className="text-xs">Altura máx (cm)</Label><NumericInput decimal step="0.01" value={e.max_height_cm} onValueChange={(value) => set({ max_height_cm: value ?? 0 })} /></div>
            </div>

            <div className="rounded-lg border p-4 bg-sand/30">
              <h4 className="font-semibold text-sm mb-3">Acionamento e acabamentos (R$ adicional)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><Label className="text-xs">Manual</Label><NumericInput decimal value={e.motor_manual_price} onValueChange={(value) => set({ motor_manual_price: value ?? 0 })} /></div>
                <div><Label className="text-xs">Motor RF</Label><NumericInput decimal value={e.motor_rf_price} onValueChange={(value) => set({ motor_rf_price: value ?? 0 })} /></div>
                <div><Label className="text-xs">Motor Wi-Fi</Label><NumericInput decimal value={e.motor_wifi_price} onValueChange={(value) => set({ motor_wifi_price: value ?? 0 })} /></div>
                <div><Label className="text-xs">Bandô</Label><NumericInput decimal value={e.bando_price} onValueChange={(value) => set({ bando_price: value ?? 0 })} /></div>
              </div>
            </div>
          </TabsContent>

          {/* ── ENTREGA ── */}
          <TabsContent value="entrega" className="space-y-4 pt-5">
            <p className="text-xs text-muted-foreground">Dimensões e peso do <strong>pacote fechado</strong> usados para cálculo de frete via Frenet (Jadlog).</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Label className="text-xs">Peso (kg)</Label><NumericInput decimal value={e.weight_kg} onValueChange={(value) => set({ weight_kg: value ?? 0 })} /></div>
              <div><Label className="text-xs">Comprimento (cm)</Label><NumericInput step="1" value={e.package_length_cm} onValueChange={(value) => set({ package_length_cm: value ?? 0 })} /></div>
              <div><Label className="text-xs">Largura (cm)</Label><NumericInput step="1" value={e.package_width_cm} onValueChange={(value) => set({ package_width_cm: value ?? 0 })} /></div>
              <div><Label className="text-xs">Altura (cm)</Label><NumericInput step="1" value={e.package_height_cm} onValueChange={(value) => set({ package_height_cm: value ?? 0 })} /></div>
            </div>
            <p className="text-[11px] text-muted-foreground">Dica: meça a caixa fechada. Peso em kg, dimensões em cm.</p>
          </TabsContent>

          {/* ── CORES ── */}
          <TabsContent value="cores" className="pt-5">
            <ColorsEditor
              colors={e.colors ?? []}
              gallery={e.gallery ?? []}
              onChange={(colors) => set({ colors })}
            />
          </TabsContent>

          {/* ── SEO ── */}
          <TabsContent value="seo" className="space-y-4 pt-5">
            <div>
              <Label>Título SEO <span className="text-muted-foreground text-xs">(até 60 caracteres)</span></Label>
              <Input
                value={e.seo_title ?? ""}
                maxLength={70}
                onChange={(ev) => set({ seo_title: ev.target.value })}
                placeholder={e.name ? `${e.name} | Ágil Persianas` : "Ex: Persiana Rolô Blackout | Ágil"}
              />
              <p className="text-[11px] text-muted-foreground mt-1">{(e.seo_title ?? "").length}/60</p>
            </div>
            <div>
              <Label>Descrição SEO <span className="text-muted-foreground text-xs">(até 160 caracteres)</span></Label>
              <Textarea
                value={e.seo_description ?? ""}
                maxLength={180}
                rows={3}
                onChange={(ev) => set({ seo_description: ev.target.value })}
                placeholder="Frase persuasiva de até 160 caracteres que aparece nos resultados do Google."
              />
              <p className="text-[11px] text-muted-foreground mt-1">{(e.seo_description ?? "").length}/160</p>
            </div>
          </TabsContent>

          {/* ── PUBLICAÇÃO ── */}
          <TabsContent value="publicacao" className="space-y-4 pt-5">
            <div className="rounded-lg border p-4 space-y-3 max-w-md">
              <label className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">Disponível para venda</div>
                  <div className="text-[11px] text-muted-foreground">Desativar oculta o produto do site.</div>
                </div>
                <Switch checked={!!e.active} onCheckedChange={(v) => set({ active: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">Destaque na home</div>
                  <div className="text-[11px] text-muted-foreground">Aparece em "Mais vendidos / Destaques".</div>
                </div>
                <Switch checked={!!e.featured} onCheckedChange={(v) => set({ featured: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">Marcar como mais vendido</div>
                  <div className="text-[11px] text-muted-foreground">Exibe o produto no atalho “Mais vendidos”.</div>
                </div>
                <Switch checked={!!e.bestseller} onCheckedChange={(v) => set({ bestseller: v })} />
              </label>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 pb-6 pt-4 border-t bg-muted/20">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar produto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CatCheck({ id, label, bold, checked, onToggle }: { id: string; label: string; bold?: boolean; checked: boolean; onToggle: (v: boolean) => void }) {
  return (
    <label className={`flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/60 cursor-pointer ${bold ? "font-semibold" : ""}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onToggle(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ColorsEditor({
  colors,
  gallery,
  onChange,
}: {
  colors: Color[];
  gallery: GalleryItem[];
  onChange: (c: Color[]) => void;
}) {
  const update = (i: number, patch: Partial<Color>) => {
    const next = [...colors];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(colors.filter((_, idx) => idx !== i));
  const add = () => onChange([...colors, { name: "Nova cor", hex: "#cccccc" }]);

  // Mapa case-insensitive de cores presentes na galeria
  const galleryColors = new Set(
    (gallery ?? [])
      .map((g) => (g.color ?? "").trim().toLowerCase())
      .filter(Boolean),
  );

  const missing = colors.filter(
    (c) => c.name && !galleryColors.has(c.name.trim().toLowerCase()),
  );

  return (
    <div className="rounded-lg border p-4 bg-sand/30 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">Cores disponíveis</h4>
          <p className="text-[11px] text-muted-foreground">
            Cada cor selecionável deve ter ao menos uma foto na <strong>Galeria</strong> com o
            campo <em>“Cor associada”</em> preenchido.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>

      {missing.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          ⚠ Sem foto associada na galeria:{" "}
          <strong>{missing.map((c) => c.name).join(", ")}</strong>. Vá na aba{" "}
          <strong>Fotos</strong> e preencha o campo <em>Cor associada</em> com o mesmo nome.
        </div>
      )}

      {colors.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma cor cadastrada.</p>
      ) : (
        <div className="grid gap-2">
          {colors.map((c, i) => {
            const ok = galleryColors.has((c.name ?? "").trim().toLowerCase());
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 ${
                  ok ? "" : "border-amber-300"
                }`}
                title={ok ? "Foto encontrada" : "Sem foto associada na galeria"}
              >
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => update(i, { hex: e.target.value })}
                  className="h-7 w-9 rounded border-0 cursor-pointer"
                />
                <Input
                  value={c.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  className="h-8 flex-1"
                  placeholder="Nome"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">+R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={c.price_delta ?? ""}
                    onChange={(e) => update(i, { price_delta: e.target.value === "" ? undefined : Number(e.target.value) })}
                    placeholder="0,00"
                    className="h-8 w-24"
                    title="Acréscimo (ou desconto, com sinal -) no preço quando esta cor é selecionada"
                  />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    ok ? "text-success" : "text-amber-700"
                  }`}
                >
                  {ok ? "✓ foto" : "sem foto"}
                </span>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        💡 Use o campo <strong>+R$</strong> para cobrar a mais (ou menos, com sinal negativo) quando o cliente escolher esta cor.
      </p>
    </div>
  );
}
