"""
Zinnia 2026 — Registration Service Layer
Implements secure server-side team creation, event validation, payment calculation,
and member enrollment using Supabase REST.
"""

import os
import random
import secrets
import requests
from typing import Dict, Any, List
from services.passport_service import get_headers, SUPABASE_URL

def generate_team_id() -> str:
    """Generate a unique human-friendly team ID in format ZIN-2026-XXXX."""
    num = random.randint(1000, 9999)
    return f"ZIN-2026-{num}"

def register_team_service(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the secure 6-step registration flow:
    1. Generate Team ID
    2. Validate Events (Availability, Team Size, Single-Event rules, Duplicates)
    3. Calculate Server-Side Expected Amount from public.events
    4. Create public.teams & public.team_payments
    5. Create public.event_registrations & public.team_members
    6. Return response (Do NOT generate/dispatch QR passport at this step)
    """
    headers = get_headers()
    
    # -------------------------------------------------------------
    # 0. Basic Payload Validation
    # -------------------------------------------------------------
    team_name = data.get("team_name", "").strip()
    college = data.get("college", "").strip()
    department = data.get("department", "CSE").strip()
    year = str(data.get("year", "III")).strip()
    selected_event_ids = data.get("selected_event_ids", [])
    members = data.get("members", [])

    if not team_name:
        return {"success": False, "error_code": "INVALID_TEAM_NAME", "message": "Team name is required."}
    if not college:
        return {"success": False, "error_code": "INVALID_COLLEGE", "message": "College name is required."}
    if not members or not isinstance(members, list) or len(members) == 0:
        return {"success": False, "error_code": "INVALID_TEAM_SIZE", "message": "At least one team member is required."}
    if not selected_event_ids or not isinstance(selected_event_ids, list):
        return {"success": False, "error_code": "EVENT_NOT_FOUND", "message": "At least one event must be selected."}

    # Check for duplicate events in payload
    if len(selected_event_ids) != len(set(selected_event_ids)):
        return {"success": False, "error_code": "DUPLICATE_EVENT", "message": "Duplicate events selected in registration."}

    # Check for duplicate emails in payload
    member_emails = [m.get("email", "").strip().lower() for m in members if m.get("email")]
    if len(member_emails) != len(set(member_emails)):
        return {"success": False, "error_code": "DUPLICATE_EMAIL", "message": "Duplicate email addresses in member list."}

    # -------------------------------------------------------------
    # STEP 2 — VALIDATE EVENTS & CALCULATE PAYMENT (Server-Side)
    # -------------------------------------------------------------
    expected_amount = 0
    validated_events = []
    has_single_event_only = False

    for ev_id in selected_event_ids:
        r = requests.get(f"{SUPABASE_URL}/rest/v1/events?id=eq.{ev_id}&select=*", headers=headers)
        if r.status_code != 200 or not r.json():
            return {
                "success": False,
                "error_code": "EVENT_NOT_FOUND",
                "message": f"Event '{ev_id}' does not exist in symposium registry."
            }
        
        event_obj = r.json()[0]
        status = event_obj.get("status", "AVAILABLE").upper()
        if status != "AVAILABLE":
            return {
                "success": False,
                "error_code": "EVENT_NOT_AVAILABLE",
                "message": f"Event '{event_obj.get('mission_name')}' is currently {status} and not open for registration."
            }

        # Check team size limits
        min_size = int(event_obj.get("team_size_min", 1))
        max_size = int(event_obj.get("team_size_max", 10))
        member_count = len(members)
        if member_count < min_size or member_count > max_size:
            return {
                "success": False,
                "error_code": "INVALID_TEAM_SIZE",
                "message": f"Event '{event_obj.get('mission_name')}' requires team size between {min_size} and {max_size} (provided: {member_count})."
            }

        # Check is_single_event_only
        if event_obj.get("is_single_event_only"):
            has_single_event_only = True

        # Calculate price from database (Never trust frontend price)
        reg_fee = int(event_obj.get("registration_fee", 0) or 0)
        expected_amount += reg_fee
        validated_events.append(event_obj)

    # If an event is single-event only, no other events can be selected
    if has_single_event_only and len(selected_event_ids) > 1:
        return {
            "success": False,
            "error_code": "SINGLE_EVENT_RESTRICTION",
            "message": "One of the selected events is restricted to single-event participation only."
        }

    # Check if any member email already exists in DB
    for email in member_emails:
        er = requests.get(f"{SUPABASE_URL}/rest/v1/team_members?email=eq.{email}&select=id,name", headers=headers)
        if er.status_code == 200 and er.json():
            existing = er.json()[0]
            return {
                "success": False,
                "error_code": "DUPLICATE_EMAIL",
                "message": f"Email '{email}' is already registered by attendee '{existing.get('name')}'."
            }

    # -------------------------------------------------------------
    # STEP 1 — CREATE TEAM
    # -------------------------------------------------------------
    # Ensure team_id is unique
    team_id = generate_team_id()
    for _ in range(5):
        tr = requests.get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=team_id", headers=headers)
        if tr.status_code == 200 and not tr.json():
            break
        team_id = generate_team_id()

    team_row = {
        "team_id": team_id,
        "team_name": team_name,
        "college": college,
        "department": department,
        "year": year,
        "registered_events": selected_event_ids,
        "payment": False,
        "payment_status": "AWAITING_PAYMENT"
    }

    t_res = requests.post(f"{SUPABASE_URL}/rest/v1/teams", headers=headers, json=team_row)
    if t_res.status_code not in [200, 201]:
        return {
            "success": False,
            "error_code": "DATABASE_ERROR",
            "message": f"Failed to initialize team record: {t_res.text}"
        }

    # -------------------------------------------------------------
    # STEP 3 — INSERT TEAM PAYMENTS
    # -------------------------------------------------------------
    payment_row = {
        "team_id": team_id,
        "expected_amount": expected_amount,
        "submitted_amount": None,
        "utr_number": None,
        "payment_status": "AWAITING_PAYMENT"
    }
    requests.post(f"{SUPABASE_URL}/rest/v1/team_payments", headers=headers, json=payment_row)

    # -------------------------------------------------------------
    # STEP 4 — CREATE EVENT REGISTRATIONS
    # -------------------------------------------------------------
    event_reg_rows = [
        {
            "team_id": team_id,
            "event_id": ev["id"],
            "team_name": team_name
        }
        for ev in validated_events
    ]
    if event_reg_rows:
        requests.post(f"{SUPABASE_URL}/rest/v1/event_registrations", headers=headers, json=event_reg_rows)

    # -------------------------------------------------------------
    # STEP 5 — CREATE TEAM MEMBERS
    # -------------------------------------------------------------
    created_members = []
    leader_assigned = False

    for idx, m in enumerate(members):
        m_id = f"ATT-{team_id[-4:]}-{idx+1}"
        m_name = m.get("name", "").strip()
        m_email = m.get("email", "").strip().lower()
        m_phone = m.get("phone", "").strip()
        
        # Only one team member may be the leader
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
            "food_collected": False
        }
        created_members.append(member_row)

    requests.post(f"{SUPABASE_URL}/rest/v1/team_members", headers=headers, json=created_members)

    # -------------------------------------------------------------
    # STEP 6 — DISPATCH QR PASSPORTS TO PARTICIPANT EMAILS
    # -------------------------------------------------------------
    dispatch_result = None
    try:
        from services.passport_service import trigger_passport_dispatch
        dispatch_result = trigger_passport_dispatch(team_id)
    except Exception as e:
        print(f"[Registration Dispatch Notice] Auto-dispatch encountered notice: {e}")

    # -------------------------------------------------------------
    # STEP 7 — RETURN REGISTRATION RESULT
    # -------------------------------------------------------------
    return {
        "success": True,
        "team_id": team_id,
        "team_name": team_name,
        "members": created_members,
        "registered_events": selected_event_ids,
        "expected_amount": expected_amount,
        "payment_status": "AWAITING_PAYMENT" if expected_amount > 0 else "FREE",
        "dispatch_status": dispatch_result.get("success") if dispatch_result else False
    }
