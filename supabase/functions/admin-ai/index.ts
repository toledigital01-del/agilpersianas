// AGIL Admin AI — assistente operacional do painel administrativo.
// Tool-calling não-streaming (loop curto). Apenas administradores autenticados podem chamar.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-3-flash-preview";
const MAX_STEPS = 8;

const SYSTEM_PROMPT = `Você é o AGIL Admin AI — assistente operacional do painel administrativo da Ágil Persianas. Você ajuda o administrador a gerenciar o site, produtos, conteúdo e a consultar dados.

REGRAS:
- Tom profissional, direto, conciso (estilo Apple). Use markdown.
- Sempre que precisar de dados, USE as ferramentas. Não invente.
- Para QUALQUER ação que altera dados (update/create/delete) você SEMPRE chama a tool primeiro com confirmed=false. O backend retorna um preview do que mudaria. Mostre o preview ao usuário em um resumo curto e pergunte "Confirma?". Só chame de novo com confirmed=true quando o usuário disser sim/confirmar/pode/manda/aprovado.
- Se o usuário pedir algo amplo (ex: "reescreve todas as descrições"), primeiro liste o que será afetado antes de pedir confirmação.
- Nunca compartilhe chaves, senhas ou IDs internos sensíveis no chat.
- Para reescrita de descrições, mantenha tom premium (Ágil é marca de persianas sob medida, produção própria).
- Quando entregar uma ação concluída, resuma o resultado em 1-2 linhas.`;

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
};

function admin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// ----------------------- TOOLS -----------------------
const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Lista produtos do catálogo. Filtros opcionais.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Busca por nome/slug" },
          active: { type: "boolean" },
          limit: { type: "number", description: "Padrão 20, máx 100" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product",
      description: "Detalhe completo de 1 produto por slug ou id.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" }, id: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "Lista categorias.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_leads",
      description: "Últimos leads. Filtros opcionais.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          limit: { type: "number", description: "Padrão 10, máx 50" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_orders",
      description: "Últimos pedidos.",
      parameters: {
        type: "object",
        properties: {
          payment_status: { type: "string" },
          limit: { type: "number", description: "Padrão 10, máx 50" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_metrics",
      description: "Métricas resumidas: produtos ativos, leads do mês, pedidos pagos do mês, ticket médio.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_site_setting",
      description: "Lê um registro de site_settings por chave.",
      parameters: { type: "object", properties: { key: { type: "string" } }, required: ["key"] },
    },
  },
  {
    type: "function",
    function: {
      name: "update_product",
      description: "Atualiza campos de um produto. Sempre chame com confirmed=false primeiro para preview, depois confirmed=true.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "slug ou id do produto" },
          fields: {
            type: "object",
            description: "Campos a alterar: name, short_description, description, seo_title, seo_description, price, price_per_sqm, active, badge, featured, bestseller, sale_price",
          },
          confirmed: { type: "boolean" },
        },
        required: ["slug", "fields"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_site_setting",
      description: "Atualiza um registro de site_settings (qualquer módulo). Sempre confirme antes.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "object", description: "Novo JSON completo" },
          confirmed: { type: "boolean" },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "rewrite_product_description",
      description: "Gera uma descrição premium para o produto. confirmed=false retorna preview do texto. confirmed=true grava.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string" },
          target_field: { type: "string", enum: ["description", "short_description"], description: "Padrão description" },
          tone_hint: { type: "string", description: "Opcional, diretriz de tom extra" },
          confirmed: { type: "boolean" },
        },
        required: ["slug"],
      },
    },
  },
];

// ----------------------- TOOL HANDLERS -----------------------
async function callLLMText(prompt: string, apiKey: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }] }),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? "";
}

