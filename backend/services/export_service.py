"""
Zinnia 2026 — Excel Export (openpyxl, server-side)

Built on the server rather than with SheetJS in the browser. Every sheet is a
multi-table join, and building them client-side would mean shipping the
personal details of every participant to whichever laptop is open — including
sheets that operator's role has no business seeing. Role checks here decide
which sheets exist in the file at all.

Rows come from admin_panel_service, which reads the zin26 tables directly over
PostgREST. No database views or functions are involved, so the export needs no
migration to work.
"""

from __future__ import annotations

import datetime as dt
from io import BytesIO
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Tuple

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from services import admin_panel_service as panel
from services import zin26_db as db
from services.audit_service import log_action

HEADER_FILL = PatternFill("solid", fgColor="2C4788")
HEADER_FONT = Font(color="FFFFFF", bold=True, size=10)
TITLE_FONT = Font(bold=True, size=13)
MUTED_FONT = Font(color="5A6373", size=10)

# Excel silently truncates sheet names past 31 chars and forbids these.
_BAD_SHEET_CHARS = str.maketrans({c: "-" for c in r"[]:*?/\\"})

# Columns that must be written as text or Excel eats the leading zero and
# turns "+91 9xxxx" into a number in scientific notation.
TEXT_COLUMNS = {"phone", "txn_ref", "user_id"}


def _safe_sheet_name(name: str, used: set) -> str:
    base = (name or "Sheet").translate(_BAD_SHEET_CHARS).strip()[:31] or "Sheet"
    candidate, n = base, 2
    while candidate.lower() in used:
        suffix = f" ({n})"
        candidate = base[: 31 - len(suffix)] + suffix
        n += 1
    used.add(candidate.lower())
    return candidate


def _add_sheet(
    wb: Workbook,
    title: str,
    columns: Sequence[Tuple[str, str]],
    rows: Iterable[Dict[str, Any]],
    used_names: set,
) -> int:
    """
    columns is a sequence of (key, Header Label) so the sheet's column order is
    explicit rather than whatever order the database happened to return.
    Returns the row count written.
    """
    ws = wb.create_sheet(_safe_sheet_name(title, used_names))
    keys = [k for k, _ in columns]
    labels = [lbl for _, lbl in columns]

    ws.append(labels)
    for cell in ws[1]:
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center")

    widths = [len(lbl) for lbl in labels]
    count = 0
    for row in rows:
        values = []
        for i, key in enumerate(keys):
            v = row.get(key)
            if isinstance(v, bool):
                v = "Yes" if v else "No"
            elif isinstance(v, list):
                v = ", ".join(str(x) for x in v)
            values.append(v)
            if count < 300:  # sampling is enough to size a column
                widths[i] = max(widths[i], len(str(v)) if v is not None else 0)
        ws.append(values)
        count += 1

    for i, key in enumerate(keys, start=1):
        letter = get_column_letter(i)
        ws.column_dimensions[letter].width = min(max(widths[i - 1] + 3, 9), 46)
        if key in TEXT_COLUMNS:
            for cell in ws[letter][1:]:
                cell.number_format = "@"

    ws.freeze_panes = "A2"
    if count:
        ws.auto_filter.ref = ws.dimensions
    return count


PARTICIPANT_COLUMNS = [
    ("user_id", "UserID"),
    ("name", "Name"),
    ("email", "Email"),
    ("phone", "Phone"),
    ("college", "College"),
    ("department", "Department"),
    ("year", "Year"),
    ("food", "Food"),
    ("payment_status", "Payment"),
    ("amount", "Amount"),
    ("txn_ref", "Txn reference"),
    ("has_screenshot", "Screenshot"),
    ("events_count", "Events"),
    ("event_list", "Event list"),
    ("team_names", "Teams"),
    ("registered_at", "Registered at"),
]

FOOD_COLUMNS = [
    ("user_id", "UserID"),
    ("name", "Name"),
    ("college", "College"),
    ("phone", "Phone"),
    ("email", "Email"),
    ("payment_status", "Payment"),
]

