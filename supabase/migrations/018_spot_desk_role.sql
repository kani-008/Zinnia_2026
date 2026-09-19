-- ==============================================================================
-- ZINNIA 2026 — 018: A DESK-ONLY ADMIN ROLE (SPOT_DESK)
-- ==============================================================================
-- WHY
--   The on-spot desk is run by two logins of its own, onspot1 and onspot2. Each
--   takes UPI into a desk account of its own (SPOT_DESK_1_* / SPOT_DESK_2_* in
--   the backend environment), never the website's accounts.
--
--   Those logins must be able to run the desk and nothing else: not the
--   Payments queue (approving or bypassing website payments), not the
--   dashboard, not the exports, which hand out every participant's details.
--   TREASURER would have given them all of that, so they get a role of their
--   own. The backend admits SPOT_DESK only on /api/admin/spot/* and
--   /api/admin/me (require_role / require_signed_in); every "any admin" route
--   refuses it (middleware DESK_ONLY_ROLES).
--
-- WHAT
--   public.admin_users.role is limited by a CHECK constraint that lists the
--   allowed roles. This replaces it with the same list plus SPOT_DESK.
--
--   The constraint was declared inline (migration 001 or 011, whichever created
--   the table), so its name is Postgres's default and is not assumed here: the
--   block finds every CHECK on admin_users that mentions role, drops it, and
--   adds one named admin_users_role_check.
--
-- SAFETY
--   Schema only; no row is changed and no login is created. If any existing row
--   held a role outside the new list, ADD CONSTRAINT would fail and the whole
--   block would roll back, leaving the old constraint in place. Running it twice
--   is harmless: the second run drops and re-adds the same constraint.
--
--   The two logins are created separately, by the person running the desk:
--   scripts/create_desk_logins.py asks for each password and prints the INSERT.
-- ==============================================================================

DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT conname
          FROM pg_constraint
         WHERE conrelid = 'public.admin_users'::regclass
           AND contype = 'c'
           AND pg_get_constraintdef(oid) ILIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE public.admin_users DROP CONSTRAINT %I', c.conname);
    END LOOP;

    ALTER TABLE public.admin_users
        ADD CONSTRAINT admin_users_role_check CHECK (role IN (
            'SUPER_ADMIN', 'TREASURER', 'GATE_ADMIN', 'FOOD_ADMIN', 'EVENT_COORDINATOR',
            'SPOT_DESK'
        ));
END $$;

-- ==============================================================================
-- VERIFY
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--    WHERE conrelid = 'public.admin_users'::regclass AND contype = 'c';
--   -- expect one admin_users_role_check listing SPOT_DESK
-- ==============================================================================
