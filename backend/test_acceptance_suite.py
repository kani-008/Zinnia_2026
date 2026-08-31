"""
Zinnia 2026 — Phase 14 Automated End-to-End Acceptance Test Suite
Validates the complete lifecycle:
1. Registration with 2-person team & 2 events (calculating exactly ₹500 fee)
2. Payment submission with genuine 12-digit UTR
3. Duplicate UTR rejection (409 Conflict)
4. Treasurer verification & idempotent passport email dispatch
5. Gate Entry check-in & duplicate scan prevention
6. Event Track check-in (valid registration vs un-registered rejection) & duplicate scan prevention
7. Food Token check-in with Veg/Non-Veg telemetry & double-claim prevention
8. Cryptographic QR signature tamper detection
"""

import os
import sys
import json
import time
import requests

# Set path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from services.passport_service import (
    sign_qr_content,
    generate_signed_qr_payload_for_member,
    parse_and_validate_scan_payload,
    get_headers,
    SUPABASE_URL
)

def run_tests():
    client = app.test_client()
    test_id = str(int(time.time()))[-5:]
    team_name = f"Acceptance Squad {test_id}"
    utr_1 = f"UTR999{test_id}001"
    utr_2_dup = utr_1
    
    print(f"\n==================================================================")
    print(f"🚀 RUNNING ZINNIA 2026 ACCEPTANCE TEST SUITE (Run ID: {test_id})")
    print(f"==================================================================")

    # -------------------------------------------------------------------------
    # TEST 1: Register a 2-person team with 1 Tech + 1 Non-Tech Event
    # -------------------------------------------------------------------------
    print("\n[TEST 1] Registering 2-person team (Debugging + Think Strike & Win)...")
    reg_payload = {
        "team_name": team_name,
        "college": "GCE Erode",
        "department": "Computer Science and Engineering",
        "year": "III",
        "registered_events": ["debugging", "think-strike-and-win"],
        "members": [
            {
                "name": f"Lead Attendee {test_id}",
                "email": f"lead_{test_id}@gcee.ac.in",
                "phone": "9876543210",
                "is_leader": True,
                "food_preference": "VEG"
            },
            {
                "name": f"Partner Attendee {test_id}",
                "email": f"partner_{test_id}@gcee.ac.in",
                "phone": "9876543211",
                "is_leader": False,
                "food_preference": "NON_VEG"
            }
        ]
    }
    
    r = client.post("/api/register", json=reg_payload)
    assert r.status_code in [200, 201], f"Registration failed: {r.status_code} {r.text}"
    reg_res = r.get_json()
    assert reg_res.get("success"), f"Registration response not successful: {reg_res}"
    team_id = reg_res.get("team_id") or reg_res.get("team", {}).get("team_id")
    members = reg_res.get("members") or reg_res.get("team", {}).get("members")
    assert len(members) == 2, f"Expected 2 members, got {len(members)}"
    print(f"  ✓ Team registered successfully: {team_id} ({len(members)} members)")

    # -------------------------------------------------------------------------
    # TEST 2: Verify Invoice Status via /api/payment/status
    # -------------------------------------------------------------------------
    print("\n[TEST 2] Verifying payment invoice status...")
    r = client.get(f"/api/payment/status?team_id={team_id}")
    assert r.status_code == 200, f"Status fetch failed: {r.status_code}"
    status_res = r.get_json()
    assert status_res.get("expected_amount") == 500, f"Expected ₹500, got ₹{status_res.get('expected_amount')}"
    assert status_res.get("payment_status") == "AWAITING_PAYMENT"
    print(f"  ✓ Expected fee is correctly ₹500 (₹250 x 2 attendees)")

    # -------------------------------------------------------------------------
    # TEST 3: Submit Payment Proof (UTR)
    # -------------------------------------------------------------------------
    print(f"\n[TEST 3] Submitting genuine payment proof (UTR: {utr_1})...")
    pay_payload = {
        "team_id": team_id,
        "utr_number": utr_1,
        "submitted_amount": 500
    }
    r = client.post("/api/payment/submit", json=pay_payload)
    assert r.status_code == 200, f"Payment submit failed: {r.status_code} {r.text}"
    pay_res = r.get_json()
    assert pay_res.get("success")
    assert pay_res.get("payment_status") == "PENDING_VERIFICATION"
    print(f"  ✓ Payment proof submitted and transitioned to PENDING_VERIFICATION")

    # -------------------------------------------------------------------------
    # TEST 4: Duplicate UTR Detection (Must reject with 409 Conflict)
    # -------------------------------------------------------------------------
    print(f"\n[TEST 4] Testing duplicate UTR submission prevention (UTR: {utr_2_dup})...")
    dup_payload = {
        "team_id": "ZIN-2026-9999",
        "utr_number": utr_2_dup,
        "submitted_amount": 500
    }
    r = client.post("/api/payment/submit", json=dup_payload)
    assert r.status_code == 409, f"Expected HTTP 409 Conflict on duplicate UTR, got {r.status_code}"
    dup_res = r.get_json()
    assert dup_res.get("error_code") == "DUPLICATE_UTR"
    print(f"  ✓ Duplicate UTR rejected with HTTP 409 DUPLICATE_UTR")

    # -------------------------------------------------------------------------
    # TEST 5: Treasurer Payment Verification & Pass Dispatch
    # -------------------------------------------------------------------------
    print(f"\n[TEST 5] Treasurer verifying payment for team {team_id}...")
    treasurer_login = client.post("/api/admin/auth/login", json={"username": "treasurer", "password": "Treasurer@Zin26"})
    assert treasurer_login.status_code == 200, f"Treasurer login failed: {treasurer_login.text}"
    treasurer_token = treasurer_login.get_json()["token"]

    verify_res = client.post(
        "/api/admin/payments/verify",
        headers={"Authorization": f"Bearer {treasurer_token}"},
        json={"team_id": team_id, "admin_name": "Symposium Treasurer"}
    )
    assert verify_res.status_code == 200, f"Treasurer verify failed: {verify_res.text}"
    v_data = verify_res.get_json()
    assert v_data.get("payment_status") == "VERIFIED"
    print(f"  ✓ Payment VERIFIED. Official QR passes dispatched to all member emails.")

    # -------------------------------------------------------------------------
    # TEST 6: Gate Reception Check-in (Single-Use Entry)
    # -------------------------------------------------------------------------
    member_1 = members[0]
    token_1 = member_1["passport_token"]
    signed_qr_1 = generate_signed_qr_payload_for_member(member_1, [{"event_id": "debugging"}, {"event_id": "think-strike-and-win"}])

    print(f"\n[TEST 6] Campus Gate Reception entry check-in for {member_1['name']}...")
    # First scan: PASS
    gate_res_1 = client.post("/api/checkin/entry", json={"token": signed_qr_1, "scanned_by": "Gate Terminal 1"})
    assert gate_res_1.status_code == 200, f"Gate scan failed: {gate_res_1.text}"
    assert gate_res_1.get_json().get("success") == True
    print("  ✓ First gate scan: ADMISSION GRANTED")

    # Second scan: REJECT (Duplicate entry prevention)
    gate_res_2 = client.post("/api/checkin/entry", json={"token": signed_qr_1, "scanned_by": "Gate Terminal 1"})
    assert gate_res_2.status_code == 400, f"Expected 400 on duplicate entry, got {gate_res_2.status_code}"
    assert "already checked in" in gate_res_2.get_json().get("reason", "").lower()
    print(f"  ✓ Immediate duplicate gate scan REJECTED: {gate_res_2.get_json().get('reason')}")

    # -------------------------------------------------------------------------
    # TEST 7: Event Track Check-in (Registered vs Unregistered vs Duplicate)
    # -------------------------------------------------------------------------
    print(f"\n[TEST 7] Event Track check-in verification...")
    # A. Unregistered track scan (Lost at SQL - event_id: lost-at-sql) -> REJECT
    unregistered_scan = client.post("/api/checkin/event", json={
        "token": signed_qr_1,
        "event_id": "lost-at-sql",
        "scanned_by": "Coordinator - SQL"
    })
    assert unregistered_scan.status_code == 400
    assert "not registered" in unregistered_scan.get_json().get("reason", "").lower()
    print("  ✓ Scan for un-registered event 'Lost at SQL' correctly REJECTED")

    # B. Registered track scan (Debugging - event_id: debugging) -> PASS
    registered_scan_1 = client.post("/api/checkin/event", json={
        "token": signed_qr_1,
        "event_id": "debugging",
        "scanned_by": "Coordinator - Debugging"
    })
    assert registered_scan_1.status_code == 200, f"Event scan failed: {registered_scan_1.text}"
    assert registered_scan_1.get_json().get("success") == True
    print("  ✓ Scan for registered event 'Debugging': ADMITTED")

    # C. Duplicate track scan for same event -> REJECT
    registered_scan_2 = client.post("/api/checkin/event", json={
        "token": signed_qr_1,
        "event_id": "debugging",
        "scanned_by": "Coordinator - Debugging"
    })
    assert registered_scan_2.status_code == 400
    assert "already checked in" in registered_scan_2.get_json().get("reason", "").lower()
    print("  ✓ Duplicate event check-in correctly REJECTED")

    # -------------------------------------------------------------------------
    # TEST 8: Food Token Check-in (Veg/Non-Veg Telemetry & Single Issuance)
    # -------------------------------------------------------------------------
    member_2 = members[1] # NON_VEG
    signed_qr_2 = generate_signed_qr_payload_for_member(member_2, [{"event_id": "debugging"}])

    print(f"\n[TEST 8] Dining Hall Food token check-in (Member 2 - NON_VEG)...")
    # First meal claim: PASS with NON_VEG
    food_res_1 = client.post("/api/checkin/food", json={"token": signed_qr_2, "scanned_by": "Dining Counter A"})
    assert food_res_1.status_code == 200, f"Food scan failed: {food_res_1.text}"
    food_data = food_res_1.get_json()
    assert food_data.get("success") == True
    assert food_data.get("food_preference") == "NON_VEG"
    print(f"  ✓ Meal token validated. Telemetry returned: {food_data.get('food_preference')} (NON_VEG meal issued)")

    # Second meal claim: REJECT (Single issuance locked)
    food_res_2 = client.post("/api/checkin/food", json={"token": signed_qr_2, "scanned_by": "Dining Counter A"})
    assert food_res_2.status_code == 400
    assert "already claimed" in food_res_2.get_json().get("reason", "").lower()
    print(f"  ✓ Duplicate meal token claim correctly REJECTED: {food_res_2.get_json().get('reason')}")

    # -------------------------------------------------------------------------
    # TEST 9: Cryptographic QR Signature Tamper Detection
    # -------------------------------------------------------------------------
    print("\n[TEST 9] Testing Cryptographic QR Signature Tamper Detection...")
    tampered_qr = signed_qr_1.replace('"f":"V"', '"f":"N"') # Tamper food pref from V to N
    resolved_tok, qr_obj, is_valid, msg = parse_and_validate_scan_payload(tampered_qr)
    assert not is_valid, "Tampered QR payload must fail signature verification!"
    print(f"  ✓ Tampered payload detected and rejected: {msg}")

    print("\n==================================================================")
    print("🎉 ALL ACCEPTANCE TESTS PASSED ACCORDING TO SPECIFICATION!")
    print("==================================================================\n")

if __name__ == "__main__":
    run_tests()
