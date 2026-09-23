-- ==============================================================================
-- ZINNIA 2026 — 022: REGISTRATION CLOSES AT 7:30 PM ON 23 SEPTEMBER
-- ==============================================================================
-- WHY
--   The organisers moved the close again on the day: 11:59 PM -> 9:00 PM (021)
--   -> 7:30 PM IST on 23 September. Short Film is unchanged and still closes at
--   the end of 20 September.
--
--   The close is enforced in TWO independent places and both move:
--     1. backend/services/rules_engine.py  _CLOSES_DEFAULT  (Python, R14)
--     2. zin26.events.reg_closes_at, read by zin26.register_participant_event
--        inside the database, for every registration path.
--   This file is the database half. public.app_settings.default_reg_closes_at
--   enforces nothing; it drives the super-admin countdown, and moves with it.
--
--   The ON-SPOT DESK is not affected by any of this: it registers walk-ins
--   after the close and all through the fest day.
--
-- SAFETY
--   Data only, no schema change. Each UPDATE matches the OLD value, so an event
--   whose close an admin has already changed by hand is left alone, and running
--   this file twice changes nothing the second time.
-- ==============================================================================

UPDATE zin26.events
   SET reg_closes_at = '2026-09-23T19:30:00+05:30'
 WHERE code <> 'SHORT_FILM'
   AND reg_closes_at = '2026-09-23T21:00:00+05:30';

UPDATE public.app_settings
   SET value = '"2026-09-23T19:30:00+05:30"'
 WHERE key = 'default_reg_closes_at'
   AND value = '"2026-09-23T21:00:00+05:30"';

-- ==============================================================================
-- VERIFY
--   SELECT code, reg_closes_at AT TIME ZONE 'Asia/Kolkata' AS closes_ist
--     FROM zin26.events ORDER BY sort_order;
--   -- expect 19:30:00 on 2026-09-23 for eight events, 2026-09-20 for SHORT_FILM
--
--   SELECT key, value FROM public.app_settings
--    WHERE key IN ('default_reg_closes_at', 'short_film_closes_at');
-- ==============================================================================
