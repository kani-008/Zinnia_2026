"""
Create (or reset) on-spot desk logins.

    python scripts/create_desk_logins.py onspot3 onspot4    only these two
    python scripts/create_desk_logins.py                    all four

Only the logins named are touched: onspot1 and onspot2 keep their passwords
when you add onspot3 and onspot4.

Asks for each password (typed, not shown), then prints ONE block of SQL to
paste into the Supabase SQL editor and run. The block:

  1. allows the SPOT_DESK role (migration 018 - safe to run again),
  2. creates the logins, or resets their password and role if they exist,
  3. shows their rows, so you can see it worked.

It runs as one transaction: if any part fails, nothing is changed. Nothing is
written anywhere by this script itself, and the passwords are never printed -
only their bcrypt hashes.

Each login is tied to its UPI account in the backend environment:
    SPOT_DESK_1_ADMIN=onspot1   SPOT_DESK_1_UPI_ID=...
    SPOT_DESK_2_ADMIN=onspot2   SPOT_DESK_2_UPI_ID=...
    SPOT_DESK_3_ADMIN=onspot3   SPOT_DESK_3_UPI_ID=...
    SPOT_DESK_4_ADMIN=onspot4   SPOT_DESK_4_UPI_ID=...
"""

import getpass
import os
import sys

import bcrypt

LOGINS = [
    ("onspot1", "On-spot Desk 1"),
    ("onspot2", "On-spot Desk 2"),
    ("onspot3", "On-spot Desk 3"),
    ("onspot4", "On-spot Desk 4"),
]

MIGRATION = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "supabase", "migrations", "018_spot_desk_role.sql"
)


def ask(username: str) -> str:
    while True:
        # The login strips spaces around a password before checking it
        # (auth_service.authenticate_admin), so the hash must be of the same.
        first = getpass.getpass(f"Password for {username}: ").strip()
        if len(first) < 8:
            print("  At least 8 characters, please.")
            continue
        if getpass.getpass(f"Again, for {username}: ").strip() != first:
            print("  They did not match - try again.")
            continue
        return first


def migration_sql() -> str:
    """The DO block of migration 018, without its comment header."""
    text = open(MIGRATION, encoding="utf-8").read()
    start = text.index("DO $$")
    end = text.index("END $$;") + len("END $$;")
    return text[start:end]


def chosen(args) -> list:
    """The logins named on the command line (all of them when none are)."""
    known = dict(LOGINS)
    wanted = [a.strip().lower() for a in args if a.strip()]
    unknown = [w for w in wanted if w not in known]
    if unknown:
        raise SystemExit(f"Unknown login(s): {', '.join(unknown)}. Known: {', '.join(known)}")
    return [(u, n) for u, n in LOGINS if not wanted or u in wanted]


def main() -> int:
    logins = chosen(sys.argv[1:])
    print("Setting passwords for: " + ", ".join(u for u, _ in logins))
    rows = []
    for username, name in logins:
        password = ask(username)
        digest = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode()
        rows.append(f"    ('{username}', '{digest}', '{name}', 'SPOT_DESK', true)")

    print("\n-- ============ copy from here ============")
    print("-- Zinnia 2026: on-spot desk logins. Paste all of this into the Supabase SQL")
    print("-- editor and press Run. One transaction: if anything fails, nothing changes.")
    print("BEGIN;\n")
    print("-- 1. allow the SPOT_DESK role (migration 018)")
    print(migration_sql())
    print("\n-- 2. the desk logins (created, or password and role reset)")
    print("INSERT INTO public.admin_users (username, password_hash, name, role, is_active) VALUES")
    print(",\n".join(rows))
    print("ON CONFLICT (username) DO UPDATE")
    print("   SET password_hash = EXCLUDED.password_hash,")
    print("       name          = EXCLUDED.name,")
    print("       role          = EXCLUDED.role,")
    print("       is_active     = true;")
    print("\nCOMMIT;\n")
    names = ", ".join(f"'{u}'" for u, _ in logins)
    print(f"-- 3. check: expect {len(logins)} row(s), role SPOT_DESK, is_active true")
    print("SELECT username, role, is_active FROM public.admin_users")
    print(f" WHERE username IN ({names}) ORDER BY username;")
    print("-- ============= copy to here =============")
    return 0


if __name__ == "__main__":
    sys.exit(main())
