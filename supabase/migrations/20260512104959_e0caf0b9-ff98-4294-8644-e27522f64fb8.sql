-- Profiles: lock down public read
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- is_first_purchase: only service_role may execute
REVOKE EXECUTE ON FUNCTION public.is_first_purchase(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.is_first_purchase(text) TO service_role;