PAYMENT_COLUMNS = [
    ("user_id", "UserID"),
    ("name", "Name"),
    ("college", "College"),
    ("phone", "Phone"),
    ("email", "Email"),
    ("amount", "Amount"),
    ("txn_ref", "Txn reference"),
    ("payment_status", "Status"),
    ("has_screenshot", "Screenshot"),
    ("events_count", "Events"),
]

EVENT_COLUMNS = [
    ("team_name", "Team"),
    ("team_status", "Team status"),
    ("user_id", "UserID"),
    ("name", "Name"),
    ("email", "Email"),
    ("phone", "Phone"),
    ("college", "College"),
    ("food", "Food"),
    ("payment_status", "Payment"),
    ("role", "Role"),
    ("accept_status", "Accepted"),
]

TEAM_COLUMNS = [
    ("team_id", "Team ID"),
    ("event_name", "Event"),
    ("team_name", "Team"),
    ("status", "Status"),
    ("captain_user_id", "Captain UserID"),
    ("captain_name", "Captain"),
    ("members", "Members"),
    ("pending_count", "Awaiting reply"),
    ("created_at", "Created"),
]


def _summary_sheet(wb: Workbook, admin: Dict[str, Any], sheets: List[str], counts: Dict[str, int]) -> None:
    """
    First sheet, always. A workbook that cannot say what it is or when it was
    taken is useless three months later when somebody finds it in a folder.
    """
    ws = wb.create_sheet("Summary")
    ws["A1"] = "Zinnia 2026 — Registration export"
    ws["A1"].font = TITLE_FONT
    ws["A3"] = "Generated"
    ws["B3"] = dt.datetime.now().strftime("%d %B %Y, %H:%M")
    ws["A4"] = "Generated by"
    ws["B4"] = admin.get("name", "admin")
    ws["A5"] = "Sheets"
    ws["B5"] = ", ".join(sheets)
    for r in range(3, 6):
        ws[f"A{r}"].font = MUTED_FONT

    ws["A7"] = "Sheet"
    ws["B7"] = "Rows"
    for cell in (ws["A7"], ws["B7"]):
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT

    r = 8
    for name, n in counts.items():
        ws[f"A{r}"] = name
        ws[f"B{r}"] = n
        r += 1

    ws.column_dimensions["A"].width = 34
    ws.column_dimensions["B"].width = 46


def _participant_rows() -> List[Dict[str, Any]]:
    """
    The master sheet: one row per participant with their latest payment, the
    events they hold and the teams they are in. Shaped to PARTICIPANT_COLUMNS.
    """
    queue = panel._queue_rows()          # already joins participants + payments + events
    teams = {t["team_id"]: t["team_name"] for t in panel._teams()}
    team_names: Dict[str, List[str]] = {}
    for r in panel._registrations():
        if r.get("team_id") and teams.get(r["team_id"]):
            team_names.setdefault(r["user_id"], []).append(teams[r["team_id"]])

    out = []
    for r in queue:
        out.append({
            **r,
            "food": r.get("food_preference"),
            "has_screenshot": bool(r.get("screenshot_url")),
            "team_names": ", ".join(sorted(set(team_names.get(r["user_id"], [])))) or None,
        })
    out.sort(key=lambda r: r.get("user_id") or "")
    return out


