-- ==============================================================================
-- 003_profiles_demo_access.sql
-- Allow anon read + update on profiles for the public demo (same spirit as 002).
-- DEMO ONLY: everyone can read/update demo personas. Do not use as-is in prod.
-- ==============================================================================

-- 1. Anon policies for profiles (none existed before — this is why profile
--    saves from the demo UI were silently blocked at the database level).
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles" ON public.profiles FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon update profiles" ON public.profiles;
CREATE POLICY "Allow anon update profiles" ON public.profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ==============================================================================
-- 2. Link demo personas to real rows (run AFTER creating the 3 demo users).
--    Steps:
--    a) Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user",
--       Auto-confirm ON, with these exact emails (any temporary password):
--         admin@realstate.com
--         john.doe@realstate.com
--         rachel.green@realstate.com
--       The handle_new_user() trigger auto-creates one profiles row per user.
--    b) Run the block below to set demo names/roles on those rows.
--    c) Run: SELECT id, email FROM public.profiles;
--       Copy the 3 UUIDs into INITIAL_PROFILES in src/lib/mock-data.ts
--       (replace 'user-admin-1', 'user-rep-1', 'user-rep-2').
--    From then on, "Save Profile Changes" in the app writes to these real rows.
-- ==============================================================================

-- b) Demo persona names/roles:
UPDATE public.profiles SET full_name = 'Sarah Connor (Sales Director)', role = 'admin' WHERE email = 'admin@realstate.com';
UPDATE public.profiles SET full_name = 'John Doe (Senior Executive)', role = 'sales_rep' WHERE email = 'john.doe@realstate.com';
UPDATE public.profiles SET full_name = 'Rachel Green (Property Consultant)', role = 'sales_rep' WHERE email = 'rachel.green@realstate.com';
