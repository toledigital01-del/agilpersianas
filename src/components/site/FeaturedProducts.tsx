import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star, Flame, ShoppingCart, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatBRL } from "@/lib/cart";
import { useSiteSetting } from "@/hooks/use-site-setting";
import { FEATURED_DEFAULTS, type FeaturedConfig } from "@/components/admin/site/FeaturedModule";

type Product = {
  id: string;
  name: string;
  slug: string;
  badge: string | null;
  price: number;
  sale_price: number | null;
  price_per_sqm: number;
  product_type: string;
  rating: number;
  reviews_count: number;
  cover_image: string | null;
  bestseller: boolean;
};

export function FeaturedProducts() {
  const { value: cfg } = useSiteSetting<FeaturedConfig>("featured", FEATURED_DEFAULTS);
  const limit = cfg.limit ?? 8;
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featured-products", limit],
    queryFn: async () => {
      const { data: marked, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, badge, price, sale_price, price_per_sqm, product_type, rating, reviews_count, cover_image, bestseller",
        )
        .eq("active", true)
        .eq("featured", true)
        .order("position", { ascending: true })
        .order("bestseller", { ascending: false })
        .limit(limit);
      if (error) throw error;
      const markedList = (marked ?? []) as Product[];
      if (markedList.length >= limit) return markedList;

      // Complementa com produtos ativos mais bem avaliados (sem duplicar)
      const { data: top, error: e2 } = await supabase
        .from("products")
        .select(
          "id, name, slug, badge, price, sale_price, price_per_sqm, product_type, rating, reviews_count, cover_image, bestseller",
        )
        .eq("active", true)
        .order("position", { ascending: true })
        .order("rating", { ascending: false })
        .order("reviews_count", { ascending: false })
        .limit(limit + markedList.length);
      if (e2) throw e2;
      const ids = new Set(markedList.map((p) => p.id));
      const filler = ((top ?? []) as Product[]).filter((p) => !ids.has(p.id));
      return [...markedList, ...filler].slice(0, limit);
    },
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (!cfg.enabled) return null;
  // Só esconde quando realmente não há nenhum produto em destaque cadastrado.
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section id="catalogo" className="bg-background py-12 md:py-16">
      <div className="container-premium">
        <div className="mb-12 flex flex-col items-center text-center md:mb-16" data-reveal>
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ backgroundColor: "rgba(184,84,28,0.10)", color: "#B8541C" }}
          >
            <Flame className="h-3.5 w-3.5" /> {cfg.eyebrow}
          </span>
          <h2 className="mt-5 text-display text-4xl md:text-6xl">
            {cfg.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            {cfg.subtitle}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-md bg-secondary"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
            {products.map((p, i) => (
              <div key={p.id} data-reveal style={{ transitionDelay: `${(i % 4) * 80}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center" data-reveal>
          <a
            href={cfg.ctaUrl}
            className="group inline-flex h-13 items-center justify-center gap-2.5 rounded-full bg-foreground px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-background transition-all duration-300 ease-premium hover:bg-primary hover:-translate-y-0.5 hover:shadow-glow"
          >
            {cfg.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const isM2 = product.product_type === "metro_quadrado";
  const finalPrice = isM2
    ? product.price_per_sqm
    : product.sale_price && product.sale_price > 0
      ? product.sale_price
      : product.price;
  const fullPrice =
    !isM2 && product.sale_price && product.sale_price > 0 && product.sale_price < product.price
      ? product.price
      : null;
  const pixPrice = finalPrice * 0.95;
  const installment = finalPrice / 6;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isM2) {
      // Para sob medida, leva para a página do produto para configurar
      window.location.assign(`/produto/${product.slug}`);
      return;
    }
    addItem({
      id: product.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      image: product.cover_image,
      unitPrice: finalPrice,
      fullPrice: fullPrice ?? undefined,
    });
  }

  return (
    <Link to="/produto/$slug" params={{ slug: product.slug }} className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-secondary ring-1 ring-border transition-all duration-500 ease-premium group-hover:ring-primary/30 group-hover:shadow-card">
        {product.cover_image && (
          <img
            src={product.cover_image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-premium group-hover:scale-[1.06]"
          />
        )}
        {/* Overlay gradiente sutil ao hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {product.badge && (
          <span
            className="absolute left-3 top-3 inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
            style={{ backgroundColor: "#E2763A" }}
          >
            {product.badge}
          </span>
        )}
        {product.bestseller && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background shadow-md">
            <Flame className="h-3 w-3" /> Top
          </span>
        )}
        {/* Quick add */}
        <button
          onClick={quickAdd}
          className="absolute bottom-3 right-3 inline-flex translate-y-2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg opacity-0 transition-all duration-300 ease-premium group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {isM2 ? "Configurar" : "Adicionar"}
        </button>
      </div>

      <div className="mt-5 flex flex-col text-left">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
          {product.name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="font-medium text-foreground/80">{product.rating.toFixed(1)}</span>
          <span>({product.reviews_count})</span>
        </div>

        <div className="mt-2.5 flex flex-col">
          {fullPrice && (
            <span className="text-[11px] text-muted-foreground line-through">
              de {formatBRL(fullPrice)}
            </span>
          )}
          <span className="text-display text-xl text-foreground">
            {isM2 ? `a partir de ${formatBRL(finalPrice)}/m²` : formatBRL(finalPrice)}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: "#B8541C" }}>
            ou {formatBRL(pixPrice)} no PIX (-5%)
          </span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">
            em até 6× de {formatBRL(installment)} sem juros
          </span>
        </div>
      </div>
    </Link>
  );
}
