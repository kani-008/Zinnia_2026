"""
Zinnia 2026 — Official Participant Email & QR Dispatch Service
Generates responsive HTML passport emails with embedded QR code badges (CID/base64),
event telemetry, and food status. Never relies on external Quickchart APIs.
"""

import os
import io
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Dict, Any, List, Optional

# SMTP Configuration from Environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASS = (os.getenv("SMTP_PASS", "") or os.getenv("SMTP_PASSWORD", "")).replace(" ", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "Zinnia 2026 <zinnia2026@gcee.ac.in>")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")

def generate_qr_png_bytes(data: str) -> bytes:
    """
    Generate raw PNG bytes for a QR code image.
    Strictly uses local qrcode library — fails loudly if package is missing.
    """
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
        img = qr.make_image(fill_color="#08090A", back_color="#ffffff")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()
    except Exception as e:
        raise RuntimeError(f"Local QR Code generation failed: {str(e)}. No insecure third-party fallback allowed.")

def generate_qr_base64(data: str) -> str:
    """Generate Base64 encoded PNG data of the QR code."""
    png_bytes = generate_qr_png_bytes(data)
    return base64.b64encode(png_bytes).decode("utf-8")

def generate_passport_email_html(
    member: Dict[str, Any],
    team: Dict[str, Any],
    registered_events: List[Dict[str, Any]],
    qr_cid_or_url: str,
    passport_link: str
) -> str:
    """Creates a high-production, futuristic dark/cyber themed HTML email."""
    member_name = member.get("name", "Participant")
    member_id = member.get("id", "")
    team_id = team.get("team_id", "")
    team_name = team.get("team_name", "Team")
    college = team.get("college", "GCE Erode")
    is_leader = member.get("is_leader", False)
    food_pref = (member.get("food_preference") or "VEG").upper()
    is_veg = food_pref != "NON_VEG"
    
    # Generate event breakdown table rows
    events_html = ""
    if registered_events:
        for ev in registered_events:
            ev_obj = ev.get("events") if isinstance(ev.get("events"), dict) else ev
            ev_title = ev_obj.get("mission_name") or ev_obj.get("title") or ev_obj.get("name") or "Symposium Event"
            ev_category = ev_obj.get("category", "Track").upper()
            ev_venue = ev_obj.get("venue", "Main Campus")
            ev_time = ev_obj.get("schedule_time", "Event Day — 10:00 AM")
            
            events_html += f"""
            <tr style="border-bottom: 1px solid #1f242d;">
                <td style="padding: 12px 8px; font-weight: 700; color: #EEEEEA; font-size: 13px;">
                    {ev_title}
                    <div style="font-size: 11px; color: #0FA9C6; font-weight: 500; margin-top: 2px;">{ev_category}</div>
                </td>
                <td style="padding: 12px 8px; color: #B8B8B2; font-size: 12px;">{ev_venue}</td>
                <td style="padding: 12px 8px; color: #E5BD00; font-size: 12px; font-family: monospace; font-weight: 600;">{ev_time}</td>
            </tr>
            """
    else:
        events_html = """
        <tr>
            <td colspan="3" style="padding: 14px; text-align: center; color: #B8B8B2; font-size: 13px;">
                Registered for General Symposium Access & Technical Tracks
            </td>
        </tr>
        """

    # Image source
    if qr_cid_or_url.startswith("cid:"):
        qr_img_src = qr_cid_or_url
    elif qr_cid_or_url.startswith("data:"):
        qr_img_src = qr_cid_or_url
    else:
        qr_img_src = f"data:image/png;base64,{qr_cid_or_url}"

    food_badge_color = "#10B981" if is_veg else "#EF4444"
    food_badge_bg = "#064E3B" if is_veg else "#7F1D1D"
    food_text = "🌱 VEG MEAL INCLUDED" if is_veg else "🍗 NON-VEG MEAL INCLUDED"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zinnia 2026 Official Digital Passport</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #08090A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #EEEEEA;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #08090A; padding: 30px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #111214; border: 2px solid #23262D; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #0FA9C6 0%, #1570EF 100%); padding: 26px 20px; text-align: center;">
                  <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #08090A; font-weight: 900; margin-bottom: 6px; background-color: #E5BD00; display: inline-block; padding: 3px 10px; border-radius: 4px;">
                    NATIONAL LEVEL TECHNICAL SYMPOSIUM
                  </div>
                  <h1 style="margin: 4px 0 0 0; font-size: 28px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px;">
                    ZINNIA 2026
                  </h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #EEEEEA; font-weight: 500;">
                    Government College of Engineering, Erode
                  </p>
                </td>
              </tr>

              <!-- Attendee Greeting -->
              <tr>
                <td style="padding: 24px 20px 12px 20px;">
                  <p style="margin: 0 0 8px 0; font-size: 16px; color: #EEEEEA;">
                    Hello <strong style="color: #E5BD00;">{member_name}</strong>,
                  </p>
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #B8B8B2; line-height: 1.5;">
                    Your squad registration for <strong>Zinnia 2026</strong> has been verified and approved by the symposium treasurer! Below is your official personal Digital Gate & Event Passport.
                  </p>

                  <!-- Digital Passport QR Card -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #08090A; border: 2px solid #0FA9C6; border-radius: 12px; margin-bottom: 20px; text-align: center;">
                    <tr>
                      <td style="padding: 20px 16px;">
                        <div style="font-size: 11px; font-family: monospace; color: #0FA9C6; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
                          OFFICIAL SCANNER CREDENTIAL
                        </div>

                        <!-- Embedded QR Image -->
                        <div style="display: inline-block; background-color: #ffffff; padding: 12px; border-radius: 12px;">
                          <img src="{qr_img_src}" alt="Attendee Passport QR" width="220" height="220" style="display: block; width: 220px; height: 220px;" />
                        </div>

                        <!-- Participant Info Strip -->
                        <div style="margin-top: 14px;">
                          <div style="font-size: 16px; font-weight: 800; color: #EEEEEA; text-transform: uppercase;">
                            {member_name} { '(LEADER)' if is_leader else '' }
                          </div>
                          <div style="font-size: 12px; font-family: monospace; color: #E5BD00; margin-top: 4px;">
                            TEAM: {team_name} &bull; ID: {team_id}
                          </div>
                          <div style="font-size: 11px; color: #B8B8B2; margin-top: 2px;">
                            {college}
                          </div>
                        </div>

                        <!-- Food Badge -->
                        <div style="margin-top: 14px; display: inline-block; background-color: {food_badge_bg}; color: {food_badge_color}; border: 1px solid {food_badge_color}; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; font-family: monospace; text-transform: uppercase;">
                          {food_text}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Registered Events List -->
                  <div style="margin-bottom: 20px;">
                    <div style="font-size: 12px; font-family: monospace; color: #0FA9C6; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                      REGISTERED COMPETITION TRACKS
                    </div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #08090A; border: 1px solid #23262D; border-radius: 8px;">
                      <thead>
                        <tr style="border-bottom: 1px solid #23262D; background-color: #17181C;">
                          <th align="left" style="padding: 8px; font-size: 10px; font-family: monospace; color: #B8B8B2; text-transform: uppercase;">TRACK</th>
                          <th align="left" style="padding: 8px; font-size: 10px; font-family: monospace; color: #B8B8B2; text-transform: uppercase;">VENUE</th>
                          <th align="left" style="padding: 8px; font-size: 10px; font-family: monospace; color: #B8B8B2; text-transform: uppercase;">TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events_html}
                      </tbody>
                    </table>
                  </div>

                  <!-- Instructions -->
                  <div style="background-color: #17181C; border-left: 3px solid #E5BD00; padding: 12px 14px; border-radius: 4px; margin-bottom: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #E5BD00; text-transform: uppercase; margin-bottom: 4px;">
                      IMPORTANT SYMPOSIUM INSTRUCTIONS
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: #B8B8B2; line-height: 1.6;">
                      <li>Present this QR at the Main Reception Desk for campus admission.</li>
                      <li>Present the same QR at your designated event venue to check in for competition.</li>
                      <li>Scan this QR at the dining hall to claim your refreshment/lunch token.</li>
                    </ul>
                  </div>

                  <!-- View Live Digital Pass Link -->
                  <div style="text-align: center; margin-bottom: 20px;">
                    <a href="{passport_link}" style="display: inline-block; background-color: #0FA9C6; color: #08090A; font-weight: 800; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-transform: uppercase; font-family: monospace;">
                      OPEN LIVE DIGITAL PASSPORT &rarr;
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #08090A; padding: 16px 20px; text-align: center; border-top: 1px solid #23262D;">
                  <p style="margin: 0; font-size: 10px; color: #71717A; font-family: monospace;">
                    ZINNIA 2026 &bull; Department of Computer Science and Engineering<br/>
                    Government College of Engineering, Erode &bull; Support: zinnia2026@gcee.ac.in
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return html

