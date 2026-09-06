# Phase 3–6 recovery from bytecode — status

The working tree was rolled back to a pre-Phase-3 state at some point before
2026-09-04. Sources for the participant flow were lost; their `.pyc` files
survived in `__pycache__` and are the recovery source.

**Backend recovery is complete.** What remains is listed under "Not recoverable
from bytecode" at the bottom.

## Method

`.pyc` files were written by the same CPython 3.14 that runs here, so `marshal`
loads them directly — no decompiler is involved.

- `python _recover/dump_pyc.py` — inventory of every module and whether its
  source survives.
- `python _recover/dump_pyc.py <module>` — constants, names, signatures, line
  numbers and full disassembly for one module.
- `python _recover/verify.py` — compiles each rebuilt `.py` and compares it
  against the original bytecode code-object by code-object: definitions,
  argument names, constants and the whole instruction stream.
  **"byte-identical" means the rebuild is the original**, not a lookalike.

Both tools read from `_recover/pyc_backup/`, never from the live
`__pycache__` — see the warning below.

## WARNING: do not run the backend against a stale tree

A `python app.py` was running at 23:12 on 2026-09-04. It imported three modules
whose sources were stale, recompiled them, and **overwrote their original
bytecode**. Everything else was snapshotted to `_recover/pyc_backup/` (38 files)
immediately afterwards, before the damage could spread.

The three casualties:

| Module | Consequence |
|---|---|
| `email_service` | lost `_strip_tags` and `send_simple_email` outright |
| `passport_service` | lost only the env-default change (trivial to redo) |
| `registration_routes` | lost the Phase 6 body; the docstring was captured first |

The server has been stopped. It is safe to start again now that the sources are
back — the risk was only ever recompiling over bytecode that had no source.

## Recovered and verified byte-identical (25 modules)

Rebuilt from bytecode:

| Module | Code objects |
|---|---|
| `services/zin26_db.py` | 14/14 |
| `services/participant_service.py` | 10/10 |
| `services/participant_auth_service.py` | 8/8 |
| `services/rules_engine.py` | 30/30 |
| `services/event_registration_service.py` | 12/12 |
| `services/team_service.py` | 16/16 |
| `middleware/participant_auth.py` | 3/3 |
| `controllers/participant_controller.py` | 10/10 |
| `controllers/participant_auth_controller.py` | 15/15 |
| `controllers/participant_team_controller.py` | 16/16 |
| `routes/participant_routes.py` | 2/2 |
| `app.py` | 4/4 |

Twelve surviving modules were also re-checked against their bytecode and match:
`auth_service`, `payment_service`, `registration_service`, `admin_controller`,
`passport_controller`, `payment_controller`, `registration_controller`,
`auth_middleware`, `rate_limiter`, `error_handler`, `admin_routes`,
`passport_routes`, `payment_routes`.

## Deliberate deviations (3)

`verify.py` reports these as mismatches on purpose. Do not "fix" them.

1. **`services/admin_service.py`** — 6/7 identical. The two differing constants
   are a hardcoded Supabase URL and publishable key, replaced with
   `os.getenv(..., "")`. Every function body is byte-identical.
2. **`services/passport_service.py`** — 14/15 identical, same two constants,
   same reason. The pre-rollback version had already made this change; the copy
   on disk was the older one that still carried them.
3. **`services/email_service.py`** — compared against the *clobbered* baseline,
   so the two functions restored into it read as "not in original". They are
   reconstructions from their call sites, not bit-verified:
   - `_strip_tags` — the text/plain part builder.
   - `send_simple_email(to, subject, html, text=None)` — the signature is
     pinned by the call sites in `participant_auth_service`, `team_service` and
     `event_registration_service`, and the fourth parameter by the surviving
     `(None,)` default tuple in the pre-clobber bytecode.

`routes/registration_routes.py` is in the same position: reconstructed from the
docstring captured before the overwrite, which named the 410 behaviour and the
four replacement endpoints. Behaviourally right, not bit-verified.

## Verified working

`create_app()` boots and registers **42 routes, 15 of them `/api/participant/*`** —
exactly the set the surviving `src/lib/participant/api.ts` client calls.

Checked live through the Flask test client:

- missing / malformed / forged bearer tokens all 401
- an **admin** token is rejected on participant routes (`Token is not a
  participant session`) — the audience split works
- a genuine participant token is accepted
- body validation returns the right field errors and status codes
- `POST /api/register` answers 410 with the replacement endpoints
- rate limiting engages (request-otp hit its 5/min cap under test)

The recovered rule engine was also cross-checked against the **live seed data**
— the check the lost `test_rules_engine.py` used to perform. All 9 events match
on type, min/max team, capacity, counts_toward_limit and name, and all 11
`event_blocks` rows match the engine's block occupancy. Zero mismatches.

The rule engine was checked against every combination in §3 of the spec:
Tracks A and B all pass, Borderland+LastSignal+Debugging raises the R15
tight-window warning, and the R1/R2/R3/R5/R7 rejections all fire with the right
rule ID. `can_cancel` blocks the R7 orphan case.

## Not recoverable from bytecode

- **`supabase/migrations/005`–`011`** — only `001`–`004` and `012` survive as
  files. **The schema they created is NOT lost**: migrations 005-011 were
  already applied to the live Supabase project, and all 17 `zin26` tables are
  present and reachable —

      app_config  blocks  checkins  event_blocks  events  login_otps
      paper_submissions  participants  payments  registrations  round_results
      rounds  short_film  slots  team_members  teams  windows

  So the backend runs today. What is missing is only the *replayable* SQL, and
  it can be regenerated from the live database rather than guessed: PostgREST
  exposes column names, types, nullability and defaults at
  `GET /rest/v1/` with `Accept-Profile: zin26` and
  `Accept: application/openapi+json`. Do that before anyone needs to stand up a
  second environment. The three functions to re-derive by hand are
  `next_participant_serial()`, `register_participant_event()` and
  `confirm_team()` (all from 008); their contracts are pinned by the sentinel
  strings the recovered services catch — `ZIN26_EVENT_FULL`,
  `ZIN26_ALREADY_REGISTERED`, `ZIN26_EVENT_UNKNOWN`, `ZIN26_TEAM_NOT_READY`,
  `ZIN26_TEAM_UNKNOWN`.
- **`src/lib/rules/engine.test.ts`** — the 48-case suite.
- **`backend/test_rules_engine.py`, `test_integration_offline.py`,
  `smoke_test_participant.py`** — pytest-rewritten bytecode. Messier to read
  than plain modules but still readable; not attempted yet.
- **The participant React pages.** `src/lib/participant/api.ts` and `types.ts`
  survive and pin every endpoint and payload shape, so the pages have a precise
  contract to be rebuilt against.

## Known defect found during recovery

`build_user_id`'s docstring claims serial 14 -> `ZIN26-0142`. The implemented
Luhn check digit actually gives `ZIN26-0141`, and `ZIN26-0142` fails
`is_valid_user_id`. The spec carried the same bad example; the spec is fixed,
the docstring is left as-is because it is part of the byte-verified original.
Fix it deliberately, not by accident.

`execute_server_checkin` in `admin_service` returns `success: True` on both
branches, including when the attendance insert did not confirm. Preserved as
found — it is in the byte-identical portion — but it is a bug.
