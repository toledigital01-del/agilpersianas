ALTER TABLE public.products ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Seed initial positions based on created_at (newest first → lowest position)
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM public.products
)
UPDATE public.products p
SET position = ordered.rn
FROM ordered
WHERE p.id = ordered.id AND p.position = 0;

CREATE INDEX IF NOT EXISTS idx_products_position ON public.products(position);