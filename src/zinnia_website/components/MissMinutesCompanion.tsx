import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, 
  X, 
  Clock, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { audioManager } from '../core/AudioManager';
import { sendChatMessage, fetchSuggestedFaqs, SuggestedFaq } from '../../services/aiChat';

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
  const [mounted, setMounted] = useState(false);
  const [isRagOpen, setIsRagOpen] = useState(false);

  // RAG Chat State
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
  const charWrapperRef = useRef<HTMLDivElement | null>(null);

  // Animation Engine State Ref (Maintains 60fps single rAF loop without shifting position)
  const animState = useRef({
    pointerX: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 500,
    pointerY: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
    pupilX: 0,
    pupilY: 0,
    bodyTilt: 0,
    bodyBob: 0,
    isWaving: false,
    waveStartTime: 0,
    waveArmAngle: 0,
    isBlinking: false,
    blinkStartTime: 0,
    proximity: 'idle' as 'idle' | 'watching' | 'curious',
    speechText: "Hey y'all! Click me!",
    showSpeech: false,
    speechTimer: 0,
  });

  // DOM direct mutation refs
  const bodyGroupRef = useRef<SVGGElement | null>(null);
  const pupilLeftRef = useRef<SVGEllipseElement | null>(null);
  const pupilRightRef = useRef<SVGEllipseElement | null>(null);
  const leftEyeRef = useRef<SVGEllipseElement | null>(null);
  const rightEyeRef = useRef<SVGEllipseElement | null>(null);
  const leftArmRef = useRef<SVGGElement | null>(null);
  const leftArmWavingRef = useRef<SVGGElement | null>(null);
  const rightArmRef = useRef<SVGGElement | null>(null);
  const mouthRef = useRef<SVGPathElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const speechBubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchSuggestedFaqs().then((faqs) => {
      if (faqs && faqs.length > 0) setSuggestedFaqs(faqs.slice(0, 4));
    });
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (isRagOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isRagOpen]);

  // Handle Send to RAG Core
  const handleSend = async (customQuery?: string) => {
    const q = customQuery || inputQuery;
    if (!q.trim() || isLoading) return;

    audioManager.playTimelineTick();
    const state = animState.current;
    state.isWaving = true;
    state.waveStartTime = performance.now();

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

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const state = animState.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pointer tracking across screen (tracks eyes and tilt, does NOT move character position)
    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion) return;
      state.pointerX = e.clientX;
      state.pointerY = e.clientY;
    };

    const handleWindowClick = (e: MouseEvent) => {
      // Cheerful wave in place
      state.isWaving = true;
      state.waveStartTime = performance.now();
      audioManager.playTimelineTick();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handleWindowClick, { passive: true });

    let nextBlinkTime = performance.now() + 3500 + Math.random() * 2000;
    let rAFId: number;

    const renderLoop = (time: number) => {
      if (!prefersReducedMotion) {
        // 1. Subtle gentle idle breathing bob in place
        state.bodyBob = Math.sin(time * 0.003) * 2;

        // 2. Eye tracking relative to her stationary bottom-right corner
        const charCenterX = window.innerWidth - 65;
        const charCenterY = window.innerHeight - 60;
        const toPointerX = state.pointerX - charCenterX;
        const toPointerY = state.pointerY - charCenterY;
        const distToPointer = Math.hypot(toPointerX, toPointerY);

        const eyeAngle = Math.atan2(toPointerY, toPointerX);
        const maxPupilRadius = 3.6;
        const targetRadius = Math.min(maxPupilRadius, distToPointer / 90);

        const targetPupilX = Math.cos(eyeAngle) * targetRadius;
        const targetPupilY = Math.sin(eyeAngle) * targetRadius;

        state.pupilX += (targetPupilX - state.pupilX) * 0.14;
        state.pupilY += (targetPupilY - state.pupilY) * 0.14;

        // Proximity reaction
        if (distToPointer < 160) {
          state.proximity = 'curious';
          state.bodyTilt = Math.max(-5, Math.min(5, (toPointerX / 160) * 5));
        } else if (distToPointer < 320) {
          state.proximity = 'watching';
          state.bodyTilt = Math.max(-3, Math.min(3, (toPointerX / 320) * 3));
        } else {
          state.proximity = 'idle';
          state.bodyTilt *= 0.9;
        }

        // 3. Blinking
        if (time > nextBlinkTime) {
          state.isBlinking = true;
          state.blinkStartTime = time;
          nextBlinkTime = time + 3800 + Math.random() * 2500;
        }
        if (state.isBlinking && time - state.blinkStartTime > 160) {
          state.isBlinking = false;
        }

        // 4. Upward High Waving Animation in place ("HI!" Greeting)
        if (state.isWaving) {
          const waveElapsed = (time - state.waveStartTime) / 1000;
          if (waveElapsed < 0.85) {
            const waveProgress = (waveElapsed / 0.85) * (Math.PI * 6);
            state.waveArmAngle = Math.sin(waveProgress) * 24;
          } else {
            state.isWaving = false;
            state.waveArmAngle = 0;
          }
        }

        if (state.showSpeech && time > state.speechTimer) {
          state.showSpeech = false;
        }
      }

      // DOM Updates (Zero layout recalculation)
      if (charWrapperRef.current) {
        charWrapperRef.current.style.transform = `translate3d(0, ${state.bodyBob}px, 0)`;
      }

      if (bodyGroupRef.current) {
        bodyGroupRef.current.style.transform = `rotate(${state.bodyTilt}deg)`;
      }

      if (pupilLeftRef.current) {
        pupilLeftRef.current.setAttribute('cx', `${64 + state.pupilX}`);
        pupilLeftRef.current.setAttribute('cy', `${52 + state.pupilY}`);
      }
      if (pupilRightRef.current) {
        pupilRightRef.current.setAttribute('cx', `${96 + state.pupilX}`);
        pupilRightRef.current.setAttribute('cy', `${52 + state.pupilY}`);
      }

      const eyeRy = state.isBlinking ? 1.5 : state.proximity === 'curious' ? 13.5 : 11.5;
      if (leftEyeRef.current) leftEyeRef.current.setAttribute('ry', `${eyeRy}`);
      if (rightEyeRef.current) rightEyeRef.current.setAttribute('ry', `${eyeRy}`);

      // Arm Animation - Switch between resting on hip and waving high in the air
      if (state.isWaving) {
        if (leftArmRef.current) leftArmRef.current.style.display = 'none';
        if (leftArmWavingRef.current) {
          leftArmWavingRef.current.style.display = 'block';
          leftArmWavingRef.current.style.transform = `rotate(${state.waveArmAngle}deg)`;
        }
      } else {
        if (leftArmRef.current) leftArmRef.current.style.display = 'block';
        if (leftArmWavingRef.current) leftArmWavingRef.current.style.display = 'none';
      }

      if (mouthRef.current) {
        if (state.isWaving || state.proximity === 'curious' || isRagOpen) {
          mouthRef.current.setAttribute('d', 'M 64 72 Q 80 94 96 72 Z');
          mouthRef.current.setAttribute('fill', '#D50000');
        } else {
          mouthRef.current.setAttribute('d', 'M 66 74 Q 80 87 94 74');
          mouthRef.current.setAttribute('fill', '#FFFEEF');
        }
      }

      if (glowRef.current) {
        glowRef.current.style.opacity = state.proximity === 'curious' ? '0.75' : state.isWaving ? '0.9' : '0.4';
      }

      if (speechBubbleRef.current) {
        speechBubbleRef.current.style.opacity = state.showSpeech ? '1' : '0';
        speechBubbleRef.current.style.transform = state.showSpeech
          ? 'scale(1) translate(-50%, -100%)'
          : 'scale(0.8) translate(-50%, -80%)';
      }

      rAFId = requestAnimationFrame(renderLoop);
    };

    rAFId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rAFId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handleWindowClick);
    };
  }, [mounted, isRagOpen]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* =========================================================================
          MISS MINUTES STATIONARY LIVING MASCOT (Fixed to Bottom-Right Corner)
          ========================================================================= */}
      <div
        ref={charWrapperRef}
        className="fixed bottom-3 sm:bottom-4 right-3 sm:right-6 pointer-events-auto cursor-pointer z-[99998] select-none will-change-transform"
        onClick={(e) => {
          e.stopPropagation(); // Stop background window click
          const state = animState.current;
          state.isWaving = true;
          state.waveStartTime = performance.now();
          audioManager.playNodeEngage();
          setIsRagOpen((prev) => !prev);
        }}
      >
        {/* Floating Comic Speech Bubble */}
        <div
          ref={speechBubbleRef}
          className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-[#FF8C00] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#8A5500] px-3 py-1 font-comic text-xs tracking-wide font-black -rotate-2 pointer-events-none transition-all duration-200"
          style={{ opacity: 0 }}
        >
          <span>{animState.current.speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FF8C00] border-r-[2.5px] border-b-[2.5px] border-[#0D0D0F] rotate-45" />
        </div>

        {/* Ambient Warm Golden Aura Glow */}
        <div
          ref={glowRef}
          className="absolute -inset-4 bg-[radial-gradient(circle,_rgba(255,140,0,0.45)_0%,_transparent_70%)] rounded-full blur-xl pointer-events-none transition-opacity duration-300"
          style={{ opacity: 0.4 }}
        />

        {/* =========================================================================
            ARTICULATED SVG CHARACTER (Stays in corner, waves upward, tracks eyes)
            ========================================================================= */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 select-none group">
          <svg
            viewBox="0 0 160 170"
            className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-150"
          >
            <defs>
              <radialGradient id="mmClockBevel" cx="38%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#FFA726" />
                <stop offset="68%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#E65100" />
              </radialGradient>
              <linearGradient id="mmRimShade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D84315" />
                <stop offset="100%" stopColor="#7E1D00" />
              </linearGradient>
            </defs>

            {/* Subtree Container for Tilt */}
            <g
              ref={bodyGroupRef}
              className="origin-[80px_90px] transition-transform duration-100 ease-out will-change-transform"
            >
              {/* ==================== 1. LEGS & SHOES ==================== */}
              {/* Left Leg */}
              <g className="origin-[68px_110px]">
                <line
                  x1="68"
                  y1="110"
                  x2="66"
                  y2="142"
                  stroke="#0D0D0F"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 50 144 C 50 137, 62 135, 70 138 C 76 140, 78 148, 76 153 C 74 156, 50 156, 50 144 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* Right Leg */}
              <g className="origin-[92px_110px]">
                <line
                  x1="92"
                  y1="110"
                  x2="94"
                  y2="142"
                  stroke="#0D0D0F"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 86 144 C 86 137, 98 135, 106 138 C 112 140, 114 148, 112 153 C 110 156, 86 156, 86 144 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* ==================== 2. 3D CLOCK BODY ==================== */}
              <ellipse
                cx="84"
                cy="68"
                rx="49"
                ry="49"
                fill="url(#mmRimShade)"
                stroke="#0D0D0F"
                strokeWidth="4.2"
              />

              <path
                d="M 80 19
                   C 107 19, 128 39, 127 67
                   C 126 94, 106 114, 79 113
                   C 52 112, 33 93, 33 66
                   C 33 39, 53 19, 80 19 Z"
                fill="url(#mmClockBevel)"
                stroke="#0D0D0F"
                strokeWidth="4.5"
              />

              {/* Tick Marks */}
              <line x1="80" y1="23" x2="80" y2="33" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="123" y1="66" x2="113" y2="66" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="80" y1="109" x2="80" y2="99" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="37" y1="66" x2="47" y2="66" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="101" y1="28" x2="96" y2="35" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="118" y1="45" x2="111" y2="49" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="118" y1="87" x2="111" y2="83" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="101" y1="104" x2="96" y2="97" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="104" x2="64" y2="97" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="87" x2="49" y2="83" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="45" x2="49" y2="49" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="28" x2="64" y2="35" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />

              <circle cx="80" cy="62" r="4.2" fill="#0D0D0F" />

              {/* ==================== 3. EYES & EYELASHES ==================== */}
              <ellipse
                ref={leftEyeRef}
                cx="64"
                cy="52"
                rx="9.5"
                ry="11.5"
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
              />
              <ellipse
                ref={pupilLeftRef}
                cx="64"
                cy="52"
                rx="5"
                ry="7.5"
                fill="#0D0D0F"
              />
              <path d="M 57 39 L 52 33 M 64 38 L 64 31 M 71 40 L 76 34" stroke="#0D0D0F" strokeWidth="3" strokeLinecap="round" />

              <ellipse
                ref={rightEyeRef}
                cx="96"
                cy="52"
                rx="9.5"
                ry="11.5"
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
              />
              <ellipse
                ref={pupilRightRef}
                cx="96"
                cy="52"
                rx="5"
                ry="7.5"
                fill="#0D0D0F"
              />
              <path d="M 89 40 L 84 34 M 96 38 L 96 31 M 103 39 L 108 33" stroke="#0D0D0F" strokeWidth="3" strokeLinecap="round" />

              {/* ==================== 4. MOUTH & CHEEKS ==================== */}
              <path
                ref={mouthRef}
                d="M 66 74 Q 80 87 94 74"
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="51" cy="66" r="5" fill="#E64A19" opacity="0.45" />
              <circle cx="109" cy="66" r="5" fill="#E64A19" opacity="0.45" />

              {/* ==================== 5. ARMS & WHITE GLOVES ==================== */}
              {/* Left Arm - Resting On Hip */}
              <g
                ref={leftArmRef}
                className="origin-[36px_65px] will-change-transform"
              >
                <path
                  d="M 36 64 C 18 68, 16 85, 34 94"
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth="8.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 36 64 C 18 68, 16 85, 34 94"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="12"
                  strokeLinecap="round"
                  style={{ zIndex: -1 }}
                />
                <path
                  d="M 32 90 C 28 86, 36 82, 40 88 C 42 92, 38 98, 32 96 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3"
                />
              </g>

              {/* Left Arm - Raised High Waving ("HI!" Greeting with Open Glove) */}
              <g
                ref={leftArmWavingRef}
                className="origin-[36px_65px] will-change-transform"
                style={{ display: 'none' }}
              >
                <path
                  d="M 36 66 Q 14 42 22 18"
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth="8.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 36 66 Q 14 42 22 18"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="12"
                  strokeLinecap="round"
                  style={{ zIndex: -1 }}
                />
                {/* Cheerful Open White Glove Waving High */}
                <g transform="translate(10, 2)">
                  <path
                    d="M 12 18 C 8 12, 10 4, 16 5 C 19 2, 25 4, 24 10 C 28 8, 30 14, 27 18 C 24 23, 16 24, 12 18 Z"
                    fill="#FFFEEF"
                    stroke="#0D0D0F"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <line x1="16" y1="12" x2="19" y2="16" stroke="#0D0D0F" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="21" y1="12" x2="23" y2="15" stroke="#0D0D0F" strokeWidth="1.5" strokeLinecap="round" />
                </g>
              </g>

              {/* Right Arm (Resting on Hip) */}
              <g
                ref={rightArmRef}
                className="origin-[124px_65px] will-change-transform"
              >
                <path
                  d="M 124 64 C 142 68, 144 85, 126 94"
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth="8.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 124 64 C 142 68, 144 85, 126 94"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="12"
                  strokeLinecap="round"
                  style={{ zIndex: -1 }}
                />
                <path
                  d="M 128 90 C 132 86, 124 82, 120 88 C 118 92, 122 98, 128 96 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* =========================================================================
          TVA CONVERSATIONAL AI RAG ASSISTANT DIALOG PANEL
          ========================================================================= */}
      {isRagOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-24 sm:bottom-28 right-3 sm:right-6 w-[94vw] max-w-[420px] max-h-[78vh] sm:max-h-[580px] bg-[#141417] border-[3.5px] border-[#FF8C00] shadow-[0_0_40px_rgba(255,140,0,0.3),_8px_8px_0px_#000000] z-[99999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto select-auto"
        >
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
              onClick={() => setIsRagOpen(false)}
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
