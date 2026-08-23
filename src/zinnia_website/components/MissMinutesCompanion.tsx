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
  Database,
  MessageSquare
} from 'lucide-react';
import { audioManager } from '../core/AudioManager';
import { sendChatMessage, fetchSuggestedFaqs, SuggestedFaq } from '../../services/aiChat';
import missMinutesImg from '../../assets/miss_minutes.gif';

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
  const [isHovered, setIsHovered] = useState(false);
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
    }, 8000);

    return () => clearInterval(bubbleTimer);
  }, [isOpen]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Send
  const handleSend = async (customQuery?: string) => {
    const q = customQuery || inputQuery;
    if (!q.trim() || isLoading) return;

    audioManager.playTimelineTick();

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
        await new Promise((r) => setTimeout(r, 600));
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
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOpen = () => {
    audioManager.playNodeEngage();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowBubble(false);
    }
  };

  return (
    <>
      {/* =========================================================================
          MISS MINUTES LIVING FULL-CHARACTER COMPANION (Bottom-Right)
          ========================================================================= */}
      <div
        ref={companionRef}
        className="relative flex items-center justify-end z-50 select-none"
      >
        {/* Floating Contextual Speech Balloon */}
        {showBubble && !isOpen && (
          <div 
            onClick={toggleOpen}
            className="absolute -top-14 right-20 sm:right-28 whitespace-nowrap bg-[#FF8C00] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3.5px_3.5px_0px_#8A5500] px-3.5 py-1.5 font-comic text-xs sm:text-sm tracking-wide font-extrabold rotate-2 sticker-pop cursor-pointer z-50 animate-bounce"
          >
            <span>{speechBubble}</span>
            {/* Speech Tail */}
            <div className="absolute -bottom-2 right-4 w-3 h-3 bg-[#FF8C00] border-r-[2.5px] border-b-[2.5px] border-[#0D0D0F] rotate-45" />
          </div>
        )}

        {/* Miss Minutes Full-Body Character Figure */}
        <div
          onClick={toggleOpen}
          onMouseEnter={() => {
            setIsHovered(true);
            setSpeechBubble("Ask me anything, sugar!");
            setShowBubble(true);
          }}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative cursor-pointer flex items-center gap-2 select-none"
        >
          {/* Ambient Warm Golden Glow */}
          <div className="absolute -inset-2 bg-[radial-gradient(circle,_rgba(255,140,0,0.35)_0%,_transparent_70%)] rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-300" />

          {/* Full-Body Animated Character Graphic */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:-rotate-3 active:scale-95">
            <img
              src={missMinutesImg}
              alt="Miss Minutes - TVA AI Guide"
              className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
            />
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
        <div className="fixed bottom-24 sm:bottom-28 right-3 sm:right-6 w-[94vw] max-w-[420px] max-h-[78vh] sm:max-h-[580px] bg-[#141417] border-[3.5px] border-[#FF8C00] shadow-[0_0_40px_rgba(255,140,0,0.25),_8px_8px_0px_#000000] z-90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Bar */}
          <div className="bg-[#FF8C00] text-[#0D0D0F] p-3 sm:p-3.5 border-b-[3px] border-[#0D0D0F] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#0D0D0F] border border-[#FF8C00] overflow-hidden flex items-center justify-center p-0.5">
                <img src={missMinutesImg} alt="Miss Minutes" className="w-full h-full object-contain" />
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
    </>
  );
};

export default MissMinutesCompanion;
