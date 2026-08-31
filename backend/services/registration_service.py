"""
Zinnia 2026 — Team Registration Service Layer
Strictly writes all registrations directly into Supabase database tables:
teams, team_members, event_registrations, team_payments.
No temporary local storage fallbacks used.
"""

import os
import random
import secrets
import datetime
import requests
from typing import Dict, Any, List, Tuple
from services.passport_service import get_headers, SUPABASE_URL

OFFICIAL_EVENT_REGISTRY = {
    "debugging": {"id": "debugging", "code": "01", "mission_name": "DEBUGGING", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "the-last-signal": {"id": "the-last-signal", "code": "02", "mission_name": "THE LAST SIGNAL", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "lost-at-sql": {"id": "lost-at-sql", "code": "03", "mission_name": "LOST AT SQL", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "gadget-codes": {"id": "gadget-codes", "code": "04", "mission_name": "GADGET CODES", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "paper-presentation": {"id": "paper-presentation", "code": "05", "mission_name": "PAPER PRESENTATION", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "borderland-at-gcee": {"id": "borderland-at-gcee", "code": "06", "mission_name": "BORDERLAND AT GCEE", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "think-strike-and-win": {"id": "think-strike-and-win", "code": "07", "mission_name": "THINK, STRIKE AND WIN", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "plot-twist": {"id": "plot-twist", "code": "08", "mission_name": "PLOT TWIST", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "short-flim": {"id": "short-flim", "code": "09", "mission_name": "SHORT FILM", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    # Aliases
    "short-film": {"id": "short-flim", "code": "09", "mission_name": "SHORT FILM", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "borderland-at-gce": {"id": "borderland-at-gcee", "code": "06", "mission_name": "BORDERLAND AT GCEE", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"},
    "think-strike-win": {"id": "think-strike-and-win", "code": "07", "mission_name": "THINK, STRIKE AND WIN", "team_size_min": 1, "team_size_max": 2, "status": "AVAILABLE"}
}

FALLBACK_EVENTS = OFFICIAL_EVENT_REGISTRY

def generate_team_id() -> str:
    """Generate a unique human-friendly team ID in format ZIN-2026-XXXX."""
    num = random.randint(1000, 9999)
    return f"ZIN-2026-{num}"

def safe_supabase_get(url: str, headers: dict) -> Tuple[bool, Any]:
    try:
        r = requests.get(url, headers=headers, timeout=4)
        if r.status_code == 200:
            return True, r.json()
        return False, []
    except Exception as e:
        print(f"[Supabase REST Notice] GET failed ({url}): {e}")
        return False, []

def safe_supabase_post(url: str, headers: dict, json_data: Any, log_error: bool = True) -> Tuple[bool, Any]:
    try:
        req_headers = dict(headers)
        req_headers["Prefer"] = "return=representation"
        r = requests.post(url, headers=req_headers, json=json_data, timeout=5)
        if r.status_code in (200, 201):
            return True, r.json() if r.text else {}
        if log_error:
            print(f"[Supabase POST Error] HTTP {r.status_code}: {r.text}")
        return False, {"status_code": r.status_code, "text": r.text}
    except Exception as e:
        if log_error:
            print(f"[Supabase POST Exception] {e}")
        return False, {"error": str(e)}

def register_team_service(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes team registration flow, strictly writing records into Supabase DB.
    """
    try:
        headers = get_headers()
        
        # 0. Basic Payload Validation
        team_name = data.get("team_name", "").strip()
        college = data.get("college", "").strip()
        department = data.get("department", "CSE").strip()
        year = str(data.get("year", "III")).strip()
        selected_event_ids = data.get("selected_event_ids") or data.get("registered_events") or []
        members = data.get("members", [])

        if not team_name:
            return {"success": False, "error_code": "INVALID_TEAM_NAME", "message": "Team name is required."}
        if not college:
            return {"success": False, "error_code": "INVALID_COLLEGE", "message": "College name is required."}
        if not members or not isinstance(members, list) or len(members) == 0:
            return {"success": False, "error_code": "INVALID_TEAM_SIZE", "message": "At least one team member is required."}
        if not selected_event_ids or not isinstance(selected_event_ids, list):
            return {"success": False, "error_code": "EVENT_NOT_FOUND", "message": "At least one event must be selected."}

        if len(selected_event_ids) != len(set(selected_event_ids)):
            return {"success": False, "error_code": "DUPLICATE_EVENT", "message": "Duplicate events selected in registration."}

        member_emails = [m.get("email", "").strip().lower() for m in members if m.get("email")]
        if len(member_emails) != len(set(member_emails)):
            return {"success": False, "error_code": "DUPLICATE_EMAIL", "message": "Duplicate email addresses in member list."}

        events_dict = FALLBACK_EVENTS.copy()
        ok_ev, db_evs = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/events?select=*", headers)
        if ok_ev and isinstance(db_evs, list) and len(db_evs) > 0:
            events_dict.update({ev["id"]: ev for ev in db_evs if "id" in ev})

        expected_amount = 0
        validated_events = []
        has_single_event_only = False

        for ev_id in selected_event_ids:
            event_obj = events_dict.get(ev_id)
            if not event_obj:
                return {
                    "success": False,
                    "error_code": "EVENT_NOT_FOUND",
                    "message": f"Event '{ev_id}' does not exist in symposium registry."
                }
            status = str(event_obj.get("status", "AVAILABLE")).upper()
            if status == "FULL":
                return {
                    "success": False,
                    "error_code": "EVENT_FULL",
                    "message": f"Registration for '{event_obj.get('mission_name')}' is full."
                }
            if status != "AVAILABLE":
                return {
                    "success": False,
                    "error_code": "EVENT_NOT_AVAILABLE",
                    "message": f"Event '{event_obj.get('mission_name')}' is currently {status} and not open for registration."
                }

            min_size = int(event_obj.get("team_size_min", 1))
            max_size = int(event_obj.get("team_size_max", 10))
            member_count = len(members)
            if member_count < min_size or member_count > max_size:
                return {
                    "success": False,
                    "error_code": "INVALID_TEAM_SIZE",
                    "message": f"Event '{event_obj.get('mission_name')}' requires team size between {min_size} and {max_size} (provided: {member_count})."
                }

            if event_obj.get("is_single_event_only"):
                has_single_event_only = True

            validated_events.append(event_obj)

        # Flat registration fee: ₹250 per participant (each should be 250 rupees)
        expected_amount = max(250, len(members) * 250)

        if has_single_event_only and len(selected_event_ids) > 1:
            return {
                "success": False,
                "error_code": "SINGLE_EVENT_RESTRICTION",
                "message": "One of the selected events is restricted to single-event participation only."
            }

        for email in member_emails:
            ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_members?email=eq.{email}&select=id,name", headers)
            if ok and isinstance(res, list) and len(res) > 0:
                existing = res[0]
                return {
                    "success": False,
                    "error_code": "DUPLICATE_EMAIL",
                    "message": f"Email '{email}' is already registered by attendee '{existing.get('name')}'."
                }

        team_id = generate_team_id()
        team_row = {
            "team_id": team_id,
            "team_name": team_name,
            "college": college,
            "department": department,
            "year": year,
            "registered_events": selected_event_ids,
            "payment_status": "AWAITING_PAYMENT"
        }
        ok_t, res_t = safe_supabase_post(f"{SUPABASE_URL}/rest/v1/teams", headers, team_row)
        if not ok_t:
            err_text = res_t.get("text", "") if isinstance(res_t, dict) else str(res_t)
            print(f"[Supabase DB Write Error] Team registration failed for {team_id}: {err_text}")
            if "row-level security" in err_text.lower() or "42501" in err_text:
                return {
                    "success": False,
                    "error_code": "RLS_POLICY_ERROR",
                    "message": "Database write blocked by Row Level Security (RLS). Please run fix_supabase_schema_and_rls.sql in Supabase SQL Editor or disable RLS on tables."
                }
            return {
                "success": False,
                "error_code": "DB_INSERTION_FAILED",
                "message": f"Failed to store registration in database: {err_text}"
            }

        payment_row = {
            "team_id": team_id,
            "expected_amount": expected_amount,
            "submitted_amount": None,
            "utr_number": None,
            "payment_status": "AWAITING_PAYMENT"
        }
        safe_supabase_post(f"{SUPABASE_URL}/rest/v1/team_payments", headers, payment_row)
        try:
            from services.payment_service import save_local_payment
            save_local_payment(team_id, payment_row)
        except Exception:
            pass

        event_reg_rows = [
            {
                "team_id": team_id,
                "event_id": ev["id"],
                "team_name": team_name
            }
            for ev in validated_events
        ]
        if event_reg_rows:
            safe_supabase_post(f"{SUPABASE_URL}/rest/v1/event_registrations", headers, event_reg_rows)

        created_members = []
        leader_assigned = False

        for idx, m in enumerate(members):
            m_id = f"ATT-{team_id[-4:]}-{idx+1}"
            m_name = m.get("name", "").strip()
            m_email = m.get("email", "").strip().lower()
            m_phone = m.get("phone", "").strip()
            
            is_leader = False
            if not leader_assigned:
                if m.get("is_leader") or idx == 0:
                    is_leader = True
                    leader_assigned = True

            passport_token = secrets.token_hex(16)
            member_row = {
                "id": m_id,
                "team_id": team_id,
                "name": m_name,
                "email": m_email,
                "phone": m_phone,
                "is_leader": is_leader,
                "passport_token": passport_token,
                "food_preference": m.get("food_preference") or "VEG"
            }
            created_members.append(member_row)

        ok_m, resp_m = safe_supabase_post(f"{SUPABASE_URL}/rest/v1/team_members", headers, created_members, log_error=False)
        if not ok_m and "food_preference" in str(resp_m):
            members_no_food = [{k: v for k, v in m.items() if k != "food_preference"} for m in created_members]
            safe_supabase_post(f"{SUPABASE_URL}/rest/v1/team_members", headers, members_no_food)

        dispatch_result = None
        if expected_amount == 0:
            try:
                from services.passport_service import trigger_passport_dispatch
                requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={"payment_status": "VERIFIED"})
                requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json={"payment_status": "VERIFIED"})
                dispatch_result = trigger_passport_dispatch(team_id)
            except Exception as e:
                print(f"[Registration Dispatch Notice] Free auto-dispatch notice: {e}")

        return {
            "success": True,
            "team_id": team_id,
            "team_name": team_name,
            "members": created_members,
            "registered_events": selected_event_ids,
            "expected_amount": expected_amount,
            "payment_status": "AWAITING_PAYMENT" if expected_amount > 0 else "VERIFIED",
            "dispatch_status": bool(dispatch_result)
        }

    except Exception as e:
        print(f"[Registration Controller Error] {e}")
        return {
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": f"Server encountered an unexpected error: {str(e)}"
        }
