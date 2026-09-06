-- Zinnia 2026 — "Lost in SQL" becomes a team event of exactly two.
--
-- It was configured as an individual event (min_team = max_team = 1). The
-- coordinators run it in pairs, so the row is corrected to a fixed team of 2.
--
-- Keep this in step with the two code-side mirrors of the same numbers:
--   backend/services/rules_engine.py  EVENTS["LOST_IN_SQL"]  (min_team, max_team)
--   src/lib/rules/catalog.ts          LOST_IN_SQL            (minTeam, maxTeam)
-- The rule engine is what actually enforces team size at registration time;
-- this row is the reference copy the two engines are aligned to.

UPDATE zin26.events
SET    min_team = 2,
       max_team = 2
WHERE  code = 'LOST_IN_SQL';

-- Verification:
--   SELECT code, name, min_team, max_team FROM zin26.events WHERE code = 'LOST_IN_SQL';
--   -- expected: LOST_IN_SQL | Lost in SQL | 2 | 2