async function findProduct(sb: ReturnType<typeof admin>, ref: string) {
  let q = sb.from("products").select("*").limit(1);
  if (/^[0-9a-f-]{36}$/i.test(ref)) q = q.eq("id", ref);
  else q = q.eq("slug", ref);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

async function runTool(name: string, args: any, ctx: { apiKey: string; userId: string; userEmail: string }) {
  const sb = admin();

  if (name === "list_products") {
    let q = sb.from("products").select("id,slug,name,short_description,price,active,featured,bestseller,price_per_sqm,cover_image").order("position").limit(Math.min(args?.limit ?? 20, 100));
    if (typeof args?.active === "boolean") q = q.eq("active", args.active);
    if (args?.search) q = q.or(`name.ilike.%${args.search}%,slug.ilike.%${args.search}%`);
    const { data, error } = await q;
    if (error) throw error;
    return { count: data?.length ?? 0, products: data };
  }

  if (name === "get_product") {
    const ref = args?.slug || args?.id;
    if (!ref) return { error: "slug ou id obrigatório" };
    const p = await findProduct(sb, ref);
    return p ?? { error: "produto não encontrado" };
  }

  if (name === "list_categories") {
    const { data, error } = await sb.from("categories").select("id,slug,name,active,position").order("position");
    if (error) throw error;
    return { categories: data };
  }

  if (name === "list_leads") {
    let q = sb.from("leads").select("id,name,phone,email,product_interest,source,status,created_at").order("created_at", { ascending: false }).limit(Math.min(args?.limit ?? 10, 50));
    if (args?.status) q = q.eq("status", args.status);
    const { data, error } = await q;
    if (error) throw error;
    return { count: data?.length ?? 0, leads: data };
  }

  if (name === "list_orders") {
    let q = sb.from("orders").select("id,order_number,customer_email,total,payment_status,created_at").order("created_at", { ascending: false }).limit(Math.min(args?.limit ?? 10, 50));
    if (args?.payment_status) q = q.eq("payment_status", args.payment_status);
    const { data, error } = await q;
    if (error) throw error;
    return { count: data?.length ?? 0, orders: data };
  }

  if (name === "get_metrics") {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const iso = monthStart.toISOString();
    const [{ count: activeProducts }, { count: leadsMonth }, { data: paidOrders }] = await Promise.all([
      sb.from("products").select("id", { count: "exact", head: true }).eq("active", true),
      sb.from("leads").select("id", { count: "exact", head: true }).gte("created_at", iso),
      sb.from("orders").select("total").in("payment_status", ["pago", "aprovado", "confirmed"]).gte("created_at", iso),
    ]);
    const totals = (paidOrders ?? []).map((o: any) => Number(o.total) || 0);
    const revenue = totals.reduce((a, b) => a + b, 0);
    const avg = totals.length ? revenue / totals.length : 0;
    return { active_products: activeProducts ?? 0, leads_this_month: leadsMonth ?? 0, paid_orders_this_month: totals.length, revenue_this_month: revenue, avg_ticket: avg };
  }

  if (name === "get_site_setting") {
    const { data, error } = await sb.from("site_settings").select("*").eq("key", args.key).maybeSingle();
    if (error) throw error;
    return data ?? { error: "chave não encontrada" };
  }

  if (name === "update_product") {
    const ref = args?.slug;
    const fields = args?.fields ?? {};
    if (!ref) return { error: "slug obrigatório" };
    const allowed = ["name", "short_description", "description", "seo_title", "seo_description", "price", "price_per_sqm", "active", "badge", "featured", "bestseller", "sale_price"];
    const cleaned: Record<string, unknown> = {};
    for (const k of Object.keys(fields)) if (allowed.includes(k)) cleaned[k] = fields[k];
    const before = await findProduct(sb, ref);
    if (!before) return { error: "produto não encontrado" };
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const k of Object.keys(cleaned)) if ((before as any)[k] !== cleaned[k]) diff[k] = { from: (before as any)[k], to: cleaned[k] };
    if (Object.keys(diff).length === 0) return { ok: true, message: "Nenhuma mudança detectada." };
    if (!args?.confirmed) {
      return { requires_confirmation: true, preview: { product: before.name, slug: before.slug, diff }, hint: "Reenvie a tool com confirmed=true para gravar." };
    }
    const { error } = await sb.from("products").update(cleaned).eq("id", before.id);
    if (error) throw error;
    await sb.from("admin_ai_actions").insert({ user_id: ctx.userId, user_email: ctx.userEmail, action: "update_product", payload: { slug: before.slug, diff }, status: "ok" });
    return { ok: true, updated: Object.keys(diff), product: before.slug };
  }

  if (name === "update_site_setting") {
    const key = args?.key; const value = args?.value;
    if (!key || typeof value !== "object") return { error: "key e value (object) obrigatórios" };
    const { data: before } = await sb.from("site_settings").select("*").eq("key", key).maybeSingle();
    if (!args?.confirmed) {
      return { requires_confirmation: true, preview: { key, before: before?.value ?? null, after: value }, hint: "Reenvie com confirmed=true." };
    }
    const { error } = await sb.from("site_settings").upsert({ key, value });
    if (error) throw error;
    await sb.from("admin_ai_actions").insert({ user_id: ctx.userId, user_email: ctx.userEmail, action: "update_site_setting", payload: { key, before: before?.value ?? null, after: value }, status: "ok" });
    return { ok: true, key };
  }

  if (name === "rewrite_product_description") {
    const ref = args?.slug;
    const field = args?.target_field === "short_description" ? "short_description" : "description";
    if (!ref) return { error: "slug obrigatório" };
    const p = await findProduct(sb, ref);
    if (!p) return { error: "produto não encontrado" };
    const prompt = `Reescreva a ${field === "short_description" ? "descrição curta (até 180 caracteres, 1 frase)" : "descrição completa (3 a 5 parágrafos curtos, markdown leve)"} do produto abaixo em tom PREMIUM para a marca Ágil Persianas (persianas e cortinas sob medida, produção própria, instalação profissional). Não invente specs. Use apenas o conteúdo abaixo.\n\nProduto: ${p.name}\nDescrição atual: ${p.description ?? "(vazio)"}\nDescrição curta atual: ${p.short_description ?? "(vazio)"}\nTom extra: ${args?.tone_hint ?? "—"}\n\nResponda APENAS com o texto final, sem comentários.`;
    const newText = (await callLLMText(prompt, ctx.apiKey)).trim();
    if (!newText) return { error: "Falha ao gerar texto" };
    if (!args?.confirmed) {
      return { requires_confirmation: true, preview: { product: p.name, field, before: (p as any)[field] ?? "", after: newText }, hint: "Reenvie com confirmed=true para gravar." };
    }
    const { error } = await sb.from("products").update({ [field]: newText }).eq("id", p.id);
    if (error) throw error;
    await sb.from("admin_ai_actions").insert({ user_id: ctx.userId, user_email: ctx.userEmail, action: "rewrite_product_description", payload: { slug: p.slug, field, before: (p as any)[field] ?? "", after: newText }, status: "ok" });
    return { ok: true, product: p.slug, field, length: newText.length };
  }

  return { error: `tool desconhecida: ${name}` };
}

