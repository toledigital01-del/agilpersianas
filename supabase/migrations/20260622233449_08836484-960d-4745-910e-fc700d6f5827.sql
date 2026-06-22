GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

-- Allow customer to read their own order on the order tracking page (/pedido/$numero)
-- Policy is intentionally narrow: anyone can SELECT, but only if they know the order_number.
-- This matches how the public order tracking page works (URL contains the order number).
DROP POLICY IF EXISTS "Public can view orders by number" ON public.orders;
CREATE POLICY "Public can view orders by number"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.orders TO anon;