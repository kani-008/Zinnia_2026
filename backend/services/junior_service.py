"""
Zinnia 2026 — first-year juniors and their lunch passes (super admin only).

The final-year students invite the first-year juniors to the inauguration and
to lunch. The super admin uploads a sheet of {name, email, food}; each junior
is stored in zin26.juniors with a code ZIN26-J001 ... ZIN26-J999 and emailed an
invite whose QR is that code (email_service.send_junior_invite_email).

The numbers are handed out shuffled, not in sheet order: the code IS the lunch
pass - the scanner reads nothing else - and in order (J001, J002 ...) one pass
would give away the next one.

Juniors are guests, not registrations: they never appear in zin26.participants,
so nothing here touches registration counts, payments or exports. The food
counter's scanner records their lunch in zin26.food_attendance under the same
code, which migration 019 made possible; this module only reads that table to
show who has eaten.

Sending is one junior per request. The admin page walks the list, each mail
going as soon as the previous one has finished, so no request runs long.
"""

from __future__ import annotations

import csv
import datetime as dt
import io
import re
import secrets
from typing import Any, Dict, List, Optional, Tuple

from services import zin26_db as db
from services.audit_service import log_action
from services.zin26_db import Zin26Error

JUNIOR_PREFIX = "ZIN26-J"
JUNIOR_ID_RE = re.compile(r"^ZIN26-J(\d{3,})$")
CODE_NUMBERS = range(1, 1000)  # ZIN26-J001 ... ZIN26-J999

MAX_UPLOAD_BYTES = 1024 * 1024
MAX_ROWS = 300  # 60 are expected; this only stops a wrong file doing damage
# Hard limits on what is read from the file at all, blank rows included. A tiny
# .xlsx can claim a million rows by 16,000 columns; openpyxl would pad it out.
MAX_SHEET_LINES = 5000
MAX_SHEET_COLS = 26

# Stricter than the participant form's check on purpose. The address goes into
# a PostgREST in.(...) list and into an email To: header, and a comma or a
# bracket in either splits one address into two - the pass could reach a
# stranger. A sheet typo like "ravi,kumar@gmail.com" is refused instead.
EMAIL_RE = re.compile(r"^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$")

_HEADERS = {
    "name": {"name", "full name", "fullname", "student name", "junior name"},
    "email": {"email", "e-mail", "mail", "email id", "emailid", "email address", "mail id"},
    "food": {"food", "food preference", "food_preference", "foodpreference", "preference",
             "veg/non-veg", "veg / non-veg", "veg or non-veg", "food type"},
}

# A heading is rarely just the word. Sheets come in with "Food Preference
# (Veg / Non veg)", "Email ID :" or "Name of the student", so a column whose
# heading only CONTAINS the word is taken when nothing matched it exactly.
# Exact matches are claimed first, so a plain "Name" is never lost to a
# "Name of college" sitting further left.
_HEADER_WORDS = {"name": ("name",), "email": ("mail",), "food": ("food", "veg")}

_VEG = {"veg", "v", "vegetarian", "veg."}
_NON_VEG = {"non-veg", "non veg", "nonveg", "non_veg", "nv", "non-vegetarian", "non vegetarian", "nonvegetarian"}


def _fail(code: str, message: str, **extra: Any) -> Dict[str, Any]:
    return {"success": False, "error_code": code, "message": message, **extra}


