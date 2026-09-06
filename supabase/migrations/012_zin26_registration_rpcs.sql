-- ==============================================================================
-- ZINNIA 2026 — 012: REGISTRATION FUNCTIONS
-- ==============================================================================
-- Migration 011 reconstructed the zin26 TABLES from the code that reads them,
-- but the code also calls two PL/pgSQL FUNCTIONS that were equally absent from
-- the repository. Registering for any event failed with PGRST202 until now:
--
--   zin26.register_participant_event(...)  event_registration_service.rpc_register
--   zin26.confirm_team(...)                team_service._rpc_confirm_team
--
-- Both must exist for a participant to enter a single event.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. registrations.status must allow PENDING_ACCEPTANCE
--
--    A team inserts a registrations row for EVERY member at creation time with
--    status PENDING_ACCEPTANCE, and confirm_team() flips them to CONFIRMED once
--    everyone has accepted. That row is what holds the member's 3-event quota
--    and the event's seat while invitations are outstanding — deferring it to
--    acceptance time would let two captains each add the same person and both
--    confirm past R1.
--
--    Migration 011's CHECK allowed only CONFIRMED / HELD / CANCELLED, so team
--    creation would have failed on the constraint.
-- ------------------------------------------------------------------------------
ALTER TABLE zin26.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
ALTER TABLE zin26.registrations ADD  CONSTRAINT registrations_status_check
    CHECK (status IN ('PENDING_ACCEPTANCE', 'CONFIRMED', 'HELD', 'CANCELLED'));

-- ------------------------------------------------------------------------------
-- 2. register_participant_event — the race-safe seat claim
--
--    The capacity check and the insert happen under one row lock on the event.
--    Doing it in Python would leave the window between "one seat left" and
--    INSERT open to a second request, which is the concurrency note in §5 of
--    the spec.
--
--    Sentinel exceptions: the caller matches on these strings and turns them
--    into participant-facing messages, so the text matters.
--      ZIN26_EVENT_UNKNOWN       no such event, or it is inactive
--      ZIN26_EVENT_FULL          capacity reached
--      ZIN26_ALREADY_REGISTERED  UNIQUE(user_id, event_code) would be violated
--
--    Returns the new reg_id.
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
AS $$
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

    -- One row per person per event; the unique index is the real guard but
    -- checking here returns the domain error instead of a 23505.
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
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. confirm_team — flip a fully accepted team's reservations to CONFIRMED
--
--    Called once every member has accepted (D2). Returns how many rows moved,
--    which the caller reports back as the member count.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zin26.confirm_team(p_team_id TEXT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_moved INT;
BEGIN
    UPDATE zin26.registrations
       SET status = 'CONFIRMED'
     WHERE team_id = p_team_id
       AND status = 'PENDING_ACCEPTANCE';
    GET DIAGNOSTICS v_moved = ROW_COUNT;

    UPDATE zin26.teams
       SET status = 'CONFIRMED', updated_at = NOW()
     WHERE team_id = p_team_id;

    RETURN v_moved;
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. Service role only — the browser reaches none of this.
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION zin26.register_participant_event(TEXT, TEXT, TEXT, TEXT, TEXT)
    FROM anon, authenticated;
REVOKE ALL ON FUNCTION zin26.confirm_team(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION zin26.register_participant_event(TEXT, TEXT, TEXT, TEXT, TEXT)
    TO service_role;
GRANT EXECUTE ON FUNCTION zin26.confirm_team(TEXT) TO service_role;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   SELECT zin26.register_participant_event('ZIN26-0018','DEBUGGING');  -- reg_id
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conrelid = 'zin26.registrations'::regclass AND contype = 'c';
-- ==============================================================================
