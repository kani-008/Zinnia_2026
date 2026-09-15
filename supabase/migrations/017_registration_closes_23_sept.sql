-- ==============================================================================
-- ZINNIA 2026 — 017: REGISTRATION CLOSES AT THE END OF 23 SEPTEMBER
-- ==============================================================================
-- WHY
--   The organisers moved the close from the end of 22 September to the end of
--   23 September IST, the night before the fest. Short Film is unchanged and
--   still closes at the end of 20 September, because its video submission
--   closes the same day.
--
--   The close date is enforced in TWO independent places, and both have to move:
--     1. backend/services/rules_engine.py  _CLOSES_DEFAULT  (Python, R14)
--     2. zin26.events.reg_closes_at, read by zin26.register_participant_event
--        inside the database, for every registration path.
--   Moving only the Python leaves the database refusing registrations on the
--   23rd, and the participant sees "Unknown event" instead of any closing
--   message. This file is the database half.
--
--   public.app_settings.default_reg_closes_at enforces nothing; it drives only
--   the super-admin countdown. It moves too so that countdown tells the truth.
--
-- SAFETY
--   Data only, no schema change. Each UPDATE matches the OLD value, so an event
--   whose close date an admin has already changed by hand is left alone, and
--   running this file twice changes nothing the second time.
-- ==============================================================================

UPDATE zin26.events
   SET reg_closes_at = '2026-09-23T23:59:59+05:30'
 WHERE code <> 'SHORT_FILM'
   AND reg_closes_at = '2026-09-22T23:59:59+05:30';

UPDATE public.app_settings
   SET value = '"2026-09-23T23:59:59+05:30"'
 WHERE key = 'default_reg_closes_at'
   AND value = '"2026-09-22T23:59:59+05:30"';

-- ==============================================================================
-- VERIFY
--   SELECT code, reg_closes_at AT TIME ZONE 'Asia/Kolkata' AS closes_ist
--     FROM zin26.events ORDER BY sort_order;
--   -- expect 23:59:59 on 2026-09-23 for eight events, 2026-09-20 for SHORT_FILM
--
--   SELECT key, value FROM public.app_settings
--    WHERE key IN ('default_reg_closes_at', 'short_film_closes_at');
-- ==============================================================================
