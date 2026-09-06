-- ==============================================================================
-- ZINNIA 2026 — 006: EVENT CAPACITY, CLOSURE & THE BLOCK GRID
-- ==============================================================================
-- PURPOSE
--   Two things the admin panel needs from the events table:
--     1. A per-event maximum with a manual open/close switch (R12, D9).
--     2. The B1-B4 time-block grid the rule engine will read (R2-R6).
--
--   Everything here is ADDITIVE. No existing column changes meaning, so the
--   current registration flow keeps working untouched.
--
--   Team sizes and per-participant durations below are the coordinator rulings
--   of 4 September 2026: Gadget Codes 2, Paper Presentation 2-3, non-tech 3,
--   individual tech events 1, Short Film 1; running events 30 minutes.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CAPACITY AND CLOSURE COLUMNS
-- ------------------------------------------------------------------------------
ALTER TABLE events ADD COLUMN IF NOT EXISTS sched_type TEXT
    CHECK (sched_type IN ('FIXED', 'RUNNING', 'SLOT', 'ONLINE'));

-- Minutes ONE participant is occupied, not how long the desk is open.
ALTER TABLE events ADD COLUMN IF NOT EXISTS duration_min INT;

-- NULL capacity means unlimited.
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity INT;

-- TEAMS or PARTICIPANTS. Never inferred - a team event counts teams.
ALTER TABLE events ADD COLUMN IF NOT EXISTS capacity_unit TEXT NOT NULL DEFAULT 'TEAMS'
    CHECK (capacity_unit IN ('TEAMS', 'PARTICIPANTS'));

-- false for Paper Presentation and Short Film only (D3, D3a).
ALTER TABLE events ADD COLUMN IF NOT EXISTS counts_toward_limit BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE events ADD COLUMN IF NOT EXISTS reg_closes_at TIMESTAMPTZ;

-- The switch. Auto-close writes false; a coordinator can write true back.
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT true;

-- CAPACITY | MANUAL | DATE - drives the status chip in the admin panel.
ALTER TABLE events ADD COLUMN IF NOT EXISTS closed_reason TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS closed_by TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

ALTER TABLE events ADD COLUMN IF NOT EXISTS has_rounds BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------------------------
-- 2. THE BLOCK GRID (data, not code - if the timeline moves, edit rows)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
    block_code  TEXT PRIMARY KEY,
    label       TEXT NOT NULL,
    window_code TEXT NOT NULL CHECK (window_code IN ('MORNING', 'AFTERNOON')),
    minutes     INT  NOT NULL,
    sort_order  INT  NOT NULL
);

INSERT INTO blocks (block_code, label, window_code, minutes, sort_order) VALUES
    ('B1', '11:00-12:00', 'MORNING',   60, 1),
    ('B2', '12:00-13:00', 'MORNING',   60, 2),
    ('B3', '14:00-14:30', 'AFTERNOON', 30, 3),
    ('B4', '14:30-15:00', 'AFTERNOON', 30, 4)
ON CONFLICT (block_code) DO UPDATE SET
    label = EXCLUDED.label,
    window_code = EXCLUDED.window_code,
    minutes = EXCLUDED.minutes,
    sort_order = EXCLUDED.sort_order;

CREATE TABLE IF NOT EXISTS rounds (
    event_code     TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_no       INT  NOT NULL,
    name           TEXT NOT NULL,
    is_elimination BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (event_code, round_no)
);

-- WHOLE     the block is consumed entirely; nothing else fits (FIXED events)
-- CANDIDATE the block is eligible; the cost is events.duration_min drawn from
--           that window's remaining minutes (RUNNING and SLOT events)
CREATE TABLE IF NOT EXISTS event_blocks (
    event_code TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    round_no   INT  NOT NULL DEFAULT 0,
    block_code TEXT NOT NULL REFERENCES blocks(block_code),
    mode       TEXT NOT NULL CHECK (mode IN ('WHOLE', 'CANDIDATE')),
    PRIMARY KEY (event_code, round_no, block_code)
);

-- ------------------------------------------------------------------------------
-- 3. SEED: THE CONFIRMED CATALOG (rulings of 4 September 2026)
-- ------------------------------------------------------------------------------
UPDATE events SET sched_type = 'RUNNING', duration_min = 30,
       team_size_min = 1, team_size_max = 1,
       counts_toward_limit = true, capacity_unit = 'PARTICIPANTS'
 WHERE id IN ('debugging', 'the-last-signal', 'lost-at-sql');

UPDATE events SET sched_type = 'FIXED', duration_min = 60,
       team_size_min = 3, team_size_max = 3,
       counts_toward_limit = true, capacity_unit = 'TEAMS'
 WHERE id IN ('think-strike-and-win', 'plot-twist');

