-- ==============================================================================
-- ZINNIA 2026 — 020: NON-TECH TEAM EVENTS TAKE A TEAM OF 2 OR 3
-- ==============================================================================
-- WHY
--   The organisers opened the three non-tech team events - Borderland @ GCEE,
--   Think Strike Win and Plot Twist - to teams of 2 as well as 3. They were
--   exactly 3. Short Film stays an individual event; no tech event changes.
--
--   The team size lives in three places that must agree, or one screen offers
--   a team of 2 that another refuses:
--     1. backend/services/rules_engine.py  EVENTS        (the server's check)
--     2. src/lib/rules/catalog.ts                          (the browser's copy)
--     3. zin26.events.min_team / max_team                  (this file)
--
-- SAFETY
--   Data only: three rows of zin26.events, the event settings. No participant,
--   team or registration row is touched - and none existed in these events when
--   this was written. Every team of 3 is still valid. The UPDATE matches the
--   OLD sizes, so an event already changed by hand is left alone, and running
--   this file twice changes nothing the second time.
-- ==============================================================================

UPDATE zin26.events
   SET min_team = 2
 WHERE code IN ('BORDERLAND', 'THINK_STRIKE_WIN', 'PLOT_TWIST')
   AND min_team = 3
   AND max_team = 3;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   SELECT code, min_team, max_team FROM zin26.events
--    WHERE category = 'NON_TECH' ORDER BY sort_order;
--   -- expect BORDERLAND, THINK_STRIKE_WIN, PLOT_TWIST  2 | 3,  SHORT_FILM  1 | 1
-- ==============================================================================
