import os
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", ".env")
load_dotenv(env_path, override=True)

url = os.getenv("SUPABASE_URL", "").rstrip("/")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

teams = [
    {
        "team_id": "ZIN-2026-1001",
        "team_name": "CyberShield",
        "college": "Government College of Engineering, Erode",
        "department": "Computer Science & Engineering",
        "year": "IV",
        "registered_events": ["debugging", "think-strike-and-win"],
        "payment_status": "VERIFIED",
        "utr_number": "UTR20260904001",
        "members": [
            {
                "id": "ZIN26-CYBER-M1",
                "team_id": "ZIN-2026-1001",
                "name": "Karthik Raja",
                "email": "karthik.gcee@gmail.com",
                "phone": "9876543210",
                "is_leader": True,
                "passport_token": "token_cybershield_lead_9041"
            },
            {
                "id": "ZIN26-CYBER-M2",
                "team_id": "ZIN-2026-1001",
                "name": "Ananya Sharma",
                "email": "ananya.sharma@gmail.com",
                "phone": "9876543211",
                "is_leader": False,
                "passport_token": "token_cybershield_m2_9042"
            }
        ]
    },
    {
        "team_id": "ZIN-2026-1002",
        "team_name": "Quantum Hackers",
        "college": "Government College of Technology, Coimbatore",
        "department": "Information Technology",
        "year": "III",
        "registered_events": ["lost-at-sql", "gadget-codes"],
        "payment_status": "VERIFIED",
        "utr_number": "UTR20260904002",
        "members": [
            {
                "id": "ZIN26-QUANT-M1",
                "team_id": "ZIN-2026-1002",
                "name": "Venkatesh Kumar",
                "email": "venkat.gct@gmail.com",
                "phone": "9843215678",
                "is_leader": True,
                "passport_token": "token_quantum_lead_9043"
            },
            {
                "id": "ZIN26-QUANT-M2",
                "team_id": "ZIN-2026-1002",
                "name": "Priyanka N",
                "email": "priyanka.n@gmail.com",
                "phone": "9843215679",
                "is_leader": False,
                "passport_token": "token_quantum_m2_9044"
            }
        ]
    },
    {
        "team_id": "ZIN-2026-1003",
        "team_name": "CodeCraft Innovators",
        "college": "PSG College of Technology",
        "department": "Computer Science & Engineering",
        "year": "III",
        "registered_events": ["paper-presentation", "short-flim"],
        "payment_status": "VERIFIED",
        "utr_number": "UTR20260904003",
        "members": [
            {
                "id": "ZIN26-CRAFT-M1",
                "team_id": "ZIN-2026-1003",
                "name": "Siddharth V",
                "email": "siddharth.psg@gmail.com",
                "phone": "9789012345",
                "is_leader": True,
                "passport_token": "token_codecraft_lead_9045"
            }
        ]
    },
    {
        "team_id": "ZIN-2026-1004",
        "team_name": "Starlight Visionaries",
        "college": "KPR Institute of Engineering & Technology",
        "department": "Electronics & Communication Engineering",
        "year": "II",
        "registered_events": ["the-last-signal", "borderland-at-gcee"],
        "payment_status": "VERIFIED",
        "utr_number": "UTR20260904004",
        "members": [
            {
                "id": "ZIN26-STAR-M1",
                "team_id": "ZIN-2026-1004",
                "name": "Deepak Prakash",
                "email": "deepak.kpr@gmail.com",
                "phone": "9654321098",
                "is_leader": True,
                "passport_token": "token_starlight_lead_9046"
            },
            {
                "id": "ZIN26-STAR-M2",
                "team_id": "ZIN-2026-1004",
                "name": "Divya Lakshmi",
                "email": "divya.lakshmi@gmail.com",
                "phone": "9654321099",
                "is_leader": False,
                "passport_token": "token_starlight_m2_9047"
            }
        ]
    }
]

for t in teams:
    # Delete existing records if present
    for tbl in ["team_members", "team_payments", "event_registrations", "teams"]:
        requests.delete(f"{url}/rest/v1/{tbl}?team_id=eq.{t['team_id']}", headers=headers)
    
    # Insert team
    team_body = {
        "team_id": t["team_id"],
        "team_name": t["team_name"],
        "college": t["college"],
        "department": t["department"],
        "year": t["year"],
        "registered_events": t["registered_events"],
        "payment_status": t["payment_status"]
    }
    r_team = requests.post(f"{url}/rest/v1/teams", headers=headers, json=team_body)
    print(f"Team {t['team_id']}: status {r_team.status_code}")
    
    # Insert members
    for m in t["members"]:
        r_mem = requests.post(f"{url}/rest/v1/team_members", headers=headers, json=m)
        print(f" Member {m['name']}: status {r_mem.status_code}")
        
    # Insert payment
    pay_body = {
        "team_id": t["team_id"],
        "payment_status": t["payment_status"],
        "submitted_amount": len(t["members"]) * 250,
        "expected_amount": len(t["members"]) * 250,
        "utr_number": t["utr_number"]
    }
    requests.post(f"{url}/rest/v1/team_payments", headers=headers, json=pay_body)
    
    # Insert event registrations
    for ev in t["registered_events"]:
        reg_body = {
            "team_id": t["team_id"],
            "event_id": ev,
            "agent_id": t["members"][0]["id"]
        }
        requests.post(f"{url}/rest/v1/event_registrations", headers=headers, json=reg_body)

# Also add pending registration record in staging table for Treasurer review
pend = {
    "team_id": "ZIN-2026-1005",
    "team_name": "AI Nexus",
    "college": "Coimbatore Institute of Technology",
    "department": "Artificial Intelligence & Data Science",
    "year": "III",
    "members": [
        {"name": "Naveen Kumar", "email": "naveen.cit@gmail.com", "phone": "9123456789", "is_leader": True, "food_preference": "VEG"},
        {"name": "Sujatha R", "email": "sujatha.cit@gmail.com", "phone": "9123456790", "is_leader": False, "food_preference": "NON_VEG"}
    ],
    "registered_events": ["debugging", "plot-twist"],
    "payment_status": "PENDING_VERIFICATION",
    "utr_number": "UTR20260904005",
    "submitted_amount": 500,
    "expected_amount": 500
}
requests.delete(f"{url}/rest/v1/pending_registrations?team_id=eq.ZIN-2026-1005", headers=headers)
r_pend = requests.post(f"{url}/rest/v1/pending_registrations", headers=headers, json=pend)
print(f"Pending registration status: {r_pend.status_code}")
print("SUCCESSFULLY SEEDED PARTICIPANT TEAMS & MEMBERS INTO SUPABASE DATABASE!")
