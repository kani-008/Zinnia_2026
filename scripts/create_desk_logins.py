"""
Create (or reset) on-spot desk logins.

    python scripts/create_desk_logins.py onspot3 onspot4    only these two
    python scripts/create_desk_logins.py                    all four

Only the logins named are touched: onspot1 and onspot2 keep their passwords
when you add onspot3 and onspot4.

Asks for each password (typed, not shown), then builds ONE block of SQL for
the Supabase SQL editor. The block:

  1. allows the SPOT_DESK role (migration 018 - safe to run again),
  2. creates the logins, or resets their password and role if they exist,
  3. shows their rows, so you can see it worked.

The SQL is put on the clipboard and saved to a file - never copied out of the
terminal, which wraps long lines and so cut the INSERT in half once. Paste it
into the SQL editor and press Run. It runs as one transaction: if any part
fails, nothing is changed. The passwords are never shown or saved - only their
bcrypt hashes. Add --print to also show the SQL here.

Each login is tied to its UPI account in the backend environment:
    SPOT_DESK_1_ADMIN=onspot1   SPOT_DESK_1_UPI_ID=...
    SPOT_DESK_2_ADMIN=onspot2   SPOT_DESK_2_UPI_ID=...
    SPOT_DESK_3_ADMIN=onspot3   SPOT_DESK_3_UPI_ID=...
    SPOT_DESK_4_ADMIN=onspot4   SPOT_DESK_4_UPI_ID=...
"""

import getpass
import os
import subprocess
import sys
import tempfile

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

SQL_FILE = os.path.join(tempfile.gettempdir(), "zinnia_desk_logins.sql")


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
    wanted = [a.strip().lower() for a in args if a.strip() and not a.startswith("--")]
    unknown = [w for w in wanted if w not in known]
    if unknown:
        raise SystemExit(f"Unknown login(s): {', '.join(unknown)}. Known: {', '.join(known)}")
    return [(u, n) for u, n in LOGINS if not wanted or u in wanted]


def build_sql(rows) -> str:
    """rows: [(username, bcrypt_hash, display_name)] -> the whole transaction, short lines."""
    values = ",\n".join(
        f"    ('{username}',\n     '{digest}',\n     '{name}', 'SPOT_DESK', true)"
        for username, digest, name in rows
    )
    names = ", ".join(f"'{u}'" for u, _, _ in rows)
    return "\n".join([
        "-- Zinnia 2026: on-spot desk logins. Run all of this in the Supabase",
        "-- SQL editor. One transaction: if anything fails, nothing changes.",
        "BEGIN;",
        "",
        "-- 1. allow the SPOT_DESK role (migration 018)",
        migration_sql(),
        "",
        "-- 2. the desk logins (created, or password and role reset)",
        "INSERT INTO public.admin_users",
        "    (username, password_hash, name, role, is_active)",
        "VALUES",
        values,
        "ON CONFLICT (username) DO UPDATE",
        "   SET password_hash = EXCLUDED.password_hash,",
        "       name          = EXCLUDED.name,",
        "       role          = EXCLUDED.role,",
        "       is_active     = true;",
        "",
        "COMMIT;",
        "",
        f"-- 3. check: expect {len(rows)} row(s), role SPOT_DESK, is_active true",
        "SELECT username, role, is_active FROM public.admin_users",
        f" WHERE username IN ({names})",
        " ORDER BY username;",
        "",
    ])


def to_clipboard(text: str) -> bool:
    """Best effort: Windows clip, macOS pbcopy, Linux xclip. False if none worked."""
    # Plain ASCII bytes, no byte-order mark: Windows clip pastes a BOM as a real
    # (invisible) character, and Postgres rejects it before the first statement.
    # The SQL is ASCII throughout - usernames, bcrypt hashes and migration 018.
    data = text.encode("ascii")
    for cmd in (["clip"], ["pbcopy"], ["xclip", "-selection", "clipboard"]):
        try:
            subprocess.run(cmd, input=data, check=True)
            return True
        except (OSError, subprocess.CalledProcessError):
            continue
    return False


def main() -> int:
    logins = chosen(sys.argv[1:])
    print("Setting passwords for: " + ", ".join(u for u, _ in logins))
    rows = []
    for username, name in logins:
        password = ask(username)
        digest = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode()
        rows.append((username, digest, name))

    sql = build_sql(rows)
    with open(SQL_FILE, "w", encoding="utf-8", newline="\n") as f:
        f.write(sql)
    copied = to_clipboard(sql)

    print()
    if copied:
        print("The SQL is on your clipboard. In Supabase: SQL Editor -> New query ->")
        print("paste (Ctrl+V) -> Run.")
    else:
        print("Could not reach the clipboard - open the file below and copy all of it.")
    print(f"Also saved to: {SQL_FILE}")
    print("Do not copy the SQL out of this terminal: it wraps long lines.")
    if "--print" in sys.argv[1:]:
        print("\n" + sql)
    return 0


if __name__ == "__main__":
    sys.exit(main())