def _team_rows() -> List[Dict[str, Any]]:
    """One row per team, with its members inlined. Shaped to TEAM_COLUMNS."""
    events = {e["code"]: e["name"] for e in panel._events()}
    people = {p["user_id"]: p for p in panel._participants()}
    members: Dict[str, List[Dict[str, Any]]] = {}
    for m in panel._team_members():
        members.setdefault(m["team_id"], []).append(m)

    out = []
    for t in panel._teams():
        ms = members.get(t["team_id"], [])
        # Captain first, then members alphabetically — reads like a team sheet.
        ms.sort(key=lambda m: (m.get("role") != "CAPTAIN",
                               people.get(m["user_id"], {}).get("name") or ""))
        out.append({
            "team_id": t["team_id"],
            "event_code": t["event_code"],
            "event_name": events.get(t["event_code"], t["event_code"]),
            "team_name": t.get("team_name"),
            "status": t.get("status"),
            "captain_user_id": t.get("captain_user_id"),
            "captain_name": people.get(t.get("captain_user_id") or "", {}).get("name"),
            "members": ", ".join(
                f"{m['user_id']} {people.get(m['user_id'], {}).get('name', '')}".strip()
                for m in ms),
            "pending_count": sum(
                1 for m in ms if str(m.get("accept_status", "")).upper() == "PENDING"),
            "created_at": t.get("created_at"),
        })
    out.sort(key=lambda r: (r["event_name"] or "", r["team_name"] or ""))
    return out


def _match(row: Dict[str, Any], filters: Dict[str, Any]) -> bool:
    college = (filters.get("college") or "").strip().lower()
    if college and college not in str(row.get("college", "")).lower():
        return False
    status = (filters.get("payment_status") or "").strip().upper()
    if status and status != "ALL" and str(row.get("payment_status", "")).upper() != status:
        return False
    return True


# Every tab group the export knows how to build, in workbook order.
ALL_SHEETS = ["participants", "teams", "events", "food", "payments"]


def _collect_sheets(
    sheets: List[str],
    filters: Optional[Dict[str, Any]] = None,
    admin: Optional[Dict[str, Any]] = None,
    only_event: str = "",
) -> List[Tuple[str, Sequence[Tuple[str, str]], List[Dict[str, Any]]]]:
    """
    The single definition of which tabs exist, in what order, with which columns
    and which rows.

    Three things render this list: the .xlsx download, the row-count preview and
    the Google Sheets sync. The first two used to decide it separately, which is
    how preview came to count event rosters WITHOUT applying the filters the
    workbook applies — it promised rows the file did not contain. Adding a tab
    here now adds it to all three.

    A coordinator only ever gets their own events, enforced here rather than by
    hiding a checkbox in the browser.
    """
    filters = filters or {}
    admin = admin or {}
    role = (admin.get("role") or "").upper()
    sheets = sheets or ["participants"]

    out: List[Tuple[str, Sequence[Tuple[str, str]], List[Dict[str, Any]]]] = []

    # One snapshot for the whole list. Without it every event roster re-reads
    # registrations, participants, teams and team_members from scratch.
    with panel.cached_reads():
        participants: List[Dict[str, Any]] = []
        if {"participants", "food", "payments"} & set(sheets):
            participants = [r for r in _participant_rows() if _match(r, filters)]

        if "participants" in sheets:
            out.append(("All Participants", PARTICIPANT_COLUMNS, participants))

        if "teams" in sheets:
            out.append(("Teams", TEAM_COLUMNS, _team_rows()))

        if "events" in sheets:
            allowed = set(admin.get("allowed_events") or [])
            catalog = db.select("events", "select=code,name&order=sort_order")
            if only_event:
                catalog = [e for e in catalog if e["code"] == only_event]
            if role == "EVENT_COORDINATOR":
                catalog = [e for e in catalog if e["code"] in allowed]
            for ev in catalog:
                rows = [r for r in panel._event_roster_rows(ev["code"]) if _match(r, filters)]
                out.append((ev["name"], EVENT_COLUMNS, rows))

        if "food" in sheets:
            # Two tabs, not one with a column: the counts go to two different
            # counters on the day.
            out.append(("Food - Veg", FOOD_COLUMNS,
                        [r for r in participants if str(r.get("food", "")).upper() == "VEG"]))
            out.append(("Food - Non-Veg", FOOD_COLUMNS,
                        [r for r in participants if str(r.get("food", "")).upper() == "NON_VEG"]))

        if "payments" in sheets:
            verified = [r for r in participants
                        if str(r.get("payment_status", "")).upper() == "APPROVED"]
            # Pending and rejected together: this is the chase list, and whoever
            # works it does not care which of the two a row is.
            unverified = [r for r in participants
                          if str(r.get("payment_status", "")).upper() != "APPROVED"]
            out.append(("Payment - Verified", PAYMENT_COLUMNS, verified))
            out.append(("Payment - Not Verified", PAYMENT_COLUMNS, unverified))

    return out


