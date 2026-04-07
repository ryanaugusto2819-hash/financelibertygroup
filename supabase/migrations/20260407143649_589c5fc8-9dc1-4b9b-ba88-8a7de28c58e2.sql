DROP POLICY IF EXISTS "Authenticated users can create expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can edit expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can remove expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can create revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can edit revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can remove revenues" ON public.revenues;
DROP POLICY IF EXISTS "Authenticated users can create finance manual values" ON public.finance_manual_values;
DROP POLICY IF EXISTS "Authenticated users can edit finance manual values" ON public.finance_manual_values;
DROP POLICY IF EXISTS "Authenticated users can remove finance manual values" ON public.finance_manual_values;

CREATE POLICY "Authenticated users can create expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can edit expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create revenues"
ON public.revenues
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can edit revenues"
ON public.revenues
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove revenues"
ON public.revenues
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create finance manual values"
ON public.finance_manual_values
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can edit finance manual values"
ON public.finance_manual_values
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can remove finance manual values"
ON public.finance_manual_values
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);