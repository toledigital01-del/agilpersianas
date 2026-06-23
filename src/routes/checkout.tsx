import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, Copy, CheckCircle2, ShieldCheck, Truck, Tag,
  CreditCard, QrCode, FileText, Lock, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createAsaasCharge } from "@/lib/asaas.functions";
import { quoteShipping, type ShippingQuote } from "@/lib/frenet.functions";
import { applyWelcomeCoupon, registerCouponUsage, WELCOME_COUPON } from "@/lib/coupon";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Ágil Persianas" },
      { name: "description", content: "Finalize sua compra com segurança." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutPage,
});

const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export type CheckoutPayload = {
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string | null;
  widthCm: number;
  heightCm: number;
  motor: string;
  color: string;
  bando: boolean;
  unitPrice: number;
  subtotal: number;
};

const STORAGE_KEY = "agil:checkout-payload";

type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const maskCpf = (v: string) => {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11)
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};
const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};
const maskCep = (v: string) => {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};
const maskCard = (v: string) =>
  onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
const maskExp = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState<CheckoutPayload | null>(null);

  // Contato
  const [email, setEmail] = useState("");

  // Entrega
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // Frete
  const [services, setServices] = useState<ShippingQuote[] | null>(null);
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [shipLoading, setShipLoading] = useState(false);
  const [shipError, setShipError] = useState<string | null>(null);
  const quote = useServerFn(quoteShipping);

  // Pagamento
  const [billingType, setBillingType] = useState<BillingType>("PIX");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [installments, setInstallments] = useState(1);

  // Cupom
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Submissão
  const [submitting, setSubmitting] = useState(false);
  const [pixResult, setPixResult] = useState<{ qr: string | null; payload: string | null; invoiceUrl: string } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const createCharge = useServerFn(createAsaasCharge);

  // Carregar payload
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        navigate({ to: "/" });
        return;
      }
      setPayload(JSON.parse(raw) as CheckoutPayload);
    } catch {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const baseSubtotal = payload?.subtotal ?? 0;
  const shippingCost = shipping?.price ?? 0;
  const pixDiscount = billingType === "PIX" ? Math.round(baseSubtotal * 0.05 * 100) / 100 : 0;
  const finalTotal = Math.max(0, baseSubtotal + shippingCost - couponDiscount - pixDiscount);

  // ViaCEP autofill
  async function lookupCep(rawCep: string) {
    const digits = onlyDigits(rawCep);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const j = (await r.json()) as {
        logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean;
      };
      if (j.erro) {
        toast.error("CEP não encontrado");
      } else {
        setAddress(j.logradouro ?? "");
        setNeighborhood(j.bairro ?? "");
        setCity(j.localidade ?? "");
        setStateUf(j.uf ?? "");
      }
    } catch {
      toast.error("Erro ao consultar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  // Quote frete automaticamente quando CEP completo + payload
  useEffect(() => {
    if (!payload) return;
    const digits = onlyDigits(cep);
    if (digits.length !== 8) {
      setServices(null);
      setShipping(null);
      return;
    }
    let cancelled = false;
    setShipLoading(true);
    setShipError(null);
    quote({
      data: {
        destinationCep: digits,
        productId: payload.productId,
        quantity: 1,
        invoiceValue: baseSubtotal,
      },
    })
      .then((r) => {
        if (cancelled) return;
        if (!r.success) {
          setShipError(r.error);
          setServices([]);
        } else {
          setServices(r.services);
          setShipping(r.services[0] ?? null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setShipError(e instanceof Error ? e.message : "Erro ao calcular frete");
      })
      .finally(() => !cancelled && setShipLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cep, payload, baseSubtotal, quote]);

  async function handleApplyCoupon() {
    if (!email) return setCouponMsg({ ok: false, text: "Informe seu e-mail." });
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

  function validate(): string | null {
    if (!/\S+@\S+\.\S+/.test(email)) return "Informe um e-mail válido.";
    if (firstName.trim().length < 2) return "Informe seu nome.";
    if (lastName.trim().length < 2) return "Informe seu sobrenome.";
    const cpfD = onlyDigits(cpf);
    if (cpfD.length !== 11 && cpfD.length !== 14) return "CPF/CNPJ inválido.";
    if (onlyDigits(phone).length < 10) return "Informe um WhatsApp válido.";
    if (onlyDigits(cep).length !== 8) return "Informe um CEP válido.";
    if (!address.trim()) return "Informe o endereço.";
    if (!number.trim()) return "Informe o número.";
    if (!neighborhood.trim()) return "Informe o bairro.";
    if (!city.trim()) return "Informe a cidade.";
    if (!stateUf.trim()) return "Informe o estado.";
    if (!shipping) return "Selecione uma opção de frete.";
    if (billingType === "CREDIT_CARD") {
      if (onlyDigits(cardNumber).length < 13) return "Número do cartão inválido.";
      if (cardExp.length < 5) return "Validade do cartão inválida.";
      if (cardCvv.length < 3) return "CVV inválido.";
      if (cardName.trim().length < 3) return "Informe o nome no cartão.";
    }
    return null;
  }

  async function handleSubmit() {
    if (!payload) return;
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const fullAddress = `${address}, ${number}${complement ? ` - ${complement}` : ""} - ${neighborhood}, ${city}/${stateUf} - CEP ${cep}`;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone,
          items: [{
            productId: payload.productId,
            name: payload.productName,
            width_cm: payload.widthCm,
            height_cm: payload.heightCm,
            motor: payload.motor,
            color: payload.color,
            bando: payload.bando,
            unit_price: payload.unitPrice,
          }],
          subtotal: baseSubtotal,
          discount: couponDiscount,
          total: finalTotal,
          notes: [
            `Endereço: ${fullAddress}`,
            shipping ? `Frete: ${shipping.carrier} (${shipping.serviceDescription}) - ${shipping.deliveryDays}d - ${BRL(shipping.price)}` : null,
            couponDiscount > 0 ? `Cupom ${WELCOME_COUPON.code}: -${BRL(couponDiscount)}` : null,
            billingType === "CREDIT_CARD" ? `Parcelas: ${installments}x` : null,
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
            name: fullName,
            cpfCnpj: onlyDigits(cpf),
            email,
            phone,
            postalCode: onlyDigits(cep),
            addressNumber: number,
          },
        },
      });

      if (!charge.success) throw new Error(charge.error ?? "Falha ao gerar a cobrança.");

      if (couponDiscount > 0) registerCouponUsage(email, order.id).catch(() => {});

      if (billingType === "PIX") {
        setPixResult({ qr: charge.pixQrCode, payload: charge.pixPayload, invoiceUrl: charge.invoiceUrl });
        sessionStorage.removeItem(STORAGE_KEY);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        window.location.href = charge.invoiceUrl;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  function copyPix() {
    if (!pixResult?.payload) return;
    navigator.clipboard.writeText(pixResult.payload);
    toast.success("Código PIX copiado!");
  }

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF6F1" }}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // PIX RESULT VIEW
  if (pixResult) {
    return (
      <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "#FFF6F1" }}>
        <div className="max-w-2xl mx-auto bg-card rounded-2xl border shadow-sm p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <h1 className="font-display text-3xl">Pedido criado!</h1>
          <p className="text-muted-foreground mt-1">Pague via PIX para iniciar a produção.</p>
          <div className="mt-6 inline-block rounded-xl border bg-white p-4">
            {pixResult.qr ? (
              <img src={pixResult.qr} alt="QR Code PIX" className="h-64 w-64" />
            ) : (
              <p className="text-sm text-muted-foreground p-8">QR indisponível — use o código abaixo.</p>
            )}
          </div>
          {pixResult.payload && (
            <div className="mt-4">
              <Label className="text-xs text-muted-foreground">Código copia-e-cola</Label>
              <div className="mt-1 flex gap-2">
                <Input readOnly value={pixResult.payload} className="font-mono text-xs h-11" />
                <Button type="button" onClick={copyPix} className="h-11">
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-6">
            Após o pagamento, enviaremos a confirmação por e-mail e WhatsApp.
          </p>
          <Link to="/" className="mt-6 inline-block text-sm text-primary hover:underline">
            ← Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const specs: string[] = [
    `${(payload.widthCm / 100).toFixed(2)}m × ${(payload.heightCm / 100).toFixed(2)}m`,
    `Cor: ${payload.color}`,
    payload.motor === "manual" ? "Manual" : payload.motor === "rf" ? "Motor RF" : "Motor Wi-Fi",
    payload.bando ? "Com bandô" : null,
  ].filter(Boolean) as string[];

  const Summary = (
    <aside className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
      <div className="flex gap-3">
        {payload.productImage && (
          <img
            src={payload.productImage}
            alt={payload.productName}
            className="h-20 w-20 rounded-lg object-cover border"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-tight truncate">{payload.productName}</div>
          <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
            {specs.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>

      <div className="border-t pt-4">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" /> Cupom de desconto
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Código"
            className="h-10 uppercase"
          />
          <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode}>
            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
          </Button>
        </div>
        {couponMsg && (
          <p className={`text-[11px] mt-1 ${couponMsg.ok ? "text-success" : "text-destructive"}`}>{couponMsg.text}</p>
        )}
      </div>

      <div className="border-t pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{BRL(baseSubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Frete</span>
          <span>{shipping ? BRL(shippingCost) : "—"}</span>
        </div>
        {couponDiscount > 0 && (
          <div className="flex justify-between text-success">
            <span>Cupom</span>
            <span>-{BRL(couponDiscount)}</span>
          </div>
        )}
        {pixDiscount > 0 && (
          <div className="flex justify-between text-success">
            <span>Desconto PIX (5%)</span>
            <span>-{BRL(pixDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-2 border-t">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-bold">{BRL(finalTotal)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-t pt-3">
        <ShieldCheck className="h-3.5 w-3.5 text-success" /> Pagamento processado em ambiente seguro Asaas.
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF6F1" }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          ← Continuar comprando
        </Link>
        <h1 className="font-display text-3xl lg:text-4xl mt-2 mb-6">Finalizar compra</h1>

        {/* Mobile summary accordion */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="w-full bg-card border rounded-xl p-4 flex items-center justify-between"
          >
            <span className="text-sm font-medium">Resumo do pedido</span>
            <span className="flex items-center gap-2 text-sm">
              <strong>{BRL(finalTotal)}</strong>
              {summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>
          {summaryOpen && <div className="mt-3">{Summary}</div>}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* LEFT — Form */}
          <div className="space-y-6">
            {/* Contato */}
            <Section title="Contato" subtitle={<Link to="/auth" className="text-xs text-primary hover:underline">Fazer login</Link>}>
              <Label htmlFor="ck-email">E-mail*</Label>
              <Input id="ck-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="h-11" />
            </Section>

            {/* Entrega */}
            <Section title="Entrega">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Nome*">
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11" />
                </Field>
                <Field label="Sobrenome*">
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" />
                </Field>
                <Field label="CPF / CNPJ*">
                  <Input value={cpf} onChange={(e) => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" className="h-11" />
                </Field>
                <Field label="WhatsApp*">
                  <Input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(31) 9 9999-9999" className="h-11" />
                </Field>
                <Field label="CEP*" className="sm:col-span-2">
                  <div className="flex gap-2">
                    <Input
                      value={cep}
                      onChange={(e) => setCep(maskCep(e.target.value))}
                      onBlur={(e) => lookupCep(e.target.value)}
                      placeholder="00000-000"
                      className="h-11 max-w-[180px]"
                    />
                    <Button type="button" variant="outline" onClick={() => lookupCep(cep)} disabled={cepLoading} className="h-11">
                      {cepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      Buscar
                    </Button>
                    <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary self-center hover:underline">
                      Não sei meu CEP
                    </a>
                  </div>
                </Field>
                <Field label="Endereço*" className="sm:col-span-2">
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11" />
                </Field>
                <Field label="Número*">
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} className="h-11" />
                </Field>
                <Field label="Complemento">
                  <Input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco..." className="h-11" />
                </Field>
                <Field label="Bairro*">
                  <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="h-11" />
                </Field>
                <Field label="Cidade*">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
                </Field>
                <Field label="Estado*">
                  <Input value={stateUf} onChange={(e) => setStateUf(e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" className="h-11" />
                </Field>
              </div>
            </Section>

            {/* Frete */}
            <Section title="Forma de frete">
              {onlyDigits(cep).length !== 8 && (
                <p className="text-sm text-muted-foreground">Informe seu CEP para calcular o frete.</p>
              )}
              {shipLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Calculando frete...
                </div>
              )}
              {shipError && <p className="text-sm text-destructive">{shipError}</p>}
              {services && services.length > 0 && (
                <div className="space-y-2">
                  {services.map((s) => {
                    const active = shipping?.serviceCode === s.serviceCode;
                    return (
                      <button
                        type="button"
                        key={s.serviceCode}
                        onClick={() => setShipping(s)}
                        className={`w-full text-left rounded-xl border-2 p-4 flex items-center justify-between transition-all ${
                          active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Truck className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <div className="font-semibold text-sm">{s.carrier} — {s.serviceDescription}</div>
                            <div className="text-xs text-muted-foreground">Entrega em até {s.deliveryDays} dias úteis</div>
                          </div>
                        </div>
                        <div className="font-semibold">{BRL(s.price)}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* Pagamento */}
            <Section title="Pagamento">
              <div className="grid sm:grid-cols-3 gap-3">
                {([
                  { v: "CREDIT_CARD" as const, l: "Cartão de crédito", sub: "Até 6× sem juros", Icon: CreditCard },
                  { v: "PIX" as const, l: "PIX", sub: "5% de desconto", Icon: QrCode },
                  { v: "BOLETO" as const, l: "Boleto", sub: "Venc. 3 dias", Icon: FileText },
                ]).map((o) => {
                  const active = billingType === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setBillingType(o.v)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${
                        active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                      }`}
                    >
                      <o.Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="mt-1 font-semibold text-sm">{o.l}</div>
                      <div className="text-[11px] text-muted-foreground">{o.sub}</div>
                    </button>
                  );
                })}
              </div>

              {billingType === "CREDIT_CARD" && (
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <Field label="Número do cartão*" className="sm:col-span-2">
                    <Input value={cardNumber} onChange={(e) => setCardNumber(maskCard(e.target.value))} placeholder="0000 0000 0000 0000" className="h-11" />
                  </Field>
                  <Field label="Validade (MM/AA)*">
                    <Input value={cardExp} onChange={(e) => setCardExp(maskExp(e.target.value))} placeholder="MM/AA" className="h-11" />
                  </Field>
                  <Field label="CVV*">
                    <Input value={cardCvv} onChange={(e) => setCardCvv(onlyDigits(e.target.value).slice(0, 4))} placeholder="123" className="h-11" />
                  </Field>
                  <Field label="Nome impresso no cartão*" className="sm:col-span-2">
                    <Input value={cardName} onChange={(e) => setCardName(e.target.value.toUpperCase())} className="h-11" />
                  </Field>
                  <Field label="Parcelas*" className="sm:col-span-2">
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    >
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}× de {BRL(finalTotal / n)} {n === 1 ? "à vista" : "sem juros"}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                    Os dados do cartão são processados em ambiente seguro Asaas.
                  </p>
                </div>
              )}
              {billingType === "PIX" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Após confirmar o pedido, você receberá o <strong>QR Code</strong> e o <strong>código copia-e-cola</strong> imediatamente.
                </p>
              )}
              {billingType === "BOLETO" && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Boleto com vencimento em 3 dias úteis. O pedido entra em produção após a confirmação bancária.
                </p>
              )}
            </Section>

            <Button
              size="lg"
              className="w-full h-14 text-base bg-primary hover:bg-primary/90 shadow-glow"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processando...</>
              ) : (
                <>Finalizar Pedido — {BRL(finalTotal)} <Lock className="h-4 w-4" /></>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Ao finalizar, você concorda com nossos Termos e Política de Privacidade.
            </p>
          </div>

          {/* RIGHT — Summary (desktop) */}
          <div className="hidden lg:block lg:sticky lg:top-6">{Summary}</div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border shadow-sm p-6">
      <header className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg">{title}</h2>
        {subtitle}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}