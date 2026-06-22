import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ASAAS_BASE = () => {
  const env = (process.env.ASAAS_ENV ?? "sandbox").toLowerCase();
  return env === "production" || env === "live"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
};

async function asaasFetch(path: string, init?: RequestInit) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");
  const res = await fetch(`${ASAAS_BASE()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AgilPersianas/1.0",
      access_token: apiKey,
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (data?.errors as Array<{ description: string }>)?.[0]?.description ||
      `Asaas error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

const QuoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  cpfCnpj: z.string().trim().min(11).max(20),
  phone: z.string().trim().max(20).optional(),
  amount: z.number().positive().max(1_000_000),
  description: z.string().trim().min(2).max(500),
  billingType: z.enum(["PIX", "BOLETO", "UNDEFINED"]).default("UNDEFINED"),
});

export const createQuotePayment = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof QuoteSchema>) => QuoteSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // 1. Cria pedido leve (rastreio + webhook conseguem atualizar status)
      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert({
          customer_name: data.name,
          customer_email: data.email,
          customer_phone: data.phone ?? null,
          subtotal: data.amount,
          total: data.amount,
          items: [{ description: data.description, quantity: 1, price: data.amount }],
          status: "orcamento",
          payment_status: "pendente",
          notes: `Orçamento avulso — ${data.description}`,
        })
        .select("id, order_number")
        .single();

      if (orderErr || !order) {
        console.error("createQuotePayment: erro ao criar pedido", orderErr);
        return { success: false as const, error: "Não foi possível registrar o orçamento." };
      }

      // 2. Cliente Asaas
      const customer = (await asaasFetch("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          cpfCnpj: data.cpfCnpj.replace(/\D/g, ""),
          email: data.email,
          mobilePhone: data.phone ?? undefined,
        }),
      })) as { id: string };

      // 3. Cobrança
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const payment = (await asaasFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: customer.id,
          billingType: data.billingType,
          value: data.amount,
          dueDate,
          description: `${data.description} — Pedido ${order.order_number}`,
          externalReference: order.id,
        }),
      })) as { id: string; invoiceUrl: string; bankSlipUrl?: string };

      // 4. PIX QR (quando aplicável)
      let pixQr: string | null = null;
      let pixPayload: string | null = null;
      if (data.billingType === "PIX") {
        try {
          const qr = (await asaasFetch(`/payments/${payment.id}/pixQrCode`)) as {
            encodedImage: string;
            payload: string;
          };
          pixQr = `data:image/png;base64,${qr.encodedImage}`;
          pixPayload = qr.payload;
        } catch (err) {
          console.warn("createQuotePayment: PIX QR indisponível", err);
        }
      }

      await supabaseAdmin
        .from("orders")
        .update({
          payment_method: data.billingType.toLowerCase(),
          asaas_payment_id: payment.id,
          asaas_invoice_url: payment.invoiceUrl,
          asaas_pix_qrcode: pixQr,
          asaas_pix_payload: pixPayload,
        })
        .eq("id", order.id);

      return {
        success: true as const,
        orderNumber: order.order_number,
        invoiceUrl: payment.invoiceUrl,
        pixQrCode: pixQr,
        pixPayload,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao gerar cobrança";
      console.error("createQuotePayment error:", msg);
      return { success: false as const, error: msg };
    }
  });