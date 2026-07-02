import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { TrustBar } from "@/components/site/TrustBar";
import { Newsletter } from "@/components/site/Newsletter";
import { Button } from "@/components/ui/button";
import { Check, Phone } from "lucide-react";

export interface LandingFeature {
  title: string;
  description: string;
}

export interface LandingFAQItem {
  q: string;
  a: string;
}

export interface LandingPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string;
  intro: ReactNode;
  ctaPrimary?: { label: string; to?: string; href?: string };
  ctaSecondaryWhatsapp?: string;
  features: LandingFeature[];
  benefitsTitle?: string;
  benefits: string[];
  faq: LandingFAQItem[];
  jsonLd?: object;
  bottomCta?: { title: string; description: string };
}

export function LandingLayout({
  eyebrow,
  title,
  subtitle,
  heroImage,
  intro,
  ctaPrimary = { label: "Solicitar orçamento", to: "/#orcamento" },
  ctaSecondaryWhatsapp = "Olá! Gostaria de mais informações.",
  features,
  benefitsTitle = "Por que escolher a Ágil",
  benefits,
  faq,
  bottomCta,
}: LandingPageProps) {
  const waLink = `https://wa.me/5532351202810?text=${encodeURIComponent(ctaSecondaryWhatsapp)}`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={title}
              className="h-full w-full object-cover"
              loading="eager"
              width={1920}
              height={1080}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
          </div>

          <div className="container-premium relative z-10 py-20 md:py-32">
            <div className="max-w-2xl text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">
                {eyebrow}
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight md:text-6xl">{title}</h1>
              <p className="mt-5 text-lg text-white/85 md:text-xl">{subtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                {ctaPrimary.to ? (
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <Link to={ctaPrimary.to}>{ctaPrimary.label}</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <a href={ctaPrimary.href}>{ctaPrimary.label}</a>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:text-white"
                >
                  <a href={waLink} target="_blank" rel="noreferrer">
                    <Phone className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <TrustBar />

        {/* INTRO */}
        <section className="bg-background py-16 md:py-24">
          <div className="container-premium grid gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="prose prose-lg max-w-none text-foreground/90">
                {intro}
              </div>
            </div>
            <aside className="md:col-span-5">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="font-serif text-xl">{benefitsTitle}</h3>
                <ul className="mt-4 space-y-3">
                  {benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full bg-primary hover:bg-primary/90">
                  {ctaPrimary.to ? (
                    <Link to={ctaPrimary.to}>Pedir orçamento agora</Link>
                  ) : (
                    <a href={ctaPrimary.href}>Pedir orçamento agora</a>
                  )}
                </Button>
              </div>
            </aside>
          </div>
        </section>

        {/* FEATURES */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container-premium">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-3xl md:text-4xl">Características técnicas</h2>
              <p className="mt-3 text-muted-foreground">
                Especificações que fazem diferença no resultado final.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <article
                  key={f.title}
                  className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md"
                >
                  <h3 className="font-serif text-lg">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-background py-16 md:py-24">
          <div className="container-premium max-w-3xl">
            <h2 className="font-serif text-3xl md:text-4xl">Perguntas frequentes</h2>
            <div className="mt-8 divide-y border-y">
              {faq.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium">
                    {item.q}
                    <span className="text-primary transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        {bottomCta && (
          <section className="bg-graphite py-16 text-graphite-foreground md:py-20">
            <div className="container-premium text-center">
              <h2 className="font-serif text-3xl md:text-4xl">{bottomCta.title}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-white/75">{bottomCta.description}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {ctaPrimary.to ? (
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <Link to={ctaPrimary.to}>{ctaPrimary.label}</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                    <a href={ctaPrimary.href}>{ctaPrimary.label}</a>
                  </Button>
                )}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <a href={waLink} target="_blank" rel="noreferrer">
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </section>
        )}

        <Newsletter />
      </main>

      <Footer />
    </div>
  );
}
