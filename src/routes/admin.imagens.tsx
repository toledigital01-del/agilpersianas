import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Play, Pause, RefreshCw, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/imagens")({
  component: ImageOptimizerPage,
});

type Item = {
  kind: "product_cover" | "product_image";
  productId: string;
  productSlug: string;
  productName: string;
  imageId?: string;
  url: string;
};

type Status = "pending" | "running" | "done" | "skipped" | "error";

type Row = Item & {
  status: Status;
  message?: string;
  beforeKb?: number;
  afterKb?: number;
  newUrl?: string;
};

const BUCKET = "product-media";
const MAX_SIDE = 1600;
const QUALITY = 0.85;

async function loadCatalog(): Promise<Item[]> {
  const items: Item[] = [];
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, cover_image")
    .order("name");
  for (const p of products ?? []) {
    if (p.cover_image) {
      items.push({
        kind: "product_cover",
        productId: p.id,
        productSlug: p.slug,
        productName: p.name,
        url: p.cover_image,
      });
    }
  }
  const { data: imgs } = await supabase
    .from("product_images")
    .select("id, url, product_id, products(slug, name)")
    .order("position");
  for (const im of (imgs ?? []) as any[]) {
    items.push({
      kind: "product_image",
      productId: im.product_id,
      productSlug: im.products?.slug ?? "",
      productName: im.products?.name ?? "",
      imageId: im.id,
      url: im.url,
    });
  }
  return items;
}

function isAlreadyOptimized(url: string) {
  return /\.webp(\?|$)/i.test(url) && url.includes("/optimized/");
}

async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: "cors", cache: "no-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

async function encodeWebp(blob: Blob): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(blob);
  let { width, height } = bitmap;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const out: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob falhou"))),
      "image/webp",
      QUALITY,
    ),
  );
  return { blob: out, width, height };
}

async function processOne(item: Item): Promise<{ newUrl: string; beforeKb: number; afterKb: number } | { skipped: true }> {
  if (isAlreadyOptimized(item.url)) return { skipped: true };
  const original = await fetchAsBlob(item.url);
  const beforeKb = Math.round(original.size / 1024);
  const { blob } = await encodeWebp(original);
  const afterKb = Math.round(blob.size / 1024);
  const path = `optimized/${item.productSlug || item.productId}/${item.kind === "product_cover" ? "cover" : `gal-${item.imageId}`}-${Date.now()}.webp`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const newUrl = data.publicUrl;
  if (item.kind === "product_cover") {
    const { error } = await supabase.from("products").update({ cover_image: newUrl }).eq("id", item.productId);
    if (error) throw error;
  } else if (item.imageId) {
    const { error } = await supabase
      .from("product_images")
      .update({ url: newUrl, size_kb: afterKb })
      .eq("id", item.imageId);
    if (error) throw error;
  }
  return { newUrl, beforeKb, afterKb };
}

function ImageOptimizerPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const pauseRef = useRef(false);

  async function refresh() {
    setLoading(true);
    try {
      const items = await loadCatalog();
      setRows(items.map((it) => ({ ...it, status: isAlreadyOptimized(it.url) ? "skipped" : "pending" })));
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao carregar catálogo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.status === "done").length;
    const skipped = rows.filter((r) => r.status === "skipped").length;
    const errors = rows.filter((r) => r.status === "error").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const beforeKb = rows.reduce((s, r) => s + (r.beforeKb ?? 0), 0);
    const afterKb = rows.reduce((s, r) => s + (r.afterKb ?? 0), 0);
    const processed = done + skipped + errors;
    return { total, done, skipped, errors, pending, processed, beforeKb, afterKb };
  }, [rows]);

  const progress = stats.total === 0 ? 0 : Math.round((stats.processed / stats.total) * 100);

  async function start() {
    if (running) return;
    setRunning(true);
    pauseRef.current = false;
    for (let i = 0; i < rows.length; i++) {
      if (pauseRef.current) break;
      const row = rows[i];
      if (row.status === "done" || row.status === "skipped") continue;
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)));
      try {
        const res = await processOne(row);
        setRows((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? "skipped" in res
                ? { ...r, status: "skipped", message: "já otimizada" }
                : { ...r, status: "done", beforeKb: res.beforeKb, afterKb: res.afterKb, newUrl: res.newUrl }
              : r,
          ),
        );
      } catch (e: any) {
        setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "error", message: e.message ?? "erro" } : r)));
      }
    }
    setRunning(false);
    toast.success("Processamento concluído");
  }

  function pause() {
    pauseRef.current = true;
    setRunning(false);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl flex items-center gap-2">
            <ImageIcon className="h-6 w-6" /> Otimizador de imagens
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Converte capas e galerias para WebP, redimensiona até {MAX_SIDE}px e re-hospeda no storage. Atualiza os registros automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={running || loading}>
            <RefreshCw className="h-4 w-4" /> Recarregar
          </Button>
          {running ? (
            <Button size="sm" variant="secondary" onClick={pause}>
              <Pause className="h-4 w-4" /> Pausar
            </Button>
          ) : (
            <Button size="sm" onClick={start} disabled={loading || stats.pending === 0}>
              <Play className="h-4 w-4" /> Iniciar ({stats.pending})
            </Button>
          )}
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Progresso
          </CardTitle>
          <CardDescription>
            {stats.processed} de {stats.total} processadas · {stats.errors} erros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress} />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <Stat label="Total" value={stats.total} />
            <Stat label="Otimizadas" value={stats.done} tone="success" />
            <Stat label="Já WebP" value={stats.skipped} />
            <Stat label="Erros" value={stats.errors} tone={stats.errors ? "error" : undefined} />
            <Stat
              label="Economia"
              value={
                stats.beforeKb > 0
                  ? `${Math.max(0, Math.round((1 - stats.afterKb / stats.beforeKb) * 100))}%`
                  : "—"
              }
              tone="success"
            />
          </div>
          {stats.beforeKb > 0 && (
            <div className="text-xs text-muted-foreground">
              {(stats.beforeKb / 1024).toFixed(1)} MB → {(stats.afterKb / 1024).toFixed(1)} MB
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Itens ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : rows.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma imagem encontrada.</div>
          ) : (
            <div className="divide-y border rounded-lg overflow-hidden">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 text-xs">
                  <img src={r.newUrl ?? r.url} alt="" className="h-10 w-10 rounded object-cover bg-muted shrink-0" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.productName}</div>
                    <div className="text-muted-foreground truncate">
                      {r.kind === "product_cover" ? "capa" : "galeria"} · {r.url.split("/").pop()}
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-28">
                    {r.status === "done" && r.beforeKb != null && (
                      <div className="text-success">
                        {r.beforeKb}→{r.afterKb} KB
                      </div>
                    )}
                    {r.status === "error" && <div className="text-destructive truncate" title={r.message}>{r.message}</div>}
                    {r.status === "skipped" && <div className="text-muted-foreground">já otimizada</div>}
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "success" | "error" }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`text-base font-semibold ${tone === "success" ? "text-emerald-600" : tone === "error" ? "text-destructive" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "done")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
      </span>
    );
  if (status === "running")
    return <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse" />;
  if (status === "skipped") return <span className="inline-block h-3 w-3 rounded-full bg-muted-foreground/40" />;
  return <span className="inline-block h-3 w-3 rounded-full border border-muted-foreground/40" />;
}