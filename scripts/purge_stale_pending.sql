-- ==============================================================================
-- ZINNIA 2026 — PURGE STALE PENDING REGISTRATIONS
-- ==============================================================================
-- PURPOSE:
--   Deletes unverified / abandoned registrations older than N days (default: 3 days)
--   that are still in 'AWAITING_PAYMENT' status.
--   This automatically cascades and deletes pending_registration_emails,
--   releasing email addresses held by abandoned registration attempts.
--
-- USAGE:
--   Run manually in Supabase SQL editor or schedule via pg_cron:
--   SELECT cron.schedule('0 0 * * *', $$DELETE FROM pending_registrations WHERE payment_status = 'AWAITING_PAYMENT' AND created_at < NOW() - INTERVAL '3 days'$$);

DELETE FROM pending_registrations
WHERE payment_status = 'AWAITING_PAYMENT'
  AND created_at < NOW() - INTERVAL '3 days';
