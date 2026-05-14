import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Truck, Ruler, MessageCircle, ChevronRight, Wrench, Sparkles, ShieldCheck } from "lucide-react";
import type { Product } from "@/routes/produto.$slug";
import { toast } from "sonner";
import { CheckoutDialog } from "./CheckoutDialog";
import { ShippingCalculator } from "./ShippingCalculator";
import type { ShippingQuote } from "@/lib/frenet.functions";
import { loadSelection, saveSelection } from "@/lib/product-selection";
import { openLumiWith } from "@/components/site/LumiWidget";
import { HowToMeasureDialog } from "./HowToMeasureDialog";
import {
  CordLeft, CordRight, NoBando, WithBando,
  HandManual, MotorRf, MotorWifi, MountInside, MountOutside,
} from "./BlindIcons";

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function buildMeasureOptions(minCm: number, maxCm: number) {
  const opts: { cm: number; label: string }[] = [];
  for (let cm = minCm; cm <= maxCm; cm++) {
    const meters = (cm / 100).toFixed(2).replace(".", ",");
    opts.push({ cm, label: `${meters} (${cm} cm)` });
  }
  return opts;
}

type Motor = "manual" | "rf" | "wifi";
type Mount = "inside" | "outside";
type Side = "left" | "right";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type IconOption = { v: string; l: string; sub?: string; price?: number; Icon: IconType };