def send_participant_passport_email(
    member: Dict[str, Any],
    team: Dict[str, Any],
    registered_events: List[Dict[str, Any]],
    app_base_url: str = "http://localhost:5173",
    force_resend: bool = False
) -> Dict[str, Any]:
    """
    Constructs and sends the official passport email with CID-embedded QR code.
    Enforces idempotency unless force_resend is True.
    """
    recipient_email = member.get("email", "").strip()
    if not recipient_email:
        return {"success": False, "status": "SKIPPED_NO_EMAIL", "error": "No email address found for participant."}

    # Idempotency check
    if member.get("passport_sent_at") and not force_resend:
        return {
            "success": True, 
            "status": "SKIPPED_ALREADY_SENT", 
            "message": f"Passport email already dispatched at {member.get('passport_sent_at')}."
        }

    # 1. Build compact signed QR payload from member details
    from services.passport_service import generate_signed_qr_payload_for_member
    
    qr_payload_str = generate_signed_qr_payload_for_member(member, registered_events)
    png_bytes = generate_qr_png_bytes(qr_payload_str)
    passport_link = f"{app_base_url}/passport?token={member.get('passport_token') or member.get('id')}"

    # 2. Build Multipart Email Message
    msg = MIMEMultipart("related")
    msg["Subject"] = f"🎟️ Official Zinnia 2026 Digital Passport — {member.get('name', 'Participant')} ({team.get('team_id', '')})"
    msg["From"] = SMTP_FROM
    msg["To"] = recipient_email

    # Plain text fallback
    events_text = "\n".join([
        f"- {ev.get('events', ev).get('mission_name', 'Event')} ({ev.get('events', ev).get('venue', 'Venue')} @ {ev.get('events', ev).get('schedule_time', '10:00 AM')})"
        for ev in registered_events
    ])
    
    text_content = f"""
ZINNIA 2026 — OFFICIAL DIGITAL PASSPORT
Government College of Engineering, Erode

Hello {member.get('name')},

Your squad registration has been verified!
Team: {team.get('team_name')} ({team.get('team_id')})
Food Preference: {member.get('food_preference', 'VEG')}

Your Registered Events:
{events_text or 'General Symposium Access'}

View your digital pass online:
{passport_link}

Please present your QR pass at the entrance gate and event venues.
    """
    
    alt_part = MIMEMultipart("alternative")
    alt_part.attach(MIMEText(text_content, "plain"))

    html_content = generate_passport_email_html(
        member=member,
        team=team,
        registered_events=registered_events,
        qr_cid_or_url="cid:passport_qr",
        passport_link=passport_link
    )
    alt_part.attach(MIMEText(html_content, "html"))
    msg.attach(alt_part)

    # Attach QR image as inline CID
    qr_image = MIMEImage(png_bytes, "png")
    qr_image.add_header("Content-ID", "<passport_qr>")
    qr_image.add_header("Content-Disposition", "inline", filename="passport_qr.png")
    msg.attach(qr_image)

    # 3. Deliver via SMTP.
    # Missing credentials is a FAILURE, not a simulated success. This previously
    # returned success:True, which made trigger_passport_dispatch stamp
    # passport_sent_at and report every pass as delivered while no mail was ever
    # sent — leaving teams VERIFIED with zero emails and no visible error.
    # Set ALLOW_EMAIL_SIMULATION=true explicitly for local development only.
    if not SMTP_USER or not SMTP_PASS or SMTP_USER.startswith("your_"):
        simulation_allowed = os.getenv("ALLOW_EMAIL_SIMULATION", "false").lower() == "true"
        message = (
            f"SMTP is not configured (SMTP_USER/SMTP_PASS missing or placeholder). "
            f"No email was sent to {recipient_email}."
        )
        if simulation_allowed:
            print(f"[Email Sim] {message} ALLOW_EMAIL_SIMULATION is on — reporting as simulated.")
            return {
                "success": False,
                "status": "SIMULATED_NOT_SENT",
                "recipient": recipient_email,
                "error": message,
                "message": "Development simulation — nothing was delivered."
            }
        print(f"[SMTP Error] {message}")
        return {
            "success": False,
            "status": "FAILED",
            "recipient": recipient_email,
            "error": message
        }

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)

        return {"success": True, "status": "SENT", "recipient": recipient_email}
    except Exception as e:
        print(f"[SMTP Error] Failed to deliver passport to {recipient_email}: {e}")
        return {"success": False, "status": "FAILED", "error": str(e), "recipient": recipient_email}

