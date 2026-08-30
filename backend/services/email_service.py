"""
Zinnia 2026 — Email & QR Dispatch Service
Generates responsive HTML passport emails with embedded QR code badges,
registered events breakdown, and food token details.
"""

import os
import io
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import Dict, Any, List, Optional

# SMTP & App Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "") or os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "Zinnia 2026 <zinnia2026@gcee.ac.in>")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173").rstrip("/")

def generate_qr_base64(data: str) -> str:
    """Generate a Base64 encoded PNG of the QR code for embedding in HTML/Email."""
    try:
        import qrcode
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode("utf-8")
    except Exception as e:
        # Fallback to QuickChart QR API for reliability if qrcode package isn't loaded
        import urllib.parse
        encoded = urllib.parse.quote_plus(data)
        return f"https://quickchart.io/qr?text={encoded}&size=240&margin=2"

def generate_passport_email_html(
    member: Dict[str, Any],
    team: Dict[str, Any],
    registered_events: List[Dict[str, Any]],
    qr_data_or_url: str,
    passport_link: str
) -> str:
    """Creates a high-production, futuristic dark/cyber themed HTML email."""
    member_name = member.get("name", "Participant")
    member_id = member.get("id", "")
    team_id = team.get("team_id", "")
    team_name = team.get("team_name", "Team")
    college = team.get("college", "GCE Erode")
    is_leader = member.get("is_leader", False)
    
    # Generate event items HTML
    events_html = ""
    if registered_events:
        for ev in registered_events:
            ev_obj = ev.get("events") if isinstance(ev.get("events"), dict) else ev
            ev_title = ev_obj.get("mission_name") or ev_obj.get("title") or ev_obj.get("name") or "Symposium Event"
            ev_category = ev_obj.get("category", "General Track").upper()
            ev_venue = ev_obj.get("venue", "Main Campus Arena")
            ev_time = ev_obj.get("schedule_time", "Event Day — 10:00 AM")
            
            events_html += f"""
            <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 12px; font-weight: 600; color: #f8fafc;">
                    {ev_title}
                    <div style="font-size: 11px; color: #818cf8; font-weight: 400; margin-top: 2px;">{ev_category}</div>
                </td>
                <td style="padding: 12px; color: #cbd5e1; font-size: 13px;">{ev_venue}</td>
                <td style="padding: 12px; color: #38bdf8; font-size: 12px; font-family: monospace;">{ev_time}</td>
            </tr>
            """
    else:
        events_html = """
        <tr>
            <td colspan="3" style="padding: 14px; text-align: center; color: #94a3b8; font-size: 13px;">
                Registered for General Symposium Access
            </td>
        </tr>
        """

    # Format QR image src
    if qr_data_or_url.startswith("http"):
        qr_img_src = qr_data_or_url
    else:
        qr_img_src = f"data:image/png;base64,{qr_data_or_url}"

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zinnia 2026 Digital Passport</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 30px 10px;">
        <tr>
          <td align="center">
            <!-- Container -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 24px; text-align: center;">
                  <div style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #c7d2fe; font-weight: 700; margin-bottom: 6px;">
                    NATIONAL LEVEL SYMPOSIUM
                  </div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">
                    ZINNIA 2026
                  </h1>
                  <p style="margin: 6px 0 0 0; font-size: 14px; color: #e0e7ff;">
                    Official Digital Passport & Entrance Pass
                  </p>
                </td>
              </tr>

              <!-- Greeting & Badge -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #e2e8f0;">
                    Hello <strong style="color: #ffffff;">{member_name}</strong>,
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
                    Your registration for <strong>Zinnia 2026</strong> has been confirmed! Below is your official credential badge. Please present this QR code at the campus reception, event tracks, and refreshment counters.
                  </p>

                  <!-- Digital Pass Card -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; margin-bottom: 24px;">
                    <tr>
                      <td align="center" style="padding: 20px 16px; border-bottom: 1px solid #1e293b;">
                        <!-- QR Code -->
                        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                          <img src="{qr_img_src}" alt="Participant QR Code" width="160" height="160" style="display: block; border: 0;" />
                        </div>
                        <div style="margin-top: 10px; font-family: monospace; font-size: 14px; font-weight: 700; color: #818cf8; letter-spacing: 1px;">
                          {member_id}
                        </div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                          Token: {member.get('passport_token', '')[:12]}...
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px;">
                          <tr>
                            <td style="color: #94a3b8; width: 40%;">Participant:</td>
                            <td style="color: #f8fafc; font-weight: 600;">{member_name} {'(Leader)' if is_leader else ''}</td>
                          </tr>
                          <tr>
                            <td style="color: #94a3b8;">Team ID / Name:</td>
                            <td style="color: #38bdf8; font-family: monospace;">{team_id} &bull; {team_name}</td>
                          </tr>
                          <tr>
                            <td style="color: #94a3b8;">Institution:</td>
                            <td style="color: #f8fafc;">{college}</td>
                          </tr>
                          <tr>
                            <td style="color: #94a3b8;">Food Clearance:</td>
                            <td style="color: #10b981; font-weight: 600;">&#10004; Lunch & Refreshment Token Included</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Registered Events -->
                  <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #6366f1; padding-left: 8px;">
                    Enrolled Events & Schedule
                  </h3>
                  
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; margin-bottom: 24px; font-size: 13px;">
                    <thead>
                      <tr style="background-color: #1e293b; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                        <th align="left" style="padding: 10px 12px;">Event Track</th>
                        <th align="left" style="padding: 10px 12px;">Venue</th>
                        <th align="left" style="padding: 10px 12px;">Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events_html}
                    </tbody>
                  </table>

                  <!-- Instructions & Actions -->
                  <div style="background-color: #1e1b4b; border: 1px solid #3730a3; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <div style="font-weight: 600; color: #a5b4fc; font-size: 13px; margin-bottom: 4px;">
                      &#128073; Important Venue Instructions:
                    </div>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #cbd5e1; line-height: 1.6;">
                      <li>Keep this email handy or save the QR code to your phone gallery.</li>
                      <li>Scan your QR pass at the main campus reception gate to mark attendance.</li>
                      <li>Proceed directly to your event venue 15 minutes before the scheduled time.</li>
                      <li>Show your QR pass at the dining hall to claim lunch.</li>
                    </ul>
                  </div>

                  <!-- Direct Pass Button -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                    <tr>
                      <td align="center">
                        <a href="{passport_link}" target="_blank" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">
                          Open Live Digital Pass &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 24px; background-color: #080d1a; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
                  <div>Zinnia 2026 Organizing Committee &bull; Government College of Engineering, Erode</div>
                  <div style="margin-top: 4px;">This is an automated credential notification. Please do not share your QR code.</div>
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
    app_base_url: str = APP_BASE_URL
) -> Dict[str, Any]:
    """
    Constructs and sends the passport email with QR pass to a single participant.
    Falls back gracefully to logging if SMTP credentials are not configured.
    """
    recipient_email = member.get("email", "").strip()
    recipient_name = member.get("name", "Participant")
    member_id = member.get("id", "")
    token = member.get("passport_token", member_id)
    
    if not recipient_email:
        return {"success": False, "error": "No email address found for participant."}

    # QR payload and live passport link
    passport_link = f"{app_base_url}/passport?token={token}"
    qr_base64_data = generate_qr_base64(token)

    html_content = generate_passport_email_html(
        member=member,
        team=team,
        registered_events=registered_events,
        qr_data_or_url=qr_base64_data,
        passport_link=passport_link
    )

    # Check if SMTP is configured
    if not SMTP_USER or not SMTP_PASS:
        print(f"[Email Service Notice] SMTP not configured. Simulated pass dispatch to {recipient_name} <{recipient_email}> for Member {member_id}.")
        return {
            "success": True,
            "status": "SIMULATED",
            "recipient": recipient_email,
            "passport_link": passport_link,
            "message": "Email generated successfully (Simulated mode: Set SMTP_USER & SMTP_PASS to send live emails)."
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🎟️ Your Official Pass & QR Code — Zinnia 2026 [{member_id}]"
        msg["From"] = SMTP_FROM
        msg["To"] = recipient_email

        # Attach text fallback
        text_content = f"Hello {recipient_name},\n\nYour Zinnia 2026 registration is confirmed!\nTeam: {team.get('team_name')} ({team.get('team_id')})\nMember ID: {member_id}\n\nAccess your digital passport and QR pass here:\n{passport_link}\n\nSee you at the symposium!"
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Send via SMTP
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        server.ehlo()
        if SMTP_PORT == 587:
            server.starttls()
            server.ehlo()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_FROM, [recipient_email], msg.as_string())
        server.quit()

        print(f"[Email Service] Successfully sent pass to {recipient_name} <{recipient_email}>.")
        return {
            "success": True,
            "status": "SENT",
            "recipient": recipient_email,
            "passport_link": passport_link
        }
    except Exception as e:
        print(f"[Email Service Error] Failed to send email to {recipient_email}: {e}")
        return {
            "success": False,
            "status": "FAILED",
            "error": str(e),
            "recipient": recipient_email
        }
