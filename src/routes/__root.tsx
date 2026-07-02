import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts, useRouterState } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/lib/cart";
import { CartDrawer } from "@/components/site/CartDrawer";
import { SocialProofToasts } from "@/components/site/SocialProofToasts";
import { SeoHead } from "@/components/site/SeoHead";
import { LumiWidget } from "@/components/site/LumiWidget";
import { WhatsAppFAB } from "@/components/site/WhatsAppFAB";
import { useSiteTheme } from "@/lib/theme";
import { META_PIXEL_ID, GA4_MEASUREMENT_ID } from "@/lib/analytics";

import appCss from "../styles.css?url";

const PIXEL_SNIPPET = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`;

const GA4_INIT = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_MEASUREMENT_ID}',{send_page_view:true});`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar à home
          </Link>
        </div>
      </div>
    </div>
  );
}

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ágil Persianas",
  url: "https://agil2.lovable.app",
  logo: "https://agil2.lovable.app/og/agil-logo.png",
  sameAs: [
    "https://www.instagram.com/agilpersianas",
    "https://www.facebook.com/agilpersianas",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+55-11-4002-8922",
    contactType: "customer service",
    areaServed: "BR",
    availableLanguage: ["Portuguese"],
  },
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ágil Persianas" },
      { name: "description", content: "Persianas e cortinas sob medida com entrega para todo Brasil." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Ágil Persianas" },
      { name: "twitter:title", content: "Ágil Persianas" },
      { property: "og:description", content: "Persianas e cortinas sob medida com entrega para todo Brasil." },
      { name: "twitter:description", content: "Persianas e cortinas sob medida com entrega para todo Brasil." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5171a845-35f3-4188-8ac2-9a322b547a7d/id-preview-6ba4c76c--e82f979a-13e1-4ed4-b867-203a2377e8d5.lovable.app-1776846844365.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5171a845-35f3-4188-8ac2-9a322b547a7d/id-preview-6ba4c76c--e82f979a-13e1-4ed4-b867-203a2377e8d5.lovable.app-1776846844365.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(ORG_JSONLD) },
      { children: PIXEL_SNIPPET },
      { src: `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`, async: true },
      { children: GA4_INIT },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSite = !pathname.startsWith("/admin") && !pathname.startsWith("/auth");
  useSiteTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <SeoHead />
          <Outlet />
          <CartDrawer />
          <Toaster richColors position="top-right" />
          <SocialProofToasts />
          {isSite && (
            <>
              <LumiWidget />
              <WhatsAppFAB />
            </>
          )}
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
