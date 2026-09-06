"""
Rotate every seeded admin password.

The hashes in migration 001 and in services/auth_service.py are public in git
history, so those accounts must be treated as compromised permanently. This
prints fresh passwords and the SQL to install them.

    python scripts/gen_admin_hashes.py

Run it locally. Do NOT commit the output. Hand each credential over out of
band, then set ADMIN_DISABLE_SEED_FALLBACK=true so the built-in accounts in
auth_service.py stop being accepted at all.
"""

import secrets
import string

import bcrypt

# Matches the usernames seeded by migration 001.
ACCOUNTS = [
    "superadmin", "treasurer", "gate1", "gate2", "food1", "food2",
    "debugging1", "debugging2", "signal1", "signal2", "sql1", "sql2",
    "gadget1", "gadget2", "paper1", "paper2", "borderland1", "borderland2",
    "strike1", "strike2", "plottwist1", "plottwist2", "film1", "film2",
]

# Unambiguous alphabet: no O/0 or l/1 to mistype when read off a screen.
ALPHABET = "".join(c for c in string.ascii_letters + string.digits if c not in "O0lI1")


def main() -> None:
    print("-- Zinnia 2026 admin credential rotation")
    print("-- Copy the SQL into the Supabase SQL editor, then destroy this output.\n")
    for user in ACCOUNTS:
        pw = "".join(secrets.choice(ALPHABET) for _ in range(16))
        h = bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12)).decode()
        print(f"-- {user}: {pw}")
        print(f"UPDATE admin_users SET password_hash = '{h}' WHERE username = '{user}';")
    print("\n-- Then: ADMIN_DISABLE_SEED_FALLBACK=true in the backend environment.")


if __name__ == "__main__":
    main()
