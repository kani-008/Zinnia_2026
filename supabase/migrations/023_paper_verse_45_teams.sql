-- ==============================================================================
-- ZINNIA 2026 — 023: PAPER VERSE HOLDS 45 TEAMS, AND IS OPEN FOR THE DESK
-- ==============================================================================
-- WHY
--   Paper Verse filled its 30 team places on the eve of the fest and was closed
--   on the admin Events page. The organisers added 15 more places for walk-in
--   teams at the on-spot desk, so the cap moves to 45 and the event is active
--   again.
--
--   Reopening does NOT reopen the website: that closed at 7:30 PM on 23
--   September through zin26.events.reg_closes_at (migration 022), and only the
--   on-spot desk registers after it.
--
--   The capacity lock comes off with it: 45 is not the last word, so the
--   organisers can set the number themselves on the admin Events page as the
--   desk fills up. Nothing else is unlocked.
--
--   capacity is counted in TEAMS for an event with max_team > 1 — both
--   zin26.register_participant_event and capacity_map() count distinct teams —
--   so 45 means 45 teams, not 45 people. The Python side of the same number is
--   rules_engine.EVENTS["PAPER_PRESENTATION"].capacity.
--
-- SAFETY
--   Data only, no schema change. The UPDATE matches the OLD capacity, so it
--   does nothing the second time and leaves a hand-edited cap alone.
-- ==============================================================================

UPDATE zin26.events
   SET capacity = 45,
       is_active = TRUE,
       capacity_is_locked = FALSE
 WHERE code = 'PAPER_PRESENTATION'
   AND capacity = 30;

-- Run on its own if the capacity above was already changed by hand.
UPDATE zin26.events
   SET capacity_is_locked = FALSE
 WHERE code = 'PAPER_PRESENTATION'
   AND capacity_is_locked;

-- ==============================================================================
-- VERIFY
--   SELECT code, capacity, is_active, capacity_is_locked
--     FROM zin26.events WHERE code = 'PAPER_PRESENTATION';
--   -- expect 45, true, false
--
--   SELECT COUNT(DISTINCT team_id) AS teams_taken
--     FROM zin26.registrations
--    WHERE event_code = 'PAPER_PRESENTATION' AND status <> 'CANCELLED';
--   -- 30 at the time of writing: 15 places left for the desk
-- ==============================================================================
