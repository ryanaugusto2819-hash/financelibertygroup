CREATE TABLE public.revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  client text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  country text,
  payment_method text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read revenues" ON public.revenues FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert revenues" ON public.revenues FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update revenues" ON public.revenues FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete revenues" ON public.revenues FOR DELETE TO anon USING (true);