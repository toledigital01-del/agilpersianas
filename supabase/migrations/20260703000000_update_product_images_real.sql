-- Atualiza cover_image de todos os produtos com fotos reais e de alta qualidade
-- Fonte: Pexels (images.pexels.com) e Unsplash (images.unsplash.com) — licença gratuita comercial
-- Parâmetros: w=1260 h=750 dpr=1 para alta resolução otimizada para e-commerce

-- ============================================================
-- 1. PERSIANA ROLÔ — Tela Solar / Screen
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/16153504/pexels-photo-16153504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'rolo-designer-screen-5',
  'persiana-rolo-tela-solar-5-branca',
  'persiana-rolo-tela-solar-3-cinza',
  'persiana-rolo-tela-solar-5-bege'
);

-- ============================================================
-- 2. PERSIANA ROLÔ — Blackout
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/25985681/pexels-photo-25985681.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'persiana-rolo-blackout-cinza-basic',
  'persiana-rolo-blackout-branca',
  'persiana-rolo-blackout-off-white'
);

-- ============================================================
-- 3. PERSIANA ROLÔ — Translúcida / Duo
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/10096397/pexels-photo-10096397.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'rolo-duo-translucida-blackout'
);

-- ============================================================
-- 4. PERSIANA ROLÔ — Night & Day / Zebra / Listrado
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/9270061/pexels-photo-9270061.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'rolo-night-day-listrado'
);

-- ============================================================
-- 5. CORTINA ROMANA — Vignette / Off White / Premium
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/4938326/pexels-photo-4938326.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'romana-vignette-off-white',
  'persiana-romana-bege'
);

-- ============================================================
-- 6. CORTINA ROMANA — Linho Natural
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/30673624/pexels-photo-30673624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'romana-linho-natural-cru',
  'persiana-romana-linho-bege'
);

-- ============================================================
-- 7. CORTINA ROMANA — Blackout
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/4938321/pexels-photo-4938321.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'persiana-romana-blackout-cinza'
);

-- ============================================================
-- 8. CORTINA SILHOUETTE / Double Vision Especial
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/37609127/pexels-photo-37609127.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'silhouette-cinza-perola'
);

-- ============================================================
-- 9. DOUBLE VISION / Pirouette / Zebra
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/9270061/pexels-photo-9270061.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'doublevision-pirouette-branca'
)
OR slug ILIKE '%doublevision%'
OR slug ILIKE '%double-vision%';

-- ============================================================
-- 10. PAINEL JAPONÊS / Sliding Panel
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/34574609/pexels-photo-34574609.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'painel-skyline-bege-linho'
)
OR slug ILIKE '%painel%';

-- ============================================================
-- 11. PERSIANA HORIZONTAL — Madeira / Wood
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/33980196/pexels-photo-33980196.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'horizontal-madeira-imbuia'
)
OR (slug ILIKE '%horizontal%' AND slug ILIKE '%madeira%');

-- ============================================================
-- 12. PERSIANA HORIZONTAL — Alumínio
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/13005096/pexels-photo-13005096.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug ILIKE '%horizontal%alumin%'
   OR slug ILIKE '%horizontal%alumin%';

-- ============================================================
-- 13. PERSIANA HORIZONTAL — PVC
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/24182748/pexels-photo-24182748.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug ILIKE '%horizontal%pvc%';

-- ============================================================
-- 14. PERSIANA VERTICAL
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/239854/pexels-photo-239854.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'vertical-linho-offwhite'
)
OR slug ILIKE '%vertical%bege%'
OR slug ILIKE '%vertical%branca%'
OR slug ILIKE '%vertical%linho%';

-- ============================================================
-- 15. TELA MOSQUITEIRA / Tela Retrátil
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/8955198/pexels-photo-8955198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'mosquiteira-magnetica-branca',
  'tela-mosquiteira-recolhivel-branca'
)
OR slug ILIKE '%mosquiteira%'
OR slug ILIKE '%tela-retratil%';

-- ============================================================
-- 16. TOLDO ARTICULADO / Retrátil
-- ============================================================
UPDATE public.products SET cover_image =
  'https://images.pexels.com/photos/20384369/pexels-photo-20384369.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
WHERE slug IN (
  'toldo-articulado-premium-4x3'
)
OR slug ILIKE '%toldo%';

-- ============================================================
-- 17. Atualizar gallery com múltiplas imagens por tipo (rolo)
-- ============================================================
UPDATE public.products SET gallery =
  '[
    {"url":"https://images.pexels.com/photos/16153504/pexels-photo-16153504.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Luz filtrada pela tela solar"},
    {"url":"https://images.pexels.com/photos/10096397/pexels-photo-10096397.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Efeito de luz e sombra"},
    {"url":"https://images.pexels.com/photos/8955198/pexels-photo-8955198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Persiana de rolo instalada"}
  ]'::jsonb
WHERE slug IN (
  'rolo-designer-screen-5',
  'persiana-rolo-tela-solar-5-branca',
  'persiana-rolo-tela-solar-3-cinza',
  'persiana-rolo-tela-solar-5-bege'
);

UPDATE public.products SET gallery =
  '[
    {"url":"https://images.pexels.com/photos/25985681/pexels-photo-25985681.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Blackout total — escuridão completa"},
    {"url":"https://images.pexels.com/photos/10096397/pexels-photo-10096397.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Ambiente controlado"},
    {"url":"https://images.pexels.com/photos/8955198/pexels-photo-8955198.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Persiana de rolo blackout"}
  ]'::jsonb
WHERE slug IN (
  'persiana-rolo-blackout-cinza-basic',
  'persiana-rolo-blackout-branca',
  'persiana-rolo-blackout-off-white',
  'rolo-duo-translucida-blackout'
);

UPDATE public.products SET gallery =
  '[
    {"url":"https://images.pexels.com/photos/33980196/pexels-photo-33980196.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Detalhe das lâminas de madeira"},
    {"url":"https://images.pexels.com/photos/34538313/pexels-photo-34538313.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Sala com persiana horizontal madeira"},
    {"url":"https://images.pexels.com/photos/37609127/pexels-photo-37609127.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Ambiente com persianas"}
  ]'::jsonb
WHERE slug IN (
  'horizontal-madeira-imbuia'
)
OR (slug ILIKE '%horizontal%' AND slug ILIKE '%madeira%');

UPDATE public.products SET gallery =
  '[
    {"url":"https://images.pexels.com/photos/4938326/pexels-photo-4938326.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Tecido pregueado elegante"},
    {"url":"https://images.pexels.com/photos/30673624/pexels-photo-30673624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Cortina romana em ambiente aconchegante"},
    {"url":"https://images.pexels.com/photos/4938328/pexels-photo-4938328.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Tecido premium dourado"}
  ]'::jsonb
WHERE slug ILIKE '%romana%';

UPDATE public.products SET gallery =
  '[
    {"url":"https://images.pexels.com/photos/20384369/pexels-photo-20384369.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Toldo articulado em fachada"},
    {"url":"https://images.pexels.com/photos/14545936/pexels-photo-14545936.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Área externa com toldo"},
    {"url":"https://images.pexels.com/photos/18867724/pexels-photo-18867724.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1","caption":"Varanda com sombreamento"}
  ]'::jsonb
WHERE slug ILIKE '%toldo%';
