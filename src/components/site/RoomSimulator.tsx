import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload, Sparkles, Loader2, Download, RotateCcw, Check, ShoppingBag, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { paletteFor, type FabricColor } from "@/lib/fabric-palettes";

type ColorOpt = { color: string; hex: string; img: string; swatch?: string };
type Product = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  thumbs: ColorOpt[];
  href: string;
  cover: string;
  category: string;
};
type CategoryOpt = { id: string; label: string; hint: string };

const FALLBACK_HEX: Record<string, string> = {
  branca: "#F5F1EA", branco: "#F5F1EA",
  bege: "#C9B89A", "bege rústico": "#B8A07A", "bege rustico": "#B8A07A",
  cinza: "#8A8A8A", preta: "#222222", preto: "#222222",
  marrom: "#6B4A2B", azul: "#3B5BA9", verde: "#4F7A4A",
};
function guessHex(name: string): string {
  const k = name.trim().toLowerCase();
  return FALLBACK_HEX[k] ?? "#B8B8B8";
}

/** Paleta neutra padrão usada quando o produto não tem cores curadas nem cadastradas. */
const DEFAULT_NEUTRAL_PALETTE: { name: string; hex: string }[] = [
  { name: "Branco", hex: "#F2F2EE" },
  { name: "Bege", hex: "#D9C7A9" },
  { name: "Cinza", hex: "#9B9C99" },
  { name: "Marrom", hex: "#7A6852" },
  { name: "Preto", hex: "#33373B" },
];

