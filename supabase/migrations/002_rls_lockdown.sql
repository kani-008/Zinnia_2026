-- ==============================================================================
-- ZINNIA 2026 — 002: RLS LOCKDOWN
-- ==============================================================================
-- PURPOSE
--   As of the audit, the public anon key had FULL read/write/DELETE access to
--   every table. That key is hardcoded in the shipped frontend bundle, so any
--   visitor could dump or delete all participant data.
--
--   Verified before this migration:
--     GET    /rest/v1/team_members?select=*   -> 200, 24 rows (names, emails,
--                                                phones, passport_token)
--     DELETE /rest/v1/team_members?id=eq.<x>  -> 204
--     PATCH  /rest/v1/team_members?id=eq.<x>  -> 204
--
-- MODEL
--   The Flask backend uses the SERVICE ROLE key, which bypasses RLS entirely.
--   So all application writes keep working with zero policies defined.
--   The anon key gets read access to `events` only — nothing else.
--
-- HOW TO APPLY
--   Supabase has no DDL endpoint. Paste this into:
--     Supabase Dashboard -> SQL Editor -> New query -> Run
--   Then re-run the verification block at the bottom.
--
-- SAFETY
--   Non-destructive. Creates no tables, drops no data. Only toggles RLS and
--   revokes grants. Reversible via the rollback block at the end.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ENABLE RLS ON EVERY TABLE THAT EXISTS
-- ------------------------------------------------------------------------------
-- FORCE also applies RLS to the table owner, closing the "owner bypasses RLS"
-- gap. The service_role key still bypasses it (it holds the bypassrls attribute).
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'teams',
        'team_members',
        'event_registrations',
        'team_payments',
        'attendance',
        'passport_dispatch',
        'events',
        'admin_profiles',
        'admin_users',
        'event_coordinators'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
            EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY;', t);
            RAISE NOTICE 'RLS enabled on %', t;
        ELSE
            RAISE NOTICE 'skipped (does not exist): %', t;
        END IF;
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 2. REVOKE ALL TABLE GRANTS FROM anon AND authenticated
-- ------------------------------------------------------------------------------
-- RLS alone is not enough. PostgREST checks SQL grants first; leaving DELETE
-- granted means a future permissive policy silently re-opens deletion.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Stop future tables from defaulting back to open.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. THE ONLY PUBLIC READ: the events catalogue
-- ------------------------------------------------------------------------------
-- The marketing site lists events before anyone logs in. Nothing else is public.
-- SELECT only — no INSERT/UPDATE/DELETE grant is issued.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;

DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events"
    ON public.events
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Deliberately NO policies on teams, team_members, event_registrations,
-- team_payments, attendance, passport_dispatch, admin_*.
-- RLS on + zero policies = deny all, for every role except service_role.

COMMIT;

-- ==============================================================================
-- VERIFICATION — run this after the migration and read the output
-- ==============================================================================

-- 4a. Every table must show rls_enabled = true (events included).
SELECT
    c.relname                        AS table_name,
    c.relrowsecurity                 AS rls_enabled,
    c.relforcerowsecurity            AS rls_forced,
    count(p.polname)                 AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

-- 4b. anon must appear ONLY on events, and only with SELECT.
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon' AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- ==============================================================================
-- POST-APPLY CHECK FROM A SHELL (should be 0 rows / denied, not 200 with data):
--
--   U=https://<your-project>.supabase.co
--   K=<your anon key>
--   curl -s "$U/rest/v1/team_members?select=*" -H "apikey: $K" -H "Authorization: Bearer $K"
--     -> expect []  (RLS) or 401/403 (grant revoked)
--   curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$U/rest/v1/team_members?id=eq.zzz" \
--        -H "apikey: $K" -H "Authorization: Bearer $K"
--     -> expect 401/403, NOT 204
--   curl -s "$U/rest/v1/events?select=id" -H "apikey: $K" -H "Authorization: Bearer $K"
--     -> expect the event list (public catalogue still works)
--
-- Also confirm the backend still works end to end: it uses the service role key
-- and bypasses all of the above. If a backend call starts returning [] after
-- this, it is running on the ANON key and that is a separate bug to fix.
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK (only if this breaks something you cannot immediately diagnose)
-- ==============================================================================
-- BEGIN;
-- DO $$ DECLARE t text; BEGIN
--   FOREACH t IN ARRAY ARRAY['teams','team_members','event_registrations',
--       'team_payments','attendance','passport_dispatch','events',
--       'admin_profiles','admin_users','event_coordinators'] LOOP
--     IF EXISTS (SELECT 1 FROM information_schema.tables
--                WHERE table_schema='public' AND table_name=t) THEN
--       EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY;', t);
--       EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t);
--     END IF;
--   END LOOP;
-- END $$;
-- COMMIT;
-- NOTE: rolling back restores the vulnerability. Prefer fixing forward.
-- ==============================================================================
