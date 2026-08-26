"""
Zinnia 2026 — Passport & Check-in Service Layer
Handles server-side validation and Supabase DB operations for:
- Campus Entry Gate Scan (one-time use per participant)
- Event Track Check-in Scan (team registration validation + one-time per event)
- Food Token Scan (one-time meal distribution lock)
- Passport Dispatch (n8n webhook + callback tracking)
"""

import os
import datetime
import requests
from typing import Dict, Any, Optional, Tuple, List

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://aiefrwricgwchvapinlc.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_jP4KLIgOGvI-QIWVEBzznA_5b_FJvOL")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "")

def get_headers(prefer_return: str = "representation") -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": f"return={prefer_return}"
    }

def lookup_member(identifier: str) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Look up a member by passport_token OR id OR email.
    Also fetches the associated team details.
    """
    cleaned = identifier.strip()
    if not cleaned:
        return None, None

    headers = get_headers()
    # 1. Try matching passport_token
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/team_members?passport_token=eq.{cleaned}&select=*",
        headers=headers
    )
    members = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []

    # 2. Try matching id (fallback)
    if not members:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/team_members?id=eq.{cleaned}&select=*",
            headers=headers
        )
        members = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []

    # 3. Try matching email (fallback)
    if not members:
        r = requests.get(
            f"{SUPABASE_URL}/rest/v1/team_members?email=eq.{cleaned}&select=*",
            headers=headers
        )
        members = r.json() if r.status_code == 200 and isinstance(r.json(), list) else []

    if not members:
        return None, None

    member = members[0]
    # Fetch team
    team_id = member.get("team_id")
    team = None
    if team_id:
        tr = requests.get(
            f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=*",
            headers=headers
        )
        teams = tr.json() if tr.status_code == 200 and isinstance(tr.json(), list) else []
        if teams:
            team = teams[0]

    return member, team

def get_team_registered_events(team_id: str) -> List[Dict[str, Any]]:
    """Fetch all event registrations and event details for a team."""
    headers = get_headers()
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/event_registrations?team_id=eq.{team_id}&select=*,events(*)",
        headers=headers
    )
    if r.status_code == 200 and isinstance(r.json(), list):
        return r.json()
    return []

# ==============================================================================
# 1. ENTRY CHECK-IN
# ==============================================================================
def process_entry_checkin(
    token_or_id: str,
    scanned_by: str = "Gate Reception Desk",
    location: str = "Main Campus Gate"
) -> Dict[str, Any]:
    """
    Validates entry passport token / ID and records single-use attendance.
    """
    member, team = lookup_member(token_or_id)
    if not member:
        return {
            "success": False,
            "reason": f"No participant found with passport token or ID '{token_or_id}'.",
            "member": None
        }

    member_id = member["id"]
    team_id = member["team_id"]
    member_name = member["name"]
    college = team.get("college", "GCE Erode") if team else "GCE Erode"

    headers = get_headers()

    # 1. Check existing ENTRY attendance record
    check_r = requests.get(
        f"{SUPABASE_URL}/rest/v1/attendance?member_id=eq.{member_id}&checkin_type=eq.ENTRY&select=*",
        headers=headers
    )
    if check_r.status_code == 200:
        existing = check_r.json()
        if existing and len(existing) > 0:
            rec = existing[0]
            scan_time = rec.get("scanned_at", "earlier")
            scan_by = rec.get("scanned_by", "Staff")
            return {
                "success": False,
                "reason": f"Already checked in at {scan_time} by {scan_by}.",
                "member": member,
                "team": team,
                "attendance_record": rec
            }

    # 2. Insert new ENTRY attendance row
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = {
        "team_id": team_id,
        "member_id": member_id,
        "passport_token_used": token_or_id,
        "participant_name": member_name,
        "college": college,
        "checkin_type": "ENTRY",
        "scanned_by": scanned_by,
        "location": location,
        "scanned_at": now_iso
    }

    insert_r = requests.post(
        f"{SUPABASE_URL}/rest/v1/attendance",
        headers=headers,
        json=payload
    )

    if insert_r.status_code in [200, 201]:
        return {
            "success": True,
            "reason": f"Campus Entry Verified. Welcome {member_name}!",
            "member": member,
            "team": team,
            "attendance": payload
        }
    else:
        err_msg = insert_r.text
        if "ux_attendance_entry_once" in err_msg or insert_r.status_code == 409:
            return {
                "success": False,
                "reason": "Already checked in (entry limit reached).",
                "member": member,
                "team": team
            }
        return {
            "success": False,
            "reason": f"Database insertion failed: {err_msg}",
            "member": member
        }

# ==============================================================================
# 2. EVENT CHECK-IN
# ==============================================================================
def process_event_checkin(
    token_or_id: str,
    event_id: str,
    scanned_by: str = "Event Coordinator",
    location: str = "Event Venue"
) -> Dict[str, Any]:
    """
    Validates participant's team is registered for event_id and checks them in once.
    """
    if not event_id:
        return {
            "success": False,
            "reason": "Missing event_id in checkin request.",
            "member": None
        }

    member, team = lookup_member(token_or_id)
    if not member:
        return {
            "success": False,
            "reason": f"No participant found with passport token or ID '{token_or_id}'.",
            "member": None
        }

    member_id = member["id"]
    team_id = member["team_id"]
    member_name = member["name"]
    college = team.get("college", "GCE Erode") if team else "GCE Erode"
    headers = get_headers()

    # 1. Fetch event details
    ev_r = requests.get(
        f"{SUPABASE_URL}/rest/v1/events?id=eq.{event_id}&select=*",
        headers=headers
    )
    event_obj = ev_r.json()[0] if ev_r.status_code == 200 and len(ev_r.json()) > 0 else None
    event_name = event_obj.get("mission_name") or event_obj.get("title") if event_obj else event_id

    # 2. Fetch team's registered events for confirmation & verification
    reg_r = requests.get(
        f"{SUPABASE_URL}/rest/v1/event_registrations?team_id=eq.{team_id}&select=*,events(*)",
        headers=headers
    )
    registered_events = reg_r.json() if reg_r.status_code == 200 and isinstance(reg_r.json(), list) else []
    
    # Check if team is registered for this specific event
    is_registered = any(r.get("event_id") == event_id for r in registered_events)
    if not is_registered:
        # Fallback check team.registered_events array if any
        if team and team.get("registered_events") and event_id in team.get("registered_events"):
            is_registered = True

    if not is_registered:
        return {
            "success": False,
            "reason": f"Team '{team.get('team_name') if team else team_id}' is not registered for '{event_name}'.",
            "member": member,
            "team": team,
            "registered_events": registered_events
        }

    # 3. Check existing EVENT attendance for this member & event
    check_r = requests.get(
        f"{SUPABASE_URL}/rest/v1/attendance?member_id=eq.{member_id}&event_id=eq.{event_id}&checkin_type=eq.EVENT&select=*",
        headers=headers
    )
    if check_r.status_code == 200:
        existing = check_r.json()
        if existing and len(existing) > 0:
            rec = existing[0]
            scan_time = rec.get("scanned_at", "earlier")
            scan_by = rec.get("scanned_by", "Coordinator")
            return {
                "success": False,
                "reason": f"Already checked in for {event_name} at {scan_time} by {scan_by}.",
                "member": member,
                "team": team,
                "registered_events": registered_events,
                "attendance_record": rec
            }

    # 4. Insert new EVENT attendance row
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    payload = {
        "team_id": team_id,
        "member_id": member_id,
        "passport_token_used": token_or_id,
        "participant_name": member_name,
        "college": college,
        "checkin_type": "EVENT",
        "event_id": event_id,
        "event_name": event_name,
        "scanned_by": scanned_by,
        "location": location,
        "scanned_at": now_iso
    }

    insert_r = requests.post(
        f"{SUPABASE_URL}/rest/v1/attendance",
        headers=headers,
        json=payload
    )

    if insert_r.status_code in [200, 201]:
        return {
            "success": True,
            "reason": f"Admitted to {event_name}. Check-in recorded!",
            "member": member,
            "team": team,
            "event": event_obj,
            "registered_events": registered_events,
            "attendance": payload
        }
    else:
        err_msg = insert_r.text
        if "ux_attendance_event_once" in err_msg or insert_r.status_code == 409:
            return {
                "success": False,
                "reason": f"Already checked in for {event_name}.",
                "member": member,
                "team": team,
                "registered_events": registered_events
            }
        return {
            "success": False,
            "reason": f"Database insertion error: {err_msg}",
            "member": member,
            "registered_events": registered_events
        }

# ==============================================================================
# 3. FOOD TOKEN CHECK-IN
# ==============================================================================
def process_food_checkin(
    token_or_id: str,
    scanned_by: str = "Dining Staff",
    location: str = "Dining Counter A"
) -> Dict[str, Any]:
    """
    Checks food_collected flag on team_members; locks after one claim.
    """
    member, team = lookup_member(token_or_id)
    if not member:
        return {
            "success": False,
            "reason": f"No participant found with passport token or ID '{token_or_id}'.",
            "member": None
        }

    member_id = member["id"]
    member_name = member["name"]

    if member.get("food_collected"):
        claimed_at = member.get("food_collected_at", "earlier")
        return {
            "success": False,
            "reason": f"Food token already claimed at {claimed_at}.",
            "member": member,
            "team": team
        }

    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Update team_members row atomically
    upd_r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/team_members?id=eq.{member_id}",
        headers=headers,
        json={
            "food_collected": True,
            "food_collected_at": now_iso
        }
    )

    if upd_r.status_code in [200, 204]:
        member["food_collected"] = True
        member["food_collected_at"] = now_iso
        return {
            "success": True,
            "reason": f"Food token validated for {member_name}. Meal Issued!",
            "member": member,
            "team": team
        }
    else:
        return {
            "success": False,
            "reason": f"Failed to update food token status: {upd_r.text}",
            "member": member
        }

# ==============================================================================
# 4. PASSPORT DISPATCH AUTOMATION (Email + n8n Webhook & Callback)
# ==============================================================================
from services.email_service import send_participant_passport_email, generate_qr_base64

def generate_qr_image_bytes(data: str) -> bytes:
    """Generate raw PNG bytes for a QR code image."""
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
        import io
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        import io
        # Fallback 1x1 png if fails
        return b""

def trigger_passport_dispatch(team_id: str, app_base_url: str = "http://localhost:5173") -> Dict[str, Any]:
    """
    Fetches team members, fetches registered events, and dispatches:
    1. Direct personalized HTML email with QR badge to each participant.
    2. Webhook payload to n8n (if configured).
    Logs dispatch records in passport_dispatch table.
    """
    headers = get_headers()
    
    # 1. Fetch team members
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/team_members?team_id=eq.{team_id}&select=*",
        headers=headers
    )
    if r.status_code != 200 or not isinstance(r.json(), list):
        return {"success": False, "error": f"Failed to fetch team members: {r.text}"}

    members = r.json()

    # 2. Fetch team info
    tr = requests.get(
        f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=*",
        headers=headers
    )
    team = tr.json()[0] if tr.status_code == 200 and len(tr.json()) > 0 else {"team_id": team_id, "team_name": "Team"}

    # 3. Fetch registered events with full event details
    registered_events = get_team_registered_events(team_id)

    dispatch_rows = []
    webhook_payload = []
    email_results = []
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    for m in members:
        token = m.get("passport_token") or m.get("id")
        passport_link = f"{app_base_url}/passport?token={token}"
        
        # Dispatch email to member
        mail_res = send_participant_passport_email(
            member=m,
            team=team,
            registered_events=registered_events,
            app_base_url=app_base_url
        )
        email_results.append(mail_res)

        # Dispatch record
        dispatch_rows.append({
            "member_id": m["id"],
            "channel": "EMAIL",
            "status": "SENT" if mail_res.get("success") else "FAILED",
            "provider_ref": mail_res.get("status"),
            "error_message": mail_res.get("error"),
            "created_at": now_iso,
            "sent_at": now_iso if mail_res.get("success") else None
        })

        # Update member passport_sent_at
        if mail_res.get("success"):
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/team_members?id=eq.{m['id']}",
                headers=headers,
                json={"passport_sent_at": now_iso}
            )

        webhook_payload.append({
            "member_id": m["id"],
            "name": m["name"],
            "phone": m["phone"],
            "email": m["email"],
            "passport_token": token,
            "passport_link": passport_link,
            "team_id": team_id,
            "registered_events": [ev.get("event_id") for ev in registered_events]
        })

    # Save to passport_dispatch table
    if dispatch_rows:
        try:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/passport_dispatch",
                headers=headers,
                json=dispatch_rows
            )
        except Exception as e:
            print(f"[Dispatch Warning] Failed to log dispatch record: {e}")

    # Fire webhook if configured
    webhook_status = "skipped_no_url"
    if N8N_WEBHOOK_URL:
        try:
            w_res = requests.post(
                N8N_WEBHOOK_URL,
                json={
                    "event": "team_registered",
                    "team_id": team_id,
                    "team_name": team.get("team_name"),
                    "members": webhook_payload
                },
                timeout=5
            )
            webhook_status = str(w_res.status_code)
        except Exception as e:
            webhook_status = f"error: {e}"

    return {
        "success": True,
        "dispatched_count": len(members),
        "email_results": email_results,
        "webhook_status": webhook_status,
        "members": webhook_payload
    }

def update_dispatch_status(
    member_id: str,
    status: str,
    channel: str = "WHATSAPP",
    provider_ref: Optional[str] = None,
    error_message: Optional[str] = None
) -> Dict[str, Any]:
    """
    Updates passport_dispatch table status and updates team_members.passport_sent_at if SENT.
    """
    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Update or insert dispatch record
    record = {
        "member_id": member_id,
        "channel": channel,
        "status": status,
        "provider_ref": provider_ref,
        "error_message": error_message,
        "sent_at": now_iso if status == "SENT" else None
    }

    requests.post(
        f"{SUPABASE_URL}/rest/v1/passport_dispatch",
        headers=headers,
        json=[record]
    )

    if status == "SENT":
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/team_members?id=eq.{member_id}",
            headers=headers,
            json={"passport_sent_at": now_iso}
        )

    return {"success": True, "record": record}
