import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { LumiWidget, openLumiWith } from "@/components/site/LumiWidget";
import { CartDrawer } from "@/components/site/CartDrawer";
import { Newsletter } from "@/components/site/Newsletter";
import { supabase } from "@/integrations/supabase/client";
import { Sun, Sparkles, ArrowRight, Star, Check, Umbrella, Home } from "lucide-react";
import { formatBRL } from "@/lib/cart";
import banner from "@/assets/cat-toldo.jpg";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Toldos sob Medida",
  description:
    "Toldos articulados, retráteis e fixos sob medida — sofisticação e conforto térmico para áreas externas.",
  brand: { "@type": "Brand", name: "Ágil Persianas" },
  image: "https://agil2.lovable.app/og/toldos.jpg",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "BRL",
    lowPrice: "590",
    highPrice: "5900",
    availability: "https://schema.org/InStock",
  },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "318" },
};

export const Route = createFileRoute("/toldos")({
  head: () => ({
    meta: [
      { title: "Toldos sob Medida — Ágil Persianas" },
      {
        name: "description",
        content:
          "Toldos articulados, retráteis e fixos sob medida. Conforto térmico, proteção solar e sofisticação para áreas externas em todo o Brasil.",
      },
      { property: "og:title", content: "Toldos sob Medida — Ágil Persianas" },
      {
        property: "og:description",
        content: "Viva ao ar livre com sofisticação. Toldos premium sob medida.",
      },
      { property: "og:image", content: "https://agil2.lovable.app/og/toldos.jpg" },
      { name: "twitter:image", content: "https://agil2.lovable.app/og/toldos.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
  }),
  component: ToldosPage,
});

const TIPOS = [
  { t: "Articulado", s: "Estrutura projetada que avança sobre a área externa." },
  { t: "Retrátil", s: "Recolhe automaticamente — você decide quando ter sombra." },
  { t: "Capota fixa", s: "Cobertura permanente sobre portas e janelas." },
  { t: "Vela", s: "Design moderno em formato triangular ou quadrado." },
];

const BENEFITS = [
  { icon: Sun, t: "Conforto térmico", s: "Reduz até 8 °C a temperatura do ambiente." },
  { icon: Umbrella, t: "Proteção UV", s: "Lona com bloqueio solar profissional." },
  { icon: Home, t: "Valoriza o imóvel", s: "Acabamento premium para varandas e fachadas." },
];

function ToldosPage() {
  const { data: produtos = [] } = useQuery({
    queryKey: ["categoria-produtos", "toldos"],
    queryFn: async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("id,slug,parent_id")
        .eq("active", true);
      const list = cats ?? [];
      const root = list.find((c) => c.slug === "toldos" || c.slug === "toldo");
      const ids = new Set<string>();
      if (root) {
        ids.add(root.id);
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
      }
      let q = supabase
        .from("products")
        .select("id,name,slug,price,sale_price,price_per_sqm,cover_image,rating,reviews_count,badge,short_description")
        .eq("active", true)
        .order("position", { ascending: true })
        .order("featured", { ascending: false })
        .order("bestseller", { ascending: false })
        .limit(8);
      if (ids.size > 0) {
        q = q.in("category_id", Array.from(ids));
      } else {
        q = q.or("name.ilike.%toldo%,tags.cs.{toldos}");
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img src={banner} alt="Toldo articulado sobre área externa moderna" className="h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
          </div>
          <div className="container-premium relative z-10 py-20 md:py-32">
            <div className="max-w-2xl text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">
                ✦ Lifestyle premium
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">
                Toldos sob Medida
              </h1>
              <p className="mt-5 text-lg text-white/90 md:text-xl">
                Viva ao ar livre com sofisticação. Toldos articulados, retráteis e
                fixos com conforto térmico e acabamento premium.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openLumiWith({ productName: "Toldos sob medida", pageUrl: "/toldos" })}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-glow hover:-translate-y-0.5 transition"
                >
                  <Sparkles className="h-4 w-4" /> Pedir orçamento com a Lumi
                </button>
                <Link
                  to="/catalogo"
                  search={{ categoria: "toldos" }}
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md hover:bg-white/20 transition"
                >
                  Ver modelos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="bg-background py-16 md:py-24">
          <div className="container-premium">
            <div className="mb-10 max-w-2xl">
              <span className="eyebrow">Por que instalar</span>
              <h2 className="mt-3 text-display text-3xl md:text-5xl">
                A área externa que você sempre quis aproveitar.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {BENEFITS.map((b) => (
                <div key={b.t} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <b.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl">{b.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TIPOS */}
        <section className="bg-sand py-16 md:py-24">
          <div className="container-premium">
            <div className="mb-10 max-w-2xl">
              <span className="eyebrow">Modelos disponíveis</span>
              <h2 className="mt-3 text-display text-3xl md:text-5xl">
                Para varanda, fachada, restaurante ou comércio.
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {TIPOS.map((t) => (
                <div key={t.t} className="rounded-2xl border border-border bg-background p-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    <Check className="h-3.5 w-3.5" /> {t.t}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRODUTOS EM DESTAQUE */}
        {produtos.length > 0 && (
          <section className="bg-background py-16 md:py-24">
            <div className="container-premium">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="eyebrow">Produtos</span>
                  <h2 className="mt-3 text-display text-3xl md:text-5xl">Em destaque</h2>
                </div>
                <Link
                  to="/catalogo"
                  search={{ categoria: "toldos" }}
                  className="hidden md:inline-flex h-11 items-center gap-2 rounded-full border-2 border-primary px-5 text-[12px] font-bold uppercase tracking-[0.16em] text-primary hover:bg-primary hover:text-white transition"
                >
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {produtos.map((p: any) => (
                  <Link key={p.id} to="/produto/$slug" params={{ slug: p.slug }} className="group">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                      {p.cover_image && (
                        <img src={p.cover_image} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      )}
                      {p.badge && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-display text-base">{p.name}</h3>
                      {p.rating > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {p.rating.toFixed(1)} · {p.reviews_count}
                        </div>
                      )}
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        a partir de {formatBRL(p.sale_price ?? p.price)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <Newsletter />
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFAB />
      <LumiWidget />
    </div>
  );
}