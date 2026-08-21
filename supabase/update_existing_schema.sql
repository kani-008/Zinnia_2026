-- ==============================================================================
-- ZINNIA 2026 — SCHEMA MIGRATION / UPDATE SCRIPT FOR EXISTING DATABASE
-- Run this in your Supabase SQL Editor to update your existing schema to the 5-table architecture.
-- ==============================================================================

-- 1. Drop Legacy Unused Tables
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS food_distribution CASCADE;

-- 2. Update 'participants' Table (Add Food Tracking)
ALTER TABLE public.participants 
  ADD COLUMN IF NOT EXISTS food_collected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS food_collected_at TIMESTAMP WITH TIME ZONE;

-- 3. Update 'events' Table (Add event_type and results_finalized)
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(16) DEFAULT 'TECH',
  ADD COLUMN IF NOT EXISTS results_finalized BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS results_finalized_at TIMESTAMP WITH TIME ZONE;

-- Ensure constraint for event_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_event_type_check'
  ) THEN
    ALTER TABLE public.events ADD CONSTRAINT events_event_type_check CHECK (event_type IN ('TECH', 'NON_TECH'));
  END IF;
END $$;

-- Update existing 9 events with their correct TECH / NON_TECH types
UPDATE public.events SET event_type = 'TECH' WHERE id IN (
  'msn-sys-recovery', 'msn-oracle', 'msn-broken-records', 'msn-infinity-protocol', 'msn-mission-control'
);

UPDATE public.events SET event_type = 'NON_TECH' WHERE id IN (
  'msn-borderland-gce', 'msn-think-strike-win', 'msn-plot-twist', 'msn-short-film'
);

-- 4. Update 'event_registrations' Table (Add team_id & prize position)
ALTER TABLE public.event_registrations 
  ADD COLUMN IF NOT EXISTS team_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS position INTEGER;

-- Ensure constraint for prize position (1 = 1st, 2 = 2nd, 3 = 3rd, NULL = Participated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_registrations_position_check'
  ) THEN
    ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_position_check CHECK (position IN (1, 2, 3) OR position IS NULL);
  END IF;
END $$;

-- 5. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_participants_food ON public.participants(food_collected);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_er_position ON public.event_registrations(position);
CREATE INDEX IF NOT EXISTS idx_er_team ON public.event_registrations(event_id, team_name);

-- 6. Enable and Refresh Row Level Security Policies
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public participant registration" ON public.participants;
CREATE POLICY "Public participant registration" ON public.participants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public participant read" ON public.participants;
CREATE POLICY "Public participant read" ON public.participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public participant update" ON public.participants;
CREATE POLICY "Public participant update" ON public.participants FOR UPDATE USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public event registrations insert" ON public.event_registrations;
CREATE POLICY "Public event registrations insert" ON public.event_registrations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public event registrations read" ON public.event_registrations;
CREATE POLICY "Public event registrations read" ON public.event_registrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public event registrations update" ON public.event_registrations;
CREATE POLICY "Public event registrations update" ON public.event_registrations FOR ALL USING (true);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public attendance insert" ON public.attendance;
CREATE POLICY "Public attendance insert" ON public.attendance FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public attendance read" ON public.attendance;
CREATE POLICY "Public attendance read" ON public.attendance FOR SELECT USING (true);
