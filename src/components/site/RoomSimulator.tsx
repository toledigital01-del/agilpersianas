import { useRef, useState } from "react";
import { Camera, Upload, Sparkles, Loader2, Download, RotateCcw, Check, ShoppingBag, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import pinpointBege from "@/assets/products/rolo-pinpoint-bege.jpg";
import pinpointBranca from "@/assets/products/rolo-pinpoint-branca.jpg";
import pinpointCinza from "@/assets/products/rolo-pinpoint-cinza.jpg";
import pinpointPreta from "@/assets/products/rolo-pinpoint-preta.jpg";
import textBranca from "@/assets/products/rolo-texturizado-branca.jpg";
import textBege from "@/assets/products/rolo-texturizado-bege-rustico.jpg";
import textCinza from "@/assets/products/rolo-texturizado-cinza.jpg";
import liso from "@/assets/products/rolo-tecido-liso-branca.jpg";

type Product = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  thumbs: { color: string; img: string; hex: string }[];
  href: string;
  cover: string;
  category: string;
};

const PRODUCTS: Product[] = [
  {
    id: "blackout-pinpoint",
    name: "Persiana Rolô Blackout Pinpoint",
    description: "Bloqueio total da luz, textura sutil pinpoint. Ideal para quartos.",
    prompt: "persiana rolô blackout texturizada pinpoint, tecido opaco que bloqueia 100% da luz, rolada no topo da janela",
    href: "/rolo-blackout-pinpoint",
    cover: pinpointCinza,
    category: "rolo",
    thumbs: [
      { color: "Branca", img: pinpointBranca, hex: "#F5F1EA" },
      { color: "Bege", img: pinpointBege, hex: "#C9B89A" },
      { color: "Cinza", img: pinpointCinza, hex: "#8A8A8A" },
      { color: "Preta", img: pinpointPreta, hex: "#222" },
    ],
  },
  {
    id: "blackout-texturizado",
    name: "Persiana Rolô Blackout Texturizado",
    description: "Textura linho premium com bloqueio total. Acabamento sofisticado.",
    prompt: "persiana rolô blackout texturizada estilo linho, tecido opaco com textura visível, rolo no topo da janela",
    href: "/rolo-blackout-texturizado",
    cover: textBege,
    category: "rolo",
    thumbs: [
      { color: "Branca", img: textBranca, hex: "#F5F1EA" },
      { color: "Bege rústico", img: textBege, hex: "#B8A07A" },
      { color: "Cinza", img: textCinza, hex: "#7C7C7C" },
    ],
  },
  {
    id: "rolo-tela-solar",
    name: "Persiana Rolô Tela Solar",
    description: "Filtra a luz e mantém a vista. Perfeito para sala e home office.",
    prompt: "persiana rolô tela solar screen, tecido translúcido cinza fino que filtra luz mas mantém visão da janela",
    href: "/persiana-solar-screen",
    cover: liso,
    category: "rolo",
    thumbs: [
      { color: "Branca", img: liso, hex: "#EFEFEF" },
      { color: "Cinza", img: textCinza, hex: "#7C7C7C" },
    ],
  },
];

const CATEGORIES: { id: string; label: string; hint: string }[] = [
  { id: "rolo", label: "Persiana Rolô", hint: "Ambientes internos · sob medida" },
];

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
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState<string>(PRODUCTS[0].id);
  const [colorIdx, setColorIdx] = useState(0);
  const [categoryId, setCategoryId] = useState<string>(CATEGORIES[0].id);
  const [compare, setCompare] = useState(50);

  const product = PRODUCTS.find((p) => p.id === productId)!;
  const color = product.thumbs[Math.min(colorIdx, product.thumbs.length - 1)];
  const category = CATEGORIES.find((c) => c.id === categoryId) ?? CATEGORIES[0];
  const productsInCategory = PRODUCTS.filter((p) => p.category === categoryId);

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
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-room", {
        body: {
          imageDataUrl: original,
          product: product.prompt,
          color: color.color,
          ambient: category.label,
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
    a.download = `agil-simulacao-${product.id}.png`;
    a.click();
  }

  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de simular a ${product.name} (cor ${color.color}) no meu ambiente pelo site da Ágil Persianas e gostaria de um orçamento.`,
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
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{category.hint}</p>
            </div>

            {/* Passo 2 — Tecido / Acabamento */}
            <div className="mt-6">
              <StepHeader n={2} title="Tecido / Acabamento" />
              <div className="mt-3 grid grid-cols-3 gap-2.5">
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
                        <div className="line-clamp-1 text-[11px] font-semibold leading-tight">{p.name.replace("Persiana Rolô ", "")}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground line-clamp-2">{product.description}</p>
            </div>

            {/* Passo 3 — Cor */}
            <div className="mt-6">
              <StepHeader n={3} title="Cor do tecido" />
              <div className="mt-3 flex flex-wrap gap-2.5">
                {product.thumbs.map((t, i) => {
                  const active = colorIdx === i;
                  return (
                    <button
                      key={t.color}
                      type="button"
                      onClick={() => setColorIdx(i)}
                      title={t.color}
                      className={`group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition ${
                        active ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
                      }`}
                    >
                      <span
                        className="h-9 w-9 rounded-full border border-black/10 shadow-md"
                        style={{ backgroundColor: t.hex }}
                      />
                      <span className="text-[10px] font-medium">{t.color}</span>
                    </button>
                  );
                })}
              </div>
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

            {result && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link
                  to={product.href}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-background transition hover:opacity-90"
                >
                  <ShoppingBag className="h-3.5 w-3.5" /> Ver e comprar
                </Link>
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