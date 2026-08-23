import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  Clock, 
  HelpCircle,
  ChevronRight,
  Database
} from 'lucide-react';
import { audioManager } from '../core/AudioManager';
import { sendChatMessage, fetchSuggestedFaqs, SuggestedFaq } from '../../services/aiChat';

export type MissMinutesExpression = 
  | 'idle' 
  | 'curious' 
  | 'excited' 
  | 'surprised' 
  | 'thinking' 
  | 'confused' 
  | 'happy';

interface Message {
  id: string;
  sender: 'miss-minutes' | 'user';
  text: string;
  timestamp: string;
  source?: string;
}

// Local offline RAG Knowledge Engine (Ensures accurate answers even if backend server is offline)
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
  const [expression, setExpression] = useState<MissMinutesExpression>('idle');
  const [isBlinking, setIsBlinking] = useState(false);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [speechBubble, setSpeechBubble] = useState<string | null>("Hey y'all! Need help?");
  const [bubbleVisible, setBubbleVisible] = useState(true);

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

  // Periodic Blink Animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4200 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Randomized Idle Expressions
  useEffect(() => {
    if (isOpen) return;
    const expressionInterval = setInterval(() => {
      const expressions: MissMinutesExpression[] = ['idle', 'curious', 'happy', 'excited'];
      const nextExp = expressions[Math.floor(Math.random() * expressions.length)];
      setExpression(nextExp);
    }, 6000);

    return () => clearInterval(expressionInterval);
  }, [isOpen]);

  // Contextual reactions on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 400 && expression !== 'curious') {
        setExpression('curious');
      } else if (scrollY <= 400 && expression === 'curious') {
        setExpression('idle');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expression]);

  // Cursor Proximity Eye Tracking
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
      const maxDist = 5.5;
      const angle = Math.atan2(dy, dx);
      const intensity = Math.min(dist / 300, 1);

      setPupilOffset({
        x: Math.cos(angle) * maxDist * intensity,
        y: Math.sin(angle) * maxDist * intensity,
      });

      // If cursor is very close, get excited/alert
      if (dist < 120 && !isOpen && expression !== 'excited' && expression !== 'thinking') {
        setExpression('excited');
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen, expression]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Send
  const handleSend = async (customQuery?: string) => {
    const q = customQuery || inputQuery;
    if (!q.trim() || isLoading) return;

    audioManager.playTimelineTick();
    setExpression('thinking');

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputQuery('');
    setIsLoading(true);

    // Try backend RAG first, then fallback to rich local knowledge base
    try {
      let replyText = '';
      const localAnswer = getLocalRagAnswer(q.trim());
      
      if (localAnswer) {
        // Instant crisp response
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
      setExpression('happy');
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
      setExpression('confused');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    audioManager.playNodeEngage();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setExpression('happy');
      setBubbleVisible(false);
    } else {
      setExpression('idle');
    }
  };

  return (
    <>
      {/* =========================================================================
          MISS MINUTES LIVING CHARACTER (Bottom-Right Companion)
          ========================================================================= */}
      <div
        ref={companionRef}
        className="relative group flex items-center justify-end z-50 select-none"
      >
        {/* Floating Contextual Speech Bubble */}
        {bubbleVisible && !isOpen && speechBubble && (
          <div 
            onClick={toggleOpen}
            className="absolute -top-12 right-24 sm:right-28 whitespace-nowrap bg-[#FFA000] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3.5px_3.5px_0px_#8A5500] px-3 py-1.5 font-comic text-xs sm:text-sm tracking-wide font-extrabold rotate-2 sticker-pop cursor-pointer z-50 animate-bounce"
          >
            <span>{speechBubble}</span>
            {/* Speech Pointer Tail */}
            <div className="absolute -bottom-2 right-4 w-3 h-3 bg-[#FFA000] border-r-[2.5px] border-b-[2.5px] border-[#0D0D0F] rotate-45" />
          </div>
        )}

        {/* Miss Minutes Animated Character Card Container */}
        <div
          onClick={toggleOpen}
          onMouseEnter={() => {
            if (!isOpen) {
              setExpression('curious');
              setSpeechBubble("Ask me anything, sugar!");
            }
          }}
          onMouseLeave={() => {
            if (!isOpen) setExpression('idle');
          }}
          className="relative cursor-pointer flex items-center gap-3 p-2 sm:p-2.5 bg-[#1A1A1D] border-[3px] border-[#FFA000] hover:border-[#F5D90A] shadow-[5px_5px_0px_#8A5500] hover:shadow-[7px_7px_0px_#8A7400] transition-all hover:-translate-y-1 active:translate-x-1 active:translate-y-1 group"
        >
          {/* Miss Minutes 2D Illustrated SVG Avatar */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center will-change-transform animate-[float_4s_ease-in-out_infinite]">
            {/* Ambient Radial Golden Glow Pulse */}
            <div className="absolute inset-0 rounded-full bg-[#FFA000]/25 blur-md animate-pulse" />

            <svg
              viewBox="0 0 100 100"
              className="w-full h-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            >
              {/* Outer Clock Casing / Body (Warm TVA Orange) */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="#FF8C00"
                stroke="#0D0D0F"
                strokeWidth="4"
              />

              {/* Inner Clock Face (Bright Yellow-Orange Sunburst) */}
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="#FFB300"
                stroke="#0D0D0F"
                strokeWidth="2.5"
              />

              {/* Clock Tick Marks */}
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <line
                  key={deg}
                  x1="50"
                  y1="17"
                  x2="50"
                  y2="21"
                  stroke="#8A5000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  transform={`rotate(${deg} 50 50)`}
                />
              ))}

              {/* Cartoon Clock Hands (Hour & Minute hands acting as hair/eyebrows or antennae) */}
              <g className="origin-[50px_50px]">
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="28"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-[spin_20s_linear_infinite] origin-[50px_50px]"
                />
                <line
                  x1="50"
                  y1="50"
                  x2="66"
                  y2="50"
                  stroke="#0D0D0F"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="animate-[spin_5s_linear_infinite] origin-[50px_50px]"
                />
              </g>

              {/* Center Nose Pin */}
              <circle cx="50" cy="50" r="3.5" fill="#0D0D0F" />

              {/* Eyes */}
              <g>
                {/* Left Eye Socket */}
                <ellipse
                  cx="37"
                  cy="42"
                  rx="7"
                  ry={isBlinking ? 1 : 9}
                  fill="#FFFFFF"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                />
                {/* Left Pupil */}
                {!isBlinking && (
                  <ellipse
                    cx={37 + pupilOffset.x}
                    cy={42 + pupilOffset.y}
                    rx="3.5"
                    ry="5"
                    fill="#0D0D0F"
                  >
                    {/* Catchlight */}
                    <circle cx={35.5 + pupilOffset.x} cy={40 + pupilOffset.y} r="1.2" fill="#FFFFFF" />
                  </ellipse>
                )}
                {/* Left Eyelashes */}
                <path d="M 32 34 L 28 30 M 37 33 L 37 28 M 42 34 L 46 30" stroke="#0D0D0F" strokeWidth="2" strokeLinecap="round" />

                {/* Right Eye Socket */}
                <ellipse
                  cx="63"
                  cy="42"
                  rx="7"
                  ry={isBlinking ? 1 : 9}
                  fill="#FFFFFF"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                />
                {/* Right Pupil */}
                {!isBlinking && (
                  <ellipse
                    cx={63 + pupilOffset.x}
                    cy={42 + pupilOffset.y}
                    rx="3.5"
                    ry="5"
                    fill="#0D0D0F"
                  >
                    {/* Catchlight */}
                    <circle cx={61.5 + pupilOffset.x} cy={40 + pupilOffset.y} r="1.2" fill="#FFFFFF" />
                  </ellipse>
                )}
                {/* Right Eyelashes */}
                <path d="M 58 34 L 54 30 M 63 33 L 63 28 M 68 34 L 72 30" stroke="#0D0D0F" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Expressive Mouth States */}
              {expression === 'idle' && (
                <path
                  d="M 38 62 Q 50 72 62 62"
                  fill="#8B0000"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
              {expression === 'happy' && (
                <path
                  d="M 35 60 Q 50 76 65 60 Z"
                  fill="#E60000"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                />
              )}
              {expression === 'curious' && (
                <path
                  d="M 40 64 Q 50 60 60 62"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              {expression === 'excited' && (
                <ellipse
                  cx="50"
                  cy="64"
                  rx="7"
                  ry="9"
                  fill="#E60000"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                />
              )}
              {expression === 'thinking' && (
                <ellipse
                  cx="53"
                  cy="63"
                  rx="4"
                  ry="4"
                  fill="#0D0D0F"
                />
              )}
              {expression === 'confused' && (
                <path
                  d="M 38 66 Q 44 60 50 66 Q 56 72 62 66"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
              {expression === 'surprised' && (
                <circle
                  cx="50"
                  cy="63"
                  r="6"
                  fill="#FFFFFF"
                  stroke="#0D0D0F"
                  strokeWidth="2.5"
                />
              )}

              {/* Cute Rosy Cheeks */}
              <circle cx="28" cy="52" r="4.5" fill="#FF5722" opacity="0.6" />
              <circle cx="72" cy="52" r="4.5" fill="#FF5722" opacity="0.6" />
            </svg>
          </div>

          {/* Text & Status Label */}
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-sm sm:text-base text-[#FFA000] tracking-wide uppercase">
                MISS MINUTES
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="font-comic text-[9px] sm:text-[10px] text-[#A8A8AC] uppercase font-bold tracking-wider">
              TVA AI TIMELINE GUIDE
            </span>
          </div>

          {/* Interactive Action Indicator */}
          <div className="px-2.5 py-1 bg-[#FFA000] text-[#0D0D0F] border-[1.5px] border-[#0D0D0F] shadow-[2px_2px_0px_#8A5500] font-bungee text-[9px] tracking-wider uppercase rotate-2">
            {isOpen ? 'CLOSE' : 'TALK'}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TVA CONVERSATIONAL AI ASSISTANT DIALOG PANEL
          ========================================================================= */}
      {isOpen && (
        <div className="fixed bottom-24 sm:bottom-28 right-3 sm:right-6 w-[94vw] max-w-[420px] max-h-[78vh] sm:max-h-[580px] bg-[#141417] border-[3.5px] border-[#FFA000] shadow-[0_0_40px_rgba(255,160,0,0.2),_8px_8px_0px_#000000] z-90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-[#FFA000] text-[#0D0D0F] p-3 sm:p-3.5 border-b-[3px] border-[#0D0D0F] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#0D0D0F] text-[#FFA000] flex items-center justify-center font-display text-base border border-[#FFA000]">
                ⏰
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg uppercase tracking-wide leading-none">
                  MISS MINUTES AI CORE
                </h3>
                <span className="font-mono text-[9px] uppercase font-black tracking-widest text-[#5A3A00] block mt-0.5">
                  TVA TEMPORAL PROTOCOL &bull; ACTIVE
                </span>
              </div>
            </div>

            <button
              onClick={toggleOpen}
              className="p-1 hover:bg-[#0D0D0F] hover:text-[#FFA000] border-[1.5px] border-[#0D0D0F] transition-colors cursor-pointer text-[#0D0D0F]"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Suggested Queries Chips */}
          <div className="p-2.5 bg-[#1A1A1D] border-b border-[#3A3A3E] flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend("What events are available?")}
              className="whitespace-nowrap px-2.5 py-1 bg-[#26262B] hover:bg-[#FFA000] hover:text-[#0D0D0F] border border-[#FFA000]/60 text-[10px] font-mono text-[#FFA000] font-bold transition-colors cursor-pointer"
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
                      ? 'bg-[#FFA000] text-[#0D0D0F] border-[#FFA000] shadow-[3px_3px_0px_#8A5500] font-bold'
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
              <div className="flex items-center gap-2 p-2.5 bg-[#1A1A1D] border border-[#FFA000] text-[#FFA000] text-xs font-mono max-w-[80%] animate-pulse shadow-[2px_2px_0px_#8A5500]">
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
              className="flex-1 bg-[#0F0F12] border-[1.5px] border-[#3A3A3E] focus:border-[#FFA000] text-xs sm:text-sm text-[#F2F2F0] px-3 py-2 outline-none font-comic placeholder:text-[#A8A8AC]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 bg-[#FFA000] hover:bg-[#F5D90A] disabled:opacity-50 text-[#0D0D0F] border-[1.5px] border-[#0D0D0F] shadow-[2px_2px_0px_#8A5500] font-display text-xs tracking-wider uppercase cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default MissMinutesCompanion;
