import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Star, Loader2, Search as SearchIcon, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { CartDrawer } from "@/components/site/CartDrawer";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/cart";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  price_per_sqm: number;
  product_type: string;
  rating: number;
  reviews_count: number;
  cover_image: string | null;
  badge: string | null;
};

export type SubcategorySearch = {
  sort?: "destaque" | "menor-preco" | "maior-preco" | "novidades";
  q?: string;
  page?: number;
  tag?: string;
};

type Props = {
  categorySlug: string;
  routeId: "/rolo-blackout-pinpoint" | "/rolo-blackout-texturizado";
  eyebrow: string;
  title: string;
  subtitle: string;
  parentSlug?: string;
  parentLabel?: string;
  /** Marcadores opcionais (filtros rápidos por palavra-chave no nome). */
  tags?: { value: string; label: string }[];
};

const PAGE_SIZE = 24;
const SORT_OPTIONS = [
  { v: "destaque", l: "Destaque" },
  { v: "menor-preco", l: "Menor preço" },
  { v: "maior-preco", l: "Maior preço" },
  { v: "novidades", l: "Novidades" },
] as const;

const ORDER_MAP: Record<string, { col: string; asc: boolean }> = {
  destaque: { col: "featured", asc: false },
  "menor-preco": { col: "price", asc: true },
  "maior-preco": { col: "price", asc: false },
  novidades: { col: "created_at", asc: false },
};