def generate_payment_rejected_email_html(
    member: Dict[str, Any],
    team: Dict[str, Any],
    reason: str,
    resubmit_url: str
) -> str:
    """Creates a professional, supportive dark-themed HTML email for payment revision requests."""
    member_name = member.get("name", "Participant")
    team_id = team.get("team_id", "")
    team_name = team.get("team_name", "Team")
    utr_number = team.get("utr_number") or "Not Recorded"
    expected_amount = team.get("expected_amount") or 250

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zinnia 2026 — Payment Verification Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #08090A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #EEEEEA;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #08090A; padding: 30px 10px;">
        <tr>
          <td align="center">
            <!-- Main Card Container -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #111214; border: 2px solid #23262D; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1F242D 0%, #111214 100%); padding: 26px 20px; text-align: center; border-bottom: 2px solid #D51F55;">
                  <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #FFFFFF; font-weight: 900; margin-bottom: 6px; background-color: #D51F55; display: inline-block; padding: 3px 10px; border-radius: 4px;">
                    PAYMENT VERIFICATION UPDATE
                  </div>
                  <h1 style="margin: 4px 0 0 0; font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: 1px;">
                    ZINNIA 2026
                  </h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #B8B8B2; font-weight: 500;">
                    Government College of Engineering, Erode
                  </p>
                </td>
              </tr>

              <!-- Greeting & Context -->
              <tr>
                <td style="padding: 24px 24px 12px 24px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #FFFFFF; font-weight: 800;">
                    Hello {member_name},
                  </h2>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #B8B8B2;">
                    During the verification review for your team registration, the symposium treasurer was unable to verify the transaction reference provided.
                  </p>
                </td>
              </tr>

              <!-- Details Box -->
              <tr>
                <td style="padding: 0 24px 16px 24px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #08090A; border: 1px solid #23262D; border-radius: 12px; padding: 16px;">
                    <tr>
                      <td style="padding: 6px 8px; font-size: 12px; color: #B8B8B2; font-weight: 600;">Team Name &amp; ID:</td>
                      <td style="padding: 6px 8px; font-size: 12px; color: #FFFFFF; font-weight: 700; text-align: right;">{team_name} ({team_id})</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; font-size: 12px; color: #B8B8B2; font-weight: 600;">Submitted Transaction ID:</td>
                      <td style="padding: 6px 8px; font-size: 12px; color: #E5BD00; font-family: monospace; font-weight: 700; text-align: right;">{utr_number}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 8px; font-size: 12px; color: #B8B8B2; font-weight: 600;">Registration Fee Expected:</td>
                      <td style="padding: 6px 8px; font-size: 12px; color: #0FA9C6; font-weight: 700; text-align: right;">₹{expected_amount}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Reason Box -->
              <tr>
                <td style="padding: 0 24px 20px 24px;">
                  <div style="background-color: rgba(213, 31, 85, 0.08); border-left: 4px solid #D51F55; border-radius: 4px; padding: 14px 16px;">
                    <div style="font-size: 11px; font-weight: 800; color: #D51F55; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 1px;">
                      Treasurer Note / Reason:
                    </div>
                    <div style="font-size: 13px; color: #EEEEEA; line-height: 1.5; font-weight: 500;">
                      {reason or 'The transaction ID could not be matched with incoming banking records.'}
                    </div>
                  </div>
                </td>
              </tr>

              <!-- Action Instructions -->
              <tr>
                <td style="padding: 0 24px 24px 24px; text-align: center;">
                  <p style="margin: 0 0 16px 0; font-size: 13px; color: #B8B8B2; line-height: 1.5;">
                    This usually happens if a digit was mistyped or the transfer was not received. You can easily submit a corrected transaction reference number using the secure link below:
                  </p>
                  
                  <a href="{resubmit_url}" style="display: inline-block; background-color: #E5BD00; color: #090A0B; font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(229, 189, 0, 0.3);">
                    Submit Corrected Transaction ID &rarr;
                  </a>
                </td>
              </tr>

              <!-- Footer & Help -->
              <tr>
                <td style="background-color: #08090A; padding: 20px 24px; border-top: 1px solid #1F242D; font-size: 11px; color: #71767B; line-height: 1.5; text-align: center;">
                  <p style="margin: 0 0 6px 0;">
                    Need assistance? Reply directly to this email or reach the symposium coordination team at <a href="mailto:zinnia2026@gcee.ac.in" style="color: #0FA9C6; text-decoration: none;">zinnia2026@gcee.ac.in</a>.
                  </p>
                  <p style="margin: 0;">
                    Zinnia 2026 &bull; Department of Computer Science &amp; Engineering &bull; GCE Erode
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

