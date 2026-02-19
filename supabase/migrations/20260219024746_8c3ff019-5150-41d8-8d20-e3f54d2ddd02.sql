
CREATE TABLE public.insurance_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'primary', -- 'primary' | 'secondary' | 'pharmacy'
  carrier TEXT NOT NULL,
  plan_name TEXT,
  member_id TEXT,
  group_number TEXT,
  rx_bin TEXT,
  rx_pcn TEXT,
  rx_group TEXT,
  phone TEXT,
  website TEXT,
  effective_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insurance plans"
  ON public.insurance_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insurance plans"
  ON public.insurance_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insurance plans"
  ON public.insurance_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insurance plans"
  ON public.insurance_plans FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_insurance_plans_updated_at
  BEFORE UPDATE ON public.insurance_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
