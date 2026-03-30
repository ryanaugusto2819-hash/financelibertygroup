CREATE TABLE IF NOT EXISTS public.finance_manual_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_manual_values ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_values'
      AND policyname = 'Allow public read finance manual values'
  ) THEN
    CREATE POLICY "Allow public read finance manual values"
    ON public.finance_manual_values
    FOR SELECT
    TO anon
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_values'
      AND policyname = 'Allow public insert finance manual values'
  ) THEN
    CREATE POLICY "Allow public insert finance manual values"
    ON public.finance_manual_values
    FOR INSERT
    TO anon
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_values'
      AND policyname = 'Allow public update finance manual values'
  ) THEN
    CREATE POLICY "Allow public update finance manual values"
    ON public.finance_manual_values
    FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_manual_values'
      AND policyname = 'Allow public delete finance manual values'
  ) THEN
    CREATE POLICY "Allow public delete finance manual values"
    ON public.finance_manual_values
    FOR DELETE
    TO anon
    USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_finance_manual_values_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_finance_manual_values_updated_at ON public.finance_manual_values;

CREATE TRIGGER update_finance_manual_values_updated_at
BEFORE UPDATE ON public.finance_manual_values
FOR EACH ROW
EXECUTE FUNCTION public.update_finance_manual_values_updated_at();