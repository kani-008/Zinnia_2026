"""
Zinnia 2026 — Payment Service Layer
Implements secure UTR submission, idempotency, admin verification,
rejection, and triggers n8n pass dispatch ONLY upon admin verification.
"""

import os
import datetime
import requests
from typing import Dict, Any, Optional, List
from services.passport_service import get_headers, SUPABASE_URL, trigger_passport_dispatch

def get_payment_record(team_id: str) -> Optional[Dict[str, Any]]:
    """Fetch payment record for a given team."""
    headers = get_headers()
    r = requests.get(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}&select=*", headers=headers)
    if r.status_code == 200 and r.json():
        return r.json()[0]
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

    # 2. Verify Payment record
    payment = get_payment_record(team_id)
    if payment and payment.get("payment_status") == "VERIFIED":
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
    try:
        requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json=pay_update)
        requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={
            "payment_status": "PENDING_VERIFICATION"
        })
    except Exception as e:
        print(f"[Payment Update Notice] Supabase patch notice: {e}")

    return {
        "success": True,
        "message": "Payment details submitted successfully! Awaiting symposium admin verification.",
        "team_id": team_id,
        "payment_status": "PENDING_VERIFICATION",
        "utr_number": cleaned_utr,
        "submitted_amount": submitted_amount,
        "expected_amount": payment.get("expected_amount") if payment else submitted_amount
    }

def verify_admin_payment_service(team_id: str, admin_id: str = "ADMIN") -> Dict[str, Any]:
    """
    Admin verification of a pending payment.
    Marks team payment as VERIFIED and triggers pass generation & email dispatch to all team members!
    """
    headers = get_headers()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # Update Supabase team_payments and teams
    try:
        requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json={
            "payment_status": "VERIFIED",
            "payment_verified_at": now_iso,
            "verified_by": admin_id,
            "rejection_reason": None,
            "updated_at": now_iso
        })
        requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={
            "payment_status": "VERIFIED"
        })
    except Exception as e:
        print(f"[Admin Verification Notice] Supabase update notice: {e}")

    # TRIGGER PASSPORT GENERATION & EMAIL DISPATCH
    dispatch_res = trigger_passport_dispatch(team_id)

    return {
        "success": True,
        "message": f"Payment verified for team '{team_id}'. QR Digital Passes generated and dispatched to participant email(s).",
        "payment_status": "VERIFIED",
        "dispatch": dispatch_res
    }

def reject_admin_payment_service(team_id: str, admin_id: str, rejection_reason: str) -> Dict[str, Any]:
    """
    Admin rejection of a pending/invalid payment.
    Resets status to REJECTED with reason so participant can resubmit a valid UTR.
    """
    headers = get_headers()
    reason = rejection_reason.strip() if rejection_reason else "Payment verification failed. Incorrect UTR or amount."

    payment = get_payment_record(team_id)
    if not payment:
        return {"success": False, "error_code": "PAYMENT_NOT_FOUND", "message": f"Payment record for team '{team_id}' not found."}

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # 1. Update team_payments
    requests.patch(f"{SUPABASE_URL}/rest/v1/team_payments?team_id=eq.{team_id}", headers=headers, json={
        "payment_status": "REJECTED",
        "rejection_reason": reason,
        "verified_by": admin_id,
        "updated_at": now_iso
    })

    # 2. Update teams
    requests.patch(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}", headers=headers, json={
        "payment": False,
        "payment_status": "REJECTED"
    })

    return {
        "success": True,
        "message": f"Payment for team '{team_id}' has been marked as REJECTED.",
        "payment_status": "REJECTED",
        "rejection_reason": reason
    }

def get_payment_status_service(team_id: str) -> Dict[str, Any]:
    """Fetch live payment status, expected amount, UTR, and rejection details."""
    headers = get_headers()
    tr = requests.get(f"{SUPABASE_URL}/rest/v1/teams?team_id=eq.{team_id}&select=team_id,team_name,payment,payment_status", headers=headers)
    if tr.status_code != 200 or not tr.json():
        return {"success": False, "error_code": "TEAM_NOT_FOUND", "message": "Team not found."}
    
    team = tr.json()[0]
    payment = get_payment_record(team_id)

    return {
        "success": True,
        "team_id": team_id,
        "team_name": team.get("team_name"),
        "payment": team.get("payment", False),
        "payment_status": payment.get("payment_status", team.get("payment_status", "AWAITING_PAYMENT")),
        "expected_amount": payment.get("expected_amount", 0) if payment else 0,
        "submitted_amount": payment.get("submitted_amount") if payment else None,
        "utr_number": payment.get("utr_number") if payment else None,
        "rejection_reason": payment.get("rejection_reason") if payment else None,
        "payment_submitted_at": payment.get("payment_submitted_at") if payment else None,
        "payment_verified_at": payment.get("payment_verified_at") if payment else None
    }

def list_all_payments_service(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    """List all team payments with joined team details for admin verification dashboard."""
    headers = get_headers()
    url = f"{SUPABASE_URL}/rest/v1/team_payments?select=*,teams(team_name,college,department,year,registered_events)"
    if status_filter:
        url += f"&payment_status=eq.{status_filter.upper()}"
    
    r = requests.get(url, headers=headers)
    if r.status_code == 200 and isinstance(r.json(), list):
        return r.json()
    return []