def _now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def _norm_header(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _columns(heads: List[str]) -> Dict[str, Optional[int]]:
    """Which column holds the name, the email and the food, or None for each."""
    cols: Dict[str, Optional[int]] = {
        key: next((i for i, h in enumerate(heads) if h in names), None)
        for key, names in _HEADERS.items()
    }
    taken = {i for i in cols.values() if i is not None}
    for key, words in _HEADER_WORDS.items():
        if cols[key] is not None:
            continue
        found = next((i for i, h in enumerate(heads)
                      if i not in taken and any(w in h for w in words)), None)
        if found is not None:
            cols[key] = found
            taken.add(found)
    return cols


def _food(value: Any) -> Optional[str]:
    v = re.sub(r"\s+", " ", str(value or "").strip().lower())
    if v in _VEG:
        return "VEG"
    if v in _NON_VEG:
        return "NON_VEG"
    return None


# --- reading the sheet -----------------------------------------------------------

def _table_from_upload(filename: str, data: bytes) -> List[List[Any]]:
    """Every row of the first sheet (xlsx) or of the file (csv), as lists of cells."""
    name = (filename or "").lower()
    if name.endswith(".xlsx"):
        from openpyxl import load_workbook

        book = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        try:
            # max_col overrides the width the file claims; the count stops the
            # row generator before padding runs away.
            return _bounded(book.worksheets[0].iter_rows(values_only=True, max_col=MAX_SHEET_COLS))
        finally:
            book.close()
    if name.endswith(".csv"):
        text = data.decode("utf-8-sig", errors="replace")
        return _bounded(row[:MAX_SHEET_COLS] for row in csv.reader(io.StringIO(text)))
    raise ValueError("Upload the sheet as .xlsx or .csv.")


def _bounded(rows) -> List[List[Any]]:
    table: List[List[Any]] = []
    for r in rows:
        if len(table) >= MAX_SHEET_LINES:
            raise ValueError(f"The sheet has more than {MAX_ROWS} rows - check it is the juniors' list.")
        table.append(list(r))
    return table


def read_sheet(filename: str, data: bytes) -> Tuple[List[Dict[str, Any]], str]:
    """
    ([{row, name, email, food_preference, problem}], "") or ([], why the file itself is unusable).
    A row's `problem` is "" when it is fine.
    """
    if not data:
        return [], "The file is empty."
    if len(data) > MAX_UPLOAD_BYTES:
        return [], "The file is over 1 MB - upload just the sheet with name, email and food."
    try:
        table = _table_from_upload(filename, data)
    except ValueError as e:
        return [], str(e)
    except Exception:
        return [], "The file could not be read. Save it as .xlsx or .csv and try again."

    # The heading row is the first one that is not blank.
    start = next((i for i, r in enumerate(table) if any(str(c or "").strip() for c in r)), None)
    if start is None:
        return [], "The sheet has no rows."
    heads = [_norm_header(c) for c in table[start]]
    cols = _columns(heads)
    missing = [key.capitalize() for key, i in cols.items() if i is None]
    if missing:
        return [], (f"The first row must be the headings Name, Email and Food. Missing: {', '.join(missing)}.")

    def cell(r: List[Any], key: str) -> str:
        i = cols[key]
        return re.sub(r"\s+", " ", str(r[i] if i is not None and i < len(r) and r[i] is not None else "")).strip()

    rows: List[Dict[str, Any]] = []
    seen: Dict[str, int] = {}
    for offset, r in enumerate(table[start + 1:], start=start + 2):  # 1-based sheet row numbers
        if not any(str(c or "").strip() for c in r):
            continue
        name, email, food_raw = cell(r, "name"), cell(r, "email").lower(), cell(r, "food")
        food = _food(food_raw)
        problem = ""
        if not name:
            problem = "Name is missing."
        elif not EMAIL_RE.match(email):
            problem = "This email does not look right." if email else "Email is missing."
        elif food is None:
            problem = f"Food must be Veg or Non-veg (it says '{food_raw}')." if food_raw else "Food is missing."
        elif email in seen:
            problem = f"Same email as row {seen[email]}."
        if not problem:
            seen[email] = offset
        rows.append({"row": offset, "name": name, "email": email, "food_preference": food or "", "problem": problem})
        if len(rows) > MAX_ROWS:
            return [], f"The sheet has more than {MAX_ROWS} rows - check it is the juniors' list."
    if not rows:
        return [], "The sheet has headings but no juniors under them."
    return rows, ""


def _known_emails(emails: List[str]) -> Tuple[Dict[str, str], Dict[str, str]]:
    """({email: junior_id} already invited, {email: user_id} already a registered participant)."""
    if not emails:
        return {}, {}
    # Quoted, so PostgREST reads each address as one value whatever it contains.
    in_list = ",".join(db.enc('"' + e.replace("\\", "\\\\").replace('"', '\\"') + '"') for e in emails)
    juniors = {r["email"]: r["junior_id"] for r in
               db.select("juniors", f"select=junior_id,email&email=in.({in_list})")}
    participants = {r["email"]: r["user_id"] for r in
                    db.select("participants", f"select=user_id,email&email=in.({in_list})")}
    return juniors, participants


def preview(filename: str, data: bytes) -> Dict[str, Any]:
    """POST /api/admin/juniors/preview - read the sheet and say what adding it would do. Writes nothing."""
    rows, why = read_sheet(filename, data)
    if why:
        return _fail("BAD_SHEET", why)
    juniors, participants = _known_emails([r["email"] for r in rows if not r["problem"]])
    for r in rows:
        if r["problem"]:
            continue
        if r["email"] in juniors:
            r["problem"] = f"Already on the list as {juniors[r['email']]}."
        elif r["email"] in participants:
            # A registered participant's own pass already covers their lunch; a
            # second pass would be a second meal.
            r["problem"] = f"Already registered for Zinnia as {participants[r['email']]} - their pass covers lunch."
    ready = [r for r in rows if not r["problem"]]
    return {"success": True, "rows": rows, "ready": len(ready), "skipped": len(rows) - len(ready)}


# --- adding them --------------------------------------------------------------------

def _random_codes(count: int) -> Optional[List[str]]:
    """
    `count` codes drawn at random from the numbers not yet given out, or None
    when fewer than that are left.
    """
    taken = {str(r.get("junior_id") or "") for r in db.select("juniors", "select=junior_id")}
    free = [c for c in (f"{JUNIOR_PREFIX}{n:03d}" for n in CODE_NUMBERS) if c not in taken]
    if len(free) < count:
        return None
    return secrets.SystemRandom().sample(free, count)


def add(rows: Any, admin: Dict[str, Any]) -> Dict[str, Any]:
    """
    POST /api/admin/juniors - store the previewed rows, each with a free ZIN26-J
    number drawn at random. Everything is checked again here: the browser only proposes.
    """
    if not isinstance(rows, list) or not rows:
        return _fail("VALIDATION_ERROR", "Nothing to add.")
    if len(rows) > MAX_ROWS:
        return _fail("VALIDATION_ERROR", f"At most {MAX_ROWS} juniors at a time.")

    clean: List[Dict[str, str]] = []
    seen = set()
    for r in rows:
        if not isinstance(r, dict):
            continue
        name = re.sub(r"\s+", " ", str(r.get("name") or "")).strip()
        email = str(r.get("email") or "").strip().lower()
        food = _food(r.get("food_preference"))  # "VEG" / "NON_VEG" from the preview, or a word
        if name and EMAIL_RE.match(email) and food and email not in seen:
            seen.add(email)
            clean.append({"name": name[:120], "email": email, "food_preference": food})
    if not clean:
        return _fail("VALIDATION_ERROR", "None of the rows can be added - check the preview.")

    juniors, participants = _known_emails([c["email"] for c in clean])
    fresh = [c for c in clean if c["email"] not in juniors and c["email"] not in participants]
    skipped = len(clean) - len(fresh)
    if not fresh:
        return {"success": True, "added": [], "skipped": skipped, "message": "Everyone in the sheet is already on the list."}

    # A code drawn at the same moment by a second super admin, or an email added
    # meanwhile, makes the primary key or the email refuse the batch: draw again.
    for _attempt in range(3):
        codes = _random_codes(len(fresh))
        if codes is None:
            return _fail("VALIDATION_ERROR", f"Not enough ZIN26-J codes left for {len(fresh)} more juniors.")
        batch = [{**c, "junior_id": code} for c, code in zip(fresh, codes)]
        try:
            added = db.insert("juniors", batch)
            break
        except Zin26Error as e:
            if e.code != "DUPLICATE":
                raise
            # An email added meanwhile is also a duplicate: drop those and retry.
            now_known, _ = _known_emails([c["email"] for c in fresh])
            still = [c for c in fresh if c["email"] not in now_known]
            if not still:
                return {"success": True, "added": [], "skipped": len(clean), "message": "Already on the list."}
            if len(still) == len(fresh) and "email" in str(e).lower():
                # The email clashes but cannot be found to drop - never loop on it.
                return _fail("VALIDATION_ERROR", "An email in the sheet is already on the list. Upload it again to see which.")
            fresh = still
    else:
        return _fail("BUSY", "Could not give the juniors their codes - try again in a moment.")
    skipped = len(clean) - len(added)

    # Pass codes stay in `detail`, which only the super admin's audit page shows;
    # a target_id would appear in the dashboard's recent-activity feed.
    log_action("JUNIORS_ADD", "junior", None,
               detail={"added": [a["junior_id"] for a in added], "by": admin.get("username")})
    return {"success": True, "added": added, "skipped": skipped,
            "message": f"{len(added)} added{f', {skipped} already on the list' if skipped else ''}."}


# --- the list, with lunch ---------------------------------------------------------

def listing() -> Dict[str, Any]:
    """GET /api/admin/juniors - every junior, how their invite stands, and whether they have eaten."""
    juniors = db.select(
        "juniors",
        "select=junior_id,name,email,food_preference,invite_status,invite_error,invited_at,created_at"
        "&order=created_at.asc,name.asc",
    )
    lunch = {r["user_id"]: r.get("collected_at") for r in
             db.select("food_attendance", f"select=user_id,collected_at&user_id=like.{db.enc(JUNIOR_PREFIX + '*')}")}
    for j in juniors:
        j["lunch_at"] = lunch.get(j["junior_id"])
    count = lambda pred: sum(1 for j in juniors if pred(j))  # noqa: E731
    return {
        "success": True,
        "juniors": juniors,
        "counts": {
            "total": len(juniors),
            "sent": count(lambda j: j["invite_status"] == "SENT"),
            "failed": count(lambda j: j["invite_status"] == "FAILED"),
            "pending": count(lambda j: j["invite_status"] == "PENDING"),
            "veg": count(lambda j: j["food_preference"] == "VEG"),
            "non_veg": count(lambda j: j["food_preference"] == "NON_VEG"),
            "lunch": count(lambda j: bool(j["lunch_at"])),
        },
    }


def _junior(junior_id: str) -> Optional[Dict[str, Any]]:
    jid = str(junior_id or "").strip().upper()
    if not JUNIOR_ID_RE.match(jid):
        return None
    return db.select_one("juniors", f"select=*&junior_id=eq.{db.enc(jid)}")


def send(junior_id: str, admin: Dict[str, Any], resend: bool = False) -> Dict[str, Any]:
    """
    POST /api/admin/juniors/<id>/send - email one junior their invite and lunch pass.

    "Send to all" never mails anyone twice: a junior already SENT is refused
    unless this is a deliberate Resend. The send is claimed first by moving
    updated_at on the row as last read, so two tabs pressing Send at the same
    moment cannot both mail the same junior.
    """
    junior = _junior(junior_id)
    if not junior:
        return _fail("NOT_FOUND", "No junior with that code.")
    jid = junior["junior_id"]
    if junior.get("invite_status") == "SENT" and not resend:
        return _fail("ALREADY_SENT", f"{jid} already has their invite. Use Resend to send it again.", junior_id=jid)

    stamp = junior.get("updated_at")
    lock = f"&updated_at=eq.{db.enc(stamp)}" if stamp else "&updated_at=is.null"
    if not db.update("juniors", f"junior_id=eq.{db.enc(jid)}{lock}", {"updated_at": _now()}):
        return _fail("BUSY", f"{jid} is being sent from somewhere else right now.", junior_id=jid)

    from services.email_service import send_junior_invite_email

    res = send_junior_invite_email({**junior, "pass_code": jid})
    ok = bool(res.get("success"))
    update = {"invite_status": "SENT" if ok else "FAILED",
              "invite_error": None if ok else str(res.get("error") or "Not sent")[:300],
              "updated_at": _now()}
    if ok:
        update["invited_at"] = _now()
    try:
        db.update("juniors", f"junior_id=eq.{db.enc(jid)}", update)
    except Exception as e:  # noqa: BLE001
        # The mail is out; only the note of it failed. Say so rather than 500,
        # or the page would count it as unsent and mail them again.
        print(f"[juniors] {jid}: invite {'sent' if ok else 'failed'} but the status was not saved: {e}")
        if ok:
            return {"success": True, "junior_id": jid, "invite_status": "SENT", "invited_at": update["invited_at"],
                    "message": f"Invite sent to {junior['email']} (the list may show it as not sent until refreshed)."}
    # The pass code is kept out of target_id: the dashboard feed shows targets to treasurers.
    log_action("JUNIOR_INVITE" if ok else "JUNIOR_INVITE_FAILED", "junior", None,
               detail={"junior_id": jid, "to": junior["email"], "error": update["invite_error"]})
    if not ok:
        return _fail("EMAIL_FAILED", f"The invite to {junior['email']} could not be sent: {update['invite_error']}",
                     junior_id=jid)
    return {"success": True, "junior_id": jid, "invite_status": "SENT",
            "invited_at": update["invited_at"], "message": f"Invite sent to {junior['email']}."}


def remove(junior_id: str, admin: Dict[str, Any]) -> Dict[str, Any]:
    """DELETE /api/admin/juniors/<id> - take a junior off the list, unless their lunch is already recorded."""
    junior = _junior(junior_id)
    if not junior:
        return _fail("NOT_FOUND", "No junior with that code.")
    if db.select_one("food_attendance", f"select=id&user_id=eq.{db.enc(junior['junior_id'])}"):
        return _fail("LUNCH_TAKEN", f"{junior['junior_id']} has already collected lunch, so they stay on the list.")
    db.delete("juniors", f"junior_id=eq.{db.enc(junior['junior_id'])}")
    log_action("JUNIOR_REMOVE", "junior", None, detail={"junior_id": junior["junior_id"], "email": junior["email"]})
    return {"success": True, "message": f"{junior['junior_id']} ({junior['name']}) removed."}