def send_payment_rejected_email(
    member: Dict[str, Any],
    team: Dict[str, Any],
    reason: str,
    resubmit_url: str
) -> Dict[str, Any]:
    """
    Constructs and dispatches the official payment rejection and revision notification email.
    Contains no QR codes. Mirrors styling of passport emails with supportive, helpful guidance.
    """
    recipient_email = member.get("email", "").strip()
    if not recipient_email:
        return {"success": False, "status": "SKIPPED_NO_EMAIL", "error": "No email address found for participant."}

    team_id = team.get("team_id", "")
    team_name = team.get("team_name", "Team")
    utr_number = team.get("utr_number") or "Not Recorded"
    expected_amount = team.get("expected_amount") or 250

    # 1. Plain text fallback
    text_content = f"""
ZINNIA 2026 — PAYMENT VERIFICATION UPDATE
Government College of Engineering, Erode

Hello {member.get('name', 'Participant')},

During the verification review for your team registration, the symposium treasurer was unable to verify the transaction reference provided.

Team Name & ID: {team_name} ({team_id})
Submitted Transaction ID: {utr_number}
Registration Fee Expected: ₹{expected_amount}

Treasurer Reason:
{reason or 'The transaction ID could not be matched with incoming banking records.'}

This usually happens if a digit was mistyped or the payment was not received. You can submit a corrected transaction reference number here:
{resubmit_url}

Need assistance? Contact the coordination team at zinnia2026@gcee.ac.in.
    """

    # 2. Build HTML email
    html_content = generate_payment_rejected_email_html(
        member=member,
        team=team,
        reason=reason,
        resubmit_url=resubmit_url
    )

    # 3. Build Multipart Email Message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Action Required: Payment Verification Update — {team_name} ({team_id})"
    msg["From"] = SMTP_FROM
    msg["To"] = recipient_email
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    # 4. Deliver via SMTP
    if not SMTP_USER or not SMTP_PASS or SMTP_USER.startswith("your_"):
        simulation_allowed = os.getenv("ALLOW_EMAIL_SIMULATION", "false").lower() == "true"
        message = f"SMTP is not configured. Rejection email was not sent to {recipient_email}."
        if simulation_allowed:
            print(f"[Email Sim] {message}")
            return {
                "success": False,
                "status": "SIMULATED_NOT_SENT",
                "recipient": recipient_email,
                "error": message
            }
        return {
            "success": False,
            "status": "FAILED",
            "recipient": recipient_email,
            "error": message
        }

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)

        return {"success": True, "status": "REJECTION_SENT", "recipient": recipient_email}
    except Exception as e:
        print(f"[SMTP Error] Failed to deliver rejection email to {recipient_email}: {e}")
        return {"success": False, "status": "FAILED", "error": str(e), "recipient": recipient_email}

