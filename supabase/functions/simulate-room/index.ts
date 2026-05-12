import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageDataUrl, product, color, ambient } = await req.json();
    if (!imageDataUrl || !product) {
      return new Response(JSON.stringify({ error: "imageDataUrl e product são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const colorTxt = color ? ` na cor ${color}` : "";
    const ambTxt = ambient ? ` (ambiente: ${ambient})` : "";

    const prompt = `Você é um especialista em visualização de interiores. Identifique TODAS as janelas visíveis nesta foto de ambiente${ambTxt} e instale de forma fotorrealista uma ${product}${colorTxt} cobrindo cada janela completamente, do topo do batente até abaixo do peitoril, com largura proporcional ao vão.

Regras obrigatórias:
- Mantenha exatamente o mesmo enquadramento, perspectiva, móveis, paredes, piso, iluminação e cores do ambiente original.
- A persiana deve ter sombras coerentes com a luz natural da cena, textura do tecido visível, dobras suaves e fixação realista no topo da janela.
- Não altere nada além das janelas. Não adicione texto, marca d'água, bordas ou logotipos.
- Resultado em alta qualidade, parecendo uma fotografia real do ambiente já com a persiana instalada.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI gateway error", resp.status, txt);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas simulações em pouco tempo. Aguarde alguns segundos.", code: "rate_limited" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings → Cloud & AI balance.", code: "credits_exhausted" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Falha ao gerar simulação. Tente novamente.", code: "ai_error" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) {
      console.error("Sem imagem na resposta", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "A IA não retornou imagem. Tente outra foto.", code: "no_image" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl: url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simulate-room error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido", code: "server_error" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});