export function BuyBox({
  product,
  onColorChange,
}: {
  product: Product;
  onColorChange?: (color: string) => void;
}) {
  const initial = useMemo(() => loadSelection(product.slug), [product.slug]);

  const [width, setWidth] = useState(initial.widthCm ?? product.min_width_cm);
  const [height, setHeight] = useState(initial.heightCm ?? product.min_height_cm);
  const [mount, setMount] = useState<Mount>("inside");
  const [side, setSide] = useState<Side>("right");
  const [motor, setMotor] = useState<Motor>("manual");
  const [bando, setBando] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);

  const productColors = useMemo(() => {
    if (Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors.filter((c) => c && c.name && c.hex);
    }
    return [
      { name: "Branca", hex: "#F4F2EC" },
      { name: "Bege", hex: "#E5DDCC" },
      { name: "Cinza", hex: "#BFC0BE" },
      { name: "Preta", hex: "#2A2D31" },
    ];
  }, [product.colors]);
  const [color, setColor] = useState(
    initial.color && productColors.some((c) => c.name === initial.color)
      ? initial.color
      : (productColors[0]?.name ?? "Branca"),
  );

  useEffect(() => {
    onColorChange?.(color);
    saveSelection(product.slug, { color });
  }, [color, onColorChange, product.slug]);

  useEffect(() => {
    saveSelection(product.slug, { widthCm: width, heightCm: height });
  }, [width, height, product.slug]);

  const widthOptions = useMemo(
    () => buildMeasureOptions(product.min_width_cm, product.max_width_cm),
    [product.min_width_cm, product.max_width_cm],
  );
  const heightOptions = useMemo(
    () => buildMeasureOptions(product.min_height_cm, product.max_height_cm),
    [product.min_height_cm, product.max_height_cm],
  );

  const validation = useMemo(() => {
    const errors: string[] = [];
    const fmt = (cm: number) => `${(cm / 100).toFixed(2)} m`;
    if (width < product.min_width_cm) errors.push(`Largura mínima ${fmt(product.min_width_cm)}`);
    if (width > product.max_width_cm) errors.push(`Largura máxima ${fmt(product.max_width_cm)}`);
    if (height < product.min_height_cm) errors.push(`Altura mínima ${fmt(product.min_height_cm)}`);
    if (height > product.max_height_cm) errors.push(`Altura máxima ${fmt(product.max_height_cm)}`);
    return errors;
  }, [width, height, product]);

  const motorPrice =
    motor === "manual"
      ? product.motor_manual_price
      : motor === "rf"
        ? product.motor_rf_price
        : product.motor_wifi_price;

  const subtotal = useMemo(() => {
    const area = Math.max((width * height) / 10000, product.min_area);
    return area * product.price_per_sqm + motorPrice + (bando ? product.bando_price : 0);
  }, [width, height, motor, bando, product, motorPrice]);

  const shippingCost = shipping?.price ?? 0;
  const total = subtotal + shippingCost;
  const pix = total * 0.95;
  const installment = total / 6;
  const suggestMotor = width >= 220 && motor === "manual";

  function handleBuy() {
    if (validation.length) {
      toast.error(validation[0]);
      return;
    }
    setCheckoutOpen(true);
  }

  function handleWhats() {
    const msg = encodeURIComponent(
      `Olá! Tenho interesse na *${product.name}*\n\n` +
        `📐 Medidas: ${(width / 100).toFixed(2)} m × ${(height / 100).toFixed(2)} m\n` +
        `🔧 Acionamento: ${motor === "manual" ? "Manual" : motor === "rf" ? "Motor RF" : "Motor Wi-Fi"}\n` +
        `🎨 Cor: ${color}\n` +
        `${bando ? "✨ Com bandô\n" : ""}` +
        `💰 Total estimado: ${BRL(total)}\n` +
        `💳 Em até 6× de ${BRL(installment)} sem juros (ou ${BRL(pix)} no PIX – 5% off)`,
    );
    window.open(`https://wa.me/5500000000000?text=${msg}`, "_blank");
  }

  return (
    <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-sand text-graphite uppercase text-[10px] tracking-widest">
            Sob medida
          </Badge>
          {product.badge && (
            <Badge className="bg-primary/10 text-primary uppercase text-[10px] tracking-widest">
              {product.badge}
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl lg:text-4xl leading-tight">{product.name}</h1>
        <p className="text-muted-foreground mt-2 text-base leading-relaxed">{product.short_description}</p>

        <div className="flex items-center gap-2 mt-3 text-sm">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
            ))}
          </div>
          <span className="font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">· {product.reviews_count.toLocaleString("pt-BR")} avaliações</span>
        </div>
      </div>

      {/* Price block */}
      <div className="rounded-2xl border bg-gradient-to-br from-card via-card to-sand/40 p-5 shadow-card ring-1 ring-border/50">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Sua persiana por</div>
        <div className="flex items-baseline gap-3 mt-1">
          <span className="font-display text-4xl lg:text-[44px] leading-none bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{BRL(total)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            ou em até <strong className="text-foreground">6× de {BRL(installment)} sem juros</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 text-success font-medium">
            <span className="h-2 w-2 rounded-full bg-success" />
            PIX {BRL(pix)} <span className="text-xs text-muted-foreground">(-5%)</span>
          </span>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Preço por m²: <strong className="text-foreground">{BRL(product.price_per_sqm)}</strong> · área mínima cobrada {product.min_area} m²
        </div>
      </div>

      {/* COLOR — moved up right under the price (premium) */}
      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Cor selecionada</div>
            <div className="font-display text-xl mt-0.5">{color}</div>
          </div>
          <Badge variant="secondary" className="bg-sand text-graphite text-[10px] uppercase tracking-widest">
            {productColors.length} opções
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          {productColors.map((c) => {
            const active = color === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                title={c.name}
                aria-label={c.name}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={`relative h-12 w-12 rounded-full transition-all ${
                    active
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-md"
                      : "ring-1 ring-border group-hover:ring-foreground/40 group-hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex, boxShadow: active ? "inset 0 0 0 2px rgba(255,255,255,.6)" : undefined }}
                />
                <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <HowToMeasureDialog />
        </div>
      </div>

      {/* Configurador — etapas numeradas */}
      <div className="space-y-5">
        <div>
          <StepHeader n={1} title="Medidas" right={
            <HowToMeasureDialog
              trigger={
                <button type="button" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                  <Ruler className="h-3.5 w-3.5" /> Como medir
                </button>
              }
            />
          } />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Largura da Persiana
              </Label>
              <Select value={String(width)} onValueChange={(v) => setWidth(Number(v))}>
                <SelectTrigger className="h-12 text-base font-medium mt-1">
                  <SelectValue placeholder="Selecione a opção" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {widthOptions.map((o) => (
                    <SelectItem key={o.cm} value={String(o.cm)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Altura da Persiana
              </Label>
              <Select value={String(height)} onValueChange={(v) => setHeight(Number(v))}>
                <SelectTrigger className="h-12 text-base font-medium mt-1">
                  <SelectValue placeholder="Selecione a opção" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {heightOptions.map((o) => (
                    <SelectItem key={o.cm} value={String(o.cm)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {validation.map((err) => (
            <p key={err} className="text-xs text-destructive mt-2">⚠ {err}</p>
          ))}
          {suggestMotor && (
            <div className="mt-2 text-xs bg-primary/5 text-primary rounded-md px-3 py-2 border border-primary/20">
              💡 Para essa largura, recomendamos motorização para uso confortável.
            </div>
          )}
        </div>

        <IconOptionGroup
          step={2}
          label="Tipo de instalação"
          value={mount}
          onChange={(v) => setMount(v as Mount)}
          options={[
            { v: "inside", l: "Dentro do vão", sub: "Visual mais clean", Icon: MountInside },
            { v: "outside", l: "Fora do vão", sub: "Cobre toda a janela", Icon: MountOutside },
          ]}
        />

        <IconOptionGroup
          step={3}
          label="Lado da Cordinha"
          value={side}
          onChange={(v) => setSide(v as Side)}
          options={[
            { v: "left", l: "Esquerda", Icon: CordLeft },
            { v: "right", l: "Direita", Icon: CordRight },
          ]}
        />

        <IconOptionGroup
          step={4}
          label="Acabamentos"
          value={bando ? "with" : "no"}
          onChange={(v) => setBando(v === "with")}
          options={[
            { v: "no", l: "Sem Bandô", Icon: NoBando },
            { v: "with", l: "Com Bandô", price: product.bando_price, Icon: WithBando },
          ]}
        />

        <IconOptionGroup
          step={5}
          label="Acionamento"
          value={motor}
          onChange={(v) => setMotor(v as Motor)}
          columns={3}
          options={[
            { v: "manual", l: "Manual", sub: "Cordinha", Icon: HandManual },
            { v: "rf", l: "Motor + Controle", sub: "Motorizado FR", price: product.motor_rf_price, Icon: MotorRf },
            { v: "wifi", l: "Motor + Controle", sub: "Motorizado Wi-Fi", price: product.motor_wifi_price, Icon: MotorWifi },
          ]}
        />
      </div>

      {/* Frete */}
      <ShippingCalculator
        productId={product.id}
        invoiceValue={subtotal}
        selectedCode={shipping?.serviceCode ?? null}
        onSelect={setShipping}
      />

      {shipping && (
        <div className="rounded-xl bg-sand/40 p-3 text-sm flex justify-between">
          <span className="text-muted-foreground">Frete ({shipping.carrier})</span>
          <span className="font-semibold">{BRL(shipping.price)}</span>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-3 pt-2">
        <Button
          size="lg"
          className="w-full h-14 text-base bg-primary hover:bg-primary/90 shadow-glow"
          onClick={handleBuy}
        >
          COMPRAR AGORA <ChevronRight className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleWhats}
          className="w-full h-12 border-whatsapp text-whatsapp hover:bg-whatsapp hover:text-whatsapp-foreground"
        >
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onClick={() =>
            openLumiWith({
              productName: product.name,
              productSlug: product.slug,
              widthCm: width,
              heightCm: height,
              motor,
              color,
              bando,
              estimatedTotal: total,
            })
          }
          className="w-full h-12 bg-foreground/[0.03] hover:bg-foreground/[0.06] text-foreground"
        >
          <Sparkles className="h-4 w-4 text-primary" /> Perguntar à Lumi
        </Button>
      </div>

      {/* Mini trust */}
      <div className="grid grid-cols-4 gap-2 pt-2 text-center text-[11px]">
        <div className="rounded-lg border bg-card p-2">
          <Ruler className="h-4 w-4 mx-auto text-primary mb-1" />
          Sob medida
        </div>
        <div className="rounded-lg border bg-card p-2">
          <Truck className="h-4 w-4 mx-auto text-primary mb-1" />
          Brasil todo
        </div>
        <div className="rounded-lg border bg-card p-2">
          <Wrench className="h-4 w-4 mx-auto text-primary mb-1" />
          Fácil instalar
        </div>
        <div className="rounded-lg border bg-card p-2">
          <ShieldCheck className="h-4 w-4 mx-auto text-primary mb-1" />
          Compra segura
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={total}
        subtotal={subtotal}
        shipping={shipping}
        item={{
          productId: product.id,
          productName: product.name,
          widthCm: width,
          heightCm: height,
          motor,
          color,
          bando,
          unitPrice: product.price_per_sqm,
        }}
      />
    </div>
  );
}

function StepHeader({ n, title, right }: { n: number; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold shadow-sm">
          {n}
        </span>
        <h3 className="font-display text-lg">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function IconOptionGroup({
  step,
  label,
  value,
  onChange,
  options,
  columns = 2,
}: {
  step: number;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: IconOption[];
  columns?: 2 | 3;
}) {
  return (
    <div>
      <StepHeader n={step} title={label} />
      <div className={`grid gap-2.5 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((o) => {
          const active = value === o.v;
          const Icon = o.Icon;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                active
                  ? "border-primary bg-gradient-to-br from-primary/10 to-primary/[0.03] shadow-md"
                  : "border-border hover:border-foreground/30 hover:bg-sand/30"
              }`}
            >
              <Icon className={`h-9 w-9 ${active ? "text-primary" : "text-foreground/70 group-hover:text-foreground"}`} />
              <div className={`text-sm font-semibold leading-tight ${active ? "text-foreground" : "text-foreground/85"}`}>
                {o.l}
              </div>
              {o.sub && <div className="text-[10px] text-muted-foreground -mt-0.5">{o.sub}</div>}
              {typeof o.price === "number" && o.price > 0 && (
                <div className="text-[10px] font-semibold text-primary">+ {BRL(o.price)}</div>
              )}
              {active && (
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
