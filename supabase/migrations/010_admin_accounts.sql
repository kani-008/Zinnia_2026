-- ==============================================================================
-- ZINNIA 2026 — 010: ONE CANONICAL SET OF ADMIN ACCOUNTS
-- ==============================================================================
-- PROBLEM THIS FIXES
--   There were two overlapping credential sets and no way to tell which
--   applied:
--     * admin_users, seeded by migration 001: superadmin / gate1 / food1 /
--       debugging1 ...
--     * a fallback list inside services/auth_service.py: admin / gate / food /
--       debugging ...
--   `treasurer` existed in BOTH with DIFFERENT passwords, so the same username
--   worked with different credentials depending on whether the database
--   happened to be reachable. The rest differed only by a trailing digit.
--
-- WHAT THIS DOES
--   Reduces both sets to ONE list of 24 accounts, removes the 12 duplicates,
--   and gives coordinator scoping event codes that actually match the live
--   schema. auth_service.py mirrors this list exactly, so signing in offline
--   and online now behave identically.
--
--   Duplicates removed: superadmin, gate, food, debugging, signal, sql,
--   gadget, paper, borderland, strike, plottwist, film.
--   `superadmin` becomes `admin` — one super-admin account, short name.
--   Two accounts are kept wherever two people genuinely share a post (both
--   gates, both food counters, both coordinators per event), because the audit
--   log is only worth reading if it names a person.
--
-- PASSWORDS BELOW ARE PUBLIC IN GIT HISTORY. They are here so the panel works
-- today, not because they are safe. Rotate before the panel guards anything:
--     python scripts/gen_admin_hashes.py
-- then set ADMIN_DISABLE_SEED_FALLBACK=true.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Fold `superadmin` into `admin`, keeping the row (and its id, so any
--    audit rows and coordinator links survive).
-- ------------------------------------------------------------------------------
UPDATE admin_users SET username = 'admin' WHERE username = 'superadmin'
  AND NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin');

-- ------------------------------------------------------------------------------
-- 2. Upsert the canonical 24.
--    Passwords: admin Admin@Zinnia2026 · treasurer Treasurer@Zin26
--               gate1/2 GatePass@Zin26 · food1/2 FoodPass@Zin26
--               all coordinators Coord@Zin26
-- ------------------------------------------------------------------------------
INSERT INTO admin_users (username, password_hash, name, phone, role) VALUES
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
    password_hash = EXCLUDED.password_hash,
    name          = EXCLUDED.name,
    phone         = EXCLUDED.phone,
    role          = EXCLUDED.role,
    is_active     = true;

-- ------------------------------------------------------------------------------
-- 3. Retire the 12 duplicates.
--    Deactivated rather than deleted: admin_audit_log.admin_id is a plain text
--    column, but any history that references these accounts stays readable,
--    and a deactivated row cannot sign in (auth_service filters is_active).
-- ------------------------------------------------------------------------------
UPDATE admin_users SET is_active = false
 WHERE username IN ('superadmin', 'gate', 'food', 'debugging', 'signal', 'sql',
                    'gadget', 'paper', 'borderland', 'strike', 'plottwist', 'film');

-- ------------------------------------------------------------------------------
-- 4. Coordinator scope, in codes that match the LIVE schema.
--
--    event_coordinators.event_id is FK'd to public.events(id) and therefore
--    holds legacy ids ('lost-at-sql'). The admin panel filters on zin26 event
--    codes ('LOST_IN_SQL'), so that mapping silently matched nothing and every
--    coordinator saw an empty event list. This table holds the zin26 codes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_event_scope (
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    event_code    TEXT NOT NULL,   -- zin26.events.code, no FK across schemas
    PRIMARY KEY (admin_user_id, event_code)
);

INSERT INTO admin_event_scope (admin_user_id, event_code)
SELECT u.id, m.event_code
  FROM (VALUES
        ('debugging1',  'DEBUGGING'),        ('debugging2',  'DEBUGGING'),
        ('signal1',     'LAST_SIGNAL'),      ('signal2',     'LAST_SIGNAL'),
        ('sql1',        'LOST_IN_SQL'),      ('sql2',        'LOST_IN_SQL'),
        ('gadget1',     'GADGET_CODES'),     ('gadget2',     'GADGET_CODES'),
        ('paper1',      'PAPER_PRESENTATION'),('paper2',     'PAPER_PRESENTATION'),
        ('borderland1', 'BORDERLAND'),       ('borderland2', 'BORDERLAND'),
        ('strike1',     'THINK_STRIKE_WIN'), ('strike2',     'THINK_STRIKE_WIN'),
        ('plottwist1',  'PLOT_TWIST'),       ('plottwist2',  'PLOT_TWIST'),
        ('film1',       'SHORT_FILM'),       ('film2',       'SHORT_FILM')
       ) AS m(username, event_code)
  JOIN admin_users u ON u.username = m.username
ON CONFLICT (admin_user_id, event_code) DO NOTHING;

ALTER TABLE admin_event_scope ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_event_scope FORCE  ROW LEVEL SECURITY;
REVOKE ALL ON admin_event_scope FROM anon, authenticated;

-- ==============================================================================
-- VERIFY
--   SELECT username, role, is_active FROM admin_users ORDER BY is_active DESC, username;
--     -- expect 24 active, 12 inactive, no duplicate role/person
--   SELECT u.username, s.event_code FROM admin_event_scope s
--     JOIN admin_users u ON u.id = s.admin_user_id ORDER BY u.username;
--     -- expect 18 rows, codes in zin26 form
-- ==============================================================================
