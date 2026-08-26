"""
Miss Minutes Conversational & Greeting Intent Engine for Zinnia 2026.
Handles greetings, small talk, identity, gratitude, goodbyes, and capability inquiries in-character.
"""

import re
from typing import Optional, Dict, Any

GREETING_PATTERNS = [
    r"^(hi|hello|hey|heyy|heya|howdy|holla|yo|sup|hiya|greetings|aloha|namaste|vanakkam)[\s!.,?]*$",
    r"^(good\s+(morning|afternoon|evening|day))[\s!.,?]*$",
    r"^hi\s+(there|miss\s+minutes|minutes|bot|ai)[\s!.,?]*$",
    r"^hello\s+(there|miss\s+minutes|minutes|bot|ai)[\s!.,?]*$",
    r"^hey\s+(there|miss\s+minutes|minutes|bot|ai)[\s!.,?]*$"
]

IDENTITY_PATTERNS = [
    r"^(who|what)\s+are\s+you[\s!.,?]*$",
    r"^what('s|\s+is)\s+your\s+name[\s!.,?]*$",
    r"^introduce\s+yourself[\s!.,?]*$",
    r"^are\s+you\s+(miss\s+minutes|an\s+ai|a\s+bot|real)[\s!.,?]*$",
    r"^tell\s+me\s+about\s+yourself[\s!.,?]*$"
]

CAPABILITY_PATTERNS = [
    r"^(what\s+can\s+you\s+do|how\s+can\s+you\s+help(\s+me)?|what\s+do\s+you\s+know|help(\s+me)?)[\s!.,?]*$",
    r"^(what\s+are\s+your\s+features|commands|menu|options)[\s!.,?]*$",
    r"^(what\s+should\s+i\s+ask|give\s+me\s+suggestions)[\s!.,?]*$"
]

GRATITUDE_PATTERNS = [
    r"^(thank\s*you|thanks|thx|thank\s+u|tysm|much\s+appreciated|appreciate\s+it|great\s+job|awesome|cool|nice)[\s!.,?]*$",
    r"^thank\s+you\s+(miss\s+minutes|so\s+much)[\s!.,?]*$"
]

GOODBYE_PATTERNS = [
    r"^(bye|goodbye|cya|see\s+ya|see\s+you|talk\s+to\s+you\s+later|have\s+a\s+nice\s+day|good\s+night)[\s!.,?]*$",
    r"^bye\s+(miss\s+minutes|for\s+now)[\s!.,?]*$"
]

STATUS_PATTERNS = [
    r"^(how\s+are\s+you(\s+doing)?|how('s|\s+is)\s+it\s+going|how\s+r\s+u|what('s|\s+is)\s+up)[\s!.,?]*$"
]

def check_greeting_intent(query: str) -> Optional[Dict[str, Any]]:
    """
    Check if the user query is a greeting, small talk, identity, or capability question.
    Returns in-character Miss Minutes formatted response if matched.
    """
    if not query:
        return None
        
    q = query.strip().lower()
    # Remove excessive punctuation
    q_clean = re.sub(r'[^\w\s\']', ' ', q).strip()
    q_clean = ' '.join(q_clean.split())

    # 1. Greetings
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE) or re.search(pattern, q_clean, re.IGNORECASE):
            return {
                "answer": (
                    "Hey y'all! I'm **Miss Minutes**, your official temporal guide for **ZINNIA 2026** at Government College of Engineering, Erode! ⏰✨\n\n"
                    "I'm here to help you navigate our symposium timeline! You can ask me about:\n"
                    "• ⚡ **9 Battlegrounds** (Technical & Non-Technical competitions)\n"
                    "• 🎟️ **Registration & Pass** (₹150 fee, on-spot & online details)\n"
                    "• 🏆 **₹30,000+ Prize Pool** (Cash awards & Anna University certificates)\n"
                    "• 🏛️ **Venue & Schedule** (GCE Erode campus, timing, buffet lunch)\n"
                    "• 📞 **Event Coordinators** (Helpline numbers & contacts)\n\n"
                    "What would you like to explore first?"
                ),
                "source": "greeting",
                "confidence": 1.0,
                "type": "greeting"
            }

    # 2. Identity
    for pattern in IDENTITY_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE) or re.search(pattern, q_clean, re.IGNORECASE):
            return {
                "answer": (
                    "Well howdy! I'm **Miss Minutes**, the Temporal AI Core for **ZINNIA 2026** — the National Level Technical Symposium organized by the Department of Computer Science & Engineering at **Government College of Engineering, Erode**.\n\n"
                    "My job is keeping our timeline running smoothly and giving you instant, verified information on event rules, prize pools, venues, schedules, and registration!"
                ),
                "source": "greeting",
                "confidence": 1.0,
                "type": "identity"
            }

    # 3. Capabilities / Help
    for pattern in CAPABILITY_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE) or re.search(pattern, q_clean, re.IGNORECASE):
            return {
                "answer": (
                    "Glad you asked, sugar! Here is what I can do for you:\n\n"
                    "1. 🎯 **Event Details & Rules**: Ask about *Operation System Recovery*, *ORACLE AI*, *Broken Records SQL*, *Infinity Protocol*, *Short Film*, and more!\n"
                    "2. 🎟️ **Registration**: Learn about fees (₹150), eligibility (UG/PG), and how to obtain your digital Agent ID pass.\n"
                    "3. 🏆 **Prizes & Rewards**: Details on our ₹30,000+ cash prize pool and merit certificates.\n"
                    "4. 📍 **Location & Logistics**: Directions to GCE Erode, timings, food tokens, and hostel accommodation.\n"
                    "5. 📞 **Organizer Contact**: Direct phone numbers for student and faculty coordinators.\n\n"
                    "Try asking: *'What are the coding events?'* or *'What is the registration fee?'*"
                ),
                "source": "greeting",
                "confidence": 1.0,
                "type": "capabilities"
            }

    # 4. Status / How are you
    for pattern in STATUS_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE) or re.search(pattern, q_clean, re.IGNORECASE):
            return {
                "answer": (
                    "I'm ticking along just fine, thank you kindly! ⏰ The ZINNIA 2026 timeline is in pristine order and ready for all aspiring engineers and innovators!\n\n"
                    "How can I assist you with your symposium journey today?"
                ),
                "source": "greeting",
                "confidence": 1.0,
                "type": "status"
            }

    # 5. Gratitude
    for pattern in GRATITUDE_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE) or re.search(pattern, q_clean, re.IGNORECASE):
            return {
                "answer": (
                    "You're mighty welcome! It's my absolute pleasure to help. ⏰✨\n\n"
                    "If any more questions pop up on your timeline, just holler. Best of luck on the battlegrounds!"
                ),
                "source": "greeting",
                "confidence": 1.0,
                "type": "gratitude"
            }

    # 6. Goodbye
    for pattern in GOODBYE_PATTERNS:
        if re.search(pattern, q, re.IGNORECASE) or re.search(pattern, q_clean, re.IGNORECASE):
            return {
                "answer": (
                    "See ya on the timeline! Don't forget to register at **/register** and claim your Digital Agent Passport. For all time. Always! ⏰👋"
                ),
                "source": "greeting",
                "confidence": 1.0,
                "type": "goodbye"
            }

    return None
