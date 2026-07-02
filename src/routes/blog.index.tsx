import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { blogPosts } from "@/lib/blog-posts";
import { Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog Ágil Persianas — Guias, Dicas e Tendências" },
      {
        name: "description",
        content:
          "Blog da Ágil Persianas com guias de medição, escolha de tecidos, automação residencial e tendências de decoração.",
      },
      { property: "og:title", content: "Blog Ágil Persianas" },
      {
        property: "og:description",
        content: "Guias práticos de persianas, cortinas e automação residencial.",
      },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const [featured, ...rest] = blogPosts;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container-premium py-16 md:py-24">
        <header className="mb-12 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Blog Ágil
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl">
            Conhecimento para sua casa, do nosso jeito
          </h1>
          <p className="mt-4 text-muted-foreground">
            Guias práticos, comparativos e tendências sobre persianas, cortinas e
            automação residencial.
          </p>
        </header>

        {featured && (
          <Link
            to="/blog/$slug"
            params={{ slug: featured.slug }}
            className="group mb-16 grid gap-8 overflow-hidden rounded-3xl border bg-card shadow-sm transition hover:shadow-md md:grid-cols-2"
          >
            <div className="relative aspect-[16/10] md:aspect-auto">
              <img
                src={featured.image}
                alt={featured.title}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="eager"
              />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {featured.category}
              </span>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">{featured.title}</h2>
              <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
              <div className="mt-6 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(featured.date).toLocaleDateString("pt-BR")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.readingTime}
                </span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {post.category}
                </span>
                <h3 className="mt-2 font-serif text-xl">{post.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
                <div className="mt-auto flex items-center gap-4 pt-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.date).toLocaleDateString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Newsletter />
      <Footer />
    </div>
  );
}
