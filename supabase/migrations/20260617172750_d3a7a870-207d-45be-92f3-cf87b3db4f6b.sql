CREATE TABLE public.admin_ai_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  status text NOT NULL DEFAULT 'ok',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_ai_actions TO authenticated;
GRANT ALL ON public.admin_ai_actions TO service_role;

ALTER TABLE public.admin_ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read ai actions"
  ON public.admin_ai_actions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_admin_ai_actions_created ON public.admin_ai_actions (created_at DESC);