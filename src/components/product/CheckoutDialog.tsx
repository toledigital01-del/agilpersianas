import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Copy, ExternalLink, CheckCircle2, ShieldCheck, Truck, Tag,
  CreditCard, QrCode, FileText, Lock, ChevronRight, ChevronLeft, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createAsaasCharge } from "@/lib/asaas.functions";
import { ShippingCalculator } from "./ShippingCalculator";
import type { ShippingQuote } from "@/lib/frenet.functions";
import { applyWelcomeCoupon, registerCouponUsage, WELCOME_COUPON } from "@/lib/coupon";

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export type CheckoutItem = {
  productId: string;
  productName: string;
  widthCm: number;
  heightCm: number;
  motor: string;
  color: string;
  bando: boolean;
  unitPrice: number;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  subtotal?: number;
  shipping?: ShippingQuote | null;
  item: CheckoutItem;
};

type ChargeResult = {
  paymentId: string;
  invoiceUrl: string;
  pixQrCode: string | null;
  pixPayload: string | null;
  billingType: BillingType;
};

const STEPS = ["Identificação", "Entrega", "Pagamento"] as const;

const maskCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

export function CheckoutDialog({
  open,
  onOpenChange,
  total,
  subtotal,
  shipping: initialShipping,
  item,
}: Props) {
  const [stage, setStage] = useState<"form" | "loading" | "success">("form");
  const [stepIdx, setStepIdx] = useState(0);
  const [billingType, setBillingType] = useState<BillingType>("PIX");
  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState<ShippingQuote | null>(initialShipping ?? null);
  const [result, setResult] = useState<ChargeResult | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const baseSubtotal = subtotal ?? total;
  const shippingCost = shipping?.price ?? 0;
  const pixDiscount = billingType === "PIX" ? Math.round(baseSubtotal * 0.05 * 100) / 100 : 0;
  const finalTotal = Math.max(0, baseSubtotal + shippingCost - couponDiscount - pixDiscount);
  const installmentValue = billingType === "CREDIT_CARD" ? finalTotal / 6 : 0;

  const identOk = useMemo(() => {
    const digits = cpfCnpj.replace(/\D/g, "");
    return name.trim().length >= 3 && (digits.length === 11 || digits.length === 14) && /\S+@\S+\.\S+/.test(email) && phone.replace(/\D/g, "").length >= 10;
  }, [name, cpfCnpj, email, phone]);

  async function handleApplyCoupon() {
    if (!email) return setCouponMsg({ ok: false, text: "Informe seu e-mail para validar o cupom." });
    if (couponCode.trim().toUpperCase() !== WELCOME_COUPON.code) {
      setCouponMsg({ ok: false, text: "Cupom não reconhecido." });
      setCouponDiscount(0);
      return;
    }
    setCouponLoading(true);
    const r = await applyWelcomeCoupon(email, baseSubtotal);
    setCouponLoading(false);
    if (!r.ok) {
      setCouponDiscount(0);
      setCouponMsg({ ok: false, text: r.reason ?? "Cupom inválido." });
      return;
    }
    setCouponDiscount(r.discount);
    setCouponMsg({ ok: true, text: `Cupom aplicado: -${BRL(r.discount)}` });
  }

  const createCharge = useServerFn(createAsaasCharge);

  function reset() {
    setStage("form");
    setStepIdx(0);
    setResult(null);
  }

  async function submitCharge() {
    setStage("loading");
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_name: name,
          customer_email: email || null,
          customer_phone: phone || null,
          items: [{
            productId: item.productId,
            name: item.productName,
            width_cm: item.widthCm,
            height_cm: item.heightCm,
            motor: item.motor,
            color: item.color,
            bando: item.bando,
            unit_price: item.unitPrice,
          }],
          subtotal: baseSubtotal,
          discount: couponDiscount,
          total: finalTotal,
          notes: [
            shipping ? `Frete: ${shipping.carrier} (${shipping.serviceDescription}) - ${shipping.deliveryDays}d - R$ ${shipping.price.toFixed(2)} | CEP ${cep || "-"}` : null,
            couponDiscount > 0 ? `Cupom ${WELCOME_COUPON.code}: -${BRL(couponDiscount)}` : null,
          ].filter(Boolean).join(" | "),
        })
        .select("id")
        .single();

      if (orderErr || !order) throw new Error(orderErr?.message ?? "Não foi possível criar o pedido.");

      const charge = await createCharge({
        data: {
          orderId: order.id,
          billingType,
          customer: {
            name,
            cpfCnpj: cpfCnpj.replace(/\D/g, ""),
            email: email || undefined,
            phone: phone || undefined,
            postalCode: cep.replace(/\D/g, "") || undefined,
          },
        },
      });

      if (!charge.success) throw new Error(charge.error ?? "Falha ao gerar a cobrança");

      setResult({
        paymentId: charge.paymentId,
        invoiceUrl: charge.invoiceUrl,
        pixQrCode: charge.pixQrCode,
        pixPayload: charge.pixPayload,
        billingType,
      });
      if (couponDiscount > 0 && email) registerCouponUsage(email, order.id).catch(() => {});
      setStage("success");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro inesperado");
      setStage("form");
    }
  }

  function handleNext() {
    if (stepIdx === 0) {
      if (!identOk) return toast.error("Preencha todos os dados de identificação");
      setStepIdx(1);
    } else if (stepIdx === 1) {
      if (!shipping) return toast.error("Selecione uma opção de frete");
      setStepIdx(2);
    } else {
      submitCharge();
    }
  }

  function copyPix() {
    if (!result?.pixPayload) return;
    navigator.clipboard.writeText(result.pixPayload);
    toast.success("Código PIX copiado!");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden p-0 gap-0">
        {stage === "form" && (
          <div className="grid md:grid-cols-[1fr_360px] max-h-[92vh]">
            {/* MAIN */}
            <div className="overflow-y-auto p-6 lg:p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-primary font-semibold">Finalizar compra</div>
                  <h2 className="font-display text-2xl mt-0.5">Falta pouco para receber em casa</h2>
                </div>
                <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stepper */}
              <ol className="flex items-center gap-2 mb-6">
                {STEPS.map((s, i) => {
                  const done = i < stepIdx;
                  const active = i === stepIdx;
                  return (
                    <li key={s} className="flex-1 flex items-center gap-2">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                        done ? "bg-success text-white" : active ? "bg-primary text-primary-foreground shadow" : "bg-muted text-muted-foreground"
                      }`}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                      {i < STEPS.length - 1 && <span className={`flex-1 h-px ${done ? "bg-success" : "bg-border"}`} />}
                    </li>
                  );
                })}
              </ol>

              {/* STEP 1 */}
              {stepIdx === 0 && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <Label htmlFor="ck-name">Nome completo*</Label>
                      <Input id="ck-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como aparece no seu documento" className="h-11" />
                    </div>
                    <div>
                      <Label htmlFor="ck-doc">CPF ou CNPJ*</Label>
                      <Input id="ck-doc" value={cpfCnpj} onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))} placeholder="000.000.000-00" className="h-11" />
                    </div>
                    <div>
                      <Label htmlFor="ck-phone">WhatsApp / Telefone*</Label>
                      <Input id="ck-phone" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(31) 9 9999-9999" className="h-11" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="ck-email">E-mail*</Label>
                      <Input id="ck-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-11" />
                      <p className="text-[11px] text-muted-foreground mt-1">Enviamos o comprovante e o status da entrega por aqui.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {stepIdx === 1 && (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-sand/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <Truck className="h-4 w-4 text-primary" /> Calcule o frete e prazo
                    </div>
                    <ShippingCalculator
                      productId={item.productId}
                      invoiceValue={baseSubtotal}
                      selectedCode={shipping?.serviceCode ?? null}
                      onSelect={(s) => setShipping(s)}
                      onCepChange={setCep}
                      compact
                    />
                  </div>
                  <div className="rounded-xl border border-dashed border-primary/40 p-4 bg-primary/5">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
                      <Tag className="h-3.5 w-3.5" /> Tem cupom de desconto?
                    </div>
                    <div className="flex gap-2">
                      <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Ex.: BEMVINDO10" className="h-10 uppercase" />
                      <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode}>
                        {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                      </Button>
                    </div>
                    {couponMsg && (
                      <p className={`text-[11px] mt-1 ${couponMsg.ok ? "text-success" : "text-destructive"}`}>{couponMsg.text}</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {stepIdx === 2 && (
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground block">
                    Forma de pagamento
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { v: "PIX" as const, l: "PIX", sub: "5% de desconto", Icon: QrCode, badge: "Mais rápido" },
                      { v: "CREDIT_CARD" as const, l: "Cartão", sub: "Até 6× sem juros", Icon: CreditCard, badge: "Sem burocracia" },
                      { v: "BOLETO" as const, l: "Boleto", sub: "3 dias úteis", Icon: FileText, badge: null },
                    ]).map((o) => {
                      const active = billingType === o.v;
                      return (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => setBillingType(o.v)}
                          className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                            active
                              ? "border-primary bg-gradient-to-br from-primary/10 to-primary/[0.03] shadow-md"
                              : "border-border hover:border-foreground/30"
                          }`}
                        >
                          {o.badge && (
                            <span className="absolute -top-2 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              {o.badge}
                            </span>
                          )}
                          <o.Icon className={`h-6 w-6 ${active ? "text-primary" : "text-foreground/60"}`} />
                          <div className="mt-2 font-semibold">{o.l}</div>
                          <div className="text-[11px] text-muted-foreground">{o.sub}</div>
                          {active && (
                            <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-xl border bg-card p-4 text-sm">
                    {billingType === "PIX" && (
                      <p>Você receberá o <strong>QR Code</strong> e o <strong>código copia-e-cola</strong> imediatamente. O pedido entra em produção assim que o pagamento cai (em segundos).</p>
                    )}
                    {billingType === "CREDIT_CARD" && (
                      <p>Pagamento processado em ambiente seguro. Você será redirecionado(a) para preencher os dados do cartão. Aprovação em segundos.</p>
                    )}
                    {billingType === "BOLETO" && (
                      <p>Boleto com vencimento em 3 dias úteis. O pedido entra em produção após a confirmação bancária (1–2 dias úteis).</p>
                    )}
                  </div>
                </div>
              )}

              {/* Nav buttons */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => stepIdx > 0 && setStepIdx(stepIdx - 1)}
                  disabled={stepIdx === 0}
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  size="lg"
                  className="h-12 px-6 bg-primary hover:bg-primary/90 shadow-glow"
                  onClick={handleNext}
                  disabled={stepIdx === 1 && !shipping}
                >
                  {stepIdx < 2 ? (
                    <>Continuar <ChevronRight className="h-5 w-5" /></>
                  ) : (
                    <>Finalizar — {BRL(finalTotal)} <Lock className="h-4 w-4" /></>
                  )}
                </Button>
              </div>

              {/* Trust */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" /> SSL 256-bit</span>
                <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Compra protegida</span>
                <span className="inline-flex items-center gap-1">⚡ Confirmação imediata</span>
              </div>
            </div>

            {/* SUMMARY (sticky on md+) */}
            <aside className="bg-gradient-to-b from-sand/40 to-background border-t md:border-t-0 md:border-l p-6 overflow-y-auto">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Resumo do pedido</div>
              <div className="mt-3 rounded-xl border bg-card p-3">
                <div className="font-semibold text-sm leading-snug">{item.productName}</div>
                <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
                  <div>📐 {(item.widthCm / 100).toFixed(2)} m × {(item.heightCm / 100).toFixed(2)} m</div>
                  <div>🎨 Cor: {item.color}</div>
                  <div>🔧 {item.motor === "manual" ? "Manual" : item.motor === "rf" ? "Motor RF" : "Motor Wi-Fi"}{item.bando ? " · Com bandô" : ""}</div>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <Row label="Subtotal" value={BRL(baseSubtotal)} />
                <Row label="Frete" value={shipping ? BRL(shippingCost) : "a calcular"} muted={!shipping} />
                {couponDiscount > 0 && <Row label={`Cupom ${WELCOME_COUPON.code}`} value={`-${BRL(couponDiscount)}`} success />}
                {pixDiscount > 0 && <Row label="Desconto PIX (5%)" value={`-${BRL(pixDiscount)}`} success />}
              </div>

              <div className="mt-3 pt-3 border-t flex items-baseline justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="font-display text-2xl">{BRL(finalTotal)}</span>
              </div>
              {installmentValue > 0 && (
                <div className="text-[11px] text-right text-muted-foreground mt-0.5">
                  ou 6× de <strong className="text-foreground">{BRL(installmentValue)}</strong> sem juros
                </div>
              )}

              <div className="mt-5 space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> Produzido sob medida e entregue em todo o Brasil.</div>
                <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> 12 meses de garantia direto da fábrica.</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Atendimento humano por WhatsApp.</div>
              </div>
            </aside>
          </div>
        )}

        {stage === "loading" && (
          <div className="py-16 px-8 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Gerando sua cobrança…</p>
          </div>
        )}

        {stage === "success" && result && (
          <div className="p-8 max-w-md mx-auto space-y-4">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-3">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-display text-2xl">Pedido criado!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Conclua o pagamento abaixo — confirmamos automaticamente assim que cair.
              </p>
            </div>

            {result.billingType === "PIX" && result.pixQrCode && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img src={result.pixQrCode} alt="QR Code PIX" className="h-56 w-56 rounded-lg border bg-white p-2" />
                </div>
                {result.pixPayload && (
                  <div>
                    <Label className="text-xs">Pix Copia e Cola</Label>
                    <div className="flex gap-2 mt-1">
                      <Input readOnly value={result.pixPayload} className="text-xs font-mono" />
                      <Button type="button" variant="outline" onClick={copyPix}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button asChild size="lg" className="w-full">
              <a href={result.invoiceUrl} target="_blank" rel="noopener">
                <ExternalLink className="h-4 w-4" />
                {result.billingType === "BOLETO" ? "Visualizar boleto"
                  : result.billingType === "CREDIT_CARD" ? "Pagar com cartão"
                  : "Ver fatura completa"}
              </a>
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, muted, success }: { label: string; value: string; muted?: boolean; success?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={success ? "text-success font-medium" : muted ? "text-muted-foreground" : ""}>{value}</span>
    </div>
  );
}
