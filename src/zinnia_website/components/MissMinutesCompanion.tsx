import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, 
  X, 
  Clock, 
  MessageSquare
} from 'lucide-react';
import { audioManager } from '../core/AudioManager';
import { sendChatMessage, fetchSuggestedFaqs, SuggestedFaq } from '../../services/aiChat';

export type MissMinutesPose = 'idle' | 'waving' | 'thinking' | 'excited' | 'pointing' | 'walking';

interface Message {
  id: string;
  sender: 'miss-minutes' | 'user';
  text: string;
  timestamp: string;
  source?: string;
}

// Local offline RAG Knowledge Engine
const SYMPOSIUM_KNOWLEDGE: Record<string, string> = {
  events: "Oh honey, you're looking for the battlegrounds? We've got 9 active missions on this timeline!\n\n**Technical Events:**\n1. **Operation: System Recovery** (Debugging)\n2. **Operation: ORACLE** (AI & Prompt Engineering)\n3. **Operation: Broken Records** (SQL Recovery)\n4. **Infinity Protocol** (Solo Coding Anomaly)\n5. **Algorithm Overdrive** (Competitive DSA)\n\n**Non-Technical Events:**\n6. **Chamber of Enigmas** (Cipher Escape & Riddles)\n7. **Paper Syndicate** (Research Presentation)\n8. **Pixel Heist** (UI/UX Design Sprint)\n9. **Neural Clash** (Campus Strategy & Gaming)",
  venue: "ZINNIA '26 is hosted at the **Government College of Engineering, Erode** (Department of Computer Science & Engineering), Perundurai, Erode, Tamil Nadu 638053.",
  prizes: "The total prize pool across all 9 battlegrounds exceeds **₹25,000+** in grand cash awards, alongside Anna University verified merit certificates and CHRONOS digital badges!",
  fee: "Registration fee is standard at ₹250 per participant which grants access to technical events, symposium kits, food, and verified certificates!",
  date: "Mark your timeline! ZINNIA 2026 takes place on **September 17, 2026** at GCE Erode.",
  rules: "Participants must bring their college ID card. Individual and team participation (1-3 members) are supported depending on the mission clearance level."
};

function getLocalRagAnswer(query: string): string | null {
  const q = query.toLowerCase();
  if (q.includes('event') || q.includes('battleground') || q.includes('competition') || q.includes('what events')) {
    return SYMPOSIUM_KNOWLEDGE.events;
  }
  if (q.includes('venue') || q.includes('where') || q.includes('location') || q.includes('college')) {
    return SYMPOSIUM_KNOWLEDGE.venue;
  }
  if (q.includes('prize') || q.includes('cash') || q.includes('reward') || q.includes('money')) {
    return SYMPOSIUM_KNOWLEDGE.prizes;
  }
  if (q.includes('fee') || q.includes('cost') || q.includes('price') || q.includes('pay') || q.includes('how much')) {
    return SYMPOSIUM_KNOWLEDGE.fee;
  }
  if (q.includes('date') || q.includes('when') || q.includes('time') || q.includes('schedule')) {
    return SYMPOSIUM_KNOWLEDGE.date;
  }
  if (q.includes('rule') || q.includes('eligib') || q.includes('allow') || q.includes('team')) {
    return SYMPOSIUM_KNOWLEDGE.rules;
  }
  return null;
}

