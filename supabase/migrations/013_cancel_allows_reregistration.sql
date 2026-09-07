-- ==============================================================================
-- ZINNIA 2026 — 013: A CANCELLED EVENT MUST BE REGISTERABLE AGAIN
-- ==============================================================================
-- SYMPTOM
--   Register for Debugging, cancel it, try to register for it again:
--     HTTP 409 {"code":"23505", "details":"Key (user_id, event_code)=
--     (ZIN26-0018, DEBUGGING) already exists.", "message":"duplicate key value
--     violates unique constraint \"uq_registration_user_event\""}
--   surfaced to the participant wrapped in "could not register - is migration
--   008 applied?", which sent everyone looking at the wrong thing. The
--   migration was applied. The constraint was doing exactly what it said.
--
-- CAUSE
--   Cancellation is a SOFT cancel by design: 011 gave registrations a
--   cancelled_at column and every service sets status='CANCELLED' instead of
--   deleting, so a coordinator can still see who pulled out and when. But 011
--   also made uniqueness unconditional:
--
--       CONSTRAINT uq_registration_user_event UNIQUE (user_id, event_code)
--
--   A CANCELLED row still occupies (user_id, event_code) forever. The seat is
--   released to everybody EXCEPT the person who gave it up, so every event a
--   participant cancels is burned for that participant permanently. It
--   compounds: cancel Debugging and The Last Signal, and R7 then refuses Short
--   Film as the only remaining entry — which is how a participant ends up
--   unable to register for anything at all.
--
--   The same constraint broke the team paths for the same reason:
--   team_service cancels a declining member's row and swap_member cancels the
--   outgoing member's, so neither person could ever be re-added to that event.
--
-- FIX
--   Uniqueness applies to LIVE registrations only. A cancelled row keeps its
--   history and stops constraining the future.
--
--   Safe because every read path already filters status=neq.CANCELLED —
--   event_registration_service.held_event_codes / capacity_map /
--   get_dashboard, admin_panel_service.LIVE_REG, and all four team_service
--   queries — so more than one row per (user_id, event_code) is invisible to
--   the application. The one view that shows every row is the treasurer's
--   payment detail panel, where the full history is the point.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Live-only uniqueness
--
--    Dropping the constraint drops its backing index with it. The DROP INDEX
--    covers the case where an earlier partial run left the index behind
--    without the constraint.
--
--    This stays the real race guard: two concurrent inserts for the same
--    (user_id, event_code) still leave exactly one winner, which is the
--    concurrency requirement in §5 of the spec. It just stops counting the
--    dead rows.
-- ------------------------------------------------------------------------------
ALTER TABLE zin26.registrations DROP CONSTRAINT IF EXISTS uq_registration_user_event;
DROP INDEX IF EXISTS zin26.uq_registration_user_event;

CREATE UNIQUE INDEX IF NOT EXISTS uq_registration_user_event_live
    ON zin26.registrations (user_id, event_code)
 WHERE status <> 'CANCELLED';

-- Re-asserted from 012 so this file is safe to run on its own.
ALTER TABLE zin26.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE zin26.registrations ADD  CONSTRAINT registrations_status_check
    CHECK (status IN ('PENDING_ACCEPTANCE', 'CONFIRMED', 'HELD', 'CANCELLED'));

