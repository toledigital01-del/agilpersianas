import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { CartDrawer } from "@/components/site/CartDrawer";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import { formatBRL } from "@/lib/cart";

type Search = { categoria?: string; ambiente?: string; q?: string; bestseller?: string };

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    ambiente: typeof s.ambiente === "string" ? s.ambiente : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    bestseller: typeof s.bestseller === "string" ? s.bestseller : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — Persianas e Cortinas | Ágil Persianas" },
      {
        name: "description",
        content:
          "Catálogo completo de persianas, cortinas e toldos sob medida. Filtre por ambiente e tipo, com entrega para todo Brasil.",
      },
    ],
  }),
  component: CatalogoPage,
});

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
  category_id: string | null;
};

function CatalogoPage() {
  const search = useSearch({ from: "/catalogo" });
  const filterSlug = search.categoria || search.ambiente;
  const onlyBestsellers = search.bestseller === "1";

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalogo", filterSlug, search.q, onlyBestsellers],
    queryFn: async () => {
      // Resolve a categoria + descendentes (subcategorias) para filtrar amplamente
      let categoryIds: string[] = [];
      if (filterSlug) {
        const { data: allCats } = await supabase
          .from("categories")
          .select("id,slug,parent_id")
          .eq("active", true);
        const list = allCats ?? [];
        const root = list.find((c) => c.slug === filterSlug);
        if (root) {
          const ids = new Set<string>([root.id]);
          let added = true;
          while (added) {
            added = false;
            for (const c of list) {
              if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
                ids.add(c.id);
                added = true;
              }
            }
          }
          categoryIds = Array.from(ids);
        }
      }

      let q = supabase
        .from("products")
        .select(
          "id,name,slug,price,sale_price,price_per_sqm,product_type,rating,reviews_count,cover_image,badge,category_id,bestseller",
        )
        .eq("active", true);
      if (categoryIds.length > 0) q = q.in("category_id", categoryIds);
      if (search.q) q = q.ilike("name", `%${search.q}%`);
      if (onlyBestsellers) q = q.eq("bestseller", true);
      const { data, error } = await q
        .order("position", { ascending: true })
        .order("bestseller", { ascending: false })
        .order("featured", { ascending: false })
        .limit(120);
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: catName } = useQuery({
    queryKey: ["cat-name", filterSlug],
    enabled: !!filterSlug,
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", filterSlug as string)
        .maybeSingle();
      return data?.name ?? "";
    },
  });

  const title = onlyBestsellers ? "Mais vendidos" : catName ? `${catName}` : "Todos os produtos";

  // Categorias raiz para os chips de filtro
  const { data: rootCats = [] } = useQuery({
    queryKey: ["catalogo-root-cats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,name,slug,parent_id,position")
        .eq("active", true)
        .is("parent_id", null)
        .order("position", { ascending: true });
      return (data ?? []) as { id: string; name: string; slug: string }[];
    },
    staleTime: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container-premium py-10 md:py-14">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Catálogo
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-5xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">
            {products.length} {products.length === 1 ? "produto" : "produtos"} encontrados
          </p>
        </header>

        {/* Filtros — chips por categoria + atalho mais vendidos */}
        <div className="mb-8 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex min-w-max items-center gap-2">
            <Link
              to="/catalogo"
              className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold transition ${
                !filterSlug && !onlyBestsellers
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40 hover:text-primary"
              }`}
            >
              Todos
            </Link>
            <Link
              to="/catalogo"
              search={{ bestseller: "1" }}
              className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold transition ${
                onlyBestsellers
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40 hover:text-primary"
              }`}
            >
              Mais vendidos
            </Link>
            {rootCats.map((c) => {
              const active = filterSlug === c.slug;
              return (
                <Link
                  key={c.id}
                  to="/catalogo"
                  search={{ categoria: c.slug }}
                  className={`inline-flex h-9 items-center rounded-full border px-4 text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <p className="font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente outra categoria ou volte ao catálogo completo.
            </p>
            <Link
              to="/catalogo"
              className="inline-flex mt-4 items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Ver todos os produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10">
            {products.map((p) => (
              <CatalogCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <WhatsAppFAB />
      <CartDrawer />
    </div>
  );
}

function CatalogCard({ p }: { p: ProductRow }) {
  const isM2 = p.product_type === "metro_quadrado";
  const finalPrice =
    isM2
      ? p.price_per_sqm
      : p.sale_price && p.sale_price > 0
        ? p.sale_price
        : p.price;
  const showFrom = isM2 || (p.sale_price && p.sale_price > 0 && p.sale_price < p.price);
  const fullPrice = isM2 ? null : p.price;

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col"
    >
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
          <span className="text-[11px] text-muted-foreground mt-0.5">
            ou em até 6× sem juros
          </span>
        </div>
      </div>
    </Link>
  );
}
