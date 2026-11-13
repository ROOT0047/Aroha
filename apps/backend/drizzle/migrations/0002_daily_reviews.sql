CREATE TABLE public.daily_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('morning','evening')),
  summary text NOT NULL DEFAULT '',
  missions jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, review_date, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_reviews TO authenticated;
GRANT ALL ON public.daily_reviews TO service_role;
ALTER TABLE public.daily_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reviews select" ON public.daily_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own reviews insert" ON public.daily_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reviews update" ON public.daily_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own reviews delete" ON public.daily_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);