import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { Newsletter } from "@/components/site/Newsletter";
import { blogPosts, getPostBySlug } from "@/lib/blog-posts";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Post não encontrado" }] };
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title} — Blog Ágil` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "article:published_time", content: post.date },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Organization", name: "Ágil Persianas" },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-premium py-32 text-center">
      <h1 className="font-serif text-4xl">Post não encontrado</h1>
      <Link to="/blog" className="mt-6 inline-block text-primary underline">
        Voltar ao blog
      </Link>
    </div>
  ),
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <article>
        {/* HERO */}
        <header className="relative">
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img src={post.image} alt={post.title} className="h-full w-full object-cover" />
          </div>
          <div className="container-premium -mt-24 md:-mt-32">
            <div className="rounded-3xl border bg-card p-8 shadow-lg md:p-12">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao blog
              </Link>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">
                {post.category}
              </p>
              <h1 className="mt-2 font-serif text-3xl md:text-5xl">{post.title}</h1>
              <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
              <div className="mt-6 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.date).toLocaleDateString("pt-BR")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readingTime}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section className="container-premium py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-lg max-w-none whitespace-pre-line text-foreground/90 prose-headings:font-serif prose-h2:text-3xl prose-h2:mt-12 prose-h3:text-xl prose-h3:mt-8 prose-li:my-1">
              {post.content}
            </div>

            <div className="mt-12 rounded-2xl border bg-muted/30 p-8 text-center">
              <h3 className="font-serif text-2xl">Pronto para sua persiana?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Receba um orçamento sob medida em poucas horas.
              </p>
              <Button asChild className="mt-5 bg-primary hover:bg-primary/90">
                <Link to="/">Pedir orçamento</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* RELATED */}
        {related.length > 0 && (
          <section className="bg-muted/30 py-16">
            <div className="container-premium">
              <h2 className="mb-8 font-serif text-2xl md:text-3xl">Continue lendo</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="group flex gap-4 overflow-hidden rounded-2xl border bg-card p-3 transition hover:shadow-md"
                  >
                    <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="py-2 pr-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {p.category}
                      </span>
                      <h3 className="mt-1 font-serif text-lg leading-snug">{p.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      <Newsletter />
      <Footer />
    </div>
  );
}
