-- ==============================================================================
-- SAFE MIGRATION SCRIPT FOR TEAM-CENTRIC SCHEMA
-- ==============================================================================

-- 1. Create teams table if not exists
CREATE TABLE IF NOT EXISTS public.teams (
  team_id VARCHAR(32) PRIMARY KEY,
  team_name VARCHAR(255) NOT NULL,
  college VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  year VARCHAR(10) NOT NULL,
  registered_events TEXT[] DEFAULT '{}',
  payment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create team_members table if not exists
CREATE TABLE IF NOT EXISTS public.team_members (
  id VARCHAR(64) PRIMARY KEY,
  team_id VARCHAR(32) NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(32) NOT NULL,
  is_leader BOOLEAN DEFAULT FALSE,
  band_id VARCHAR(64) UNIQUE,
  food_collected BOOLEAN DEFAULT FALSE,
  food_collected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create hand_bands table
CREATE TABLE IF NOT EXISTS public.hand_bands (
  band_id VARCHAR(64) PRIMARY KEY,
  member_id VARCHAR(64) UNIQUE NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  team_id VARCHAR(32) NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hand_bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public teams all" ON public.teams;
CREATE POLICY "Public teams all" ON public.teams FOR ALL USING (true);

DROP POLICY IF EXISTS "Public team_members all" ON public.team_members;
CREATE POLICY "Public team_members all" ON public.team_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Public hand_bands all" ON public.hand_bands;
CREATE POLICY "Public hand_bands all" ON public.hand_bands FOR ALL USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_tm_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_tm_band ON public.team_members(band_id);
CREATE INDEX IF NOT EXISTS idx_hb_mem ON public.hand_bands(member_id);
