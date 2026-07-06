
## Objetivo
Refazer a seção `RoomSimulator` do site na home, elevando-a ao padrão dos melhores visualizadores internacionais de persianas (Bali Blinds Visualizer, Graber VirtuRoom, Blinds.com, Novo Blinds, Instant Interiors — Window Treatments).

## Padrões observados nos referências
Análise consolidada dos 6 visualizadores líderes:
- **Bali Blinds** — upload de foto OU galeria "sample rooms", tips visuais de "boa foto", preview grande à esquerda, seleção de produto/cor à direita.
- **Graber VirtuRoom (FotoQuirk)** — passo a passo numerado (foto → medidas → produto → cor), preview em tela cheia, comparação lado a lado, botão "salvar/compartilhar".
- **Blinds.com Visualizer** — hero grande com CTA "Try it now", 3 passos ilustrados ("Upload / Choose / See"), badge "Free · No login · Powered by AI".
- **Novo Blinds** — layout ultra-minimal ("Your room. Reimagined."), copy curta, 3 cards de passos, resultado em <1 min.
- **Instant Interiors** — Before/After slider grande no topo, galeria de exemplos reais, CTA final para app.
- **Hampton Shade Co.** — banda promocional acima, prova social com fotos reais de clientes.

## Nova estrutura da seção (topo → base)
1. **Hero da seção** — headline mais curta e impactante ("Veja a persiana na sua janela antes de comprar."), eyebrow "Simulador com IA · Grátis · Sem login", 3 badges de confiança (Grátis · Sem cadastro · Resultado em segundos).
2. **Faixa "Como funciona" — 3 passos** com ícones grandes: 1) Envie a foto do ambiente, 2) Escolha modelo + cor, 3) Veja pronto em segundos. Copy curta, estilo Novo Blinds.
3. **Painel do simulador** (o miolo — hoje já existe, mas será reorganizado):
   - **Coluna esquerda (preview grande, ~60%)**:
     - Área de imagem 4:3 arredondada, sombra suave.
     - Antes/depois com slider "compare" quando há resultado (já existe — reforçar visual com handle laranja estilo Bali).
     - Barra inferior com: `Outra foto`, `Usar ambiente de amostra ▾` (dropdown com Sala/Quarto/Escritório — hoje pré-carrega só Sala), `Baixar imagem`, `Compartilhar no WhatsApp`.
     - Estado vazio (sem foto): dropzone grande + botão `Tirar foto` (mobile) / `Enviar foto` (desktop) + link "Ver com ambiente de amostra".
   - **Coluna direita (configurador, ~40%, sticky no desktop)**:
     - Passo 1 — **Categoria** (Rolô, Romana, Double Vision, …): chips horizontais roláveis (não mais `<select>` nativo).
     - Passo 2 — **Modelo/Tecido**: grid 2 col com card visual (imagem + nome), estilo Bali.
     - Passo 3 — **Cor**: swatches redondos grandes com hover/check (já existe — melhorar labels e tamanho).
     - CTA primária **"Simular na minha janela"** — full-width, laranja, com ícone Sparkles, loading state elegante.
     - Micro-copy de rodapé (representação artística por IA + política de foto).
4. **Faixa "Fotos boas ficam melhores"** — 3 mini-cards com dicas ilustradas (janela centralizada · luz natural · sem contraluz forte), inspirado no "Tips for a good photo" da Bali.
5. **Galeria de exemplos reais** — grid 3 col com antes/depois de clientes reais (usar imagens já existentes de `BeforeAfter`, versão condensada), com CTA "Ver mais transformações".
6. **CTA final** — "Gostou? Vamos medir juntos." → botão para orçamento + WhatsApp.

## Melhorias de UX (baseadas nos referências)
- Barra de progresso visual no topo do configurador (Passo 1/2/3).
- Botão **Compartilhar no WhatsApp** com deep-link `https://wa.me/…?text=` + link temporário da imagem.
- Botão **Baixar** salvando PNG com marca d'água discreta "Ágil Persianas".
- Tooltip "?" ao lado de cada passo explicando o que aquilo significa.
- Ao clicar num swatch, se já existe resultado, **re-simula automaticamente** (hoje limpa e obriga clicar de novo).
- Skeleton mais sofisticado enquanto catálogo carrega (hoje é bloco cinza).
- Mensagens de erro claras com CTA "Tentar novamente".
- Analytics: disparar eventos `simulator_upload`, `simulator_generate`, `simulator_download`, `simulator_share`.

## Escopo técnico
Arquivos a alterar (apenas frontend/presentation):
- `src/components/site/RoomSimulator.tsx` — reescrita completa da UI mantendo a lógica atual (catálogo Supabase, `simulate-room` edge function, fallback canvas `composeSimulation`, paletas curadas). Trocar `<select>` nativos por chips/grid, reorganizar em 2 colunas, adicionar dicas + galeria + CTA final dentro da mesma seção.
- Nenhuma mudança em `supabase/functions/simulate-room/index.ts` — a IA já funciona bem.
- Nenhuma mudança em rotas ou dados.

## Fora de escopo
- Não altero o modelo de IA nem o backend.
- Não crio página `/simulador` separada (a rota atual só redireciona para o anchor).
- Não mudo o catálogo do banco.

## Critérios de aceitação
- Seção renderiza sem CLS visível e sem quebras no mobile (coluna única, configurador colapsa acima do preview).
- Preview aparece já com ambiente de amostra pré-carregado, como hoje.
- Trocar cor após simular re-simula automaticamente.
- Compartilhar/baixar funcionam.
- Layout visualmente comparável aos referências (Bali/Graber/Novo), mantendo a identidade Ágil (laranja `#E8531A`, fundo creme, tipografia atual).
