-- ==============================================================================
-- ZINNIA 2026 — 014: RECORD WHICH ACCOUNT EACH PAYMENT WAS SENT TO
-- ==============================================================================
-- WHY
--   The registration fee is now split across two receiving accounts instead of
--   one. Not for convenience: a personal savings account taking several hundred
--   small credits from unrelated payers is the pattern bank fraud systems flag,
--   and an account frozen mid-fest traps money that has already been collected.
--   Two accounts halve the count each one sees.
--
--   The account is chosen server-side when the verified registration token is
--   minted, derived from the participant's email address (an HMAC, so it cannot
--   be predicted, and so the same address always lands on the same account no
--   matter how many times the token is re-minted). The participant then sees a
--   QR for that account only.
--
--   Nothing in the database recorded which one that was. Without it the
--   treasurer cannot tell which of the two bank statements a given UTR should
--   appear in, and the payments queue would be reconciled against the wrong
--   account half the time. Re-deriving it from the email at read time is not a
--   substitute: the derivation moves if the configured accounts ever change,
--   and it would relabel money that has already been received.
--
-- WHAT
--   One nullable TEXT column holding the payee VPA the participant was shown.
--   Nullable and undefaulted on purpose:
--     * every row written before this migration was paid into the single
--       original account, and NULL is read as exactly that by
--       pending_registration.payee_by_upi();
--     * a CHECK constraint listing today's two VPAs would make adding a third
--       account another hand-applied console migration, so the column stays
--       plain TEXT.
--
--   The value is stamped once, at the INSERT that creates the payments row, and
--   is never included in the UPDATE that a resubmission runs. A participant
--   whose payment was rejected and who pays again must reconcile against the
--   account the money actually went to, not whichever one the configuration
--   would choose today.
--
-- SAFETY
--   ADD COLUMN IF NOT EXISTS only. Nothing is dropped, renamed, rewritten or
--   backfilled, and no existing row changes. There is no migration ledger in
--   this project - migrations are pasted into the Supabase SQL console by hand -
--   so this file is written to be re-runnable without effect.
--
--   No policy or grant work is needed: zin26.payments has RLS enabled with no
--   policies, anon and authenticated are already fully revoked, and Flask
--   reaches the table with the service-role key.
--
-- ORDER OF DEPLOY
--   RUN THIS BEFORE DEPLOYING THE CODE. PostgREST answers a select naming an
--   unknown column with HTTP 400 (Postgres 42703), and five separate select
--   lists name this column once the code ships - including the treasurer's
--   payments queue. Applying the migration first is harmless to the running
--   site; shipping the code first takes the payments queue down.
-- ==============================================================================

ALTER TABLE zin26.payments
    ADD COLUMN IF NOT EXISTS payee_upi TEXT;

COMMENT ON COLUMN zin26.payments.payee_upi IS
    'VPA of the receiving account this participant was shown, stamped at row '
    'creation and never updated. NULL means the row predates the two-account '
    'split and was paid into the original account.';

-- The treasurer reconciles one bank statement at a time, so the queue is read
-- account-by-account. Partial: NULL rows are the pre-split remainder and are
-- never filtered on.
CREATE INDEX IF NOT EXISTS idx_payments_payee
    ON zin26.payments (payee_upi, created_at DESC)
    WHERE payee_upi IS NOT NULL;

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   -- the column exists, is nullable, and has no default
--   SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_schema = 'zin26' AND table_name = 'payments'
--      AND column_name = 'payee_upi';
--   -- expect: payee_upi | text | YES | (null)
--
--   -- existing rows are untouched
--   SELECT count(*) AS total, count(payee_upi) AS stamped FROM zin26.payments;
--   -- expect stamped = 0 immediately after this migration
--
--   -- after a few new registrations, the split should be roughly even
--   SELECT coalesce(payee_upi, '(pre-split)') AS account, count(*)
--     FROM zin26.payments GROUP BY 1 ORDER BY 2 DESC;
-- ==============================================================================
