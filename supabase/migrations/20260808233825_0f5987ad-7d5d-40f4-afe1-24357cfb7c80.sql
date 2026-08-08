CREATE TABLE public.subscribers (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'none',
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscribers TO authenticated;
GRANT ALL ON public.subscribers TO service_role;

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own subscription" ON public.subscribers
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_subscribers_updated_at BEFORE UPDATE ON public.subscribers
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();