// Grid premium estilo Blinds.com / SelectBlinds — 7 categorias principais
// com imagens reais, hover com zoom suave e link direto para o catálogo filtrado.
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import imgRolo from "@/assets/cat-rolo.jpg";
import imgDouble from "@/assets/cat-double-vision.jpg";
import imgRomana from "@/assets/cat-romana.jpg";
import imgPainel from "@/assets/cat-painel.jpg";
import imgHorizontal from "@/assets/cat-horizontal.jpg";
import imgVertical from "@/assets/cat-vertical.jpg";
import imgAutomacao from "@/assets/section-automacao.jpg";
import imgTela from "@/assets/cat-tela.jpg";
import imgToldo from "@/assets/cat-toldo.jpg";

type Item = {
  title: string;
  desc: string;
  img: string;
  slug: string;
  badge?: string;
  /** Quando definido, sobrescreve o destino padrão (/catalogo?categoria=slug) */
  to?: string;
};

const ITEMS: Item[] = [
  {
    title: "Rolô",
    desc: "Versátil, moderna e perfeita para qualquer ambiente.",
    img: imgRolo,
    slug: "persiana-rolo",
    badge: "Mais vendida",
  },
  {
    title: "Double Vision",
    desc: "Faixas duplas para controle total da luz.",
    img: imgDouble,
    slug: "double-vision",
  },
  {
    title: "Romana",
    desc: "Elegância clássica em tecidos premium.",
    img: imgRomana,
    slug: "cortina-romana",
  },
  {
    title: "Painel",
    desc: "Ideal para grandes vãos e portas de vidro.",
    img: imgPainel,
    slug: "persiana-painel",
  },
  {
    title: "Horizontal",
    desc: "Madeira, alumínio ou PVC — clássico atemporal.",
    img: imgHorizontal,
    slug: "persiana-horizontal",
  },
  {
    title: "Vertical",
    desc: "Excelente para escritórios e ambientes amplos.",
    img: imgVertical,
    slug: "persiana-vertical",
  },
  {
    title: "Motorizadas",
    desc: "Automação Wi-Fi, controle remoto e voz.",
    img: imgAutomacao,
    slug: "motorizadas",
    badge: "Novidade",
  },
  {
    title: "Tela Mosquiteira",
    desc: "Proteção contra insetos sem perder ventilação.",
    img: imgTela,
    slug: "tela-mosquiteira",
    to: "/tela-mosquiteira",
  },
  {
    title: "Toldos",
    desc: "Conforto térmico e sofisticação para áreas externas.",
    img: imgToldo,
    slug: "toldos",
    to: "/toldos",
  },
];

export function CategoriesPremium() {
  return (
    <section id="categorias" className="bg-background py-12 md:py-16">
      <div className="container-premium">
        {/* Cabeçalho */}
        <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end" data-reveal>
          <div className="max-w-2xl">
            <span className="eyebrow">Coleção 2026</span>
            <h2 className="text-display mt-3 text-4xl md:text-6xl">
              Navegue por categoria
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Persianas, cortinas e toldos sob medida — escolha o modelo perfeito
              para cada janela com tecidos premium e instalação profissional.
            </p>
          </div>
          <Link
            to="/catalogo"
            className="group inline-flex h-12 items-center gap-2 rounded-full border-2 px-6 text-[12px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ease-premium hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5"
            style={{ borderColor: "#F57C00", color: "#F57C00" }}
          >
            Ver todas as categorias
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Grid Bento — 2 cards grandes (linha 1 e linha 4) + 4 cards normais */}
        {/* Grid uniforme — todas as caixas do mesmo tamanho para padronização visual */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {ITEMS.map((item, i) => {
            const linkProps = item.to
              ? { to: item.to as "/tela-mosquiteira" | "/toldos" }
              : { to: "/catalogo" as const, search: { categoria: item.slug } };
            return (
              <Link
                key={item.slug}
                {...linkProps}
                data-reveal
                style={{ transitionDelay: `${(i % 4) * 80}ms` }}
                className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-foreground shadow-sm ring-1 ring-border transition-all duration-500 ease-premium hover:shadow-2xl hover:ring-primary/30 hover:-translate-y-1"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  loading={i < 3 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-premium group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent transition-opacity duration-500 group-hover:from-black/80" />

                {/* Badge */}
                {item.badge && (
                  <span
                    className="absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-sm sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.22em]"
                    style={{ backgroundColor: "#F57C00" }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Conteúdo — altura/tipografia padronizadas em todos os cards */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5 md:p-6 text-white transition-transform duration-500 ease-premium group-hover:-translate-y-1">
                  <h3
                    className="text-display leading-tight"
                    style={{ fontSize: "clamp(1.05rem, 1.55vw, 1.5rem)", minHeight: "2.4em" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="hidden text-[12.5px] leading-snug text-white/85 sm:block md:text-[13px]"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: "2.6em",
                    }}
                  >
                    {item.desc}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 group-hover:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
                    Explorar
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
