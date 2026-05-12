import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { HeroBanner } from "@/components/site/Hero";
import { PromoStrip } from "@/components/site/PromoStrip";
// TrustBar e Categories removidos a pedido do cliente
import { FeaturedProducts } from "@/components/site/FeaturedProducts";
import { BestSellersWeek } from "@/components/site/BestSellersWeek";
import { CategoriesPremium } from "@/components/site/CategoriesPremium";
import { BenefitsRow } from "@/components/site/BenefitsRow";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { CategoryBanners } from "@/components/site/CategoryBanners";
import { DiscountsGrid } from "@/components/site/DiscountsGrid";
import { Testimonials } from "@/components/site/Testimonials";
import { Newsletter } from "@/components/site/Newsletter";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { LumiWidget } from "@/components/site/LumiWidget";

import { AutomationSection } from "@/components/site/AutomationSection";
import { MosquitoSection } from "@/components/site/MosquitoSection";
import { RoomSimulator } from "@/components/site/RoomSimulator";
import { useRevealOnScroll } from "@/hooks/use-reveal-on-scroll";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ágil Persianas — Persianas e Cortinas sob Medida" },
      {
        name: "description",
        content:
          "Persianas, cortinas e toldos sob medida com tecidos premium. Envio para todo o Brasil, parcelamento em até 6× sem juros.",
      },
      { property: "og:title", content: "Ágil Persianas — Luz, Forma e Função" },
      {
        property: "og:description",
        content:
          "Coleção 2026: persianas e cortinas sob medida com tecidos premium.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useRevealOnScroll();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* 1) Hero Banner — PRIMEIRA seção abaixo do header */}
        <HeroBanner />
        {/* 2) Faixa laranja com benefícios — logo abaixo do banner */}
        <PromoStrip />
        {/* 3) ⭐ SIMULADOR IA — instala a persiana na foto da janela do cliente */}
        <RoomSimulator />
        {/* 5) Produtos em destaque */}
        <FeaturedProducts />
        {/* 5b) Mais vendidas essa semana */}
        <BestSellersWeek />
        {/* 6) Categorias premium */}
        <CategoriesPremium />
        {/* Selos de confiança / benefícios premium */}
        <BenefitsRow />
        {/* Banners promo dupla */}
        <CategoryBanners />
        {/* Antes & Depois — prova social visual */}
        <BeforeAfter />
        {/* Tela mosquiteira */}
        <MosquitoSection />
        {/* Automação residencial */}
        <AutomationSection />
        {/* Descontos */}
        <DiscountsGrid />
        {/* Prova social */}
        <Testimonials />
        {/* Newsletter cupom */}
        <Newsletter />
      </main>
      <Footer />
      <WhatsAppFAB />
      <LumiWidget />
    </div>
  );
}