UPDATE events SET sched_type = 'FIXED', duration_min = 120,
       team_size_min = 3, team_size_max = 3,
       counts_toward_limit = true, capacity_unit = 'TEAMS', has_rounds = true
 WHERE id = 'borderland-at-gcee';

UPDATE events SET sched_type = 'FIXED', duration_min = 180,
       team_size_min = 2, team_size_max = 2,
       counts_toward_limit = true, capacity_unit = 'TEAMS', has_rounds = true
 WHERE id = 'gadget-codes';

-- Capacity fixed at 24: two panels of twelve 15-minute slots is exactly what
-- the timeline holds. Not coordinator-editable.
UPDATE events SET sched_type = 'SLOT', duration_min = 15,
       team_size_min = 2, team_size_max = 3,
       counts_toward_limit = false, capacity_unit = 'TEAMS', capacity = 24
 WHERE id = 'paper-presentation';

-- Online, no block, no count. Size 1 by ruling - team composition affects no rule.
UPDATE events SET sched_type = 'ONLINE', duration_min = 0,
       team_size_min = 1, team_size_max = 1,
       counts_toward_limit = false, capacity_unit = 'PARTICIPANTS',
       reg_closes_at = '2026-09-20T23:59:59+05:30'
 WHERE id = 'short-flim';

-- Everything except Short Film closes on the site-wide date.
UPDATE events SET reg_closes_at = '2026-09-22T23:59:59+05:30'
 WHERE reg_closes_at IS NULL;

INSERT INTO rounds (event_code, round_no, name, is_elimination) VALUES
    ('gadget-codes',       1, 'Rounds 1 & 2', true),
    ('gadget-codes',       3, 'Final',        false),
    ('borderland-at-gcee', 1, 'Round 1',      true),
    ('borderland-at-gcee', 2, 'Round 2',      false)
ON CONFLICT (event_code, round_no) DO UPDATE SET
    name = EXCLUDED.name,
    is_elimination = EXCLUDED.is_elimination;

INSERT INTO event_blocks (event_code, round_no, block_code, mode) VALUES
    -- FIXED: whole blocks
    ('gadget-codes',         1, 'B1', 'WHOLE'),
    ('gadget-codes',         1, 'B2', 'WHOLE'),
    ('gadget-codes',         3, 'B3', 'WHOLE'),
    ('gadget-codes',         3, 'B4', 'WHOLE'),
    ('borderland-at-gcee',   1, 'B2', 'WHOLE'),
    ('borderland-at-gcee',   2, 'B3', 'WHOLE'),
    ('borderland-at-gcee',   2, 'B4', 'WHOLE'),
    ('think-strike-and-win', 0, 'B3', 'WHOLE'),
    ('think-strike-and-win', 0, 'B4', 'WHOLE'),
    ('plot-twist',           0, 'B3', 'WHOLE'),
    ('plot-twist',           0, 'B4', 'WHOLE'),
    -- RUNNING: 30 minutes anywhere inside the window
    ('debugging',            0, 'B1', 'CANDIDATE'),
    ('debugging',            0, 'B2', 'CANDIDATE'),
    ('the-last-signal',      0, 'B1', 'CANDIDATE'),
    ('the-last-signal',      0, 'B2', 'CANDIDATE'),
    ('lost-at-sql',          0, 'B3', 'CANDIDATE'),
    ('lost-at-sql',          0, 'B4', 'CANDIDATE'),
    -- SLOT: 15 minutes in one block, chosen by the organiser
    ('paper-presentation',   0, 'B1', 'CANDIDATE'),
    ('paper-presentation',   0, 'B2', 'CANDIDATE'),
    ('paper-presentation',   0, 'B3', 'CANDIDATE'),
    ('paper-presentation',   0, 'B4', 'CANDIDATE')
    -- short-flim: no rows at all. ONLINE events touch no block.
ON CONFLICT (event_code, round_no, block_code) DO UPDATE SET mode = EXCLUDED.mode;

-- ------------------------------------------------------------------------------
-- 4. RLS — same posture as migration 004. Grid is public-readable (the
--    participant site needs it to draw the timeline); nothing else is.
-- ------------------------------------------------------------------------------
ALTER TABLE blocks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds       ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view blocks" ON blocks;
CREATE POLICY "Public can view blocks" ON blocks
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view rounds" ON rounds;
CREATE POLICY "Public can view rounds" ON rounds
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public can view event_blocks" ON event_blocks;
CREATE POLICY "Public can view event_blocks" ON event_blocks
    FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON blocks, rounds, event_blocks TO anon, authenticated;
