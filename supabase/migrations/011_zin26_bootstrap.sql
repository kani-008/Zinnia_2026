-- ==============================================================================
-- ZINNIA 2026 — 011: BOOTSTRAP A FRESH SUPABASE PROJECT
-- ==============================================================================
-- Creates the entire zin26 participant model plus the admin tables, on an empty
-- project. Run this once, then 008 and 010 are already folded in below.
--
-- PROVENANCE — READ THIS
--   The original zin26 DDL was never committed to this repository; it lived
--   only in the previous Supabase project. This file is RECONSTRUCTED from the
--   code that reads and writes those tables — services/participant_service.py,
--   team_service.py, event_registration_service.py, registration_state.py and
--   rules_engine.py. Every column and every seeded value below is one the code
--   actually uses.
--
--   That means column names and the event catalog are right, but constraints,
--   indexes and defaults that existed in the old project and are not visible
--   from the code may be missing. If you can still reach the old project,
--   compare before trusting this in production.
--
-- PREREQUISITE
--   After running this, add `zin26` under
--   Supabase Dashboard -> Settings -> API -> Exposed schemas.
--   Without that every call returns PGRST106 and nothing works.
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS zin26;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. UserID allocation
--    participant_service._next_user_id() calls next_participant_serial() rather
--    than count()+1, so two simultaneous registrations cannot be handed the
--    same code. The sequence is the whole point — do not replace it with a count.
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS zin26.participant_serial START 1;

CREATE OR REPLACE FUNCTION zin26.next_participant_serial()
RETURNS BIGINT
LANGUAGE sql
VOLATILE
AS $$
    SELECT nextval('zin26.participant_serial');
$$;

-- ------------------------------------------------------------------------------
-- 2. Event catalog
--    Mirrors rules_engine.EVENTS. The engine is what enforces team size and the
--    time-block rules at registration; these rows are the reference copy the
--    admin panel reads for capacity and closure.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zin26.events (
    code                TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    category            TEXT NOT NULL CHECK (category IN ('TECH', 'NON_TECH')),
    type                TEXT NOT NULL CHECK (type IN ('FIXED', 'RUNNING', 'SLOT', 'ONLINE')),
    min_team            INT  NOT NULL DEFAULT 1,
    max_team            INT  NOT NULL DEFAULT 1,
    -- NULL means unlimited.
    capacity            INT,
    -- Set where capacity is fixed by the timetable rather than by preference,
    -- so the admin panel renders the field read-only.
    capacity_is_locked  BOOLEAN NOT NULL DEFAULT false,
    -- true for every event: nothing is exempt from the 3-event ceiling.
    counts_toward_limit BOOLEAN NOT NULL DEFAULT true,
    -- Minutes ONE participant is occupied, not how long the desk is open.
    duration_min        INT NOT NULL DEFAULT 0,
    window_code         TEXT CHECK (window_code IN ('MORNING', 'AFTERNOON')),
    has_rounds          BOOLEAN NOT NULL DEFAULT false,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    reg_opens_at        TIMESTAMPTZ,
    reg_closes_at       TIMESTAMPTZ,
    sort_order          INT NOT NULL DEFAULT 0
);

