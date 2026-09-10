-- ==============================================================================
-- ZINNIA 2026 — 015: WHY A PAYMENT WAS APPROVED WITHOUT A BANK REFERENCE
-- ==============================================================================
-- WHY
--   Some people pay the treasurer in cash at a desk. There is no UTR for that
--   and never will be, so the normal approval path refuses them outright:
--   treasurer_review_payment returns NO_PAYMENT when the row has no txn_ref.
--
--   The bypass action approves those registrations anyway. That is a deliberate
--   hole in the verification, so it has to leave a mark. Without one, a cash
--   approval and a bank-verified approval are indistinguishable afterwards, and
--   nobody reconciling the accounts at the end of the fest can tell which
--   payments should appear in a statement and which never will.
--
--   admin_audit_log already records who pressed the button and when. This is
--   the other half: the mark travels ON the payment, so it shows up in the
--   treasurer's queue and in any export, not only in an audit table nobody
--   opens.
--
-- WHAT
--   One nullable TEXT column holding the treasurer's stated reason. Non-NULL
--   means "approved without a matching bank reference" — the queue reads it as
--   a Bypassed flag, and it is the only thing that distinguishes the two kinds
--   of approval.
--
--   Not a boolean, because "it was a bypass" is far less use six weeks later
--   than "paid cash at the CSE desk, receipt 41". The reason is required by the
--   endpoint, so the column is never set to an empty string.
--
-- SAFETY
--   ADD COLUMN IF NOT EXISTS only. Nothing dropped, renamed or backfilled, and
--   no existing row changes. There is no migration ledger in this project, so
--   this file is written to be re-runnable without effect. No policy or grant
--   work: zin26.payments has RLS enabled with no policies, anon and
--   authenticated are revoked, and Flask uses the service-role key.
--
-- ORDER OF DEPLOY
--   RUN THIS BEFORE DEPLOYING THE CODE, for the same reason as 014: PostgREST
--   answers a select naming an unknown column with HTTP 400 (Postgres 42703),
--   and the treasurer's payments queue names this one.
-- ==============================================================================

ALTER TABLE zin26.payments
    ADD COLUMN IF NOT EXISTS approval_note TEXT;

COMMENT ON COLUMN zin26.payments.approval_note IS
    'Treasurer''s reason for approving without a matching bank reference, e.g. '
    'a cash payment taken at a desk. NULL means this was a normal approval '
    'checked against a transaction reference.';

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_schema = 'zin26' AND table_name = 'payments'
--      AND column_name = 'approval_note';
--   -- expect: approval_note | text | YES | (null)
--
--   -- how much of the money never touched a bank statement
--   SELECT count(*) FILTER (WHERE approval_note IS NOT NULL) AS bypassed,
--          count(*) FILTER (WHERE approval_note IS NULL)     AS normal
--     FROM zin26.payments WHERE status = 'APPROVED';
-- ==============================================================================
