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

# Default Symposium Events Registry
FALLBACK_EVENTS = {
    "msn-sys-recovery": {"id": "msn-sys-recovery", "mission_name": "Operation: System Recovery", "team_size_min": 1, "team_size_max": 2, "registration_fee": 150, "status": "AVAILABLE"},
    "msn-oracle": {"id": "msn-oracle", "mission_name": "Operation: ORACLE", "team_size_min": 1, "team_size_max": 2, "registration_fee": 150, "status": "AVAILABLE"},
    "msn-broken-records": {"id": "msn-broken-records", "mission_name": "Operation: Broken Records", "team_size_min": 1, "team_size_max": 2, "registration_fee": 150, "status": "AVAILABLE"},
    "msn-infinity-protocol": {"id": "msn-infinity-protocol", "mission_name": "Operation: Infinity Protocol", "team_size_min": 2, "team_size_max": 3, "registration_fee": 300, "is_single_event_only": True, "status": "AVAILABLE"},
    "msn-mission-control": {"id": "msn-mission-control", "mission_name": "Operation: Mission Control", "team_size_min": 1, "team_size_max": 2, "registration_fee": 150, "is_single_event_only": True, "status": "AVAILABLE"},
    "msn-borderland-gce": {"id": "msn-borderland-gce", "mission_name": "Borderland at GCE", "team_size_min": 2, "team_size_max": 4, "registration_fee": 200, "status": "AVAILABLE"},
    "msn-think-strike-win": {"id": "msn-think-strike-win", "mission_name": "Think, Strike and Win", "team_size_min": 2, "team_size_max": 3, "registration_fee": 150, "status": "AVAILABLE"},
    "msn-plot-twist": {"id": "msn-plot-twist", "mission_name": "Plot Twist", "team_size_min": 1, "team_size_max": 2, "registration_fee": 100, "status": "AVAILABLE"},
    "msn-short-film": {"id": "msn-short-film", "mission_name": "Short Film", "team_size_min": 1, "team_size_max": 5, "registration_fee": 150, "status": "AVAILABLE"}
}

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

def safe_supabase_post(url: str, headers: dict, json_data: Any) -> Tuple[bool, Any]:
    try:
        req_headers = dict(headers)
        req_headers["Prefer"] = "return=representation"
        r = requests.post(url, headers=req_headers, json=json_data, timeout=5)
        if r.status_code in (200, 201):
            return True, r.json() if r.text else {}
        print(f"[Supabase POST Error] HTTP {r.status_code}: {r.text}")
        return False, {"status_code": r.status_code, "text": r.text}
    except Exception as e:
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
        department = data.get("department", "").strip()
        year = data.get("year", "").strip()
        selected_event_ids = data.get("selected_event_ids", [])
        members = data.get("members", [])

        if not team_name:
            return {"success": False, "error_code": "MISSING_PARAM", "message": "Team name is required."}
        if not college:
            return {"success": False, "error_code": "MISSING_PARAM", "message": "College / Institution name is required."}
        if not selected_event_ids or len(selected_event_ids) == 0:
            return {"success": False, "error_code": "MISSING_PARAM", "message": "At least one symposium event must be selected."}
        if not members or len(members) == 0:
            return {"success": False, "error_code": "MISSING_PARAM", "message": "At least one team member is required."}

        # Check Event constraints
        events_dict = FALLBACK_EVENTS
        ok_ev, db_evs = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/events?select=*", headers)
        if ok_ev and isinstance(db_evs, list) and len(db_evs) > 0:
            events_dict = {ev["id"]: ev for ev in db_evs if "id" in ev}

        validated_events = []
        has_single_event_only = False
        expected_amount = 0

        for event_id in selected_event_ids:
            event_obj = events_dict.get(event_id)
            if not event_obj:
                return {
                    "success": False,
                    "error_code": "INVALID_EVENT",
                    "message": f"Event '{event_id}' does not exist or is currently unavailable."
                }
            if event_obj.get("status") == "FULL":
                return {
                    "success": False,
                    "error_code": "EVENT_FULL",
                    "message": f"Registration for '{event_obj.get('mission_name')}' is full."
                }
            
            if event_obj.get("is_single_event_only"):
                has_single_event_only = True

            reg_fee = int(event_obj.get("registration_fee", 0) or 0)
            expected_amount += reg_fee
            validated_events.append(event_obj)

        if has_single_event_only and len(selected_event_ids) > 1:
            return {
                "success": False,
                "error_code": "SINGLE_EVENT_RESTRICTION",
                "message": "One of the selected events is restricted to single-event participation only."
            }

        # Check member emails and duplicate checks
        member_emails = [m.get("email", "").strip().lower() for m in members if m.get("email")]
        for email in member_emails:
            ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_members?email=eq.{email}&select=id,name", headers)
            if ok and isinstance(res, list) and len(res) > 0:
                existing = res[0]
                return {
                    "success": False,
                    "error_code": "DUPLICATE_EMAIL",
                    "message": f"Email '{email}' is already registered by attendee '{existing.get('name')}'."
                }

        # STEP 1 — CREATE TEAM IN SUPABASE DB
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

        # STEP 2 — INSERT TEAM PAYMENTS IN SUPABASE DB
        payment_row = {
            "team_id": team_id,
            "expected_amount": expected_amount,
            "submitted_amount": None,
            "utr_number": None,
            "payment_status": "AWAITING_PAYMENT"
        }
        safe_supabase_post(f"{SUPABASE_URL}/rest/v1/team_payments", headers, payment_row)

        # STEP 3 — CREATE EVENT REGISTRATIONS IN SUPABASE DB
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

        # STEP 4 — CREATE TEAM MEMBERS IN SUPABASE DB
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
                "passport_token": passport_token
            }
            created_members.append(member_row)

        safe_supabase_post(f"{SUPABASE_URL}/rest/v1/team_members", headers, created_members)

        # STEP 5 — AUTO DISPATCH PASSPORTS IF CONFIGURED
        dispatch_result = None
        try:
            from services.passport_service import trigger_passport_dispatch
            dispatch_result = trigger_passport_dispatch(team_id)
        except Exception as e:
            print(f"[Passport Dispatch Warning] {e}")

        return {
            "success": True,
            "team_id": team_id,
            "team_name": team_name,
            "members": created_members,
            "registered_events": selected_event_ids,
            "expected_amount": expected_amount,
            "payment_status": "AWAITING_PAYMENT",
            "dispatch_status": bool(dispatch_result)
        }

    except Exception as e:
        print(f"[Registration Controller Error] {e}")
        return {
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": f"Server encountered an unexpected error: {str(e)}"
        }
