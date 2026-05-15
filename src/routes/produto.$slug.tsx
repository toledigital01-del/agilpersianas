import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { ProductGallery, type GalleryImage } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { TrustBar } from "@/components/product/TrustBar";
import { BenefitsGrid } from "@/components/product/BenefitsGrid";
import { LifestyleSection } from "@/components/product/LifestyleSection";
import { HowToMeasure } from "@/components/product/HowToMeasure";
import { ProductFAQ } from "@/components/product/ProductFAQ";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { ProductDescription } from "@/components/product/ProductDescription";
import { ProductInstallation } from "@/components/product/ProductInstallation";
import { ProductManual } from "@/components/product/ProductManual";
import { ProductVideo } from "@/components/product/ProductVideo";
import { ProductSpecsBox, type ProductSpec } from "@/components/product/ProductSpecsBox";
import { QuoteSection } from "@/components/site/QuoteSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ShieldCheck, Truck, Factory, Award } from "lucide-react";

export const Route = createFileRoute("/produto/$slug")({
  component: ProductPage,
});

type Category = { id: string; name: string; slug: string; parent_id: string | null };

export type Product = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  installation: string | null;
  manual_pdf_url: string | null;
  video_url: string | null;
  category_id: string | null;
  cover_image: string | null;
  gallery: GalleryImage[];
  price_per_sqm: number;
  min_area: number;
  min_width_cm: number;
  max_width_cm: number;
  min_height_cm: number;
  max_height_cm: number;
  motor_manual_price: number;
  motor_rf_price: number;
  motor_wifi_price: number;
  bando_price: number;
  colors: { name: string; hex: string }[];
  specs: ProductSpec[];
  features: string[];
  faq: { q: string; a: string }[];
  rating: number;
  reviews_count: number;
  badge: string | null;
};

function ProductPage() {
  const { slug } = useParams({ from: "/produto/$slug" });
  const [product, setProduct] = useState<Product | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!mounted) return;
        setProduct(data as unknown as Product);
        // build hierarchical breadcrumb
        if (data?.category_id) {
          const { data: cats } = await supabase
            .from("categories")
            .select("id,name,slug,parent_id");
          const map = new Map<string, Category>();
          (cats ?? []).forEach((c) => map.set(c.id, c as Category));
          const chain: Category[] = [];
          let cur = map.get(data.category_id);
          while (cur) {
            chain.unshift(cur);
            cur = cur.parent_id ? map.get(cur.parent_id) : undefined;
          }
          if (mounted) setBreadcrumb(chain);
        } else {
          setBreadcrumb([]);
        }
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug]);

  const images = useMemo<GalleryImage[]>(() => {
    if (!product) return [];
    const list = Array.isArray(product.gallery) ? product.gallery : [];
    // A foto de capa (modelo "tipo Pinpoint Branca") deve sempre ser a 1ª, sem duplicar.
    const cover = product.cover_image;
    if (!cover) return list;
    const coverUrl = cover;
    const filtered = list.filter((g) => {
      const url = typeof g === "string" ? g : g.url;
      return url !== coverUrl;
    });
    return [coverUrl, ...filtered];
  }, [product]);

  // SEO – injeta título quando produto carrega
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Ágil Persianas`;
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container-premium py-10 grid lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container-premium py-20 text-center">
          <h1 className="text-2xl font-display">Produto não encontrado</h1>
          <Link to="/" className="text-primary underline mt-4 inline-block">Voltar à home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb hierárquico */}
      <div className="border-b border-border/60">
        <div className="container-premium py-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          {breadcrumb.length > 0 ? (
            breadcrumb.map((c) => (
              <span key={c.id}>
                <span className="mx-2">/</span>
                <span className="hover:text-foreground">{c.name}</span>
              </span>
            ))
          ) : (
            <>
              <span className="mx-2">/</span>
              <span>Persianas</span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* HERO */}
      <section className="container-premium py-8 lg:py-14">
        {/* Prova social acima do hero do produto — gatilhos de confiança */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-gradient-to-r from-sand/60 via-background to-sand/60 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] font-medium text-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <strong className="text-foreground">{product.rating.toFixed(1)}</strong>
              <span className="text-muted-foreground">({product.reviews_count.toLocaleString("pt-BR")} avaliações)</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" /> Bestseller
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Factory className="h-4 w-4 text-primary" /> Produção própria
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Entrega Brasil
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Compra protegida
            </span>
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            +12 mil lares atendidos
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-16">
          <ProductGallery
            images={images}
            alt={product.name}
            badge={product.badge}
            activeColor={activeColor}
          />
          <BuyBox product={product} onColorChange={setActiveColor} />
        </div>

        {/* Aviso premium — ficha técnica editável no admin */}
        {Array.isArray(product.specs) && product.specs.length > 0 && (
          <div className="mt-10">
            <ProductSpecsBox items={product.specs} />
          </div>
        )}
      </section>

      <TrustBar />

      {/* Descrição rica vinda do admin */}
      <ProductDescription short={product.short_description} long={product.description} />

      <ProductSpecs product={product} />

      {/* Características vindas do admin */}
      <BenefitsGrid features={product.features ?? []} />

      <LifestyleSection />

      {/* Instalação rica do admin */}
      <ProductInstallation text={product.installation} />

      {/* Manual em PDF */}
      <ProductManual url={product.manual_pdf_url} />

      {/* Vídeo do produto */}
      <ProductVideo url={product.video_url} title={`${product.name} em ação`} />

      <HowToMeasure />

      {/* FAQ vindas do admin */}
      <ProductFAQ items={product.faq ?? []} />

      <RelatedProducts categoryId={product.category_id} excludeId={product.id} />
      <QuoteSection />

      <Footer />
      <WhatsAppFAB />
    </div>
  );
}
