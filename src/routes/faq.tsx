import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Como funciona a medição para persianas sob medida?",
    a: "Você mede a largura e a altura do vão onde a persiana será instalada. Para instalação por fora do vão, acrescente 10 cm em cada lado. Para instalação por dentro, use as medidas exatas do vão. Em caso de dúvida, nossa equipe pode te orientar pelo WhatsApp.",
  },
  {
    q: "Qual o prazo de entrega?",
    a: "O prazo padrão é de 15 a 25 dias úteis após a confirmação do pagamento. Para regiões da Grande São Paulo e Minas Gerais o prazo pode ser menor. Você receberá atualizações por e-mail e WhatsApp.",
  },
  {
    q: "Vocês fazem instalação?",
    a: "Sim! Oferecemos serviço de instalação profissional. Entre em contato pelo WhatsApp para solicitar orçamento de instalação na sua cidade.",
  },
  {
    q: "Como é feita a limpeza das persianas?",
    a: "Persianas de tecido: limpe com pano levemente úmido ou use aspirador de pó com bocal macio. Evite água em excesso. Persianas de alumínio: podem ser limpas com pano úmido e sabão neutro. Evite produtos abrasivos.",
  },
  {
    q: "Quais são as formas de pagamento?",
    a: "Aceitamos PIX (com 5% de desconto), cartão de crédito em até 6x sem juros e boleto bancário à vista.",
  },
  {
    q: "Posso cancelar ou trocar meu pedido?",
    a: "Por serem produtos feitos sob medida, não aceitamos cancelamentos após o início da produção. Em caso de defeito de fabricação, realizamos a troca sem custo. Entre em contato em até 7 dias após o recebimento.",
  },
  {
    q: "As persianas blackout bloqueiam 100% da luz?",
    a: "As persianas blackout bloqueiam entre 95% e 99% da luz quando instaladas por fora do vão com as medidas corretas. Para bloqueio total, recomendamos a instalação com sobreposição lateral de ao menos 5 cm em cada lado.",
  },
  {
    q: "Vocês entregam para todo o Brasil?",
    a: "Sim, entregamos para todo o território nacional via transportadora. O frete é calculado automaticamente no checkout pelo seu CEP.",
  },
  {
    q: "Qual a garantia dos produtos?",
    a: "Todos os produtos têm garantia de 12 meses contra defeitos de fabricação a partir da data de entrega.",
  },
  {
    q: "Posso pedir amostras de tecido?",
    a: "Sim! Entre em contato pelo WhatsApp e solicite amostras dos tecidos disponíveis para avaliar a textura e a cor antes de fazer o pedido.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas Frequentes — Ágil Persianas" },
      {
        name: "description",
        content:
          "Tire suas dúvidas sobre nossas persianas e cortinas sob medida: medição, prazos, instalação, pagamento e garantia.",
      },
      { property: "og:title", content: "Perguntas Frequentes — Ágil Persianas" },
      {
        property: "og:description",
        content: "Tire suas dúvidas sobre persianas e cortinas sob medida.",
      },
    ],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(FAQ_JSONLD) },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="bg-gradient-warm border-b">
          <div className="container-premium py-16 md:py-24 text-center max-w-3xl mx-auto">
            <span className="eyebrow">FAQ</span>
            <h1 className="font-display text-4xl md:text-5xl mt-3">
              Perguntas Frequentes
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Tire suas dúvidas sobre nossas persianas e cortinas sob medida
            </p>
          </div>
        </section>

        <section className="container-premium py-16 md:py-20 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((it, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base md:text-lg font-medium py-5">
                  {it.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  {it.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-14 text-center">
            <p className="font-display text-2xl md:text-3xl">
              Ainda tem dúvidas?
            </p>
            <p className="text-muted-foreground mt-2">
              Fale com um especialista agora mesmo pelo WhatsApp.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 shadow-md"
            >
              <a
                href="https://wa.me/5532351202810"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" />
                Fale no WhatsApp
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}