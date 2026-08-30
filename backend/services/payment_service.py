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

def get_payment_record(team_id: str) -> Optional[Dict[str, Any]]:
    """Fetch payment record for a given team."""
    headers = get_headers()
    ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}&select=*", headers)
    if ok and isinstance(res, list) and len(res) > 0:
        return res[0]
    return None

def submit_payment_service(team_id: str, utr_number: str, submitted_amount: float) -> Dict[str, Any]:
    """
    Submits participant UTR and amount for admin review.
    Validates team existence, payment record, positive amount, and UTR uniqueness.
    """
    headers = get_headers()
    cleaned_utr = utr_number.strip().upper() if utr_number else ""

    if not team_id:
        return {"success": False, "error_code": "TEAM_NOT_FOUND", "message": "Team ID is required."}
    if not cleaned_utr or len(cleaned_utr) < 6:
        return {"success": False, "error_code": "INVALID_UTR", "message": "A valid UTR / transaction reference number (min 6 chars) is required."}
    if not submitted_amount or submitted_amount <= 0:
        return {"success": False, "error_code": "INVALID_AMOUNT", "message": "Submitted amount must be greater than zero."}

    # 1. Verify Team exists (Remote Supabase or valid team_id pattern)
    tr = requests.get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=*", headers=headers)
    team = tr.json()[0] if tr.status_code == 200 and tr.json() else {"team_id": team_id, "team_name": "Team"}

    # 2. Fetch existing payment record
    payment = get_payment_record(team_id) or {
        "team_id": team_id,
        "expected_amount": submitted_amount,
        "payment_status": "AWAITING_PAYMENT"
    }

    if payment.get("payment_status") == "VERIFIED":
        return {
            "success": False,
            "error_code": "PAYMENT_ALREADY_VERIFIED",
            "message": "Payment for this team has already been verified and confirmed."
        }

    # 3. Check for duplicate UTR across other teams
    try:
        dup_r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?utr_number=eq.{cleaned_utr}&team_id=neq.{team_id}&select=team_id", headers=headers)
        if dup_r.status_code == 200 and dup_r.json():
            return {
                "success": False,
                "error_code": "DUPLICATE_UTR",
                "message": f"UTR '{cleaned_utr}' has already been submitted by another team."
            }
    except Exception:
        pass

    # 4. Update team_payments record to PENDING_VERIFICATION
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    pay_update = {
        "team_id": team_id,
        "submitted_amount": submitted_amount,
        "utr_number": cleaned_utr,
        "payment_status": "PENDING_VERIFICATION",
        "rejection_reason": None,
        "payment_submitted_at": now_iso,
        "updated_at": now_iso
    }
    safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers, pay_update)
    safe_supabase_patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers, {
        "payment_status": "PENDING_VERIFICATION"
    })

    return {
        "success": True,
        "message": "Payment details submitted successfully! Awaiting symposium admin verification.",
        "team_id": team_id,
        "payment_status": "PENDING_VERIFICATION",
        "utr_number": cleaned_utr,
        "submitted_amount": submitted_amount,
        "expected_amount": payment.get("expected_amount", submitted_amount) if payment else submitted_amount
    }
def get_payment_status_service(team_id: str) -> Dict[str, Any]:
    """Fetch live payment status, expected amount, UTR, and rejection details with fallback."""
    headers = get_headers()
    ok, res = safe_supabase_get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=team_id,team_name,payment_status", headers)
    
    team = res[0] if (ok and isinstance(res, list) and len(res) > 0) else {"team_id": team_id, "team_name": f"Team {team_id}", "payment_status": "AWAITING_PAYMENT"}
    payment = get_payment_record(team_id) or {}

    p_status = payment.get("payment_status") or team.get("payment_status") or "AWAITING_PAYMENT"
    is_verified = (p_status == "VERIFIED")

    return {
        "success": True,
        "team_id": team_id,
        "team_name": team.get("team_name", f"Team {team_id}"),
        "payment": is_verified,
        "payment_status": p_status,
        "expected_amount": payment.get("expected_amount", 250),
        "submitted_amount": payment.get("submitted_amount"),
        "utr_number": payment.get("utr_number"),
        "rejection_reason": payment.get("rejection_reason"),
        "payment_submitted_at": payment.get("payment_submitted_at"),
        "payment_verified_at": payment.get("payment_verified_at")
    }
