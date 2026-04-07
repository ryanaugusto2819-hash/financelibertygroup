DROP POLICY IF EXISTS "Allow public read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow public delete expenses" ON public.expenses;

DROP POLICY IF EXISTS "Allow public read revenues" ON public.revenues;
DROP POLICY IF EXISTS "Allow public insert revenues" ON public.revenues;
DROP POLICY IF EXISTS "Allow public update revenues" ON public.revenues;
DROP POLICY IF EXISTS "Allow public delete revenues" ON public.revenues;

DROP POLICY IF EXISTS "Allow public read finance manual values" ON public.finance_manual_values;
DROP POLICY IF EXISTS "Allow public insert finance manual values" ON public.finance_manual_values;
DROP POLICY IF EXISTS "Allow public update finance manual values" ON public.finance_manual_values;
DROP POLICY IF EXISTS "Allow public delete finance manual values" ON public.finance_manual_values;

CREATE POLICY "Authenticated users can read expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can edit expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can remove expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read revenues"
ON public.revenues
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create revenues"
ON public.revenues
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can edit revenues"
ON public.revenues
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can remove revenues"
ON public.revenues
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read finance manual values"
ON public.finance_manual_values
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create finance manual values"
ON public.finance_manual_values
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can edit finance manual values"
ON public.finance_manual_values
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can remove finance manual values"
ON public.finance_manual_values
FOR DELETE
TO authenticated
USING (true);