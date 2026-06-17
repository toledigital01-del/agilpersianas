## Objetivo
Priorizar a IA do painel admin (executora com confirmação em ações críticas) que faz tudo: produtos, imagens, configurações do site, e consulta de leads/pedidos/relatórios. Otimização batch de imagens e SEO de alt/filenames ficam para etapas seguintes (ou podem ser executados pela própria IA depois).

## Etapa 1 — IA Admin (entregável desta rodada)

### Nova tela
- Rota: `/admin/ia` (link no menu lateral do admin)
- Interface de chat estilo Apple (consistente com a Lumi), mas dedicada à administração
- Persistência: localStorage (1 conversa contínua, botão "Nova conversa")
- Renderiza markdown + cards de "ação pendente" quando há confirmação

### Backend
- Nova Edge Function `admin-ai` (separada da `lumi-chat` que é voltada ao cliente)
- Streaming via AI SDK + Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Autenticação obrigatória: só usuários com role `admin` podem chamar (valida JWT + `has_role`)
- System prompt define persona "AGIL Admin AI" — assistente operacional do painel

### Ferramentas (tools) que a IA pode chamar
**Leitura (sem confirmação):**
- `list_products` (filtros: ativo, categoria, busca)
- `get_product` (por slug ou id)
- `list_categories`
- `list_leads` (últimos N, filtro por status)
- `list_orders` (últimos N, filtro por status de pagamento)
- `get_site_setting` (qualquer chave de `site_settings`)
- `get_metrics` (resumo: nº produtos ativos, leads do mês, pedidos pagos do mês, ticket médio)

**Escrita com confirmação automática (ações críticas):**
Toda tool que muta dados retorna `requires_confirmation: true` na primeira chamada; o usuário confirma no chat e a IA reenvia com `confirmed: true`:
- `update_product` (descrição, short_description, SEO title/desc, alt text, preço, ativo)
- `create_product` (novo SKU)
- `delete_product` (sempre confirma)
- `update_site_setting` (qualquer módulo do `/admin/site`: hero, banners, footer, FAQ, etc.)
- `regenerate_product_alt_text` (gera alt SEO-friendly via IA para 1 ou N produtos)
- `optimize_product_images` (converte para WebP + resize 1600px máx + reupload; atualiza URLs no banco)
- `rewrite_product_description` (premium tone via IA)
- `bulk_update_seo` (gera title + meta_description para N produtos faltantes)

### Pattern de confirmação
1. Usuário pede: "Reescreve as descrições dos 5 últimos produtos"
2. IA chama tool → backend retorna preview + `requires_confirmation: true`
3. Chat exibe card: "Vou reescrever 5 descrições. Confirmar?"
4. Usuário clica "Confirmar" (ou digita "sim")
5. IA reexecuta com flag `confirmed: true` → backend aplica e retorna resultado

### Tabela nova
- `admin_ai_actions` (log de auditoria: id, user_id, action, payload, result, status, created_at)
- RLS: só admins veem; insert via service role na edge function

## Etapa 2 — Otimização batch das imagens existentes
Executada via a tool `optimize_product_images` da própria IA admin (você pede no chat: "otimiza todas as imagens do catálogo").
- Lista todos `products.cover_image` + `product_images` que não são WebP ou são > 1600px
- Em background: baixa, processa com `sharp` (server-side via edge function ou job), reenvia ao bucket, atualiza URLs
- Como Cloudflare Workers/edge functions Deno têm limitação para `sharp`, usar `@jsquash/webp` (WebAssembly, compatível com Deno) ou processar em chunks pelo gateway de imagem

## Etapa 3 — SEO de alt/filename a partir do admin
Tool `regenerate_product_alt_text` + ajuste no `ImageUpload` para gravar `alt` ao lado da URL.
- Schema: adicionar coluna `alt_text` em `product_images` (se ainda não existir) e usar `<img alt={...}>` no front
- IA gera alt baseado em: nome do produto + categoria + cor/variante

## Detalhes técnicos
- Edge function usa AI SDK (`npm:ai`, `npm:@ai-sdk/openai-compatible`) com `streamText` + `tools` + `stopWhen: stepCountIs(50)`
- Tools com `execute` no servidor — sem `needsApproval` da AI SDK (usamos pattern próprio de confirmação para ficar visual no chat)
- Cliente: `useChat` do `@ai-sdk/react` + `DefaultChatTransport` apontando para `/functions/v1/admin-ai`
- Renderiza `message.parts` (text + tool-invocation + tool-result)
- Auth: envia `Authorization: Bearer <session.access_token>` nas chamadas

## O que NÃO entra agora
- Tela dedicada de "gerenciar imagens em massa" (a IA cobre isso via chat)
- Refazer toda a UI dos módulos do admin (a IA escreve direto nas tabelas existentes)
- Histórico/auditoria com UI bonita (fica só o log na tabela, exibimos depois)

## Após aprovação
Começo criando a migration (`admin_ai_actions`), depois a edge function `admin-ai` com 3-4 tools de leitura + `update_product` + `update_site_setting` para um MVP funcional, e a rota `/admin/ia`. As demais tools (otimização de imagens, bulk SEO, alt) ficam para o turno seguinte para você validar o pattern antes.
