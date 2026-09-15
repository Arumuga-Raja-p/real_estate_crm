-- ==============================================================================
-- REAL ESTATE CRM DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'sales_rep')) DEFAULT 'sales_rep',
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatic profile creation on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. LEADS & PIPELINE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    budget_min NUMERIC(14, 2) DEFAULT 0,
    budget_max NUMERIC(14, 2) DEFAULT 0,
    preferred_type TEXT, -- e.g. 1BHK, 2BHK, 3BHK, Penthouse, Villa
    source TEXT DEFAULT 'Website' CHECK (source IN ('Website', 'Walk-in', 'Referral', 'Social Media', 'Real Estate Portal', 'Cold Call')),
    stage TEXT NOT NULL CHECK (stage IN ('New', 'Contacted', 'Site Visit', 'Interested', 'Negotiation', 'Booked', 'Lost')) DEFAULT 'New',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. LEAD NOTES & FOLLOW-UPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    follow_up_date TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PROPERTY INVENTORY (PROJECTS -> BUILDINGS -> UNITS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    city TEXT DEFAULT 'Metropolis',
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('Planning', 'Under Construction', 'Ready to Move', 'Sold Out')) DEFAULT 'Under Construction',
    featured_image TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Tower A", "Emerald Block"
    total_floors INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL, -- e.g. "A-101", "Penthouse 1"
    type TEXT NOT NULL CHECK (type IN ('1BHK', '2BHK', '3BHK', '4BHK', 'Penthouse', 'Studio', 'Villa')),
    floor INT NOT NULL,
    area_sqft NUMERIC(10, 2) NOT NULL,
    price NUMERIC(14, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Available', 'Booked')) DEFAULT 'Available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(building_id, unit_number)
);

-- ------------------------------------------------------------------------------
-- 5. BOOKINGS & CONCURRENCY CONTROL
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    booked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    booking_amount NUMERIC(14, 2) NOT NULL,
    booking_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('Confirmed', 'Cancelled')) DEFAULT 'Confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HARD CONSTRAINT: At database level, a unit CANNOT have multiple active ('Confirmed') bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_confirmed_unit_booking 
ON public.bookings (unit_id) 
WHERE status = 'Confirmed';

-- ------------------------------------------------------------------------------
-- 6. ATOMIC CONCURRENCY FUNCTION FOR SAFE UNIT BOOKING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.book_property_unit(
    p_lead_id UUID,
    p_unit_id UUID,
    p_booked_by UUID,
    p_amount NUMERIC,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_unit_status TEXT;
    v_unit_number TEXT;
    v_booking_id UUID;
    v_lead_name TEXT;
BEGIN
    -- 1. Pessimistically lock the unit record to prevent simultaneous reads/writes
    SELECT status, unit_number INTO v_unit_status, v_unit_number
    FROM public.units
    WHERE id = p_unit_id
    FOR UPDATE;

    -- Check existence
    IF v_unit_status IS NULL THEN
        RAISE EXCEPTION 'Unit does not exist';
    END IF;

    -- Concurrency check: If another user already booked this, abort immediately
    IF v_unit_status <> 'Available' THEN
        RAISE EXCEPTION 'UNIT_ALREADY_BOOKED: Unit % is already reserved or booked by another transaction', v_unit_number;
    END IF;

    -- 2. Verify lead existence
    SELECT (first_name || ' ' || last_name) INTO v_lead_name
    FROM public.leads
    WHERE id = p_lead_id;

    IF v_lead_name IS NULL THEN
        RAISE EXCEPTION 'Lead does not exist';
    END IF;

    -- 3. Transition unit status to Booked
    UPDATE public.units
    SET status = 'Booked', updated_at = NOW()
    WHERE id = p_unit_id;

    -- 4. Create confirmed booking record
    INSERT INTO public.bookings (
        lead_id,
        unit_id,
        booked_by,
        booking_amount,
        status,
        notes
    ) VALUES (
        p_lead_id,
        p_unit_id,
        p_booked_by,
        p_amount,
        'Confirmed',
        p_notes
    ) RETURNING id INTO v_booking_id;

    -- 5. Transition lead stage to 'Booked'
    UPDATE public.leads
    SET stage = 'Booked', updated_at = NOW()
    WHERE id = p_lead_id;

    -- 6. Append automatic audit trail note to the lead
    INSERT INTO public.lead_notes (
        lead_id,
        author_id,
        note,
        is_completed
    ) VALUES (
        p_lead_id,
        p_booked_by,
        'Property Unit ' || v_unit_number || ' successfully booked with token amount of $' || p_amount::TEXT || '. Booking ID: ' || v_booking_id::TEXT,
        TRUE
    );

    -- Return JSON payload of confirmation
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'unit_number', v_unit_number,
        'lead_name', v_lead_name,
        'message', 'Unit successfully booked and locked.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can view all profiles (to assign reps, see authors)
CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

-- Projects, Buildings, Units: All authenticated users can view inventory
CREATE POLICY "Allow authenticated read projects" ON public.projects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin manage projects" ON public.projects
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Allow authenticated read buildings" ON public.buildings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin manage buildings" ON public.buildings
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Allow authenticated read units" ON public.units
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin manage units" ON public.units
    FOR ALL TO authenticated USING (public.is_admin());

-- Leads: Admins can do everything; Sales reps can view and create, and update assigned leads
CREATE POLICY "Allow authenticated view leads" ON public.leads
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert leads" ON public.leads
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update leads" ON public.leads
    FOR UPDATE TO authenticated USING (
        public.is_admin() OR assigned_to = auth.uid() OR created_by = auth.uid()
    );

CREATE POLICY "Allow admin delete leads" ON public.leads
    FOR DELETE TO authenticated USING (public.is_admin());

-- Lead Notes: Authenticated can view notes for accessible leads and insert notes
CREATE POLICY "Allow authenticated view notes" ON public.lead_notes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert notes" ON public.lead_notes
    FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Allow update notes" ON public.lead_notes
    FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.is_admin());

-- Bookings: Authenticated can view bookings; insertion handled via function or authenticated policy
CREATE POLICY "Allow authenticated view bookings" ON public.bookings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert bookings" ON public.bookings
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow admin update bookings" ON public.bookings
    FOR UPDATE TO authenticated USING (public.is_admin());
