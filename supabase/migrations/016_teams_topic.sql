-- ==============================================================================
-- ZINNIA 2026 — 016: A TEAM'S CHOSEN TOPIC
-- ==============================================================================
-- WHY
--   Paper Verse (PAPER_PRESENTATION) lets each team pick its own subject — the
--   published rules say so outright: "Teams may choose any topic based on their
--   area of interest or preference." Nothing recorded that choice, so the
--   coordinators only found out what forty-odd teams were presenting when the
--   teams walked into the seminar hall. Judges could not be briefed, the running
--   order could not be grouped by subject, and two teams arriving with the same
--   topic was discovered on the day.
--
--   Captured at team creation instead, while the captain is already filling a
--   form and has actually decided.
--
-- WHAT
--   One nullable TEXT column on zin26.teams.
--
--   On teams, not on registrations: Paper Verse is team_size_min 2 / max 3
--   (rules_engine.py), so an entry is ALWAYS a team and never an individual.
--   One topic per team, which is exactly what the column expresses. Putting it
--   on registrations would store it once per member and let the three copies
--   disagree.
--
--   Nullable, and NOT constrained to Paper Verse at the database level:
--     * every team created before this migration has no topic, and they are
--       still valid teams;
--     * the eight other team events have no topic and never will, so NULL is
--       their normal state, not a defect;
--     * a CHECK tying non-NULL to event_code = 'PAPER_PRESENTATION' would have
--       to be dropped and rewritten the first time another event wants a topic.
--   Which event asks for it is a product decision and lives in the application,
--   where it can change without a migration.
--
-- SAFETY
--   ADD COLUMN IF NOT EXISTS only. Nothing dropped, renamed, rewritten or
--   backfilled, and no existing row changes. There is no migration ledger in
--   this project — migrations are pasted into the Supabase SQL console by hand —
--   so this file is written to be re-runnable without effect.
--
--   No policy or grant work: zin26.teams has RLS enabled with no policies, anon
--   and authenticated are already revoked, and Flask reaches it with the
--   service-role key.
--
-- ORDER OF DEPLOY
--   RUN THIS BEFORE DEPLOYING THE CODE, as with 014 and 015. PostgREST answers
--   a select naming an unknown column with HTTP 400 (Postgres 42703), and the
--   team read paths name this one once the code ships — which would break team
--   creation and the participant dashboard, not merely hide a field.
-- ==============================================================================

ALTER TABLE zin26.teams
    ADD COLUMN IF NOT EXISTS topic TEXT;

COMMENT ON COLUMN zin26.teams.topic IS
    'The subject this team has chosen to present. Collected at team creation '
    'for Paper Verse, where the rules let teams pick their own; NULL for every '
    'other event and for teams created before this column existed.';

NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- VERIFY
--   SELECT column_name, data_type, is_nullable, column_default
--     FROM information_schema.columns
--    WHERE table_schema = 'zin26' AND table_name = 'teams'
--      AND column_name = 'topic';
--   -- expect: topic | text | YES | (null)
--
--   -- existing teams are untouched
--   SELECT count(*) AS total, count(topic) AS with_topic FROM zin26.teams;
--   -- expect with_topic = 0 immediately after this migration
--
--   -- once teams start registering, what is Paper Verse actually presenting
--   SELECT team_id, team_name, topic
--     FROM zin26.teams
--    WHERE event_code = 'PAPER_PRESENTATION' AND status <> 'CANCELLED'
--    ORDER BY created_at;
-- ==============================================================================