export function SubcategoryPage({
  categorySlug,
  routeId,
  eyebrow,
  title,
  subtitle,
  parentSlug,
  parentLabel,
  tags = [],
}: Props) {
  const search = useSearch({ from: routeId }) as SubcategorySearch;
  const navigate = useNavigate({ from: routeId });
  const sort = search.sort ?? "destaque";
  const q = search.q ?? "";
  const tag = search.tag ?? "";
  const initialPage = Math.max(1, search.page ?? 1);

  const [qInput, setQInput] = useState(q);
  useEffect(() => setQInput(q), [q]);

  const updateSearch = (patch: Partial<SubcategorySearch>) => {
    navigate({
      search: (prev: SubcategorySearch) => {
        const next: SubcategorySearch = { ...(prev as SubcategorySearch), ...patch };
        // Reset paginação ao trocar filtro
        if ("sort" in patch || "q" in patch || "tag" in patch) next.page = 1;
        // Limpa chaves vazias para URLs limpas
        (Object.keys(next) as (keyof SubcategorySearch)[]).forEach((k) => {
          const v = next[k];
          if (v === "" || v === undefined || (k === "page" && v === 1)) delete next[k];
        });
        return next;
      },
      replace: true,
    });
  };

  const queryKey = ["subcat", categorySlug, sort, q, tag] as const;

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey,
    initialPageParam: initialPage - 1,
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (!cat) return { rows: [] as ProductRow[], total: 0, page };

      const o = ORDER_MAP[sort] ?? ORDER_MAP.destaque;

      let query = supabase
        .from("products")
        .select(
          "id,name,slug,price,sale_price,price_per_sqm,product_type,rating,reviews_count,cover_image,badge",
          { count: "exact" },
        )
        .eq("active", true)
        .eq("category_id", cat.id);
      if (q) query = query.ilike("name", `%${q}%`);
      if (tag) query = query.ilike("name", `%${tag}%`);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: rows, count } = await query
        .order("position", { ascending: true })
        .order(o.col, { ascending: o.asc })
        .order("id", { ascending: true })
        .range(from, to);

      return { rows: (rows ?? []) as ProductRow[], total: count ?? 0, page };
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.rows.length, 0);
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const products = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);
  const total = data?.pages[0]?.total ?? 0;
  const lastLoadedPage = (data?.pages[data.pages.length - 1]?.page ?? initialPage - 1) + 1;

  // Sincroniza ?page= na URL conforme avança o scroll infinito
  useEffect(() => {
    if (!data) return;
    if (lastLoadedPage !== (search.page ?? 1)) {
      navigate({
        search: (prev: SubcategorySearch) => {
          const next = { ...(prev as SubcategorySearch) };
          if (lastLoadedPage <= 1) delete next.page;
          else next.page = lastLoadedPage;
          return next;
        },
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLoadedPage]);

  // IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container-premium py-10 md:py-14">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Início</Link>
          <span className="mx-2">/</span>
          <Link to="/catalogo" className="hover:text-primary">Catálogo</Link>
          {parentSlug && parentLabel && (
            <>
              <span className="mx-2">/</span>
              <Link to="/catalogo" search={{ categoria: parentSlug }} className="hover:text-primary">
                {parentLabel}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl md:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{subtitle}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {isLoading
              ? "Carregando produtos..."
              : `${total} ${total === 1 ? "produto encontrado" : "produtos encontrados"}`}
            {(q || tag) && (
              <button
                type="button"
                onClick={() => updateSearch({ q: "", tag: "" })}
                className="ml-3 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] hover:border-primary/40 hover:text-primary"
              >
                Limpar filtros <X className="h-3 w-3" />
              </button>
            )}
          </p>
        </header>

        {/* Filtros */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 overflow-x-auto">
              {SORT_OPTIONS.map((s) => {
                const active = sort === s.v;
                return (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => updateSearch({ sort: s.v })}
                    className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {s.l}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSearch({ q: qInput.trim() });
              }}
              className="ml-auto relative flex-1 min-w-[220px] max-w-xs"
            >
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Buscar nesta categoria..."
                className="h-9 w-full rounded-full border bg-card pl-8 pr-3 text-xs outline-none focus:border-primary/40"
              />
            </form>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateSearch({ tag: "" })}
                className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-medium transition ${
                  !tag
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40 hover:text-primary"
                }`}
              >
                Todos
              </button>
              {tags.map((t) => {
                const active = tag === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => updateSearch({ tag: t.value })}
                    className={`inline-flex h-8 items-center rounded-full border px-3 text-[11px] font-medium transition ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isLoading ? (
          <SkeletonGrid count={8} />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <p className="font-medium">Nenhum produto disponível para esta busca.</p>
            {(q || tag) ? (
              <button
                type="button"
                onClick={() => updateSearch({ q: "", tag: "" })}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Limpar filtros
              </button>
            ) : (
              <Link
                to="/catalogo"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Ver catálogo completo
              </Link>
            )}
          </div>
        ) : (
          <>
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 transition-opacity ${
                isFetching && !isFetchingNextPage ? "opacity-60" : "opacity-100"
              }`}
            >
              {products.map((p) => (
                <Card key={p.id} p={p} />
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)}
            </div>

            <div ref={sentinelRef} aria-hidden className="h-1 w-full" />

            <div className="mt-10 flex flex-col items-center gap-3">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando mais produtos...
                </div>
              )}
              {hasNextPage && !isFetchingNextPage && (
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
                >
                  Carregar mais
                </button>
              )}
              {!hasNextPage && products.length >= PAGE_SIZE && (
                <p className="text-xs text-muted-foreground">Você viu todos os {total} produtos.</p>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </div>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[3/4] rounded-md bg-muted animate-pulse" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
        <div className="h-5 w-1/2 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function Card({ p }: { p: ProductRow }) {
  const isM2 = p.product_type === "metro_quadrado";
  const finalPrice = isM2
    ? p.price_per_sqm
    : p.sale_price && p.sale_price > 0
      ? p.sale_price
      : p.price;
  const showFrom = isM2 || (p.sale_price && p.sale_price > 0 && p.sale_price < p.price);
  const fullPrice = isM2 ? null : p.price;
  return (
    <Link to="/produto/$slug" params={{ slug: p.slug }} className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-secondary">
        {p.cover_image && (
          <img
            src={p.cover_image}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}
        {p.badge && (
          <span className="absolute left-3 top-3 inline-flex items-center justify-center rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold text-white">
            {p.badge}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col text-left">
        <h3 className="line-clamp-2 text-[13px] font-medium text-foreground transition group-hover:text-primary">
          {p.name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="font-medium text-foreground/80">{p.rating.toFixed(1)}</span>
          <span>({p.reviews_count})</span>
        </div>
        <div className="mt-2 flex flex-col">
          {showFrom && fullPrice && fullPrice > finalPrice && (
            <span className="text-[11px] text-muted-foreground line-through">
              de {formatBRL(fullPrice)}
            </span>
          )}
          <span className="font-display text-xl font-bold text-foreground">
            {isM2 ? `a partir de ${formatBRL(finalPrice)}/m²` : formatBRL(finalPrice)}
          </span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">ou em até 6× sem juros</span>
        </div>
      </div>
    </Link>
  );
}