// ----------------------- AUTH -----------------------
async function authorize(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { ok: false as const, error: "Sem token" };
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: u, error } = await sb.auth.getUser();
  if (error || !u?.user) return { ok: false as const, error: "Sessão inválida" };
  const adm = admin();
  const { data: role } = await adm.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
  if (!role) return { ok: false as const, error: "Acesso negado: requer admin" };
  return { ok: true as const, userId: u.user.id, userEmail: u.user.email ?? "" };
}

// ----------------------- HANDLER -----------------------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await authorize(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const body = await req.json();
    const incoming: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }, ...incoming];

    const ctx = { apiKey: LOVABLE_API_KEY, userId: auth.userId, userEmail: auth.userEmail };
    const newMessages: ChatMessage[] = [];

    for (let step = 0; step < MAX_STEPS; step++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: [...messages, ...newMessages], tools: TOOLS, tool_choice: "auto" }),
      });
      if (res.status === 429) return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos ao workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!res.ok) {
        const t = await res.text();
        console.error("admin-ai gateway error", res.status, t);
        return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await res.json();
      const choice = j?.choices?.[0]?.message;
      if (!choice) return new Response(JSON.stringify({ error: "Resposta inválida do modelo" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const calls = choice.tool_calls as ChatMessage["tool_calls"];
      newMessages.push({ role: "assistant", content: choice.content ?? null, tool_calls: calls });
      if (!calls || calls.length === 0) break;
      for (const call of calls) {
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch { /* ignore */ }
        let result: unknown;
        try {
          result = await runTool(call.function.name, args, ctx);
        } catch (e) {
          result = { error: e instanceof Error ? e.message : String(e) };
          try { await admin().from("admin_ai_actions").insert({ user_id: ctx.userId, user_email: ctx.userEmail, action: call.function.name, payload: args, status: "error", error: String(result) }); } catch { /* ignore */ }
        }
        newMessages.push({ role: "tool", tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) });
      }
    }

    return new Response(JSON.stringify({ messages: newMessages }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-ai fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});