def _strip_tags(html: str) -> str:
    """
    Crude HTML -> text for the plain-text alternative part.

    Deliberately not a parser: these are our own templates, not arbitrary
    input, and every multipart message needs *some* text/plain part or spam
    filters mark it down. Block-level tags become newlines so the result reads
    as lines rather than one run-on paragraph.
    """
    import re as _re

    text = _re.sub(r"(?s)<(script|style).*?</\1>", "", html)
    text = _re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = _re.sub(r"(?i)</(p|div|tr|li|h[1-6])>", "\n", text)
    text = _re.sub(r"<[^>]+>", "", text)
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&bull;", "-")
        .replace("&rarr;", "->")
    )
    text = _re.sub(r"\n{3,}", "\n\n", text)
    return "\n".join(line.strip() for line in text.split("\n")).strip()


def send_simple_email(to: str, subject: str, html: str, text: str = None) -> bool:
    """
    One-off transactional mail: no QR, no inline image, no idempotency stamp.

    The passport mailer above is a 600-line template with a CID attachment and
    a passport_sent_at guard. A login code needs none of that and must not be
    gated by that guard — a participant logging in for the third time still
    needs their third code — so short messages go out through here instead.

    Returns True only when SMTP actually accepted the message.
    """
    recipient = (to or "").strip()
    if not recipient:
        print("[SMTP Error] send_simple_email called with no recipient.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = recipient
    msg.attach(MIMEText(text if text is not None else _strip_tags(html), "plain"))
    msg.attach(MIMEText(html, "html"))

    # Same rule as the passport mailer: missing credentials is a failure, not a
    # silent success. ALLOW_EMAIL_SIMULATION only changes the log line.
    if not SMTP_USER or not SMTP_PASS or SMTP_USER.startswith("your_"):
        if os.getenv("ALLOW_EMAIL_SIMULATION", "false").lower() == "true":
            print(f"[Email Sim] SMTP not configured - would have sent '{subject}' to {recipient}.")
        else:
            print(f"[SMTP Error] SMTP not configured. '{subject}' not sent to {recipient}.")
        return False

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        return True
    except Exception as e:
        print(f"[SMTP Error] Failed to deliver '{subject}' to {recipient}: {e}")
        return False


# ==============================================================================
# REGISTRATION EMAIL — UserID + master QR + WhatsApp group (EMAIL #1, §4.1)
# ==============================================================================
#
# Sent the moment the participant proves their email works (the OTP step that
# now sits between the details form and payment), not at payment time. Two
# reasons: a wrong address is caught before any money moves, and a participant
# who forgets to copy their UserID has it in their inbox immediately.
#
# THE MASTER QR ENCODES THE USERID AS PLAIN TEXT — nothing else. Any phone
# camera shows "ZIN26-0142". The coordinator's identification app (a separate
# system) resolves that ID to the live record: name, food preference, events,
# team. Because the QR is a pointer and not a snapshot, it never goes stale as
# the participant registers events or forms teams. The earlier design embedded
# food + event codes in a signed payload, which went stale on the first change.

PARTICIPANTS_WHATSAPP_GROUP_URL = os.getenv(
    "WHATSAPP_GROUP_URL",
    "https://chat.whatsapp.com/DthX9rMcTk9BgLh3gQOHx6?s=sw&p=a&mlu=0&ilr=4",
).strip()


def generate_master_qr_email_html(
    name: str,
    user_id: str,
    login_url: str,
    whatsapp_url: str,
    qr_cid: str = "cid:master_qr",
) -> str:
    """
    EMAIL #2 — the confirmation, sent only after the treasurer approves the
    payment. Comic-styled ID card: big UserID, the master QR, the WhatsApp CTA,
    the login link. Everything here is released by that approval and by nothing
    earlier; the participant has already had EMAIL #1 and has been picking
    events since they submitted their payment reference.
    """
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Zinnia 2026 UserID</title>
    </head>
    <body style="margin:0;padding:0;background-color:#08090A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#EEEEEA;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#08090A;padding:30px 10px;">
        <tr><td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#111214;border:2px solid #23262D;border-radius:16px;overflow:hidden;">

            <tr>
              <td style="background:linear-gradient(135deg,#0FA9C6 0%,#1570EF 100%);padding:24px 20px;text-align:center;">
                <div style="display:inline-block;background-color:#E5BD00;color:#08090A;font-size:11px;font-weight:900;letter-spacing:2px;text-transform:uppercase;padding:3px 10px;border-radius:4px;">
                  YOU ARE REGISTERED
                </div>
                <h1 style="margin:6px 0 0 0;font-size:28px;font-weight:900;color:#FFFFFF;letter-spacing:1px;">ZINNIA 2026</h1>
                <p style="margin:6px 0 0 0;font-size:13px;color:#EEEEEA;">Government College of Engineering, Erode</p>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 20px 8px 20px;">
                <p style="margin:0 0 8px 0;font-size:16px;">Hello <strong style="color:#E5BD00;">{name}</strong>,</p>
                <p style="margin:0 0 18px 0;font-size:13px;color:#B8B8B2;line-height:1.5;">
                  Your payment has been verified and your registration is fully confirmed. Keep this
                  mail — your pass for the day is below.
                </p>

                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#08090A;border:2px solid #E5BD00;border-radius:12px;text-align:center;">
                  <tr><td style="padding:18px 16px 6px 16px;">
                    <div style="font-size:11px;font-family:monospace;color:#B8B8B2;font-weight:700;letter-spacing:2px;text-transform:uppercase;">YOUR USERID</div>
                    <div style="font-size:34px;font-family:monospace;font-weight:900;color:#E5BD00;letter-spacing:3px;margin-top:6px;">{user_id}</div>
                    <div style="font-size:11px;color:#B8B8B2;margin-top:6px;">This is how you log in, and how teammates add you to their team.</div>
                  </td></tr>
                  <tr><td style="padding:14px 16px 18px 16px;">
                    <div style="font-size:11px;font-family:monospace;color:#0FA9C6;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">MASTER QR &bull; YOUR ID CARD</div>
                    <div style="display:inline-block;background-color:#ffffff;padding:12px;border-radius:12px;">
                      <img src="{qr_cid}" alt="Master QR — {user_id}" width="200" height="200" style="display:block;width:200px;height:200px;" />
                    </div>
                    <div style="font-size:11px;color:#B8B8B2;margin-top:10px;line-height:1.5;">
                      Show this at the gate, at every event desk and at the food counter.<br/>
                      Scanning it reveals your UserID; coordinators use it to look up your events and meal.
                    </div>
                    <div style="font-size:11px;color:#E5BD00;margin-top:10px;line-height:1.5;font-weight:700;">
                      This QR is your pass for the whole day. It stays the same as you add events —
                      you will not be sent a new one. Save the attached PNG to your phone.
                    </div>
                    <div style="font-size:11px;color:#0FA9C6;margin-top:6px;line-height:1.5;font-weight:700;">
                      Your payment is verified, so this pass is active and will open the gate.
                    </div>
                  </td></tr>
                </table>

                <div style="text-align:center;margin:22px 0 10px 0;">
                  <a href="{whatsapp_url}" style="display:inline-block;background-color:#25D366;color:#08090A;font-weight:800;font-size:13px;text-decoration:none;padding:12px 22px;border-radius:8px;text-transform:uppercase;font-family:monospace;">
                    JOIN THE PARTICIPANTS WHATSAPP GROUP &rarr;
                  </a>
                  <div style="font-size:11px;color:#B8B8B2;margin-top:8px;">All schedule changes and reminders go there first.</div>
                </div>

                <div style="text-align:center;margin:10px 0 20px 0;">
                  <a href="{login_url}" style="display:inline-block;background-color:#0FA9C6;color:#08090A;font-weight:800;font-size:13px;text-decoration:none;padding:12px 22px;border-radius:8px;text-transform:uppercase;font-family:monospace;">
                    LOG IN &amp; PICK YOUR EVENTS &rarr;
                  </a>
                </div>

                <div style="background-color:#17181C;border-left:3px solid #0FA9C6;padding:12px 14px;border-radius:4px;">
                  <div style="font-size:11px;font-weight:700;color:#0FA9C6;text-transform:uppercase;margin-bottom:4px;">NOTHING LEFT TO DO</div>
                  <div style="font-size:12px;color:#B8B8B2;line-height:1.6;">
                    Your place is secured. If you have not picked all your events yet you still can —
                    the catalog stays open on your dashboard until each event closes.
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="background-color:#08090A;padding:16px 20px;text-align:center;border-top:1px solid #23262D;">
                <p style="margin:0;font-size:10px;color:#71717A;font-family:monospace;">
                  ZINNIA 2026 &bull; Department of Computer Science and Engineering<br/>
                  Government College of Engineering, Erode &bull; Support: zinnia2026@gcee.ac.in
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


def send_master_qr_email(participant: Dict[str, Any]) -> Dict[str, Any]:
    """
    EMAIL #2 — the confirmation, sent ONLY from treasurer_review_payment() on
    APPROVE. This is the one and only release point for the registration code,
    the master QR entry pass and the WhatsApp group link; nothing earlier in
    the flow emits any of the three.

    Multipart/related so the QR travels as an inline CID image and renders in
    clients that strip remote images. Idempotency is deliberately NOT enforced
    here: re-approving is exactly how a participant re-sends themselves the ID
    they forgot to copy.
    """
    recipient = (participant.get("email") or "").strip()
    user_id = (participant.get("user_id") or "").strip().upper()
    name = participant.get("name") or "Participant"

    if not recipient or not user_id:
        return {"success": False, "status": "SKIPPED", "error": "Missing email or UserID."}

    if not SMTP_USER or not SMTP_PASS or SMTP_USER.startswith("your_"):
        message = f"SMTP is not configured. Master QR email was not sent to {recipient}."
        simulated = os.getenv("ALLOW_EMAIL_SIMULATION", "false").lower() == "true"
        print(f"[{'Email Sim' if simulated else 'SMTP Error'}] {message}")
        return {
            "success": False,
            "status": "SIMULATED_NOT_SENT" if simulated else "FAILED",
            "recipient": recipient,
            "error": message,
        }

    login_url = f"{APP_BASE_URL}/participant/login?user_id={user_id}"
    whatsapp_url = PARTICIPANTS_WHATSAPP_GROUP_URL

    # The QR content is the UserID and only the UserID.
    png_bytes = generate_qr_png_bytes(user_id)

    msg = MIMEMultipart("related")
    msg["Subject"] = f"Payment confirmed — your Zinnia 2026 UserID is {user_id}, master QR inside"
    msg["From"] = SMTP_FROM
    msg["To"] = recipient

    text_content = f"""
ZINNIA 2026 - PAYMENT CONFIRMED
Government College of Engineering, Erode

Hello {name},

Your payment has been verified and your registration is fully confirmed.

YOUR USERID: {user_id}
(This is how you log in, and how teammates add you to their team.)

Your master QR is attached to this email. Show it at the gate, at every
event desk and at the food counter. Scanning it reveals your UserID.

This QR is your pass for the whole day. It stays the same as you add
events - you will not be sent a new one. Save the attached PNG to your
phone. Your payment is verified, so this pass is active and will open
the gate.

Join the participants WhatsApp group:
{whatsapp_url}

Log in to your dashboard:
{login_url}

Nothing is left to do. If you have not picked all your events yet you
still can - the catalog stays open on your dashboard until each event
closes.
    """

    alt = MIMEMultipart("alternative")
    alt.attach(MIMEText(text_content, "plain", "utf-8"))
    alt.attach(
        MIMEText(
            generate_master_qr_email_html(name, user_id, login_url, whatsapp_url),
            "html",
            "utf-8",
        )
    )
    msg.attach(alt)

    qr_image = MIMEImage(png_bytes, "png")
    qr_image.add_header("Content-ID", "<master_qr>")
    qr_image.add_header("Content-Disposition", "inline", filename=f"zinnia2026-{user_id}.png")
    msg.attach(qr_image)

    # Same PNG again as a plain attachment. Inline CID images render in the
    # body but many clients do not list them for download; the attachment is
    # the copy that saves to the phone gallery and works at the gate offline.
    qr_file = MIMEImage(png_bytes, "png")
    qr_file.add_header(
        "Content-Disposition", "attachment", filename=f"zinnia2026-master-qr-{user_id}.png"
    )
    msg.attach(qr_file)

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASS)
                server.send_message(msg)
        print(f"[Email] Master QR sent to {recipient} for {user_id}")
        return {"success": True, "status": "SENT", "recipient": recipient}
    except Exception as e:
        print(f"[SMTP Error] Master QR email to {recipient} failed: {e}")
        return {"success": False, "status": "FAILED", "recipient": recipient, "error": str(e)}


