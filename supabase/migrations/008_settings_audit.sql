-- ==============================================================================
-- ZINNIA 2026 — 008: ADMIN SETTINGS & AUDIT LOG
-- ==============================================================================
-- PURPOSE
--   Two tables the admin panel needs from its very first screen:
--     1. app_settings  - global configuration coordinators change without a deploy
--     2. admin_audit_log - who did what, including every bulk data export
--
--   The audit table exists in this first migration rather than at the end
--   because an export is a bulk extraction of personal data, and there is no
--   point recording that only after the panel has been in use for a fortnight.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES
    ('registration_fee',      '250'),
    ('default_reg_closes_at', '"2026-09-22T23:59:59+05:30"'),
    ('short_film_closes_at',  '"2026-09-20T23:59:59+05:30"'),
    ('event_date',            '"2026-09-24"'),
    ('allow_tight_b1',        'true'),   -- R15: Borderland + both morning runners
    ('warn_tight_b1',         'true'),   -- R15: warn even when allowed
    ('team_accept_timeout_h', '24')      -- D2: captain may swap after this
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_id    TEXT NOT NULL,
    admin_name  TEXT NOT NULL,
    action      TEXT NOT NULL,   -- PAYMENT_APPROVE, EVENT_CLOSE, EXPORT, ...
    target_type TEXT,            -- team | participant | event | registration
    target_id   TEXT,
    reason      TEXT,
    detail      JSONB,
    ip          TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_recent ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log (action, created_at DESC);

-- ------------------------------------------------------------------------------
-- RLS — same posture as migration 004: service role only, no browser access.
-- ------------------------------------------------------------------------------
ALTER TABLE app_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings    FORCE  ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log FORCE  ROW LEVEL SECURITY;

REVOKE ALL ON app_settings    FROM anon, authenticated;
REVOKE ALL ON admin_audit_log FROM anon, authenticated;