-- ------------------------------------------------------------------------------
-- 3. Participants and payments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zin26.participants (
    user_id         TEXT PRIMARY KEY,                   -- ZIN26-0142, check digit included
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    phone           TEXT NOT NULL,
    college         TEXT NOT NULL,
    department      TEXT,
    year            TEXT,
    food_preference TEXT NOT NULL DEFAULT 'VEG'
                      CHECK (food_preference IN ('VEG', 'NON_VEG')),
    accommodation   BOOLEAN NOT NULL DEFAULT false,
    payment_status  TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (payment_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    -- Random, unique, already on the row: doubles as the internal
    -- `registration_id` the browser is given before the UserID is released.
    master_qr_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_email  ON zin26.participants (lower(email));
CREATE INDEX IF NOT EXISTS idx_participants_status ON zin26.participants (payment_status);

CREATE TABLE IF NOT EXISTS zin26.payments (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES zin26.participants(user_id) ON DELETE CASCADE,
    amount         NUMERIC NOT NULL DEFAULT 250,
    txn_ref        TEXT,
    -- Object PATH in the private payment-proofs bucket, never a URL: a stored
    -- signed URL expires and a stored public one leaks.
    screenshot_url TEXT,
    status         TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reject_reason  TEXT,
    -- UUID, not a display name: participant_service writes the admin's id here
    -- and Postgres rejects a name with 22P02. No FK, so seed-fallback admins
    -- (which have no row) can still approve.
    approved_by    UUID,
    approved_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A resubmission APPENDS a row rather than overwriting, because the treasurer
-- needs to see what was rejected and why. So: no unique constraint on user_id.
CREATE INDEX IF NOT EXISTS idx_payments_user   ON zin26.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON zin26.payments (status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_txn_ref
    ON zin26.payments (txn_ref) WHERE txn_ref IS NOT NULL AND txn_ref <> '';

-- ------------------------------------------------------------------------------
-- 4. Login OTPs — a consumed row is the proof an address was verified
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zin26.login_otps (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES zin26.participants(user_id) ON DELETE CASCADE,
    otp_hash    TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    attempts    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_user ON zin26.login_otps (user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 5. Teams and registrations
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zin26.teams (
    team_id         TEXT PRIMARY KEY,
    event_code      TEXT NOT NULL REFERENCES zin26.events(code),
    team_name       TEXT NOT NULL,
    captain_user_id TEXT NOT NULL REFERENCES zin26.participants(user_id),
    status          TEXT NOT NULL DEFAULT 'PENDING_ACCEPTANCE'
                      CHECK (status IN ('PENDING_ACCEPTANCE', 'CONFIRMED', 'CANCELLED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_event ON zin26.teams (event_code, status);

CREATE TABLE IF NOT EXISTS zin26.team_members (
    team_id       TEXT NOT NULL REFERENCES zin26.teams(team_id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL REFERENCES zin26.participants(user_id) ON DELETE CASCADE,
    role          TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('CAPTAIN', 'MEMBER')),
    accept_status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (accept_status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    -- The 24h swap window (D2) is measured from here.
    invited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at  TIMESTAMPTZ,
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS zin26.registrations (
    reg_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES zin26.participants(user_id) ON DELETE CASCADE,
    event_code   TEXT NOT NULL REFERENCES zin26.events(code),
    team_id      TEXT REFERENCES zin26.teams(team_id) ON DELETE CASCADE,
    -- HELD is D1: a rejected payment holds the seat rather than releasing it.
    status       TEXT NOT NULL DEFAULT 'CONFIRMED'
                   CHECK (status IN ('CONFIRMED', 'HELD', 'CANCELLED')),
    source       TEXT NOT NULL DEFAULT 'ONLINE' CHECK (source IN ('ONLINE', 'SPOT')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    -- One row per person per event. The DB constraint is the real guard; the
    -- application check alone loses the race (spec §5, Concurrency).
    CONSTRAINT uq_registration_user_event UNIQUE (user_id, event_code)
);

CREATE INDEX IF NOT EXISTS idx_reg_event ON zin26.registrations (event_code, status);
CREATE INDEX IF NOT EXISTS idx_reg_user  ON zin26.registrations (user_id);

-- ------------------------------------------------------------------------------
-- 6. SEED: the nine events, mirroring rules_engine.EVENTS exactly
--
--    SHORT_FILM is size 1 per the 4 September ruling, matching
--    rules_engine.EVENTS and src/lib/rules/catalog.ts. All three must move
--    together: the engine is what rejects a registration, so a row on its own
--    changes nothing.
-- ------------------------------------------------------------------------------
INSERT INTO zin26.events
    (code, name, category, type, min_team, max_team, capacity, capacity_is_locked,
     counts_toward_limit, duration_min, window_code, has_rounds, is_active,
     reg_closes_at, sort_order)
VALUES
    ('DEBUGGING',          'Debugging Protocol', 'TECH',     'RUNNING', 1, 1, NULL, false, true,   30, 'MORNING',   false, true, '2026-09-22T23:59:59+05:30', 1),
    ('LAST_SIGNAL',        'The Last Signal',    'TECH',     'RUNNING', 1, 1, NULL, false, true,   30, 'MORNING',   false, true, '2026-09-22T23:59:59+05:30', 2),
    ('LOST_IN_SQL',        'Lost in SQL',        'TECH',     'RUNNING', 1, 1, NULL, false, true,   30, 'AFTERNOON', false, true, '2026-09-22T23:59:59+05:30', 3),
    ('GADGET_CODES',       'Gadget Codes',       'TECH',     'FIXED',   2, 2, NULL, false, true,  180, NULL,        true,  true, '2026-09-22T23:59:59+05:30', 4),
    -- 30 TEAMS (coordinators' ruling), counted as teams and not as heads: a
    -- team of 2 and a team of 3 each take one of the 30. capacity_map() and
    -- zin26.register_participant_event both count distinct team_id for an
    -- event with max_team > 1.
    --
    -- NOTE: this exceeds what 2 panels of fifteen-minute slots hold. B1-B4 is
    -- 180 minutes per panel = 12 slots each = 24. 30 teams needs a third panel,
    -- shorter slots, or more time - a scheduling decision, not a code one.
    ('PAPER_PRESENTATION', 'Paper Verse',        'TECH',     'SLOT',    2, 3,   30, true,  true,   15, NULL,        false, true, '2026-09-22T23:59:59+05:30', 5),
    ('BORDERLAND',         'Borderland @ GCEE',  'NON_TECH', 'FIXED',   3, 3, NULL, false, true,  120, NULL,        true,  true, '2026-09-22T23:59:59+05:30', 6),
    ('THINK_STRIKE_WIN',   'Think, Strike, Win', 'NON_TECH', 'FIXED',   3, 3, NULL, false, true,   60, NULL,        false, true, '2026-09-22T23:59:59+05:30', 7),
    ('PLOT_TWIST',         'Plot Twist',         'NON_TECH', 'FIXED',   3, 3, NULL, false, true,   60, NULL,        false, true, '2026-09-22T23:59:59+05:30', 8),
    -- Online, no block, no count. Closes two days before everything else.
    -- Exactly 1 per the 4 September ruling.
    ('SHORT_FILM',         'Short Film',         'NON_TECH', 'ONLINE',  1, 1, NULL, false, true,    0, NULL,        false, true, '2026-09-20T23:59:59+05:30', 9)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name, category = EXCLUDED.category, type = EXCLUDED.type,
    min_team = EXCLUDED.min_team, max_team = EXCLUDED.max_team,
    capacity_is_locked = EXCLUDED.capacity_is_locked,
    counts_toward_limit = EXCLUDED.counts_toward_limit,
    duration_min = EXCLUDED.duration_min, window_code = EXCLUDED.window_code,
    has_rounds = EXCLUDED.has_rounds, sort_order = EXCLUDED.sort_order;

-- ------------------------------------------------------------------------------
-- 7. ADMIN TABLES (public schema — admin activity is not participant data)
--    This is migration 008 folded in.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value) VALUES
    ('registration_fee',      '250'),
    ('default_reg_closes_at', '"2026-09-22T23:59:59+05:30"'),
    ('short_film_closes_at',  '"2026-09-20T23:59:59+05:30"'),
    ('event_date',            '"2026-09-24"'),
    ('allow_tight_b1',        'true'),
    ('warn_tight_b1',         'true'),
    ('team_accept_timeout_h', '24')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id    TEXT NOT NULL,
    admin_name  TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_type TEXT,
    target_id   TEXT,
    reason      TEXT,
    detail      JSONB,
    ip          TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_recent ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.admin_audit_log (target_type, target_id);

-- ------------------------------------------------------------------------------
-- 8. ADMIN ACCOUNTS — migration 010 folded in.
--
--    Passwords: admin Admin@Zinnia2026 · treasurer Treasurer@Zin26
--               gate1/2 GatePass@Zin26 · food1/2 FoodPass@Zin26
--               every coordinator Coord@Zin26
--
--    THESE HASHES ARE PUBLIC IN GIT HISTORY. Rotate before the panel guards
--    anything real:  python scripts/gen_admin_hashes.py
--    then set ADMIN_DISABLE_SEED_FALLBACK=true.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    phone         TEXT,
    role          TEXT NOT NULL CHECK (role IN
                    ('SUPER_ADMIN','TREASURER','GATE_ADMIN','FOOD_ADMIN','EVENT_COORDINATOR')),
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_users (username, password_hash, name, phone, role) VALUES
    ('admin',       '$2b$12$5uL/sUJ8CptgUJou6Jy0xe5o1h0T05ilrXkftlA3V79PnLoxcT7rW', 'System Administrator', '+91 99999 00000', 'SUPER_ADMIN'),
    ('treasurer',   '$2b$12$/SpPPmN6vDrb.4xxCbO1NOfMjlbtAtjbzkgb8xvQsQZXnwU8pADOa', 'Symposium Treasurer',  '+91 99999 00001', 'TREASURER'),
    ('gate1',       '$2b$12$j2o4yGUR03M9ku8zkD.IdufhqWvdxK1UCGtWp3P35fpvKhO/xskm2', 'Main Gate Scanner 1',  '+91 99999 00002', 'GATE_ADMIN'),
    ('gate2',       '$2b$12$j2o4yGUR03M9ku8zkD.IdufhqWvdxK1UCGtWp3P35fpvKhO/xskm2', 'Main Gate Scanner 2',  '+91 99999 00003', 'GATE_ADMIN'),
    ('food1',       '$2b$12$JfoW6xMgCJfKsJ7BS8Blc.8/owQloH6WuZC/oLkDNMKSoRYYM2CP2', 'Food Counter 1',       '+91 99999 00004', 'FOOD_ADMIN'),
    ('food2',       '$2b$12$JfoW6xMgCJfKsJ7BS8Blc.8/owQloH6WuZC/oLkDNMKSoRYYM2CP2', 'Food Counter 2',       '+91 99999 00005', 'FOOD_ADMIN'),
    ('debugging1',  '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Prabakaran D',         '+91 63692 20453', 'EVENT_COORDINATOR'),
    ('debugging2',  '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Deepakala',            '+91 93425 60879', 'EVENT_COORDINATOR'),
    ('signal1',     '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Abdul Razith',         '+91 90470 57868', 'EVENT_COORDINATOR'),
    ('signal2',     '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Sri Karthika',         '+91 93618 40633', 'EVENT_COORDINATOR'),
    ('sql1',        '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Vignesh',              '+91 80154 91593', 'EVENT_COORDINATOR'),
    ('sql2',        '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Indhumathi',           '+91 80729 51205', 'EVENT_COORDINATOR'),
    ('gadget1',     '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Muhammed Umer',        '+91 94458 86230', 'EVENT_COORDINATOR'),
    ('gadget2',     '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Swathi',               '+91 93610 63211', 'EVENT_COORDINATOR'),
    ('paper1',      '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Kanishkar',            '+91 87787 84819', 'EVENT_COORDINATOR'),
    ('paper2',      '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Karishma',             '+91 84381 94881', 'EVENT_COORDINATOR'),
    ('borderland1', '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Praveenraja',          '+91 63822 79383', 'EVENT_COORDINATOR'),
    ('borderland2', '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Kaviyasri',            '+91 76393 67928', 'EVENT_COORDINATOR'),
    ('strike1',     '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Sivabalan',            '+91 63845 11989', 'EVENT_COORDINATOR'),
    ('strike2',     '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Yogeshwari',           '+91 90809 99795', 'EVENT_COORDINATOR'),
    ('plottwist1',  '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Hariharan',            '+91 88388 69405', 'EVENT_COORDINATOR'),
    ('plottwist2',  '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Akshaya',              '+91 63818 83013', 'EVENT_COORDINATOR'),
    ('film1',       '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Aswin Sanjeev Kumar',  '+91 79040 98102', 'EVENT_COORDINATOR'),
    ('film2',       '$2b$12$mi34h1EKd354I.swTIgnE./Jt6F4krsTUZFr3zuC5j7rQGvce4J1m', 'Harshini',             '+91 93634 52517', 'EVENT_COORDINATOR')
ON CONFLICT (username) DO UPDATE SET
    password_hash = EXCLUDED.password_hash, name = EXCLUDED.name,
    phone = EXCLUDED.phone, role = EXCLUDED.role, is_active = true;

-- Coordinator scope in zin26 event codes. The older event_coordinators table
-- was FK'd to public.events and held legacy ids like 'lost-at-sql', which never
-- matched what the panel filters on — so every coordinator saw nothing.
CREATE TABLE IF NOT EXISTS public.admin_event_scope (
    admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
    event_code    TEXT NOT NULL,
    PRIMARY KEY (admin_user_id, event_code)
);

INSERT INTO public.admin_event_scope (admin_user_id, event_code)
SELECT u.id, m.event_code
  FROM (VALUES
        ('debugging1','DEBUGGING'),        ('debugging2','DEBUGGING'),
        ('signal1','LAST_SIGNAL'),         ('signal2','LAST_SIGNAL'),
        ('sql1','LOST_IN_SQL'),            ('sql2','LOST_IN_SQL'),
        ('gadget1','GADGET_CODES'),        ('gadget2','GADGET_CODES'),
        ('paper1','PAPER_PRESENTATION'),   ('paper2','PAPER_PRESENTATION'),
        ('borderland1','BORDERLAND'),      ('borderland2','BORDERLAND'),
        ('strike1','THINK_STRIKE_WIN'),    ('strike2','THINK_STRIKE_WIN'),
        ('plottwist1','PLOT_TWIST'),       ('plottwist2','PLOT_TWIST'),
        ('film1','SHORT_FILM'),            ('film2','SHORT_FILM')
       ) AS m(username, event_code)
  JOIN public.admin_users u ON u.username = m.username
ON CONFLICT (admin_user_id, event_code) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. RLS — the browser reads NOTHING here.
--    All participant and admin traffic goes through Flask with the service-role
--    key, which bypasses RLS. Anon gets the event catalog and nothing else,
--    matching the posture migration 004 established on the old project.
-- ------------------------------------------------------------------------------
ALTER TABLE zin26.participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zin26.payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE zin26.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zin26.teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE zin26.team_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zin26.login_otps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE zin26.events        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.app_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings      FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log   FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.admin_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users       FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.admin_event_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_event_scope FORCE  ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA zin26 FROM anon, authenticated;
REVOKE ALL ON public.app_settings, public.admin_audit_log,
              public.admin_users, public.admin_event_scope FROM anon, authenticated;

-- The catalog is the one thing the participant site reads directly.
GRANT USAGE ON SCHEMA zin26 TO anon, authenticated;
GRANT SELECT ON zin26.events TO anon, authenticated;
DROP POLICY IF EXISTS "Public can view events" ON zin26.events;
CREATE POLICY "Public can view events" ON zin26.events
    FOR SELECT TO anon, authenticated USING (true);

-- ==============================================================================
-- AFTER RUNNING
--   1. Settings -> API -> Exposed schemas: add `zin26`
--   2. Verify:
--        SELECT code, name, min_team, max_team, capacity FROM zin26.events
--         ORDER BY sort_order;                     -- expect 9 rows
--        SELECT zin26.next_participant_serial();   -- expect 1, then 2, ...
--        SELECT count(*) FROM public.admin_users;  -- expect 24
--        SELECT count(*) FROM public.admin_event_scope;  -- expect 18
--   3. The payment-proofs storage bucket is created on demand by
--      zin26_db.ensure_proof_bucket() — no SQL needed.
-- ==============================================================================
