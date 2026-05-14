import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ruler, MessageCircle, Camera, CheckCircle2 } from "lucide-react";
import { RulerWindow, MountInside, MountOutside } from "./BlindIcons";

const steps = [
  {
    n: "01",
    title: "Use uma trena metálica",
    desc: "Trenas de tecido distorcem a medida. Sempre use a metálica, com a janela limpa e fechada.",
  },
  {
    n: "02",
    title: "Meça a LARGURA em 3 pontos",
    desc: "Topo, meio e base do vão. Anote a MENOR das três medidas — é ela que entra no configurador.",
  },
  {
    n: "03",
    title: "Meça a ALTURA em 2 pontos",
    desc: "Lado esquerdo e direito do vão. Use a MAIOR das duas para garantir cobertura total.",
  },
  {
    n: "04",
    title: "Decida instalação",
    desc: "Dentro do vão: medida exata. Fora do vão: some 8 a 12 cm na largura e na altura para sobreposição.",
  },
];

export function HowToMeasureDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary hover:shadow-md"
          >
            <Ruler className="h-4 w-4" />
            Como escolher as medidas?
            <span className="text-primary/60 transition group-hover:translate-x-0.5">→</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Ruler className="h-3.5 w-3.5" /> Guia premium
          </div>
          <DialogTitle className="font-display text-2xl lg:text-3xl">
            Como medir sua janela em menos de 2 minutos
          </DialogTitle>
          <DialogDescription>
            Com a medida certa, sua persiana fica perfeita. Veja o passo a passo
            e, se preferir, nosso time mede por vídeo-chamada — gratuito.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          <div className="rounded-2xl border bg-gradient-to-br from-card to-sand/40 p-4 flex gap-3">
            <MountInside className="h-12 w-12 text-primary shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">
                Dentro do vão
              </div>
              <p className="text-sm mt-1 text-muted-foreground">
                Mede o espaço interno. Visual mais limpo, perde 1–2 cm de luz
                nas laterais.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-card to-sand/40 p-4 flex gap-3">
            <MountOutside className="h-12 w-12 text-primary shrink-0" />
            <div>
              <div className="text-xs uppercase tracking-widest text-primary font-semibold">
                Fora do vão
              </div>
              <p className="text-sm mt-1 text-muted-foreground">
                Cobre toda a janela e parte da parede. Bloqueia mais luz —
                some 8–12 cm em largura e altura.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 mt-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="flex gap-4 rounded-xl border bg-card p-4"
            >
              <span className="font-display text-2xl text-primary/40 leading-none shrink-0 w-8">
                {s.n}
              </span>
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {s.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-4 mt-4">
          <div className="flex items-start gap-3">
            <RulerWindow className="h-10 w-10 text-primary shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold">Prefere que a gente meça pra você?</h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                Vídeo-chamada gratuita com nosso especialista — em 10 minutos
                sua medida está pronta.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button asChild size="sm" className="bg-whatsapp hover:bg-whatsapp/90 text-whatsapp-foreground">
                  <a
                    href="https://wa.me/5500000000000?text=Quero%20medir%20por%20v%C3%ADdeo-chamada"
                    target="_blank"
                    rel="noopener"
                  >
                    <MessageCircle className="h-4 w-4" /> Agendar vídeo-chamada
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a
                    href="https://wa.me/5500000000000?text=Vou%20enviar%20foto%20da%20janela"
                    target="_blank"
                    rel="noopener"
                  >
                    <Camera className="h-4 w-4" /> Enviar foto pelo WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
