-- ==============================================================================
-- ZINNIA 2026 — SUPABASE DATABASE SCHEMA & RLS FIX
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to create all required tables and disable RLS blocking policies.
-- ==============================================================================

-- 1. DISABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- (This permits direct API inserts, updates, and selects from anon & backend keys)

ALTER TABLE IF EXISTS public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.team_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hand_bands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.passport_dispatch DISABLE ROW LEVEL SECURITY;

-- 2. CREATE / VERIFY ALL REQUIRED TABLES

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

-- 3. PERMISSIVE RLS POLICIES (FALLBACK IF RLS RE-ENABLED)

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teams') THEN
        DROP POLICY IF EXISTS "Allow public all teams" ON public.teams;
        CREATE POLICY "Allow public all teams" ON public.teams FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_members') THEN
        DROP POLICY IF EXISTS "Allow public all team_members" ON public.team_members;
        CREATE POLICY "Allow public all team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_registrations') THEN
        DROP POLICY IF EXISTS "Allow public all event_registrations" ON public.event_registrations;
        CREATE POLICY "Allow public all event_registrations" ON public.event_registrations FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'team_payments') THEN
        DROP POLICY IF EXISTS "Allow public all team_payments" ON public.team_payments;
        CREATE POLICY "Allow public all team_payments" ON public.team_payments FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attendance') THEN
        DROP POLICY IF EXISTS "Allow public all attendance" ON public.attendance;
        CREATE POLICY "Allow public all attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
