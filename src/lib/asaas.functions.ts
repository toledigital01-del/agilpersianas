import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
      "User-Agent": "AgilPersianas/1.0 (+https://agil2.lovable.app)",
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

const CheckoutSchema = z.object({
  orderId: z.string().uuid(),
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD", "UNDEFINED"]),
  customer: z.object({
    name: z.string().min(2).max(120),
    cpfCnpj: z.string().min(11).max(20),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    postalCode: z.string().optional(),
    addressNumber: z.string().optional(),
  }),
});

export const createAsaasCharge = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof CheckoutSchema>) => CheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    // Carrega o pedido
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, total, customer_name, customer_email, customer_phone, order_number, asaas_payment_id, created_at")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) {
      console.error("Asaas: pedido não encontrado", orderErr);
      return { error: "Pedido não encontrado", success: false as const };
    }

    // Anti-abuse: o checkout é público (guest checkout), então protegemos a função
    // contra dois vetores: (1) re-cobrança de pedido já cobrado e (2) abuso de
    // pedidos antigos. Pedidos só podem gerar cobrança nas primeiras 2h após
    // criação e apenas uma vez.
    if (order.asaas_payment_id) {
      return { success: false as const, error: "Este pedido já possui cobrança gerada." };
    }
    const ageMs = Date.now() - new Date(order.created_at as string).getTime();
    if (ageMs > 2 * 60 * 60 * 1000) {
      return { success: false as const, error: "Pedido expirado para pagamento. Refaça o checkout." };
    }
    if (Number(order.total) <= 0) {
      return { success: false as const, error: "Valor inválido para cobrança." };
    }

    try {
      // 1. Criar/buscar cliente no Asaas
      const customer = (await asaasFetch("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: data.customer.name,
          cpfCnpj: data.customer.cpfCnpj.replace(/\D/g, ""),
          email: data.customer.email ?? order.customer_email ?? undefined,
          mobilePhone: data.customer.phone ?? order.customer_phone ?? undefined,
          postalCode: data.customer.postalCode,
          addressNumber: data.customer.addressNumber,
        }),
      })) as { id: string };

      // 2. Criar cobrança
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const payment = (await asaasFetch("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: customer.id,
          billingType: data.billingType,
          value: Number(order.total),
          dueDate,
          description: `Pedido ${order.order_number} - Ágil Persianas`,
          externalReference: order.id,
        }),
      })) as {
        id: string;
        invoiceUrl: string;
        bankSlipUrl?: string;
        status: string;
      };

      // 3. Se for PIX, buscar o QR Code
      let pixQr: string | null = null;
      let pixPayload: string | null = null;
      if (data.billingType === "PIX") {
        const qr = (await asaasFetch(`/payments/${payment.id}/pixQrCode`)) as {
          encodedImage: string;
          payload: string;
        };
        pixQr = `data:image/png;base64,${qr.encodedImage}`;
        pixPayload = qr.payload;
      }

      // 4. Persistir no pedido
      await supabaseAdmin
        .from("orders")
        .update({
          payment_method: data.billingType.toLowerCase(),
          payment_status: "pendente",
          asaas_payment_id: payment.id,
          asaas_invoice_url: payment.invoiceUrl,
          asaas_pix_qrcode: pixQr,
          asaas_pix_payload: pixPayload,
        })
        .eq("id", order.id);

      return {
        success: true as const,
        paymentId: payment.id,
        invoiceUrl: payment.invoiceUrl,
        pixQrCode: pixQr,
        pixPayload,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao gerar cobrança";
      console.error("Asaas createCharge error:", msg);
      return { success: false as const, error: msg };
    }
  });