def build_workbook(
    sheets: List[str],
    filters: Optional[Dict[str, Any]] = None,
    admin: Optional[Dict[str, Any]] = None,
    only_event: str = "",
) -> Tuple[BytesIO, str, Dict[str, int]]:
    """
    Returns (buffer, filename, per-sheet row counts).
    """
    filters = filters or {}
    admin = admin or {}
    sheets = sheets or ["participants"]

    wb = Workbook()
    wb.remove(wb.active)
    used_names: set = set()
    counts: Dict[str, int] = {}

    for title, columns, rows in _collect_sheets(sheets, filters, admin, only_event):
        counts[title] = _add_sheet(wb, title, columns, rows, used_names)

    # Built last, inserted first.
    _summary_sheet(wb, admin, sheets, counts)
    wb.move_sheet("Summary", offset=-(len(wb.sheetnames) - 1))

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)

    stamp = dt.datetime.now().strftime("%Y-%m-%d_%H%M")
    slug = f"_{only_event.lower()}" if only_event else ""
    filename = f"zinnia2026_registrations{slug}_{stamp}.xlsx"

    log_action(
        "EXPORT",
        detail={"sheets": sheets, "filters": filters, "rows": counts, "event": only_event or None},
    )
    return buf, filename, counts


def preview(sheets: List[str], filters: Optional[Dict[str, Any]] = None,
            admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Row counts before the download, so nobody generates an empty workbook and
    concludes the system is broken.

    Counted off the same tab list build_workbook renders, so the preview cannot
    promise rows the file will not contain.
    """
    return {title: len(rows)
            for title, _, rows in _collect_sheets(sheets, filters, admin)}


# ==============================================================================
# GOOGLE SHEETS SYNC
# ==============================================================================

def _cell(value: Any) -> Any:
    """
    One cell, shaped the way _add_sheet shapes it, so a tab in the Google Sheet
    reads identically to the same tab in the downloaded workbook.
    """
    if value is None:
        return ""
    if isinstance(value, bool):
        return "Yes" if value else "No"
    if isinstance(value, list):
        return ", ".join(str(x) for x in value)
    if isinstance(value, (dt.datetime, dt.date)):
        return value.isoformat()
    return value


def sync_payload(sheets: Optional[List[str]] = None,
                 admin: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Every tab of the export as JSON, for the Google Sheets sync.

    Rows are ARRAYS, not objects. Apps Script's setValues() wants a 2D array,
    and repeating sixteen key names on every row roughly doubles a payload that
    has to fit inside Vercel's 4.5 MB response ceiling. `sheets` narrows the
    groups fetched, so a roster that outgrows one response can be pulled in two.

    text_columns carries the indices Sheets must be told to hold as text. Without
    it a phone number beginning "+91" is parsed as a FORMULA and the cell renders
    #ERROR!, and a txn_ref with a leading zero quietly loses it.

    Deliberately does NOT write an audit row. This runs every few minutes; at one
    row per call it would bury the human actions the log exists to record.
    """
    tabs = []
    for title, columns, rows in _collect_sheets(sheets or ALL_SHEETS, {}, admin or {}):
        keys = [k for k, _ in columns]
        tabs.append({
            "name": title,
            "headers": [label for _, label in columns],
            "text_columns": [i for i, k in enumerate(keys) if k in TEXT_COLUMNS],
            "rows": [[_cell(r.get(k)) for k in keys] for r in rows],
        })

    return {
        "success": True,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "tabs": tabs,
    }
