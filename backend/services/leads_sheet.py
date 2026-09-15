"""
Registration leads -> a separate Google Sheet.

Everyone who submits the personal details form is copied into its own
spreadsheet, whether or not they go on to verify their email or pay. That is
the list of people who started and did not finish, which the production tables
cannot give you: nothing is written to the database until payment, by design
(see services/pending_registration).

This deliberately touches NO database. It posts the details to an Apps Script
web app (scripts/leads-sheet.gs) and nothing else, so it can be switched off,
broken or deleted without production noticing.

It must never be able to break or slow a registration
------------------------------------------------------
* LEADS_SHEET_URL or LEADS_SHEET_KEY unset  ->  a silent no-op.
* Every failure is swallowed and logged by type only; the details themselves
  are never written to a log.
* The POST runs on its own thread, started BEFORE the OTP email goes out, and
  is joined against a fixed deadline once the email is done. The two run side
  by side, so the normal case adds no time to the form.

Why joined rather than truly fire-and-forget
--------------------------------------------
The API runs on Vercel serverless. A thread still running when the response is
returned is frozen along with the function, so an unjoined POST would lose rows
silently and at random. Joining against a deadline means the write either
finishes inside the request or is abandoned at a known bound - never left
hanging, never allowed to hold the participant up past DEADLINE_SECONDS.
"""

from __future__ import annotations

import os
import threading
import time
from typing import Any, Dict, Optional

import requests

# Personal details only. The OTP, its hash and the pending token are never sent:
# the sheet is shared with people who must not be able to complete someone
# else's registration.
FIELDS = ("name", "email", "phone", "college", "department", "year", "food_preference")

# Total budget measured from the moment capture() starts, not from finish().
# The OTP email usually takes longer than this, in which case finish() waits
# for nothing at all.
DEADLINE_SECONDS = 4.0

_CONNECT_TIMEOUT = 3.0


class Capture:
    """Handle returned by capture(); pass it to finish()."""

    __slots__ = ("thread", "deadline")

    def __init__(self, thread: threading.Thread, deadline: float) -> None:
        self.thread = thread
        self.deadline = deadline


def _config() -> tuple:
    return (
        (os.getenv("LEADS_SHEET_URL") or "").strip(),
        (os.getenv("LEADS_SHEET_KEY") or "").strip(),
    )


def _post(url: str, key: str, details: Dict[str, Any]) -> None:
    try:
        r = requests.post(
            url,
            # The key rides in the body, never the query string: URLs end up in
            # proxy and platform logs, request bodies do not.
            json={"key": key, "details": {k: details.get(k) for k in FIELDS}},
            timeout=(_CONNECT_TIMEOUT, DEADLINE_SECONDS),
        )
        if r.status_code >= 400:
            print(f"[leads_sheet] web app answered HTTP {r.status_code}")
            return
        try:
            body = r.json()
        except ValueError:
            # A deployment set to "Only myself" returns Google's sign-in page.
            print("[leads_sheet] web app did not return JSON - check it is deployed "
                  "with access set to Anyone")
            return
        if not body.get("ok"):
            print(f"[leads_sheet] web app refused the row: {body.get('error', 'unknown')}")
    except Exception as e:  # never let a sheet problem surface
        print(f"[leads_sheet] post failed: {type(e).__name__}")


def capture(details: Dict[str, Any]) -> Optional[Capture]:
    """
    Start copying these details to the leads sheet. Returns immediately.

    Returns None when the sheet is not configured, which finish() accepts.
    """
    try:
        url, key = _config()
        if not url or not key:
            return None
        payload = {k: details.get(k) for k in FIELDS}
        thread = threading.Thread(
            target=_post, args=(url, key, payload), name="leads-sheet", daemon=True
        )
        thread.start()
        return Capture(thread, time.monotonic() + DEADLINE_SECONDS)
    except Exception as e:
        print(f"[leads_sheet] could not start capture: {type(e).__name__}")
        return None


def finish(handle: Optional[Capture]) -> None:
    """Wait for the write, but never past its deadline."""
    if handle is None:
        return
    try:
        remaining = handle.deadline - time.monotonic()
        if remaining > 0:
            handle.thread.join(remaining)
    except Exception as e:
        print(f"[leads_sheet] could not finish capture: {type(e).__name__}")
