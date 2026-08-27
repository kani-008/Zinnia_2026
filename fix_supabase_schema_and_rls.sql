-- ==============================================================================
-- ZINNIA 2026 — SUPABASE DATABASE SCHEMA, RLS & FOREIGN KEY CASCADE FIX
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. CREATE / VERIFY ALL REQUIRED TABLES WITH CASCADE CONSTRAINTS

CREATE TABLE IF NOT EXISTS public.teams (
    team_id VARCHAR(64) PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    college VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    year VARCHAR(16),
    registered_events JSONB DEFAULT '[]'::jsonb,
    payment_status VARCHAR(64) DEFAULT 'AWAITING_PAYMENT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id VARCHAR(64) PRIMARY KEY,
    team_id VARCHAR(64) REFERENCES public.teams(team_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    is_leader BOOLEAN DEFAULT FALSE,
    passport_token VARCHAR(255),
    passport_issued_at TIMESTAMPTZ DEFAULT NOW(),
    passport_sent_at TIMESTAMPTZ,
    band_id VARCHAR(64),
    food_collected BOOLEAN DEFAULT FALSE,
    food_collected_at TIMESTAMPTZ,
    registration_status VARCHAR(32) DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(64) REFERENCES public.teams(team_id) ON DELETE CASCADE,
    event_id VARCHAR(64) NOT NULL,
    team_name VARCHAR(255),
    position VARCHAR(64),
    registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_payments (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(64) REFERENCES public.teams(team_id) ON DELETE CASCADE,
    expected_amount NUMERIC(10,2) DEFAULT 0,
    submitted_amount NUMERIC(10,2),
    utr_number VARCHAR(128),
    payment_status VARCHAR(64) DEFAULT 'AWAITING_PAYMENT',
    payment_screenshot_url TEXT,
    verified_by VARCHAR(255),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(64),
    member_id VARCHAR(64),
    passport_token_used VARCHAR(255),
    participant_name VARCHAR(255),
    college VARCHAR(255),
    checkin_type VARCHAR(32) NOT NULL,
    event_id VARCHAR(64),
    event_name VARCHAR(255),
    scanned_by VARCHAR(255),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    location VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS public.hand_bands (
    band_id VARCHAR(64) PRIMARY KEY,
    member_id VARCHAR(64),
    team_id VARCHAR(64),
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.passport_dispatch (
    id SERIAL PRIMARY KEY,
    member_id VARCHAR(64),
    channel VARCHAR(32),
    status VARCHAR(32),
    provider_ref TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- 2. ENSURE ON DELETE CASCADE CONSTRAINTS ON EXISTING TABLES

DO $$
BEGIN
    -- Update team_members foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_members_team_id_fkey') THEN
        ALTER TABLE public.team_members DROP CONSTRAINT team_members_team_id_fkey;
    END IF;
    ALTER TABLE public.team_members ADD CONSTRAINT team_members_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

    -- Update event_registrations foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'event_registrations_team_id_fkey') THEN
        ALTER TABLE public.event_registrations DROP CONSTRAINT event_registrations_team_id_fkey;
    END IF;
    ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;

    -- Update team_payments foreign key
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'team_payments_team_id_fkey') THEN
        ALTER TABLE public.team_payments DROP CONSTRAINT team_payments_team_id_fkey;
    END IF;
    ALTER TABLE public.team_payments ADD CONSTRAINT team_payments_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES public.teams(team_id) ON DELETE CASCADE;
END $$;

-- 3. PERMISSIVE RLS POLICIES FOR ALL OPERATIONS (SELECT, INSERT, UPDATE, DELETE)

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hand_bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all teams" ON public.teams;
CREATE POLICY "Allow public all teams" ON public.teams FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all team_members" ON public.team_members;
CREATE POLICY "Allow public all team_members" ON public.team_members FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all event_registrations" ON public.event_registrations;
CREATE POLICY "Allow public all event_registrations" ON public.event_registrations FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all team_payments" ON public.team_payments;
CREATE POLICY "Allow public all team_payments" ON public.team_payments FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all attendance" ON public.attendance;
CREATE POLICY "Allow public all attendance" ON public.attendance FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all hand_bands" ON public.hand_bands;
CREATE POLICY "Allow public all hand_bands" ON public.hand_bands FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant full table access permissions to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
