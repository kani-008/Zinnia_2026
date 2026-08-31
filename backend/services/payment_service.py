"""
Zinnia 2026 — Payment Service Layer
Implements secure UTR submission, idempotency, admin verification,
rejection, and triggers n8n pass dispatch ONLY upon admin verification.
"""

import os
import datetime
import requests
from typing import Dict, Any, Optional, List, Tuple
from services.passport_service import get_headers, SUPABASE_URL

def safe_supabase_get(url: str, headers: dict) -> Tuple[bool, Any]:
    try:
        r = requests.get(url, headers=headers, timeout=4)
        if r.status_code == 200:
            return True, r.json()
        return False, []
    except Exception as e:
        print(f"[Supabase REST Notice] GET failed ({url}): {e}")
        return False, []

def safe_supabase_patch(url: str, headers: dict, json_data: Any) -> Tuple[bool, Any]:
    try:
        r = requests.patch(url, headers=headers, json=json_data, timeout=4)
        if r.status_code in (200, 204):
            return True, r.json() if r.text else {}
        return False, {}
    except Exception as e:
        print(f"[Supabase REST Notice] PATCH failed ({url}): {e}")
        return False, {}

def safe_supabase_post(url: str, headers: dict, json_data: Any) -> Tuple[bool, Any]:
    try:
        r = requests.post(url, headers=headers, json=json_data, timeout=4)
        if r.status_code in (200, 201):
            return True, r.json() if r.text else {}
        return False, {}
    except Exception as e:
        print(f"[Supabase REST Notice] POST failed ({url}): {e}")
        return False, {}

import json

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "payments.json")

def load_local_payments() -> Dict[str, Any]:
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def save_local_payment(team_id: str, record: Dict[str, Any]):
    try:
        data = load_local_payments()
        data[team_id] = record
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[PaymentStore Error] {e}")

def get_payment_record(team_id: str) -> Optional[Dict[str, Any]]:
    """Fetch payment record for a given team."""
    headers = get_headers()
    ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}&select=*", headers)
    if ok and isinstance(res, list) and len(res) > 0:
        return res[0]
    return load_local_payments().get(team_id)

def get_fee_per_head() -> int:
    try:
        return int(os.getenv("REGISTRATION_FEE_PER_HEAD", "250"))
    except (ValueError, TypeError):
        return 250

def submit_payment_service(team_id: str, utr_number: str, submitted_amount: float) -> Dict[str, Any]:
    """
    Submits participant transaction reference / UTR for treasurer review.
    Validates that UTR is 10–30 characters, alphanumeric, and not already used by another team.
    """
    headers = get_headers()
    if not team_id:
        return {"success": False, "status_code": 400, "error_code": "TEAM_NOT_FOUND", "message": "Team ID is required."}

    if not utr_number or not isinstance(utr_number, str):
        return {"success": False, "status_code": 400, "error_code": "INVALID_UTR", "message": "Transaction reference / UTR is required."}

    cleaned_utr = utr_number.strip().upper()
    if len(cleaned_utr) < 10 or len(cleaned_utr) > 30 or not cleaned_utr.isalnum():
        return {
            "success": False,
            "status_code": 400,
            "error_code": "INVALID_UTR",
            "message": "Transaction reference / UTR must be 10 to 30 alphanumeric characters (no spaces or special symbols)."
        }

    # Check if UTR is already used by another team in database
    ok_u, res_u = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_payments?utr_number=eq.{cleaned_utr}&select=team_id,payment_status", headers)
    if ok_u and isinstance(res_u, list):
        other_teams = [p for p in res_u if p.get("team_id") != team_id]
        if other_teams:
            return {
                "success": False,
                "status_code": 409,
                "error_code": "DUPLICATE_UTR",
                "message": f"Transaction reference '{cleaned_utr}' has already been submitted by another team ({other_teams[0].get('team_id')}). Each payment proof must be unique."
            }

    # 1. Fetch team members to compute exact expected amount: member_count * REGISTRATION_FEE_PER_HEAD
    per_member_fee = get_fee_per_head()
    ok_m, res_m = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_members?team_id=eq.{team_id}&select=id,name", headers)
    member_count = len(res_m) if (ok_m and isinstance(res_m, list) and len(res_m) > 0) else 1
    calculated_expected = max(per_member_fee, member_count * per_member_fee)

    if not submitted_amount or submitted_amount <= 0:
        submitted_amount = float(calculated_expected)

    # 2. Fetch existing payment record
    payment = get_payment_record(team_id) or {
        "team_id": team_id,
        "expected_amount": calculated_expected,
        "payment_status": "AWAITING_PAYMENT"
    }

    if payment.get("payment_status") == "VERIFIED":
        return {
            "success": True,
            "error_code": "PAYMENT_ALREADY_VERIFIED",
            "message": "Payment for this team has already been verified.",
            "team_id": team_id,
            "payment_status": "VERIFIED",
            "utr_number": payment.get("utr_number", cleaned_utr),
            "expected_amount": calculated_expected,
            "submitted_amount": payment.get("submitted_amount", calculated_expected)
        }

    # 3. Update team_payments record to PENDING_VERIFICATION with transaction reference
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    pay_update = {
        "team_id": team_id,
        "submitted_amount": submitted_amount,
        "expected_amount": calculated_expected,
        "utr_number": cleaned_utr,
        "payment_status": "PENDING_VERIFICATION",
        "rejection_reason": None,
        "payment_submitted_at": now_iso,
        "updated_at": now_iso
    }
    
    # Save locally to ensure resilience
    save_local_payment(team_id, pay_update)

    # Update or insert payment record in Supabase
    if get_payment_record(team_id):
        safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers, pay_update)
    else:
        safe_supabase_post(f"{SUPABASE_URL}/rest/v1/team_payments", headers, pay_update)

    safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers, {
        "payment_status": "PENDING_VERIFICATION"
    })

    return {
        "success": True,
        "message": "Payment proof recorded successfully! Transaction reference forwarded to treasurer for verification.",
        "team_id": team_id,
        "payment_status": "PENDING_VERIFICATION",
        "utr_number": cleaned_utr,
        "member_count": member_count,
        "submitted_amount": submitted_amount,
        "expected_amount": calculated_expected
    }

