
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'variavel',
  status TEXT NOT NULL DEFAULT 'pendente',
  country TEXT,
  payment_source TEXT,
  is_auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read expenses" ON public.expenses FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert expenses" ON public.expenses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update expenses" ON public.expenses FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete expenses" ON public.expenses FOR DELETE TO anon USING (true);