-- ------------------------------------------------------------------------------
-- 2. register_participant_event — report the duplicate as a domain error
--
--    Unchanged from 012 except for the handler at the bottom. The EXISTS check
--    above the INSERT catches the ordinary case, but two simultaneous requests
--    can both pass it and one then loses on the index. Before, that surfaced
--    as a raw 23505 inside the "is migration 008 applied?" message; now it is
--    the same ZIN26_ALREADY_REGISTERED the caller already knows how to phrase.
--
--    WHEN unique_violation does not catch our own RAISE EXCEPTION calls —
--    those are P0001 raise_exception — so ZIN26_EVENT_FULL and
--    ZIN26_EVENT_UNKNOWN still travel out intact.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zin26.register_participant_event(
    p_user_id    TEXT,
    p_event_code TEXT,
    p_team_id    TEXT DEFAULT NULL,
    p_source     TEXT DEFAULT 'ONLINE',
    p_status     TEXT DEFAULT 'CONFIRMED'
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $fn$
DECLARE
    v_ev    RECORD;
    v_taken INT;
    v_reg   BIGINT;
BEGIN
    -- The lock. Everything below is decided against a row nobody else can move.
    SELECT * INTO v_ev FROM zin26.events WHERE code = p_event_code FOR UPDATE;

    IF NOT FOUND OR NOT v_ev.is_active THEN
        RAISE EXCEPTION 'ZIN26_EVENT_UNKNOWN';
    END IF;

    IF v_ev.reg_closes_at IS NOT NULL AND NOW() > v_ev.reg_closes_at THEN
        RAISE EXCEPTION 'ZIN26_EVENT_UNKNOWN';   -- closed reads as unavailable
    END IF;

    -- One LIVE row per person per event. A CANCELLED row is history and is not
    -- an obstacle: this is the check the partial index above now mirrors.
    IF EXISTS (
        SELECT 1 FROM zin26.registrations
         WHERE user_id = p_user_id
           AND event_code = p_event_code
           AND status <> 'CANCELLED'
    ) THEN
        RAISE EXCEPTION 'ZIN26_ALREADY_REGISTERED';
    END IF;

    IF v_ev.capacity IS NOT NULL THEN
        -- A team event's capacity counts TEAMS; an individual event counts heads.
        IF v_ev.max_team > 1 THEN
            SELECT COUNT(DISTINCT team_id)::int INTO v_taken
              FROM zin26.registrations
             WHERE event_code = p_event_code
               AND status <> 'CANCELLED'
               AND team_id IS NOT NULL;
        ELSE
            SELECT COUNT(*)::int INTO v_taken
              FROM zin26.registrations
             WHERE event_code = p_event_code
               AND status <> 'CANCELLED';
        END IF;

        -- A member joining a team that already holds a seat does not take a
        -- second one, so only a genuinely new team (or head) is counted.
        IF v_taken >= v_ev.capacity
           AND (p_team_id IS NULL
                OR NOT EXISTS (SELECT 1 FROM zin26.registrations
                                WHERE event_code = p_event_code
                                  AND team_id = p_team_id
                                  AND status <> 'CANCELLED'))
        THEN
            RAISE EXCEPTION 'ZIN26_EVENT_FULL';
        END IF;
    END IF;

    INSERT INTO zin26.registrations (user_id, event_code, team_id, status, source)
    VALUES (p_user_id, p_event_code, p_team_id,
            COALESCE(p_status, 'CONFIRMED'), COALESCE(p_source, 'ONLINE'))
    RETURNING reg_id INTO v_reg;

    RETURN v_reg;

EXCEPTION
    WHEN unique_violation THEN
        -- Lost the race between the EXISTS check and the INSERT.
        RAISE EXCEPTION 'ZIN26_ALREADY_REGISTERED';
END;
$fn$;

-- ------------------------------------------------------------------------------
-- 3. cancel_participant_event — cancel, and report how many rows actually moved
--
--    The service used to PATCH over PostgREST and discard the response, so a
--    filter that matched nothing was indistinguishable from a successful
--    cancel: the dashboard reloaded without the card while the row stayed live
--    in the database — "cancelled only in the frontend". Returning the count
--    makes that impossible to miss; 0 means nothing moved and the caller says
--    so instead of reporting success.
--
--    The select-then-update also has to be one transaction. As two PostgREST
--    round trips, two taps on Cancel could both read the same live row.
--
--    A captain's cancel releases every member (R14/D7), which is why the
--    team_id branch lives here rather than in a second request.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zin26.cancel_participant_event(
    p_user_id    TEXT,
    p_event_code TEXT
)
RETURNS INT
LANGUAGE plpgsql
AS $fn$
DECLARE
    v_reg     RECORD;
    v_captain TEXT;
    v_moved   INT;
BEGIN
    SELECT reg_id, team_id INTO v_reg
      FROM zin26.registrations
     WHERE user_id = p_user_id
       AND event_code = p_event_code
       AND status <> 'CANCELLED'
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ZIN26_NOT_REGISTERED';
    END IF;

    IF v_reg.team_id IS NOT NULL THEN
        SELECT captain_user_id INTO v_captain
          FROM zin26.teams WHERE team_id = v_reg.team_id;

        IF v_captain IS NOT NULL AND v_captain <> p_user_id THEN
            RAISE EXCEPTION 'ZIN26_NOT_CAPTAIN';
        END IF;

        UPDATE zin26.registrations
           SET status = 'CANCELLED', cancelled_at = NOW()
         WHERE team_id = v_reg.team_id
           AND status <> 'CANCELLED';
        GET DIAGNOSTICS v_moved = ROW_COUNT;

        UPDATE zin26.teams
           SET status = 'CANCELLED', updated_at = NOW()
         WHERE team_id = v_reg.team_id;
    ELSE
        UPDATE zin26.registrations
           SET status = 'CANCELLED', cancelled_at = NOW()
         WHERE reg_id = v_reg.reg_id
           AND status <> 'CANCELLED';
        GET DIAGNOSTICS v_moved = ROW_COUNT;
    END IF;

    RETURN v_moved;
END;
$fn$;

-- ------------------------------------------------------------------------------
-- 4. Service role only — the browser reaches none of this.
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION zin26.register_participant_event(TEXT, TEXT, TEXT, TEXT, TEXT)
    FROM anon, authenticated;
REVOKE ALL ON FUNCTION zin26.cancel_participant_event(TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION zin26.register_participant_event(TEXT, TEXT, TEXT, TEXT, TEXT)
    TO service_role;
GRANT EXECUTE ON FUNCTION zin26.cancel_participant_event(TEXT, TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   -- the blanket constraint is gone, the partial index stands in its place
--   SELECT indexname, indexdef FROM pg_indexes
--    WHERE schemaname = 'zin26' AND tablename = 'registrations';
--   -- expect uq_registration_user_event_live ... WHERE (status <> 'CANCELLED')
--
--   -- a cancelled event registers again
--   SELECT zin26.cancel_participant_event('ZIN26-0018','DEBUGGING');   -- 1
--   SELECT zin26.register_participant_event('ZIN26-0018','DEBUGGING'); -- new reg_id
--   SELECT reg_id, status, cancelled_at FROM zin26.registrations
--    WHERE user_id = 'ZIN26-0018' AND event_code = 'DEBUGGING' ORDER BY reg_id;
--   -- expect the old CANCELLED row AND the new CONFIRMED one
-- ==============================================================================
