"""
Apply a .sql migration directly to the Supabase Postgres database.

WHY THIS EXISTS
    The backend talks to Supabase over PostgREST, which runs queries but not
    DDL. So `CREATE VIEW` / `CREATE FUNCTION` cannot go through the app at all
    — they need a real Postgres connection. This is that connection, without
    hand-building a psql string.

USAGE
    python scripts/apply_migration.py supabase/migrations/009_admin_views.sql

    The database password is prompted for, never stored and never echoed. Get
    it from Supabase Dashboard -> Project Settings -> Database -> Database
    password (it is NOT any of the API keys, and can be reset there).

    Non-interactive alternative:
        set SUPABASE_DB_PASSWORD=...      (Windows)
        export SUPABASE_DB_PASSWORD=...   (bash)

    Or pass a full connection string, e.g. the Session pooler one:
        python scripts/apply_migration.py <file.sql> "postgresql://..."

The whole file runs in ONE transaction: if any statement fails, nothing is
applied and the database is left exactly as it was.
"""

from __future__ import annotations

import os
import re
import sys
from getpass import getpass
from pathlib import Path
from urllib.parse import quote_plus

try:
    import psycopg2
except ImportError:
    sys.exit("psycopg2 is not installed.  pip install psycopg2-binary")

ROOT = Path(__file__).resolve().parent.parent


def project_ref() -> str:
    """Pull the project ref out of SUPABASE_URL in the root .env."""
    env = ROOT / ".env"
    if not env.exists():
        sys.exit("No .env found at the repo root.")
    text = env.read_text(encoding="utf-8")
    m = re.search(r"^(?:VITE_)?SUPABASE_URL=https://([a-z0-9]+)\.supabase\.co", text, re.M)
    if not m:
        sys.exit("Could not read SUPABASE_URL from .env")
    return m.group(1)


def candidates(ref: str, password: str) -> list[tuple[str, str]]:
    """
    Direct first, then the IPv4 pooler. The direct host is IPv6-only on some
    networks, which fails with an unhelpful 'could not translate host name'.
    """
    pw = quote_plus(password)
    out = [("direct", f"postgresql://postgres:{pw}@db.{ref}.supabase.co:5432/postgres")]
    for region in ("ap-south-1", "us-east-1", "ap-southeast-1", "eu-central-1"):
        out.append(
            (f"pooler {region}",
             f"postgresql://postgres.{ref}:{pw}@aws-0-{region}.pooler.supabase.com:5432/postgres")
        )
    return out


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)

    path = Path(sys.argv[1])
    if not path.is_absolute():
        path = ROOT / path
    if not path.exists():
        sys.exit(f"No such file: {path}")

    sql = path.read_text(encoding="utf-8")
    print(f"Applying {path.name}  ({len(sql.splitlines())} lines)\n")

    explicit_dsn = sys.argv[2] if len(sys.argv) > 2 else ""
    if explicit_dsn:
        tries = [("provided", explicit_dsn)]
    else:
        pw = os.getenv("SUPABASE_DB_PASSWORD") or getpass("Supabase database password: ")
        if not pw:
            sys.exit("No password given.")
        tries = candidates(project_ref(), pw)

    conn = None
    for label, dsn in tries:
        try:
            conn = psycopg2.connect(dsn, connect_timeout=12)
            print(f"connected via {label}\n")
            break
        except Exception as e:
            first = str(e).strip().splitlines()[0] if str(e).strip() else type(e).__name__
            # A wrong password is final; a bad host just means try the next one.
            if "password authentication failed" in first.lower():
                sys.exit("Password rejected. Check Project Settings -> Database -> Database password.")
            print(f"  {label}: {first[:90]}")

    if conn is None:
        sys.exit(
            "\nCould not reach the database on any host.\n"
            "Copy the 'Session pooler' connection string from\n"
            "  Dashboard -> Project Settings -> Database -> Connection string\n"
            "and pass it as the second argument."
        )

    try:
        # One transaction: a failure half way leaves nothing behind.
        with conn:
            with conn.cursor() as cur:
                cur.execute(sql)
        print("APPLIED - committed.\n")
    except Exception as e:
        msg = str(e).strip()
        print("FAILED - nothing was applied, the database is unchanged.\n")
        print(msg[:1500])
        conn.close()
        sys.exit(1)

    # Report what now exists, so the result is visible rather than assumed.
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_name FROM information_schema.views
                 WHERE table_schema = 'zin26' ORDER BY table_name
            """)
            views = [r[0] for r in cur.fetchall()]
            cur.execute("""
                SELECT p.proname FROM pg_proc p
                  JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE n.nspname = 'zin26' ORDER BY p.proname
            """)
            fns = sorted({r[0] for r in cur.fetchall()})
        print("zin26 views:    ", ", ".join(views) or "(none)")
        print("zin26 functions:", ", ".join(fns) or "(none)")
    except Exception as e:
        print(f"(verification query failed: {e})")
    finally:
        conn.close()

    print("\nReload /admin - no server restart needed.")


if __name__ == "__main__":
    main()
