
-- ==============================================================================
-- 002_allow_anon_access.sql
-- Enable public / anon access for client demonstration and evaluation
-- ==============================================================================

-- 1. Projects, Buildings & Units
DROP POLICY IF EXISTS "Allow anon read projects" ON public.projects;
CREATE POLICY "Allow anon read projects" ON public.projects FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read buildings" ON public.buildings;
CREATE POLICY "Allow anon read buildings" ON public.buildings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read units" ON public.units;
CREATE POLICY "Allow anon read units" ON public.units FOR SELECT TO anon USING (true);

-- 2. Leads & Lead Notes
DROP POLICY IF EXISTS "Allow anon read leads" ON public.leads;
CREATE POLICY "Allow anon read leads" ON public.leads FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert leads" ON public.leads;
CREATE POLICY "Allow anon insert leads" ON public.leads FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update leads" ON public.leads;
CREATE POLICY "Allow anon update leads" ON public.leads FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon delete leads" ON public.leads;
CREATE POLICY "Allow anon delete leads" ON public.leads FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon read lead_notes" ON public.lead_notes;
CREATE POLICY "Allow anon read lead_notes" ON public.lead_notes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert lead_notes" ON public.lead_notes;
CREATE POLICY "Allow anon insert lead_notes" ON public.lead_notes FOR INSERT TO anon WITH CHECK (true);

-- 3. Bookings
DROP POLICY IF EXISTS "Allow anon read bookings" ON public.bookings;
CREATE POLICY "Allow anon read bookings" ON public.bookings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert bookings" ON public.bookings;
CREATE POLICY "Allow anon insert bookings" ON public.bookings FOR INSERT TO anon WITH CHECK (true);

-- 4. Concurrency RPC Stored Procedure
GRANT EXECUTE ON FUNCTION public.book_property_unit(UUID, UUID, UUID, NUMERIC, TEXT) TO anon, authenticated;