export const MissMinutesCompanion: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pose, setPose] = useState<MissMinutesPose>('idle');
  const [isBlinking, setIsBlinking] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [bodyTilt, setBodyTilt] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string>("Hey y'all! Need help?");
  const [showBubble, setShowBubble] = useState(true);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'mm-welcome',
      sender: 'miss-minutes',
      text: "Hey y'all! I'm **Miss Minutes**, and it's my job to catch y'all up before you dive into the ZINNIA '26 timeline!\n\nAsk me anything about events, rules, registration, prizes, or the venue.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFaqs, setSuggestedFaqs] = useState<SuggestedFaq[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const companionRef = useRef<HTMLDivElement>(null);

  // Initial FAQs
  useEffect(() => {
    fetchSuggestedFaqs().then((faqs) => {
      if (faqs && faqs.length > 0) setSuggestedFaqs(faqs.slice(0, 4));
    });
  }, []);

  // Periodic Blink
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 3800 + Math.random() * 2500);

    return () => clearInterval(blinkTimer);
  }, []);

  // Randomized idle actions & poses
  useEffect(() => {
    if (isOpen || isLoading) return;
    const idleTimer = setInterval(() => {
      const poses: MissMinutesPose[] = ['idle', 'waving', 'excited'];
      const nextPose = poses[Math.floor(Math.random() * poses.length)];
      setPose(nextPose);

      if (nextPose === 'waving') {
        setTimeout(() => setPose('idle'), 2500);
      }
    }, 7000);

    return () => clearInterval(idleTimer);
  }, [isOpen, isLoading]);

  // Contextual speech updates
  useEffect(() => {
    const bubbleTimer = setInterval(() => {
      if (isOpen) return;
      const bubbles = [
        "Hey y'all! Need help?",
        "Ask me about the 9 events!",
        "₹25,000+ Prize Pool!",
        "TVA Timeline Guide here!",
        "Click me to chat!"
      ];
      setSpeechBubble(bubbles[Math.floor(Math.random() * bubbles.length)]);
      setShowBubble(true);
    }, 9000);

    return () => clearInterval(bubbleTimer);
  }, [isOpen]);

  // Scroll reaction (triggers walking/floating leg movement)
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsWalking(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsWalking(false), 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Cursor Proximity & Eye Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!companionRef.current) return;
      const rect = companionRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Max eye pupil travel
      const maxDist = 4.5;
      const angle = Math.atan2(dy, dx);
      const intensity = Math.min(dist / 350, 1);

      setPupilOffset({
        x: Math.cos(angle) * maxDist * intensity,
        y: Math.sin(angle) * maxDist * intensity,
      });

      // Subtle body tilt toward mouse
      const tilt = Math.max(-6, Math.min(6, (dx / 300) * 6));
      setBodyTilt(tilt);

      // Wave if cursor is close
      if (dist < 160 && !isOpen && pose !== 'waving' && pose !== 'thinking' && !isLoading) {
        setPose('waving');
        setSpeechBubble("Hey there, sugar!");
        setShowBubble(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen, pose, isLoading]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Send
  const handleSend = async (customQuery?: string) => {
    const q = customQuery || inputQuery;
    if (!q.trim() || isLoading) return;

    audioManager.playTimelineTick();
    setPose('thinking');
    setIsTalking(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputQuery('');
    setIsLoading(true);

    try {
      let replyText = '';
      const localAnswer = getLocalRagAnswer(q.trim());
      
      if (localAnswer) {
        await new Promise((r) => setTimeout(r, 650));
        replyText = localAnswer;
      } else {
        const res = await sendChatMessage(q.trim());
        if (res.answer && !res.answer.includes('Network connection issue')) {
          replyText = res.answer;
        } else {
          replyText = "Golly, that timeline record is classified or unavailable! Ask me about the **9 battlegrounds**, **₹25,000+ prize pool**, **GCE Erode venue**, or **registration process**!";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `mm-${Date.now()}`,
          sender: 'miss-minutes',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'TVA_TIMELINE_DB'
        }
      ]);
      setPose('excited');
      setTimeout(() => setPose('idle'), 3000);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `mm-${Date.now()}`,
          sender: 'miss-minutes',
          text: "Don't fret, sugar! You can reach out directly to the coordinators or check the 9 events on our official timeline!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
      setPose('idle');
    } finally {
      setIsLoading(false);
      setIsTalking(false);
    }
  };

  const toggleOpen = () => {
    audioManager.playNodeEngage();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowBubble(false);
      setPose('waving');
      setTimeout(() => setPose('idle'), 2000);
    } else {
      setPose('idle');
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* =========================================================================
          MISS MINUTES FULLY ARTICULATED INTERACTIVE CHARACTER (Fixed to Viewport Corner)
          ========================================================================= */}
      <div
        ref={companionRef}
        className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 flex items-center justify-end z-[99998] select-none pointer-events-auto"
      >
        {/* Floating Contextual Speech Balloon */}
        {showBubble && !isOpen && (
          <div 
            onClick={toggleOpen}
            className="absolute -top-14 right-20 sm:right-28 whitespace-nowrap bg-[#FF8C00] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3.5px_3.5px_0px_#8A5500] px-3.5 py-1.5 font-comic text-xs sm:text-sm tracking-wide font-extrabold rotate-2 sticker-pop cursor-pointer z-[9999] animate-bounce"
          >
            <span>{speechBubble}</span>
            {/* Speech Tail */}
            <div className="absolute -bottom-2 right-4 w-3 h-3 bg-[#FF8C00] border-r-[2.5px] border-b-[2.5px] border-[#0D0D0F] rotate-45" />
          </div>
        )}

        {/* Miss Minutes Full-Body Interactive Character */}
        <div
          onClick={toggleOpen}
          onMouseEnter={() => {
            setPose('waving');
            setSpeechBubble("Ask me anything, sugar!");
            setShowBubble(true);
          }}
          onMouseLeave={() => {
            if (!isOpen && pose === 'waving') setPose('idle');
          }}
          className="group relative cursor-pointer flex items-center gap-2 select-none"
        >
          {/* Ambient Warm Glow */}
          <div className="absolute -inset-2 bg-[radial-gradient(circle,_rgba(255,140,0,0.3)_0%,_transparent_70%)] rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-300" />

          {/* Articulated SVG Vector Character */}
          <div 
            style={{ transform: `rotate(${bodyTilt}deg)` }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 transition-transform duration-150 ease-out will-change-transform group-hover:scale-105"
          >
            <svg
              viewBox="0 0 160 170"
              className="w-full h-full overflow-visible drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
            >
              <defs>
                {/* 3D Body Gradient */}
                <radialGradient id="clockBevel" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#FFA726" />
                  <stop offset="70%" stopColor="#FF7A00" />
                  <stop offset="100%" stopColor="#E65100" />
                </radialGradient>
                <linearGradient id="rimShub" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D84315" />
                  <stop offset="100%" stopColor="#8A2300" />
                </linearGradient>
              </defs>

              {/* ==================== LEGS & SHOES ==================== */}
              {/* Left Leg */}
              <g className={`origin-[68px_110px] ${isWalking ? 'animate-[spin_0.8s_ease-in-out_infinite_alternate]' : ''}`}>
                <line
                  x1="68"
                  y1="110"
                  x2="66"
                  y2="142"
                  stroke="#0D0D0F"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Left White Shoe */}
                <path
                  d="M 52 144 C 52 138, 62 136, 70 138 C 76 140, 78 148, 76 153 C 74 156, 52 156, 52 144 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <ellipse cx="64" cy="144" rx="4" ry="2" fill="#0D0D0F" opacity="0.3" />
              </g>

              {/* Right Leg */}
              <g className={`origin-[92px_110px] ${isWalking ? 'animate-[spin_0.8s_ease-in-out_infinite_alternate-reverse]' : ''}`}>
                <line
                  x1="92"
                  y1="110"
                  x2="94"
                  y2="142"
                  stroke="#0D0D0F"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Right White Shoe */}
                <path
                  d="M 86 144 C 86 138, 96 136, 104 138 C 110 140, 112 148, 110 153 C 108 156, 86 156, 86 144 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <ellipse cx="98" cy="144" rx="4" ry="2" fill="#0D0D0F" opacity="0.3" />
              </g>

              {/* ==================== 3D CLOCK BODY ==================== */}
              {/* 3D Right Side Bevel Rim */}
              <ellipse
                cx="84"
                cy="68"
                rx="49"
                ry="49"
                fill="url(#rimShub)"
                stroke="#0D0D0F"
                strokeWidth="4"
              />

              {/* Main Clock Face */}
              <ellipse
                cx="80"
                cy="66"
                rx="47"
                ry="47"
                fill="url(#clockBevel)"
                stroke="#0D0D0F"
                strokeWidth="4.5"
              />

              {/* Clock Tick Marks */}
              {/* 12 o'clock */}
              <line x1="80" y1="23" x2="80" y2="32" stroke="#0D0D0F" strokeWidth="4" strokeLinecap="round" />
              {/* 3 o'clock */}
              <line x1="123" y1="66" x2="114" y2="66" stroke="#0D0D0F" strokeWidth="4" strokeLinecap="round" />
              {/* 6 o'clock */}
              <line x1="80" y1="109" x2="80" y2="100" stroke="#0D0D0F" strokeWidth="4" strokeLinecap="round" />
              {/* 9 o'clock */}
              <line x1="37" y1="66" x2="46" y2="66" stroke="#0D0D0F" strokeWidth="4" strokeLinecap="round" />
              {/* Hour dashes */}
              <line x1="101" y1="28" x2="97" y2="35" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="118" y1="45" x2="111" y2="49" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="118" y1="87" x2="111" y2="83" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="101" y1="104" x2="97" y2="97" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="104" x2="63" y2="97" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="87" x2="49" y2="83" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="45" x2="49" y2="49" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="28" x2="63" y2="35" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />

              {/* Nose Center Dot */}
              <circle cx="80" cy="62" r="4" fill="#0D0D0F" />

              {/* ==================== EYES ==================== */}
              {/* Left Eye */}
              <ellipse
                cx="64"
                cy="52"
                rx="9"
                ry={isBlinking ? 1.5 : 12}
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
              />
              {!isBlinking && (
                <ellipse
                  cx={64 + pupilOffset.x}
                  cy={52 + pupilOffset.y}
                  rx="4.8"
                  ry="7.5"
                  fill="#0D0D0F"
                >
                  <circle cx={62 + pupilOffset.x} cy={49 + pupilOffset.y} r="1.8" fill="#FFFEEF" />
                </ellipse>
              )}
              {/* Left 3 Eyelashes */}
              <path d="M 58 40 L 53 34 M 64 39 L 64 32 M 70 41 L 74 35" stroke="#0D0D0F" strokeWidth="3" strokeLinecap="round" />

              {/* Right Eye */}
              <ellipse
                cx="96"
                cy="52"
                rx="9"
                ry={isBlinking ? 1.5 : 12}
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
              />
              {!isBlinking && (
                <ellipse
                  cx={96 + pupilOffset.x}
                  cy={52 + pupilOffset.y}
                  rx="4.8"
                  ry="7.5"
                  fill="#0D0D0F"
                >
                  <circle cx={94 + pupilOffset.x} cy={49 + pupilOffset.y} r="1.8" fill="#FFFEEF" />
                </ellipse>
              )}
              {/* Right 3 Eyelashes */}
              <path d="M 90 41 L 86 35 M 96 39 L 96 32 M 102 40 L 107 34" stroke="#0D0D0F" strokeWidth="3" strokeLinecap="round" />

              {/* ==================== MOUTH ==================== */}
              {pose === 'thinking' && (
                <ellipse cx="80" cy="80" rx="5" ry="4" fill="#0D0D0F" />
              )}
              {(pose === 'excited' || isTalking) && (
                <path
                  d="M 64 74 Q 80 96 96 74 Z"
                  fill="#D50000"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              )}
              {(pose === 'idle' || pose === 'waving') && !isTalking && (
                <path
                  d="M 66 74 Q 80 88 94 74"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              )}

              {/* Rosy Cheeks */}
              <circle cx="51" cy="66" r="5" fill="#E64A19" opacity="0.4" />
              <circle cx="109" cy="66" r="5" fill="#E64A19" opacity="0.4" />

              {/* ==================== ARMS & WHITE GLOVES ==================== */}
              {/* LEFT ARM */}
              {pose === 'waving' ? (
                /* Waving Left Hand */
                <g className="origin-[35px_65px] animate-[wiggle_0.6s_ease-in-out_infinite_alternate]">
                  <path
                    d="M 36 68 Q 20 48 24 32"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 36 68 Q 20 48 24 32"
                    fill="none"
                    stroke="#0D0D0F"
                    strokeWidth="11"
                    strokeLinecap="round"
                    style={{ zIndex: -1 }}
                  />
                  {/* Waving White Glove */}
                  <g transform="translate(14, 18)">
                    <path
                      d="M 12 18 C 8 12, 14 6, 20 8 C 24 6, 28 10, 26 16 C 24 22, 16 24, 12 18 Z"
                      fill="#FFFEEF"
                      stroke="#0D0D0F"
                      strokeWidth="3"
                    />
                    <circle cx="16" cy="12" r="2" fill="#FF7A00" />
                  </g>
                </g>
              ) : pose === 'thinking' ? (
                /* Thinking Left Hand touching chin */
                <g>
                  <path
                    d="M 36 70 Q 38 90 62 82"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <circle cx="62" cy="82" r="6" fill="#FFFEEF" stroke="#0D0D0F" strokeWidth="3" />
                </g>
              ) : (
                /* Default Left Hand On Hip (Akimbo) */
                <g className="transition-transform duration-200">
                  <path
                    d="M 36 64 C 18 68, 16 85, 34 94"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />
                  {/* White Gloved Hand on Hip */}
                  <path
                    d="M 32 90 C 28 86, 36 82, 40 88 C 42 92, 38 98, 32 96 Z"
                    fill="#FFFEEF"
                    stroke="#0D0D0F"
                    strokeWidth="3"
                  />
                </g>
              )}

              {/* RIGHT ARM */}
              {pose === 'excited' ? (
                /* Cheerful Raised Right Arm */
                <g className="origin-[125px_65px] animate-[wiggle_0.5s_ease-in-out_infinite_alternate]">
                  <path
                    d="M 124 68 Q 140 48 136 32"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Right White Glove Up */}
                  <circle cx="136" cy="28" r="7" fill="#FFFEEF" stroke="#0D0D0F" strokeWidth="3" />
                </g>
              ) : (
                /* Default Right Hand On Hip (Akimbo) */
                <g className="transition-transform duration-200">
                  <path
                    d="M 124 64 C 142 68, 144 85, 126 94"
                    fill="none"
                    stroke="#FF7A00"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                  />
                  {/* White Gloved Hand on Hip */}
                  <path
                    d="M 128 90 C 132 86, 124 82, 120 88 C 118 92, 122 98, 128 96 Z"
                    fill="#FFFEEF"
                    stroke="#0D0D0F"
                    strokeWidth="3"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Side Comic Badge / Talk Prompt */}
          <div className="flex flex-col items-start gap-1">
            <div className="px-3 py-1 bg-[#1A1A1D] border-[2px] border-[#FF8C00] shadow-[3px_3px_0px_#8A5500] group-hover:bg-[#FF8C00] group-hover:text-[#0D0D0F] transition-colors -rotate-2">
              <span className="font-display text-xs sm:text-sm text-[#FF8C00] group-hover:text-[#0D0D0F] tracking-wide block uppercase">
                MISS MINUTES
              </span>
            </div>
            <div className="px-2 py-0.5 bg-[#FF8C00] text-[#0D0D0F] border border-[#0D0D0F] shadow-[2px_2px_0px_#8A5500] font-bungee text-[8px] sm:text-[9px] uppercase tracking-wider rotate-1">
              {isOpen ? 'CLOSE ✕' : 'TALK TO ME 💬'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TVA CONVERSATIONAL AI ASSISTANT DIALOG PANEL
          ========================================================================= */}
      {isOpen && (
        <div className="fixed bottom-24 sm:bottom-28 right-3 sm:right-6 w-[94vw] max-w-[420px] max-h-[78vh] sm:max-h-[580px] bg-[#141417] border-[3.5px] border-[#FF8C00] shadow-[0_0_40px_rgba(255,140,0,0.25),_8px_8px_0px_#000000] z-[99999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-[#FF8C00] text-[#0D0D0F] p-3 sm:p-3.5 border-b-[3px] border-[#0D0D0F] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0D0D0F] border border-[#FF8C00] flex items-center justify-center font-display text-base text-[#FFA726]">
                ⏰
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg uppercase tracking-wide leading-none">
                  MISS MINUTES AI CORE
                </h3>
                <span className="font-mono text-[9px] uppercase font-black tracking-widest text-[#5A3000] block mt-0.5">
                  TVA TEMPORAL PROTOCOL &bull; ACTIVE
                </span>
              </div>
            </div>

            <button
              onClick={toggleOpen}
              className="p-1 hover:bg-[#0D0D0F] hover:text-[#FF8C00] border-[1.5px] border-[#0D0D0F] transition-colors cursor-pointer text-[#0D0D0F]"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Suggested Queries Chips */}
          <div className="p-2.5 bg-[#1A1A1D] border-b border-[#3A3A3E] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend("What events are available?")}
              className="whitespace-nowrap px-2.5 py-1 bg-[#26262B] hover:bg-[#FF8C00] hover:text-[#0D0D0F] border border-[#FF8C00]/60 text-[10px] font-mono text-[#FF8C00] font-bold transition-colors cursor-pointer"
            >
              ⚡ 9 BATTLEGROUNDS
            </button>
            <button
              onClick={() => handleSend("Where is the venue?")}
              className="whitespace-nowrap px-2.5 py-1 bg-[#26262B] hover:bg-[#3CE7FF] hover:text-[#0D0D0F] border border-[#3CE7FF]/60 text-[10px] font-mono text-[#3CE7FF] font-bold transition-colors cursor-pointer"
            >
              🏛️ VENUE
            </button>
            <button
              onClick={() => handleSend("What is the prize pool?")}
              className="whitespace-nowrap px-2.5 py-1 bg-[#26262B] hover:bg-[#FF3366] hover:text-[#FFFFFF] border border-[#FF3366]/60 text-[10px] font-mono text-[#FF3366] font-bold transition-colors cursor-pointer"
            >
              🏆 ₹25,000+ PRIZES
            </button>
            <button
              onClick={() => handleSend("What is the registration fee?")}
              className="whitespace-nowrap px-2.5 py-1 bg-[#26262B] hover:bg-[#F5D90A] hover:text-[#0D0D0F] border border-[#F5D90A]/60 text-[10px] font-mono text-[#F5D90A] font-bold transition-colors cursor-pointer"
            >
              🎟️ REGISTRATION
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 bg-[#0F0F12]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-xs sm:text-sm font-comic leading-relaxed border-[2px] ${
                    msg.sender === 'user'
                      ? 'bg-[#FF8C00] text-[#0D0D0F] border-[#FF8C00] shadow-[3px_3px_0px_#8A5500] font-bold'
                      : 'bg-[#1A1A1D] text-[#F2F2F0] border-[#3A3A3E] shadow-[3px_3px_0px_#000000]'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                </div>
                <span className="text-[8px] font-mono text-[#A8A8AC] mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Loading / Searching Timeline Status */}
            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 bg-[#1A1A1D] border border-[#FF8C00] text-[#FF8C00] text-xs font-mono max-w-[80%] animate-pulse shadow-[2px_2px_0px_#8A5500]">
                <Clock className="w-4 h-4 animate-spin" />
                <span className="font-bold">CONSULTING TVA DATABASE...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 sm:p-3 bg-[#1A1A1D] border-t-[2px] border-[#3A3A3E] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Miss Minutes anything..."
              className="flex-1 bg-[#0F0F12] border-[1.5px] border-[#3A3A3E] focus:border-[#FF8C00] text-xs sm:text-sm text-[#F2F2F0] px-3 py-2 outline-none font-comic placeholder:text-[#A8A8AC]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 bg-[#FF8C00] hover:bg-[#F5D90A] disabled:opacity-50 text-[#0D0D0F] border-[1.5px] border-[#0D0D0F] shadow-[2px_2px_0px_#8A5500] font-display text-xs tracking-wider uppercase cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>,
    document.body
  );
};

export default MissMinutesCompanion;
