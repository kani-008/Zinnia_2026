-- ==============================================================================
-- ZINNIA 2026 — 019: FIRST-YEAR JUNIORS AND THEIR LUNCH PASSES
-- ==============================================================================
-- WHY
--   The final-year students invite the first-year juniors to the inauguration
--   and to lunch. Each junior gets an emailed QR lunch pass, sent from the super
--   admin's "Junior invites" page (backend/services/junior_service.py).
--
--   Juniors are guests, not registrations, so they get a table of their own
--   instead of rows in zin26.participants - nothing about them may show up in
--   registration counts, the payments queue or the exports.
--
--   The food counter's scanner records a meal in zin26.food_attendance, keyed
--   by the code in the QR. That column was a foreign key to participants, so a
--   junior's code could never be recorded. It now accepts a code that belongs
--   to EITHER a participant OR a junior - checked by a trigger, because a
--   foreign key can only point at one table. An unknown code is still refused
--   with the same foreign-key error (23503) the scanner already handles.
--
-- WHAT
--   1. zin26.juniors: junior_id (ZIN26-J001 ... J999, handed out shuffled), name, email, food, and where
--      their emailed invite stands.
--   2. zin26.food_attendance: its participants-only foreign key is replaced by
--      zin26.food_attendance_known_id(), which accepts participants and juniors.
--   3. Deleting a participant or a junior removes their food rows, so nothing is
--      left pointing at a code that no longer exists.
--
-- SAFETY
--   No existing row is changed; food_attendance was empty when this was
--   written. Safe to run twice: IF NOT EXISTS / CREATE OR REPLACE throughout,
--   and the foreign-key drop only drops what is there.
-- ==============================================================================

-- 1. the juniors ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zin26.juniors (
    junior_id        TEXT PRIMARY KEY CHECK (junior_id ~ '^ZIN26-J[0-9]{3,}$'),
    name             TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    email            TEXT NOT NULL UNIQUE,
    food_preference  TEXT NOT NULL DEFAULT 'VEG' CHECK (food_preference IN ('VEG', 'NON_VEG')),
    invite_status    TEXT NOT NULL DEFAULT 'PENDING' CHECK (invite_status IN ('PENDING', 'SENT', 'FAILED')),
    invite_error     TEXT,
    invited_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Same lock-down as every other zin26 table (migration 011): reached only
-- through the backend's service role, never from a browser key.
ALTER TABLE zin26.juniors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON zin26.juniors FROM anon, authenticated;
-- The backend's key. Granted by name: a one-off "all tables in zin26" grant made
-- when the schema was set up does not cover a table created after it.
GRANT USAGE ON SCHEMA zin26 TO service_role;
GRANT ALL ON zin26.juniors TO service_role;

-- 2. food_attendance accepts a participant OR a junior ------------------------------
DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT conname
          FROM pg_constraint
         WHERE conrelid = 'zin26.food_attendance'::regclass
           AND contype = 'f'
           AND confrelid = 'zin26.participants'::regclass
    LOOP
        EXECUTE format('ALTER TABLE zin26.food_attendance DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

-- SECURITY DEFINER, like the foreign key it replaces: a key check ran with the
-- owner's rights, so whatever role the food counter's scanner inserts as, it
-- never needed to read participants or juniors itself. Pinned search_path so
-- the definer's rights cannot be steered at another schema's tables.
CREATE OR REPLACE FUNCTION zin26.food_attendance_known_id() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = zin26, pg_catalog, pg_temp AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM zin26.participants WHERE user_id = NEW.user_id)
       AND NOT EXISTS (SELECT 1 FROM zin26.juniors WHERE junior_id = NEW.user_id) THEN
        RAISE EXCEPTION 'food_attendance: % is neither a participant nor a junior', NEW.user_id
            USING ERRCODE = '23503';   -- foreign_key_violation, as before
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS food_attendance_known_id ON zin26.food_attendance;
CREATE TRIGGER food_attendance_known_id
    BEFORE INSERT OR UPDATE OF user_id ON zin26.food_attendance
    FOR EACH ROW EXECUTE FUNCTION zin26.food_attendance_known_id();

-- 3. no food row outlives its participant or junior ---------------------------------
-- One function per table: a single shared one naming OLD.user_id and
-- OLD.junior_id fails on whichever field the deleted row does not have.
CREATE OR REPLACE FUNCTION zin26.participant_food_forget() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM zin26.food_attendance WHERE user_id = OLD.user_id;
    RETURN OLD;
END $$;

CREATE OR REPLACE FUNCTION zin26.junior_food_forget() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM zin26.food_attendance WHERE user_id = OLD.junior_id;
    RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS participants_food_forget ON zin26.participants;
CREATE TRIGGER participants_food_forget
    AFTER DELETE ON zin26.participants
    FOR EACH ROW EXECUTE FUNCTION zin26.participant_food_forget();

DROP TRIGGER IF EXISTS juniors_food_forget ON zin26.juniors;
CREATE TRIGGER juniors_food_forget
    AFTER DELETE ON zin26.juniors
    FOR EACH ROW EXECUTE FUNCTION zin26.junior_food_forget();

-- The API only sees a new table once it reloads its schema cache.
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   SELECT count(*) FROM zin26.juniors;                               -- 0 at first
--   SELECT conname FROM pg_constraint
--    WHERE conrelid = 'zin26.food_attendance'::regclass AND contype = 'f';  -- no row
--   SELECT tgname FROM pg_trigger
--    WHERE tgrelid = 'zin26.food_attendance'::regclass AND NOT tgisinternal; -- food_attendance_known_id
-- ==============================================================================