def get_payment_status_service(team_id: str) -> Dict[str, Any]:
    """Fetch live payment status, expected amount (250 per member), UTR, and member details."""
    headers = get_headers()
    ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=team_id,team_name,payment_status", headers)
    
    team = res[0] if (ok and isinstance(res, list) and len(res) > 0) else {"team_id": team_id, "team_name": f"Team {team_id}", "payment_status": "AWAITING_PAYMENT"}
    
    # Query team members to calculate 250 per member
    ok_m, res_m = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_members?team_id=eq.{team_id}&select=id,name", headers)
    members_list = res_m if (ok_m and isinstance(res_m, list)) else []
    member_count = max(1, len(members_list))
    calculated_expected = member_count * 250

    payment = get_payment_record(team_id) or {}
    p_status = payment.get("payment_status") or team.get("payment_status") or "AWAITING_PAYMENT"
    is_verified = (p_status == "VERIFIED")

    expected_amount = payment.get("expected_amount")
    if not expected_amount or expected_amount < calculated_expected:
        expected_amount = calculated_expected

    return {
        "success": True,
        "team_id": team_id,
        "team_name": team.get("team_name", f"Team {team_id}"),
        "payment": is_verified,
        "payment_status": p_status,
        "member_count": member_count,
        "members": members_list,
        "expected_amount": expected_amount,
        "submitted_amount": payment.get("submitted_amount", expected_amount),
        "utr_number": payment.get("utr_number"),
        "rejection_reason": payment.get("rejection_reason"),
        "payment_submitted_at": payment.get("payment_submitted_at"),
        "payment_verified_at": payment.get("payment_verified_at")
    }

def verify_payment_by_treasurer(team_id: str, action: str = "VERIFY", reason: str = "") -> Dict[str, Any]:
    """
    Treasurer verification action.
    VERIFY -> Marks payment verified, activates team passes, triggers passport email dispatch.
    REJECT -> Sets rejection reason and allows participant to resubmit.
    """
    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    action = action.upper()

    rec = get_payment_record(team_id) or {"team_id": team_id}

    if action == "VERIFY":
        rec.update({
            "payment_status": "VERIFIED",
            "payment_verified_at": now_iso,
            "rejection_reason": None,
            "updated_at": now_iso
        })
        save_local_payment(team_id, rec)

        # 1. Update team_payments in Supabase
        safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers, {
            "payment_status": "VERIFIED",
            "payment_verified_at": now_iso,
            "rejection_reason": None,
            "updated_at": now_iso
        })
        # 2. Update teams
        safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers, {
            "payment_status": "VERIFIED"
        })
        # 3. Trigger passport email dispatch
        try:
            from services.passport_service import trigger_passport_dispatch
            trigger_passport_dispatch(team_id)
        except Exception as e:
            print(f"[Treasurer Notice] Automatic passport dispatch warning: {e}")

        return {
            "success": True,
            "message": f"Team {team_id} payment verified successfully by treasurer. Gate passes dispatched!",
            "team_id": team_id,
            "payment_status": "VERIFIED"
        }
    else:
        # Rejection
        rec.update({
            "payment_status": "REJECTED",
            "rejection_reason": reason or "Invalid or unverified transaction reference.",
            "updated_at": now_iso
        })
        save_local_payment(team_id, rec)

        safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers, {
            "payment_status": "REJECTED",
            "rejection_reason": reason or "Invalid or unverified transaction reference.",
            "updated_at": now_iso
        })
        safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers, {
            "payment_status": "REJECTED"
        })
        return {
            "success": True,
            "message": f"Team {team_id} payment rejected.",
            "team_id": team_id,
            "payment_status": "REJECTED",
            "rejection_reason": reason
        }

def get_pending_payments_service() -> Dict[str, Any]:
    """Fetch all pending payments awaiting treasurer verification."""
    headers = get_headers()
    ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_payments?payment_status=eq.PENDING_VERIFICATION&select=*&order=payment_submitted_at.desc", headers)
    records = list(res) if (ok and isinstance(res, list)) else []

    # Also include locally saved pending records
    local_data = load_local_payments()
    existing_ids = {r.get("team_id") for r in records if isinstance(r, dict)}
    for tid, rec in local_data.items():
        if rec.get("payment_status") == "PENDING_VERIFICATION" and tid not in existing_ids:
            records.append(rec)

    return {"success": True, "count": len(records), "pending_payments": records}
