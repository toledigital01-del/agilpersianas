// Hero premium — inspiração Apple/Shopify: respiração, tipografia display, microinterações sutis
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import heroLiving from "@/assets/hero-2026-living.jpg";
import heroBedroom from "@/assets/hero-2026-bedroom.jpg";
import heroLivingLumi from "@/assets/hero-2026-living-lumi.jpg";
import { ArrowRight, Sparkles, Star, Ruler, Truck, ShieldCheck, BookOpen } from "lucide-react";
import { openLumiWith } from "@/components/site/LumiWidget";
import { supabase } from "@/integrations/supabase/client";

type HeroCfg = {
  title?: string;
  subtitle?: string;
  cta?: string;
  cta2?: string;
  ctaUrl?: string;
  cta2Url?: string;
  ctaEnabled?: boolean;
  cta2Enabled?: boolean;
};

type Scene = {
  src: string;
  title: string;
  subtitle: string;
  cta?: string;
  ctaUrl?: string;
  active?: boolean;
};

const DEFAULT_SCENES: Scene[] = [
  {
    src: heroLiving,
    title: "A arte de iluminar cada ambiente.",
    subtitle: "Persianas e cortinas sob medida com design premium e acabamento impecável.",
  },
  {
    src: heroBedroom,
    title: "Noites perfeitas começam com a persiana certa.",
    subtitle: "Blackout total, conforto térmico, sob medida — entregue na sua porta.",
  },
  {
    src: heroLivingLumi,
    title: "Viva ao ar livre, com sofisticação.",
    subtitle: "Toldos modernos sob medida — conforto térmico e lifestyle premium para sua casa.",
  },
];

/**
 * HeroBanner — apenas o banner visual (imagens em fade) com indicadores e prova social flutuante.
 * Renderizado logo abaixo das categorias, como a primeira coisa visual de impacto.
 */
