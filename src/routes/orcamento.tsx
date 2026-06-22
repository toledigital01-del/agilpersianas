import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, CheckCircle2, ExternalLink, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createQuotePayment } from "@/lib/quote.functions";

export const Route = createFileRoute("/orcamento")({
  head: () => ({
    meta: [
      { title: "Solicitar Orçamento e Pagamento — Ágil Persianas" },
      {
        name: "description",
        content:
          "Solicite seu orçamento personalizado e pague online com PIX, boleto ou cartão. Pagamento seguro via Asaas.",
      },
      { property: "og:title", content: "Solicitar Orçamento — Ágil Persianas" },
      {
        property: "og:description",
        content: "Gere sua cobrança em segundos. PIX, boleto ou cartão.",
      },
    ],
  }),
  component: QuotePage,
});

type Result = {
  orderNumber: string;
  invoiceUrl: string;
  pixQrCode: string | null;
  pixPayload: string | null;
};

function QuotePage() {
  const run = useServerFn(createQuotePayment);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpfCnpj: "",
    phone: "",
    amount: "",
    description: "",
    billingType: "PIX" as "PIX" | "BOLETO" | "UNDEFINED",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(form.amount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setBusy(true);
    try {
      const r = await run({
        data: {
          name: form.name,
          email: form.email,
          cpfCnpj: form.cpfCnpj,
          phone: form.phone || undefined,
          amount,
          description: form.description,
          billingType: form.billingType,
        },
      });
      if (!r.success) {
        toast.error(r.error ?? "Falha ao gerar cobrança");
        return;
      }
      setResult({
        orderNumber: r.orderNumber,
        invoiceUrl: r.invoiceUrl,
        pixQrCode: r.pixQrCode,
        pixPayload: r.pixPayload,
      });
      toast.success("Cobrança gerada com sucesso!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function copyPix() {
    if (!result?.pixPayload) return;
    navigator.clipboard.writeText(result.pixPayload);
    toast.success("Código PIX copiado");
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à home
        </Link>

        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Pagamento online
          </div>
          <h1 className="font-display text-3xl mt-1">Solicitar orçamento e pagamento</h1>
          <p className="text-muted-foreground mt-2">
            Preencha seus dados e o valor combinado para gerar sua cobrança via PIX, boleto ou
            cartão.
          </p>
        </div>

        {result ? (
          <Card className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="font-display text-xl">Cobrança gerada</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pedido <strong>{result.orderNumber}</strong>
                </p>
              </div>
            </div>

            {result.pixQrCode && (
              <div className="rounded-lg border bg-card p-4 text-center">
                <p className="text-sm font-medium mb-3">Pague com PIX</p>
                <img
                  src={result.pixQrCode}
                  alt="QR Code PIX"
                  className="mx-auto h-56 w-56 object-contain"
                />
                {result.pixPayload && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyPix}
                    className="mt-3"
                  >
                    <Copy className="h-4 w-4" /> Copiar código PIX
                  </Button>
                )}
              </div>
            )}

            <a
              href={result.invoiceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Abrir página de pagamento <ExternalLink className="h-4 w-4" />
            </a>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setResult(null)}
            >
              Gerar nova cobrança
            </Button>
          </Card>
        ) : (
          <Card className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpf">CPF / CNPJ *</Label>
                  <Input
                    id="cpf"
                    required
                    value={form.cpfCnpj}
                    onChange={(e) => update("cpfCnpj", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    required
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => update("amount", e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="billing">Forma de pagamento</Label>
                  <Select
                    value={form.billingType}
                    onValueChange={(v) =>
                      update("billingType", v as "PIX" | "BOLETO" | "UNDEFINED")
                    }
                  >
                    <SelectTrigger id="billing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX (instantâneo)</SelectItem>
                      <SelectItem value="BOLETO">Boleto bancário</SelectItem>
                      <SelectItem value="UNDEFINED">
                        Cliente escolhe (PIX / boleto / cartão)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Descrição do produto ou serviço *</Label>
                <Textarea
                  id="desc"
                  required
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Ex.: Persiana rolo blackout 1,20m x 1,60m — cor cinza"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <Button type="submit" disabled={busy} className="w-full" size="lg">
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando cobrança…
                  </>
                ) : (
                  "Gerar link de pagamento"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Pagamento processado com segurança via Asaas. Você receberá o link e, se for
                PIX, o QR Code logo após confirmar.
              </p>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}