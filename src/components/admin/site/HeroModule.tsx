import { Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModuleCard, RequiredLabel } from "./_shared/ModuleCard";
import { UrlFieldWithPreview } from "./_shared/UrlFieldWithPreview";
import { ToggleField } from "./_shared/ToggleField";
import { useSiteSetting } from "@/hooks/use-site-setting";

type Hero = {
  title: string;
  subtitle: string;
  cta: string;
  cta2: string;
  ctaUrl: string;
  cta2Url: string;
  ctaEnabled: boolean;
  cta2Enabled: boolean;
  image: string;
};

const DEFAULTS: Hero = {
  title: "Seu ambiente merece a perfeição feita sob medida.",
  subtitle: "Responda 6 perguntas e descubra qual persiana é ideal para o seu espaço — em 60 segundos.",
  cta: "Descobrir minha persiana ideal",
  cta2: "Ver catálogo",
  ctaUrl: "#simulador-ambiente",
  cta2Url: "/catalogo",
  ctaEnabled: true,
  cta2Enabled: true,
  image: "",
};

export function HeroModule() {
  const { value: hero, setValue, save, saving } = useSiteSetting<Hero>("hero", DEFAULTS);
  const update = (patch: Partial<Hero>) => setValue({ ...hero, ...patch });

  return (
    <ModuleCard
      id="mod-hero"
      icon={Globe}
      title="Hero (Banner principal)"
      description="Bloco principal da home com título, subtítulo e botões de ação."
      saveLabel="Salvar hero"
      onSave={() => save()}
      saving={saving}
    >
      <div>
        <Label><RequiredLabel>Título</RequiredLabel></Label>
        <Input value={hero.title} onChange={(e) => update({ title: e.target.value })} placeholder={DEFAULTS.title} />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Textarea rows={2} value={hero.subtitle} onChange={(e) => update({ subtitle: e.target.value })} placeholder={DEFAULTS.subtitle} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Botão primário</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Texto</Label>
            <Input value={hero.cta} onChange={(e) => update({ cta: e.target.value })} placeholder="Pedir orçamento" />
          </div>
          <div>
            <Label>URL ou âncora</Label>
            <Input value={hero.ctaUrl} onChange={(e) => update({ ctaUrl: e.target.value })} placeholder="#simulador-ambiente ou /catalogo" />
          </div>
        </div>
        <ToggleField
          label="Ativar botão primário"
          checked={hero.ctaEnabled}
          onChange={(v) => update({ ctaEnabled: v })}
        />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Botão secundário</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Texto</Label>
            <Input value={hero.cta2} onChange={(e) => update({ cta2: e.target.value })} placeholder="Ver catálogo" />
          </div>
          <div>
            <Label>URL ou âncora</Label>
            <Input value={hero.cta2Url} onChange={(e) => update({ cta2Url: e.target.value })} placeholder="/catalogo" />
          </div>
        </div>
        <ToggleField
          label="Ativar botão secundário"
          checked={hero.cta2Enabled}
          onChange={(v) => update({ cta2Enabled: v })}
        />
      </div>

      <UrlFieldWithPreview
        label="URL da imagem de fundo (opcional — usa carrossel se vazio)"
        value={hero.image}
        onChange={(v) => update({ image: v })}
      />
    </ModuleCard>
  );
}