/** Ambientes de demonstração — para clientes que querem testar sem enviar foto própria. */
const DEMO_ROOMS: { label: string; url: string }[] = [
  { label: "Sala", url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1280&q=80" },
  { label: "Quarto", url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1280&q=80" },
  { label: "Escritório", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80" },
];

function toTitle(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function downscaleImage(dataUrl: string, maxSide = 1280): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return rej(new Error("canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      res(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = rej;
    img.src = dataUrl;
  });
}

export function RoomSimulator() {
  return <RoomSimulatorInner />;
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-primary-foreground shadow-md">
        {n}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/80">{title}</span>
    </div>
  );
}

function RoomSimulatorInner() {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [compare, setCompare] = useState(50);

  const [catalog, setCatalog] = useState<{ categories: CategoryOpt[]; products: Product[] }>({
    categories: [],
    products: [],
  });
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [productId, setProductId] = useState<string>("");
  const [colorIdx, setColorIdx] = useState(0);
  const [categoryId, setCategoryId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: cats }, { data: prods }, { data: links }] = await Promise.all([
          supabase.from("categories").select("id, name, slug, parent_id, position, active").eq("active", true),
          supabase
            .from("products")
            .select("id, name, slug, short_description, description, cover_image, colors, category_id, active")
            .eq("active", true)
            .order("name", { ascending: true }),
          supabase.from("product_categories").select("product_id, category_id"),
        ]);
        if (cancelled) return;

        const catById = new Map<string, { id: string; name: string; slug: string; parent_id: string | null; position: number }>();
        (cats ?? []).forEach((c: any) => catById.set(c.id, c));
        const rootOf = (id: string | null | undefined): { id: string; name: string; slug: string; position: number } | null => {
          let cur = id ? catById.get(id) : null;
          while (cur && cur.parent_id) cur = catById.get(cur.parent_id) ?? null;
          return cur ? { id: cur.id, name: cur.name, slug: cur.slug, position: cur.position } : null;
        };

        // map product -> set of root categories
        const productRoots = new Map<string, Set<string>>();
        const addRoot = (pid: string, catId: string | null | undefined) => {
          const r = rootOf(catId ?? null);
          if (!r) return;
          if (!productRoots.has(pid)) productRoots.set(pid, new Set());
          productRoots.get(pid)!.add(r.id);
        };
        (prods ?? []).forEach((p: any) => addRoot(p.id, p.category_id));
        (links ?? []).forEach((l: any) => addRoot(l.product_id, l.category_id));

        const rootMap = new Map<string, CategoryOpt & { position: number }>();
        const products: Product[] = [];

        for (const p of prods ?? []) {
          const roots = Array.from(productRoots.get(p.id) ?? []);
          if (roots.length === 0) continue;
          const cover = p.cover_image as string | null;
          if (!cover) continue;
          const colorsRaw: any[] = Array.isArray(p.colors) ? p.colors : [];
          // 1) Paleta curada por modelo (texturizado, pinpoint, tela solar, vedação)
          const curated = paletteFor(p.name as string, (p.short_description as string) ?? "");
          let thumbs: ColorOpt[] = curated
            ? curated.map((c: FabricColor) => ({
                color: c.name,
                hex: c.hex,
                img: cover,
                swatch: c.swatch,
              }))
            : colorsRaw
            .filter((c) => c && (c.name || c.color))
            .map((c: any) => ({
              color: String(c.name ?? c.color),
              hex: typeof c.hex === "string" && c.hex ? c.hex : guessHex(String(c.name ?? c.color)),
              img: typeof c.img === "string" && c.img ? c.img : cover,
            }));
          if (thumbs.length === 0) {
            // derive a single neutral color from the product name
            const guessName = (p.name as string).split(" ").pop() ?? "Padrão";
            thumbs.push({ color: guessName, hex: guessHex(guessName), img: cover });
          }
          // Use the first root category as primary grouping
          const primaryRoot = catById.get(roots[0])!;
          const rootInfo = rootOf(primaryRoot.id)!;
          if (!rootMap.has(rootInfo.id)) {
            rootMap.set(rootInfo.id, {
              id: rootInfo.id,
              label: toTitle(rootInfo.name),
              hint: "Sob medida · instalação realista por IA",
              position: rootInfo.position,
            });
          }
          products.push({
            id: p.id,
            name: p.name,
            description: p.short_description || (p.description ? String(p.description).slice(0, 140) : ""),
            prompt: `${p.name}, instalada no topo da janela, tecido com caimento natural`,
            href: `/produto/${p.slug}`,
            cover,
            category: rootInfo.id,
            thumbs,
          });
        }

        const categories = Array.from(rootMap.values())
          .sort((a, b) => a.position - b.position)
          .map(({ position: _p, ...rest }) => rest);

        setCatalog({ categories, products });
        setCategoryId(categories[0]?.id ?? "");
        const firstProd = products.find((p) => p.category === (categories[0]?.id ?? ""));
        setProductId(firstProd?.id ?? "");
        setColorIdx(0);
      } catch (e) {
        console.error("simulator catalog load", e);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const productsInCategory = useMemo(
    () => catalog.products.filter((p) => p.category === categoryId),
    [catalog.products, categoryId],
  );
  const product = useMemo(
    () => catalog.products.find((p) => p.id === productId) ?? productsInCategory[0],
    [catalog.products, productId, productsInCategory],
  );
  const color = product?.thumbs[Math.min(colorIdx, (product?.thumbs.length ?? 1) - 1)];
  const category = catalog.categories.find((c) => c.id === categoryId);

  // Auto-regenera quando o cliente troca a cor após já existir uma simulação.
  // Mantém apenas a última requisição válida.
  const lastReqRef = useRef(0);
  useEffect(() => {
    if (!result || !original || !product || !color) return;
    const reqId = ++lastReqRef.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("simulate-room", {
          body: {
            imageDataUrl: original,
            product: product.prompt,
            color: color.color,
            ambient: category?.label,
          },
        });
        if (reqId !== lastReqRef.current) return;
        if (error) throw error;
        const errMsg = (data as { error?: string })?.error;
        if (errMsg) {
          toast.error(errMsg);
          return;
        }
        const url = (data as { imageUrl?: string })?.imageUrl;
        if (url) {
          setResult(url);
          setCompare(50);
        }
      } catch (e) {
        if (reqId !== lastReqRef.current) return;
        console.error(e);
      } finally {
        if (reqId === lastReqRef.current) setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorIdx, productId]);

  async function handleFile(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Envie uma foto (JPG ou PNG).");
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 12MB).");
      return;
    }
    try {
      const raw = await fileToDataUrl(f);
      const small = await downscaleImage(raw, 1280);
      setOriginal(small);
      setResult(null);
    } catch {
      toast.error("Não consegui ler essa imagem.");
    }
  }

  async function generate() {
    if (!original) {
      toast.error("Envie a foto da sua janela primeiro.");
      return;
    }
    if (!product || !color) {
      toast.error("Escolha o produto e a cor.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-room", {
        body: {
          imageDataUrl: original,
          product: product.prompt,
          color: color.color,
          ambient: category?.label,
        },
      });
      if (error) throw error;
      const errMsg = (data as { error?: string })?.error;
      if (errMsg) {
        toast.error(errMsg);
        return;
      }
      const url = (data as { imageUrl?: string })?.imageUrl;
      if (!url) {
        toast.error("A IA não retornou imagem. Tente outra foto.");
        return;
      }
      setResult(url);
      setCompare(50);
      toast.success("Simulação pronta!");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Erro ao gerar simulação");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setOriginal(null);
    setResult(null);
  }

  function downloadResult() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `agil-simulacao-${product?.id ?? "persiana"}.png`;
    a.click();
  }

  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de simular a ${product?.name ?? "persiana"} (cor ${color?.color ?? ""}) no meu ambiente pelo site da Ágil Persianas e gostaria de um orçamento.`,
  );

  return (
    <section
      id="simulador-ambiente"
      className="relative overflow-hidden border-y border-border bg-gradient-to-b from-background via-muted/30 to-background py-16 sm:py-20"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Simulador IA · Exclusivo
          </div>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl md:text-5xl leading-tight">
            Veja a persiana <em className="not-italic text-primary">na sua janela</em> antes de comprar.
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            Envie uma foto do ambiente, escolha o modelo e a cor. A IA instala a persiana na imagem da sua janela em segundos —
            fotorrealista, sem compromisso.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* COLUNA ESQUERDA — preview / before-after */}
          <div className="rounded-3xl border bg-card p-3 shadow-elegant sm:p-4">
            {!original && (
              <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-muted/40 p-6 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="font-display text-xl">Envie a foto do ambiente</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tire uma foto da janela bem iluminada, de frente, com a janela visível por completo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition hover:-translate-y-0.5"
                  >
                    <Camera className="h-4 w-4" /> Usar câmera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition hover:border-primary"
                  >
                    <Upload className="h-4 w-4" /> Enviar foto
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">JPG ou PNG · até 12MB · sua imagem não é armazenada</p>
              </div>
            )}

            {original && !result && (
              <div className="relative overflow-hidden rounded-2xl">
                <img src={original} alt="Foto enviada do ambiente" className="block w-full" />
                {loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="font-display text-lg">Instalando a persiana na sua janela…</div>
                    <div className="text-xs text-muted-foreground">Isso leva entre 15 e 40 segundos</div>
                  </div>
                )}
              </div>
            )}

            {original && result && (
              <div
                className="relative select-none overflow-hidden rounded-2xl"
                onPointerDown={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.setPointerCapture(e.pointerId);
                  const move = (ev: PointerEvent) => {
                    const r = el.getBoundingClientRect();
                    const x = Math.min(Math.max(ev.clientX - r.left, 0), r.width);
                    setCompare((x / r.width) * 100);
                  };
                  const up = () => {
                    el.removeEventListener("pointermove", move);
                    el.removeEventListener("pointerup", up);
                  };
                  el.addEventListener("pointermove", move);
                  el.addEventListener("pointerup", up);
                }}
              >
                <img src={original} alt="Antes" className="block w-full" draggable={false} />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${compare}%` }}
                >
                  <img
                    src={result}
                    alt="Depois com persiana"
                    className="block h-full w-auto max-w-none"
                    style={{ width: `${100 / (compare / 100)}%` }}
                    draggable={false}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                  style={{ left: `${compare}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
                    <span className="text-xs font-bold text-primary">↔</span>
                  </div>
                </div>
                <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Antes
                </div>
                <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  Depois
                </div>
              </div>
            )}

            {original && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Outra foto
                </button>
                {result && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadResult}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-primary"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar imagem
                    </button>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* COLUNA DIREITA — controles */}
          <div className="rounded-3xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-elegant ring-1 ring-primary/5">
            {/* Passo 1 — Categoria */}
            <div>
              <StepHeader n={1} title="Escolha o produto" />
              <div className="relative mt-3">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm font-medium shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                {catalog.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{category?.hint ?? (catalogLoading ? "Carregando catálogo…" : "Nenhum produto disponível")}</p>
            </div>

            {/* Passo 2 — Tecido / Acabamento */}
            <div className="mt-6">
              <StepHeader n={2} title="Tecido / Acabamento" />
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {catalogLoading && productsInCategory.length === 0 &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />
                  ))}
                {!catalogLoading && productsInCategory.length === 0 && (
                  <p className="col-span-3 text-xs text-muted-foreground">Nenhum produto cadastrado nesta categoria.</p>
                )}
                {productsInCategory.map((p) => {
                  const active = productId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProductId(p.id);
                        setColorIdx(0);
                      }}
                      className={`group relative overflow-hidden rounded-xl border-2 bg-background text-left transition ${
                        active ? "border-primary shadow-glow" : "border-transparent hover:border-primary/40"
                      }`}
                    >
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <img
                          src={p.cover}
                          alt={p.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        {active && (
                          <div className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                      <div className="px-2 py-2">
                        <div className="line-clamp-2 text-[11px] font-semibold leading-tight">{p.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {product?.description && (
                <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{product.description}</p>
              )}
            </div>

            {/* Passo 3 — Cor */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <StepHeader n={3} title="Cor do tecido" />
                {color && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Selecionado:{" "}
                    <span className="font-bold text-foreground">{color.color}</span>
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:gap-2.5">
                {product?.thumbs.map((t, i) => {
                  const active = colorIdx === i;
                  return (
                    <button
                      key={t.color}
                      type="button"
                      onClick={() => setColorIdx(i)}
                      title={t.color}
                      className={`group relative flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition ${
                        active ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/70"
                      }`}
                    >
                      <span
                        className="relative block h-12 w-12 overflow-hidden rounded-full border border-black/10 shadow-md ring-1 ring-white/40 sm:h-14 sm:w-14"
                        style={{ backgroundColor: t.hex }}
                      >
                        {t.swatch && (
                          <img
                            src={t.swatch}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        {active && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Check className="h-5 w-5 text-white drop-shadow" />
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-1 text-[10px] font-semibold leading-tight text-foreground/80">
                        {t.color}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Toque em uma cor — a persiana é repintada na sua janela em segundos.
              </p>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={loading || !original}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gerando…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {result ? "Gerar nova simulação" : "Simular na minha janela"}
                </>
              )}
            </button>

            {result && product && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <a
                  href={product.href}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-background transition hover:opacity-90"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Ver e comprar
                </a>
                <a
                  href={`https://wa.me/5532991668800?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition hover:border-primary"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> Falar no WhatsApp
                </a>
              </div>
            )}

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              A simulação é uma representação artística gerada por IA. Pequenas variações de tom, textura e caimento podem
              ocorrer no produto final. Sua foto é usada apenas para gerar a prévia e não é armazenada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}