def send_registration_complete_email(participant: Dict[str, Any]) -> bool:
    """
    EMAIL #1 — sent the moment the payment reference and screenshot are
    submitted. Registration is COMPLETE at that point: the account exists, the
    dashboard is open and all nine events are selectable straight away.

    Deliberately not a "pending verification, check your status" message. The
    only things still to come are the master QR and the WhatsApp group link,
    which the treasurer's approval releases in EMAIL #2
    (send_master_qr_email). Nothing here blocks the participant.

    This message CARRIES THE USERID, because the UserID is the participant's
    only login credential — login by email address was removed. Without it in
    this email they could not get back into the dashboard this email is sending
    them to. The master QR and the WhatsApp group link are still held back for
    EMAIL #2.
    """
    recipient = (participant.get("email") or "").strip()
    name = participant.get("name") or "Participant"
    user_id = (participant.get("user_id") or "").strip().upper()
    if not recipient:
        return False

    login_url = f"{APP_BASE_URL}/participant/login?user_id={user_id}"
    events_url = f"{APP_BASE_URL}/participant/dashboard"

    html = f"""
    <div style="font-family:Arial,sans-serif;background:#08090A;color:#EEEEEA;padding:24px;">
      <h2 style="color:#E5BD00;margin:0 0 8px 0;">You&#39;re registered for Zinnia 2026!</h2>
      <p style="color:#B8B8B2;">Hello {name}, your registration is complete and your payment
      reference has been recorded. Nothing else is needed from you to secure your place.</p>

      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#08090A;
      border:2px solid #E5BD00;border-radius:12px;text-align:center;margin:20px 0;">
        <tr><td style="padding:18px 16px;">
          <div style="font-size:11px;font-family:monospace;color:#B8B8B2;font-weight:700;
          letter-spacing:2px;text-transform:uppercase;">YOUR USERID</div>
          <div style="font-size:32px;font-family:monospace;font-weight:900;color:#E5BD00;
          letter-spacing:3px;margin-top:6px;">{user_id}</div>
          <div style="font-size:11px;color:#B8B8B2;margin-top:8px;line-height:1.5;">
            This is how you log in, and how teammates add you to their team.<br/>
            Keep this email &mdash; you need this ID to get back in.
          </div>
        </td></tr>
      </table>

      <p style="color:#B8B8B2;"><strong style="color:#EEEEEA;">Pick your events now.</strong>
      All nine events are open to you immediately &mdash; log in to browse the catalog, create or
      join teams, and register for the events you want. Popular events fill up, so it is worth
      doing this early.</p>

      <p style="margin:20px 0;">
        <a href="{events_url}" style="background:#0FA9C6;color:#08090A;font-weight:bold;
        text-decoration:none;padding:12px 22px;display:inline-block;">Choose your events</a>
      </p>

      <p style="color:#B8B8B2;">Log in any time with your UserID at
      <a href="{login_url}" style="color:#0FA9C6;font-weight:bold;">{APP_BASE_URL}/participant/login</a>.
      There is no password: we email a 6-digit code to this address to confirm it is you.</p>

      <p style="color:#71767B;font-size:13px;border-top:1px solid #23262D;padding-top:14px;
      margin-top:22px;">One thing still to come: once the treasurer confirms your payment we will
      email your master QR entry pass and the participants&#39; WhatsApp group link. Both will also
      appear on your dashboard. Until then you can carry on registering for events as normal.</p>
    </div>
    """

    text_content = f"""
ZINNIA 2026 - YOU'RE REGISTERED!
Government College of Engineering, Erode

Hello {name},

Your registration is complete and your payment reference has been recorded.
Nothing else is needed from you to secure your place.

YOUR USERID: {user_id}
(This is how you log in, and how teammates add you to their team. Keep this
email - you need this ID to get back in.)

PICK YOUR EVENTS NOW
All nine events are open to you immediately. Log in to browse the catalog,
create or join teams, and register for the events you want. Popular events
fill up, so it is worth doing this early.

Choose your events: {events_url}

Log in any time with your UserID at {APP_BASE_URL}/participant/login
There is no password: we email a 6-digit code to this address to confirm it
is you.

Still to come: once the treasurer confirms your payment we will email your
master QR entry pass and the participants' WhatsApp group link. Both will also
appear on your dashboard. Until then you can carry on registering for events
as normal.
    """

    return send_simple_email(
        to=recipient,
        subject="You're registered for Zinnia 2026 - pick your events now",
        html=html,
        text=text_content,
    )