export function HeroBanner() {
  const [active, setActive] = useState(0);
  const [scenes, setScenes] = useState<Scene[]>(DEFAULT_SCENES);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_banners")
        .maybeSingle();
      if (cancelled || !data?.value) return;
      const incoming = data.value as Array<Partial<Scene>> | null;
      if (!Array.isArray(incoming) || !incoming.length) return;
      // Filtra inativos e mescla com defaults para campos obrigatórios
      const merged = incoming
        .filter((b) => b?.active !== false)
        .map((b, i) => {
          const def = DEFAULT_SCENES[i % DEFAULT_SCENES.length];
          return {
            src: b?.src?.trim() ? b.src! : def.src,
            title: b?.title?.trim() ? b.title! : def.title,
            subtitle: b?.subtitle?.trim() ? b.subtitle! : def.subtitle,
            cta: b?.cta,
            ctaUrl: b?.ctaUrl,
          };
        });
      if (merged.length) setScenes(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % scenes.length), 8000);
    return () => clearInterval(id);
  }, [scenes.length]);

  return (
    <section className="relative bg-background overflow-hidden">
      {/*
        Mobile: banner sem container/padding e sem cantos arredondados (full-bleed),
        proporção ~4:5 (igual ao Fácil Persianas) — mais baixo e enquadrado.
        Desktop: mantém container, cantos arredondados e altura maior.
      */}
      <div className="px-0 pt-0 pb-0 sm:container-premium sm:pt-6 sm:pb-3">
        <div className="is-visible relative" data-reveal>
          <div className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[460px] lg:min-h-[560px] rounded-none sm:rounded-[28px] overflow-hidden shadow-none sm:shadow-2xl bg-foreground sm:ring-1 sm:ring-black/5">
            {/* Camada 1 — Imagens de fundo */}
            <div className="absolute inset-0 z-0">
              {scenes.map((scene, i) => (
                <img
                  key={i}
                  src={scene.src}
                  alt="Ambiente com cortinas e persianas sob medida"
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  // @ts-expect-error fetchpriority valid HTML
                  fetchpriority={i === 0 ? "high" : "low"}
                  className={`absolute inset-0 h-full w-full object-cover object-[center_30%] sm:object-[center_40%] lg:object-center transition-all duration-[1400ms] ease-premium ${
                    i === active ? "opacity-100 scale-100" : "opacity-0 scale-[1.04]"
                  }`}
                />
              ))}
            </div>

            {/* Camada 2 — Overlay padronizado: mais forte no mobile (legibilidade) */}
            <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/45 via-black/30 to-black/75 sm:from-black/35 sm:via-black/20 sm:to-black/65" />

            {/* Camada 3 — Conteúdo: título + subtítulo + CTAs, centralizado vertical e horizontalmente */}
            <div className="relative z-10 flex h-full min-h-full sm:min-h-[460px] lg:min-h-[560px] flex-col items-center justify-between gap-6 px-5 pt-10 pb-7 text-center sm:justify-center sm:gap-8 sm:px-10 sm:py-12">
              <div className="mx-auto w-full max-w-2xl px-2 sm:max-w-3xl sm:flex-none flex-1 flex flex-col justify-center">
                <h2
                  className="text-display text-white text-balance leading-[1.1] break-words"
                  style={{
                    fontSize: "clamp(1.5rem, 4.6vw, 3rem)",
                    textShadow: "0 2px 18px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.5)",
                  }}
                >
                  {scenes[active].title}
                </h2>
                <p
                  className="mx-auto mt-3 max-w-xl text-[15px] leading-[1.55] text-white sm:mt-4 sm:max-w-2xl sm:text-[15px] sm:leading-[1.6] md:text-base"
                  style={{ textShadow: "0 1px 10px rgba(0,0,0,0.55)" }}
                >
                  {scenes[active].subtitle}
                </p>
              </div>

              <div className="flex w-full flex-col items-center justify-center gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    const el = document.getElementById("simulador-ambiente");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  style={{ backgroundColor: "#FF6B35", color: "#fff" }}
                  className="inline-flex h-10 w-auto max-w-full items-center justify-center gap-2 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.14em] shadow-glow transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-2xl sm:h-11 sm:px-6 sm:text-[12px] sm:tracking-[0.16em]"
                >
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Simular na minha janela
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <Link
                  to="/catalogo"
                  className="inline-flex h-10 w-auto max-w-full items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-white/20 sm:h-11 sm:px-6 sm:text-[12px] sm:tracking-[0.16em]"
                >
                  <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Ver catálogo
                </Link>
              </div>
            </div>

            {/* Indicadores — canto inferior direito, sem cobrir o texto central */}
            <div className="absolute right-4 bottom-4 z-20 sm:right-6 sm:bottom-6 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-2 backdrop-blur-md">
              {scenes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Cena ${i + 1}`}
                  className="h-1.5 rounded-full bg-white transition-all duration-500 ease-premium"
                  style={{ width: i === active ? 28 : 8, opacity: i === active ? 1 : 0.55 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * HeroIntro — bloco editorial com headline, descrição, card da Lumi, CTA e selos.
 * Renderizado logo após o banner.
 */
export function HeroIntro() {
  const [cfg, setCfg] = useState<HeroCfg>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "hero").maybeSingle();
      if (!cancelled && data?.value) setCfg(data.value as HeroCfg);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ctaEnabled = cfg.ctaEnabled !== false;
  const cta2Enabled = cfg.cta2Enabled !== false;
  const ctaText = cfg.cta || "Simular na minha janela";
  const cta2Text = cfg.cta2 || "Ver catálogo";
  const ctaUrl = cfg.ctaUrl || "#simulador-ambiente";
  const cta2Url = cfg.cta2Url || "/catalogo";

  const handlePrimary = () => {
    if (typeof window === "undefined") return;
    if (ctaUrl.startsWith("#")) {
      const el = document.getElementById(ctaUrl.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = ctaUrl;
    }
  };
  const handleSecondary = () => {
    if (typeof window === "undefined") return;
    if (cta2Url.startsWith("#")) {
      const el = document.getElementById(cta2Url.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = cta2Url;
    }
  };

  const scrollToSim = () => {
    if (typeof window === "undefined") return;
    const el = document.getElementById("simulador-ambiente");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  void scrollToSim;

  return (
    <section
      className="relative border-b border-white/10 overflow-hidden text-white"
      style={{ background: "#1E1C18" }}
    >
      {/* Halo sutil de fundo (aurora) — laranja sobre fundo escuro */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 h-[560px] w-[560px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(245,124,0,0.40), transparent)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(245,124,0,0.25), transparent)" }}
      />
      <div className="container-premium py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl rounded-[24px] sm:rounded-[28px] border border-white/15 bg-white/[0.05] px-4 py-7 text-center shadow-2xl backdrop-blur-sm sm:px-8 sm:py-10 md:px-10 md:py-12">
          {/* Badge — Compra assistida por IA (estilo da referência) */}
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-primary/50 bg-primary/20 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-glow sm:tracking-[0.22em]">
            <Sparkles className="h-3 w-3" />
            Compra assistida por IA
          </div>

          <h1
            className="mt-4 text-display text-white text-pretty leading-[1.08] sm:mt-5 sm:leading-[1.04]"
            style={{ fontSize: "clamp(1.45rem, 5.4vw, 3.2rem)" }}
          >
            {cfg.title ? (
              <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {cfg.title}
              </span>
            ) : (
              <>
                <span className="block">Seu ambiente merece a</span>
                <span className="mt-1 block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  perfeição feita sob medida.
                </span>
              </>
            )}
          </h1>

          <p className="mt-4 mx-auto max-w-2xl text-[13.5px] leading-[1.65] text-white/85 sm:mt-5 sm:text-[15px] sm:leading-7 md:text-base md:leading-8">
            {cfg.subtitle || "Responda 6 perguntas e descubra qual persiana é ideal para o seu espaço — em 60 segundos."}
          </p>

          {/* CTAs configuráveis */}
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {ctaEnabled && (
              <button
                type="button"
                onClick={handlePrimary}
                style={{ backgroundColor: "#FF6B35", color: "#fff" }}
                className="group inline-flex h-12 md:h-13 w-full max-w-full items-center justify-center gap-2 rounded-full px-6 sm:w-auto sm:px-8 text-[12px] md:text-[13px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] shadow-glow transition-all duration-300 ease-premium hover:shadow-2xl hover:-translate-y-0.5 hover:opacity-95"
              >
                {ctaText}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            )}
            {cta2Enabled && (
              <button
                type="button"
                onClick={handleSecondary}
                className="inline-flex h-12 md:h-13 w-full max-w-full items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 sm:w-auto sm:px-8 text-[12px] md:text-[13px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {cta2Text}
              </button>
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() =>
                openLumiWith({
                  pageUrl: typeof window !== "undefined" ? window.location.pathname : undefined,
                })
              }
              className="text-[12.5px] text-white/55 underline underline-offset-4 hover:text-white/85 transition-colors"
            >
              ou prefira falar com a Lumi
            </button>
          </div>

          {/* Selos rápidos */}
          <div className="mt-7 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[11.5px] sm:text-[12px] font-medium text-white/90 sm:mt-8 sm:gap-x-7">
            <span className="inline-flex items-center gap-1.5">
              <Ruler className="h-4 w-4 text-primary-glow" />
              Sob medida exata
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary-glow" />
              Entrega Brasil
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary-glow" />
              Compra protegida
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-primary-glow text-primary-glow" />
              4.9 · 2.300+ avaliações
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hero — wrapper de compatibilidade. Renderiza banner + intro juntos.
 * Mantido para que outras páginas que importam <Hero /> continuem funcionando.
 */
export function Hero() {
  return (
    <>
      <HeroBanner />
      <HeroIntro />
    </>
  );
}

