import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { registerNav } from '../services/registerNavigation';
import { WebsiteFooter } from '../components/layout/Footer';
import { Users, Clock, MapPin, ArrowRight, Trophy, Zap, Shield, Sparkles, Layers, Terminal, Gamepad2, Award, X, Phone, CheckCircle2, Mail, Send } from 'lucide-react';

// 2D-only Tactile Digit Swap Component (Clean vertical centering & pop transition)
const FlipNumber: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => {
  const [current, setCurrent] = useState(value);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value !== current) {
      setCurrent(value);
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [value, current]);

  return (
    <div className={`flex items-center justify-center h-8 sm:h-9 md:h-10 overflow-visible ${className}`}>
      <span
        key={current}
        className={`leading-none select-none inline-block transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${animating ? 'scale-110 -translate-y-0.5' : 'scale-100 translate-y-0'
          }`}
      >
        {current}
      </span>
    </div>
  );
};

// Pure Vanilla Dependency-Free Scroll Reveal Component (Intersection Observer + Ease-Out-Expo Curve)
const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}> = ({ children, delayMs = 0, className = '' }) => {
  const domRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Respect OS prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) {
              observer.unobserve(domRef.current);
            }
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: '-50px',
      }
    );

    if (domRef.current) {
      observer.observe(domRef.current);
    }

    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        transitionDelay: isVisible ? `${delayMs}ms` : '0ms',
      }}
      className={`scroll-reveal-init ${isVisible ? 'scroll-reveal-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// 2D-only Magnetic Interaction Component (Translates smoothly based on mouse proximity)
const MagneticElement: React.FC<{
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ children, strength = 0.25, className = '', onClick }) => {
  const elementRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * strength, y: y * strength });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={elementRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
};

export const WebsiteHomePage: React.FC = () => {
  const navigate = useNavigate();

  // Real-time ticking countdown to September 17, 2026
  const [timeLeft, setTimeLeft] = useState({
    days: '12',
    hours: '48',
    minutes: '32',
    seconds: '15',
  });

  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);

  // Selected Event Modal State
  const [selectedEvent, setSelectedEvent] = useState<EventMission | null>(null);

  // Live Events Sync from Supabase DB / Store
  const [events, setEvents] = useState<EventMission[]>(() => store.getEvents());
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      triggerComicFX('SUBSCRIBED!');
      setNewsletterEmail('');
    }
  };

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setEvents(store.getEvents());
    });
    // Trigger real-time sync from Supabase DB
    store.syncFromSupabase();
    return () => unsub();
  }, []);

  const techEvents = events.filter((e) => e.event_type === 'TECH');
  const nonTechEvents = events.filter((e) => e.event_type === 'NON_TECH');

  const triggerComicFX = (soundText: string) => {
    setInteractiveSoundText(soundText);
    setTimeout(() => {
      setInteractiveSoundText(null);
    }, 900);
  };

  // Lusion Signature Cursor Trail Position
  const [mousePos, setMousePos] = useState({ x: -250, y: -250 });

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  useEffect(() => {
    const targetDate = new Date('2026-09-24T09:00:00+05:30').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string, sound: string) => {
    triggerComicFX(sound);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-transparent text-[#F2F2F0] flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none scroll-smooth">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#F5D90A] border-3 border-[#F5D90A] shadow-[6px_6px_0px_#8A7400] rotate-6 sticker-pop">
            <span className="font-display text-4xl sm:text-6xl text-[#FF3366] tracking-wider">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}



      {/* =========================================================================
          1. TOP NAVBAR (100% 2D Illustrated Comic Style with Magnetic Buttons)
          ========================================================================= */}
      <header className="relative z-60 max-w-6xl mx-auto w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 pt-1 px-1.5 sm:px-2">
        {/* Left: Illustrated ZINNIA Comic Logo with Magnetic Pull */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Magnetic Logo Badge (Rich Gold Shadow) */}
          <MagneticElement strength={0.25} onClick={() => triggerComicFX('BOOM!')}>
            <div className="cursor-pointer group relative px-2.5 sm:px-4 py-1 sm:py-1.5 bg-[#F5D90A] border-[2.5px] sm:border-[3px] border-[#F5D90A] shadow-[3px_3px_0px_#8A7400] sm:shadow-[4px_4px_0px_#8A7400] -rotate-1 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-display text-xl sm:text-3xl text-[#0D0D0F] tracking-wide">
                  ZINNIA
                </span>
                <span className="font-comic text-lg sm:text-2xl text-[#FF3366] font-black">
                  '26
                </span>
              </div>
              {/* Speech Tail */}
              <div className="absolute -bottom-2 sm:-bottom-2.5 left-3 sm:left-5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#F5D90A] border-r-[2.5px] sm:border-r-[3px] border-b-[2.5px] sm:border-b-[3px] border-[#F5D90A] rotate-45" />
            </div>
          </MagneticElement>

          {/* Comics Code Authority Parody Stamp (Neutral Dark Box) */}
          <div className="hidden md:flex flex-col items-center justify-center p-1 px-2 bg-[#1A1A1D] border-[1.5px] border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000] rotate-2 text-[7px] font-mono leading-tight uppercase font-black text-center sticker-pop-alt cursor-pointer text-[#A8A8AC]">
            <span>APPROVED</span>
            <span className="text-[6px] text-[#FF3366]">BY THE</span>
            <span>CSE CODE</span>
          </div>
        </div>

        {/* Center/Right Comic Navigation Tabs with Magnetic Pull */}
        <nav className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
          {/* EVENTS TAB */}
          <MagneticElement strength={0.3} onClick={() => scrollToSection('events', 'EVENTS!')}>
            <button className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-[#1A1A1D] hover:bg-[#2A2A2E] hover:border-[#3CE7FF] hover:text-[#3CE7FF] text-[#F2F2F0] border-[1.5px] sm:border-[2px] border-[#3A3A3E] shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000] font-comic text-[11px] sm:text-sm tracking-wider uppercase font-bold cursor-pointer transition-all flex items-center gap-1">
              <span>EVENTS</span>
            </button>
          </MagneticElement>

          {/* CONTACT TAB */}
          <MagneticElement strength={0.3} onClick={() => {
            triggerComicFX('CONTACT!');
            navigate('/contact');
          }}>
            <button className="px-2.5 sm:px-4 py-1 sm:py-1.5 bg-[#1A1A1D] hover:bg-[#2A2A2E] hover:border-[#00E5FF] hover:text-[#00E5FF] text-[#F2F2F0] border-[1.5px] sm:border-[2px] border-[#3A3A3E] shadow-[2px_2px_0px_#000000] sm:shadow-[3px_3px_0px_#000000] font-comic text-[11px] sm:text-sm tracking-wider uppercase font-bold cursor-pointer transition-all flex items-center gap-1">
              <span>CONTACT</span>
            </button>
          </MagneticElement>

          {/* Register Navbar Magnetic Button (Cyan Accent + Cyan Shadow) */}
          <MagneticElement strength={0.35} onClick={() => navigate('/register')}>
            <button className="px-3 sm:px-6 py-1 sm:py-1.5 bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[2px] sm:border-[2.5px] border-[#3CE7FF] hover:border-[#F5D90A] shadow-[2.5px_2.5px_0px_#1E8FA3] sm:shadow-[3.5px_3.5px_0px_#1E8FA3] hover:shadow-[3.5px_3.5px_0px_#8A7400] font-display text-[11px] sm:text-sm tracking-wider uppercase cursor-pointer transition-all shrink-0">
              REGISTER
            </button>
          </MagneticElement>
        </nav>
      </header>

      {/* =========================================================================
          2. CENTER HERO: LARGE COMIC PANEL (Main Visual Focus)
          ========================================================================= */}
      <main className="relative z-30 max-w-7xl mx-auto w-full pt-1 sm:pt-2 pb-2 sm:pb-4 px-1 sm:px-3 flex flex-col items-center">
        {/* Outer unclipped wrapper for top floating badges */}
        <div className="relative w-full">



          {/* Main Hero Banner Container (Transparent, Borderless, Moved Up) */}
          <div className="relative w-full bg-transparent p-1 xs:p-2 sm:p-4 pt-0 xs:pt-1 sm:pt-1 pb-1 xs:pb-2 sm:pb-3 overflow-hidden">
            {/* -------------------------------------------------------------
                HERO CONTENT INSIDE THE COMIC PANEL (EXTRA-LARGE HERO BANNER)
                ------------------------------------------------------------- */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center space-y-2 xs:space-y-2.5 sm:space-y-3.5 w-full">
              {/* Institution & Department Header */}
              <div className="flex flex-col items-center justify-center text-center w-full px-1 sm:px-4 space-y-1 sm:space-y-1.5">
                {/* College Name: Large, bold, stretching end-to-end */}
                <h3 className="w-full text-center font-comic font-black text-[#F5D90A] uppercase whitespace-normal sm:whitespace-nowrap text-lg xs:text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-wide xs:tracking-wider sm:tracking-[0.22em] md:tracking-[0.28em] lg:tracking-[0.34em] leading-snug sm:leading-tight select-none">
                  GOVERNMENT COLLEGE OF ENGINEERING, ERODE
                </h3>
                {/* Department Name: Slightly smaller than college */}
                <p className="w-full text-center font-comic font-extrabold text-[#3CE7FF] uppercase whitespace-normal sm:whitespace-nowrap text-sm xs:text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl tracking-normal xs:tracking-wide sm:tracking-[0.12em] md:tracking-[0.16em] lg:tracking-[0.2em] leading-snug sm:leading-tight select-none">
                  DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING
                </p>
              </div>

              {/* Giant Comic Title with '26 (tight gap to dept name) */}
              <div className="flex flex-col items-center justify-center text-center w-full pt-0">
                <div className="relative inline-flex items-start justify-center max-w-full">
                  <h1 className="font-display text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[#F2F2F0] tracking-tight leading-none uppercase select-none">
                    ZINNIA
                  </h1>
                  <span className="font-comic text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#3CE7FF] font-black leading-none translate-y-1 sm:translate-y-2 md:translate-y-3 ml-1.5 sm:ml-2.5 select-none">
                    '26
                  </span>
                </div>

                {/* Subtitle Badges & Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-3 xs:pt-3.5 sm:pt-4 max-w-full">
                  <span className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#FF3366] text-white border-[2px] sm:border-[2.5px] border-[#FF3366] font-bungee text-[11px] sm:text-sm -rotate-2 sticker-pop-alt cursor-pointer shadow-[3px_3px_0px_#B01F45]">
                    NATIONAL LEVEL
                  </span>
                  <span
                    onClick={() => triggerComicFX('9 BATTLES!')}
                    className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#123B3E] text-[#3CE7FF] border-[2px] sm:border-[2.5px] border-[#3CE7FF] font-mono text-[11px] sm:text-sm font-black shadow-[2.5px_2.5px_0px_#1E8FA3] sticker-pop cursor-pointer"
                  >
                    9 ACTIVE EVENTS
                  </span>
                  <span
                    onClick={() => triggerComicFX('VERIFIED!')}
                    className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#2B2408] text-[#F5D90A] border-[2px] sm:border-[2.5px] border-[#F5D90A] font-mono text-[11px] sm:text-sm font-black shadow-[2.5px_2.5px_0px_#8A7400] sticker-pop-alt cursor-pointer"
                  >
                    ANNA UNIV VERIFIED
                  </span>
                </div>
              </div>

              {/* Center Register CTA Button */}
              <div className="pt-2 sm:pt-3 flex justify-center w-full max-w-md">
                <MagneticElement strength={0.35} onClick={() => navigate('/register')} className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-6 xs:px-8 sm:px-10 md:px-12 py-2.5 sm:py-3 bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[2px] sm:border-[2.5px] border-[#3CE7FF] hover:border-[#F5D90A] shadow-[3px_3px_0px_#1E8FA3] sm:shadow-[4px_4px_0px_#1E8FA3] hover:shadow-[4px_4px_0px_#8A7400] font-display text-xs xs:text-sm sm:text-base md:text-lg tracking-wider uppercase cursor-pointer transition-all active:translate-x-1 active:translate-y-1 flex items-center justify-center gap-2 sm:gap-2.5 group">
                    <span>REGISTER FOR ZINNIA</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                </MagneticElement>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. COUNTDOWN (Centered Below Comic Panel)
            ========================================================================= */}
        <div className="relative z-30 flex flex-col items-center justify-center pt-2 sm:pt-4 w-full">
          {/* Illustrated Comic Countdown Module */}
          <div className="flex flex-col items-center max-w-full px-1">
            {/* Caption Header */}
            <div className="px-3 sm:px-4 py-0.5 sm:py-1 bg-[#1A1A1D] text-[#A8A8AC] font-comic text-[10px] sm:text-xs uppercase tracking-widest border border-[#3A3A3E] -rotate-1 font-bold sticker-pop cursor-pointer mb-2">
              SYMPOSIUM COMMENCES IN
            </div>

            {/* Countdown Comic Number Boxes */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
              {/* Days */}
              <div className="flex flex-col items-center p-1.5 sm:p-2.5 bg-[#1A1A1D] border-[1.5px] sm:border-[2px] border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] min-w-[46px] xs:min-w-[54px] sm:min-w-[72px] hover:-translate-y-1 hover:border-[#EAEAEA] transition-all cursor-pointer">
                <FlipNumber
                  value={timeLeft.days}
                  className="font-display text-lg xs:text-xl sm:text-3xl md:text-4xl text-[#F2F2F0]"
                />
                <span className="font-comic text-[7px] sm:text-[10px] text-[#A8A8AC] font-bold uppercase mt-0.5">
                  DAYS
                </span>
              </div>

              <span className="font-display text-base sm:text-2xl text-[#3A3A3E] font-bold animate-pulse">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center p-1.5 sm:p-2.5 bg-[#1A1A1D] border-[1.5px] sm:border-[2px] border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] min-w-[46px] xs:min-w-[54px] sm:min-w-[72px] hover:-translate-y-1 hover:border-[#EAEAEA] transition-all cursor-pointer">
                <FlipNumber
                  value={timeLeft.hours}
                  className="font-display text-lg xs:text-xl sm:text-3xl md:text-4xl text-[#F2F2F0]"
                />
                <span className="font-comic text-[7px] sm:text-[10px] text-[#A8A8AC] font-bold uppercase mt-0.5">
                  HRS
                </span>
              </div>

              <span className="font-display text-base sm:text-2xl text-[#3A3A3E] font-bold animate-pulse">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center p-1.5 sm:p-2.5 bg-[#1A1A1D] border-[1.5px] sm:border-[2px] border-[#3A3A3E] shadow-[2.5px_2.5px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] min-w-[46px] xs:min-w-[54px] sm:min-w-[72px] hover:-translate-y-1 hover:border-[#EAEAEA] transition-all cursor-pointer">
                <FlipNumber
                  value={timeLeft.minutes}
                  className="font-display text-lg xs:text-xl sm:text-3xl md:text-4xl text-[#F2F2F0]"
                />
                <span className="font-comic text-[7px] sm:text-[10px] text-[#A8A8AC] font-bold uppercase mt-0.5">
                  MIN
                </span>
              </div>

              <span className="font-display text-base sm:text-2xl text-[#3A3A3E] font-bold animate-pulse">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center p-1.5 sm:p-2.5 bg-[#FF3366] border-[1.5px] sm:border-[2px] border-[#FF3366] shadow-[2.5px_2.5px_0px_#B01F45] sm:shadow-[4px_4px_0px_#B01F45] min-w-[46px] xs:min-w-[54px] sm:min-w-[72px] hover:-translate-y-1 hover:shadow-[5px_5px_0px_#B01F45] transition-all cursor-pointer">
                <FlipNumber
                  value={timeLeft.seconds}
                  className="font-display text-lg xs:text-xl sm:text-3xl md:text-4xl text-white font-black"
                />
                <span className="font-comic text-[7px] sm:text-[10px] text-[#F5D90A] font-extrabold uppercase mt-0.5">
                  SEC
                </span>
              </div>
            </div>

            {/* Timeline Status Callout */}
            <div 
              onClick={() => triggerComicFX('TIMELINE!')}
              className="mt-3 sm:mt-4 px-3 sm:px-4 py-1 bg-[#1A1A1D] border-[1.5px] sm:border-[2px] border-[#FF8C00] shadow-[2.5px_2.5px_0px_#8A5500] rotate-1 sticker-pop cursor-pointer max-w-full text-center"
            >
              <span className="font-comic text-[10px] sm:text-xs uppercase text-[#FF8C00] font-bold tracking-wider">
                ⏰ TIMELINE MONITORED &bull; 24 SEPTEMBER 2026 &bull; GCE ERODE CSE
              </span>
            </div>
          </div>

        </div>
      </main>

      {/* =========================================================================
          EVENTS SECTION (100% Pixel-Faithful to Reference Design)
          ========================================================================= */}
      <section
        id="events"
        className="relative z-30 max-w-7xl mx-auto w-full py-8 sm:py-14 px-2 sm:px-4 my-2 sm:my-6 overflow-visible"
      >
        {/* Section Header: —·····— ⚡ EVENTS ⚡ —·····— */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-[1px] w-8 sm:w-28 bg-zinc-600" />
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="h-[1px] w-4 sm:w-16 bg-zinc-600" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[#F5D90A] text-2xl sm:text-4xl font-black select-none">⚡</span>
            <h2 className="font-display italic text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-white tracking-widest uppercase select-none">
              EVENTS
            </h2>
            <span className="text-[#F5D90A] text-2xl sm:text-4xl font-black select-none">⚡</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-[1px] w-4 sm:w-16 bg-zinc-600" />
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="w-1 h-1 rounded-full bg-zinc-500" />
            <span className="h-[1px] w-8 sm:w-28 bg-zinc-600" />
          </div>
        </div>

        {/* -------------------------------------------------------------
            1. TECHNICAL EVENTS ROW (01 - 06) [NEON CYAN]
            ------------------------------------------------------------- */}
        <div className="mb-10 sm:mb-16">
          {/* Subheading: → TECHNICAL EVENTS ───□ */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="font-mono font-bold text-sm xs:text-base sm:text-lg text-[#00E5FF] tracking-wider flex items-center gap-2">
              <span>→</span>
              <span>TECHNICAL EVENTS</span>
              <span className="inline-block w-8 sm:w-12 h-[1.5px] bg-[#00E5FF]" />
              <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-[#00E5FF]" />
            </span>
          </div>

          {/* 5 Technical Cards Row (5 Columns) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {techEvents.map((e) => (
              <div
                key={e.id}
                onClick={() => {
                  triggerComicFX('ARENA!');
                  setSelectedEvent(e);
                }}
                className="group relative bg-[#040608] border-[1.5px] border-[#00E5FF] rounded-xl p-3.5 sm:p-4 pt-8 sm:pt-9 flex flex-col items-center text-center justify-between min-h-[260px] sm:min-h-[295px] cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.07)] hover:shadow-[0_0_25px_rgba(0,229,255,0.35),_3px_3px_0px_#00A8C6] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200"
              >
                {/* --- COMIC SCRABBLING & CORNER MARKS --- */}
                {/* Top-Left Ribbon Badge */}
                <div className="absolute -top-[1.5px] -left-[1.5px] z-10">
                  <div 
                    className="relative bg-[#00E5FF] text-[#000000] font-mono font-black text-xs px-3 py-0.5 shadow-sm flex items-center justify-center rounded-tl-xl"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)',
                      paddingRight: '14px',
                    }}
                  >
                    <span>{e.code}</span>
                    {/* Ribbon top stitch tick */}
                    <span className="absolute -top-0.5 right-2.5 w-1 h-1.5 bg-black/60 rotate-12" />
                  </div>
                  {/* Scratch tick mark right under ribbon */}
                  <span className="absolute -bottom-2 left-0 w-[1.5px] h-2 bg-[#00E5FF] opacity-90" />
                </div>

                {/* Top-Right Corner Scratch Tick */}
                <svg className="absolute -top-1 -right-1 w-4 h-4 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <line x1="14" y1="2" x2="14" y2="8" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="15" y1="7" x2="12" y2="12" stroke="#00E5FF" strokeWidth="1.2" strokeLinecap="round" />
                </svg>

                {/* Bottom-Left Corner Scratch Tick */}
                <svg className="absolute -bottom-1 -left-1 w-4 h-4 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="8" x2="2" y2="14" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="1" y1="11" x2="5" y2="15" stroke="#00E5FF" strokeWidth="1.2" strokeLinecap="round" />
                </svg>

                {/* Bottom-Right Corner Scrabbling Marks (//) */}
                <svg className="absolute -bottom-1 -right-1 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" fill="none">
                  <line x1="18" y1="8" x2="18" y2="18" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="13" y1="11" x2="9" y2="19" stroke="#00E5FF" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="18" y1="12" x2="14" y2="20" stroke="#00E5FF" strokeWidth="1.2" strokeLinecap="round" />
                </svg>

                {/* Subtle comic halftone screen-tone at top */}
                <div 
                  className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-15 rounded-t-xl"
                  style={{
                    backgroundImage: 'radial-gradient(#00E5FF 1px, transparent 1px)',
                    backgroundSize: '7px 7px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), transparent)'
                  }}
                />

                {/* Centered Large Line-Art Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 transition-transform my-auto">
                  {e.id.includes('debug') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00E5FF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 28C22 22 26 18 32 18C38 18 42 22 42 28V36C42 42 38 46 32 46C26 46 22 42 22 36V28Z" />
                      <path d="M32 18V12M28 12H36" />
                      <path d="M14 26L22 30M12 36H22M14 46L22 42" />
                      <path d="M50 26L42 30M52 36H42M50 46L42 42" />
                      <circle cx="32" cy="32" r="3" fill="#00E5FF" />
                    </svg>
                  )}
                  {e.id.includes('signal') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00E5FF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="46" r="4" fill="#00E5FF" />
                      <path d="M32 42V28" strokeWidth="2.8" />
                      <path d="M24 38C20 34 20 28 24 24" />
                      <path d="M40 38C44 34 44 28 40 24" />
                      <path d="M18 44C12 36 12 24 18 16" />
                      <path d="M46 44C52 36 52 24 46 16" />
                      <path d="M26 52L32 46L38 52" />
                    </svg>
                  )}
                  {e.id.includes('sql') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00E5FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="32" cy="18" rx="18" ry="6" />
                      <path d="M14 18V32C14 35.3 22 38 32 38C42 38 50 35.3 50 32V18" />
                      <path d="M14 32V46C14 49.3 22 52 32 52C42 52 50 49.3 50 46V32" />
                      <circle cx="24" cy="32" r="2" fill="#00E5FF" />
                      <circle cx="24" cy="46" r="2" fill="#00E5FF" />
                    </svg>
                  )}
                  {e.id.includes('gadget') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00E5FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="19" y="19" width="26" height="26" rx="4" />
                      <rect x="26" y="26" width="12" height="12" rx="2" fill="#00E5FF" fillOpacity="0.2" />
                      <path d="M24 9V19M32 9V19M40 9V19" />
                      <path d="M24 45V55M32 45V55M40 45V55" />
                      <path d="M9 24H19M9 32H19M9 40H19" />
                      <path d="M45 24H55M45 32H55M45 40H55" />
                    </svg>
                  )}
                  {e.id.includes('paper') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00E5FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 14H52" strokeWidth="3" />
                      <rect x="14" y="16" width="36" height="24" rx="2" />
                      <path d="M20 32L28 24L36 28L44 18" strokeWidth="2.2" />
                      <circle cx="44" cy="18" r="2.5" fill="#00E5FF" />
                      <path d="M32 40V52M22 52L32 40L42 52" strokeWidth="2.5" />
                    </svg>
                  )}
                </div>

                {/* Event Title (Stacked Lines) & Tagline */}
                <div className="w-full mt-auto">
                  <h3 className="font-sans font-black text-sm xs:text-base sm:text-lg text-white uppercase tracking-wider group-hover:text-[#00E5FF] transition-colors leading-tight">
                    {e.mission_name.toLowerCase().includes('gadget') ? (
                      <>
                        <span>GADGET CODES</span>
                        <br />
                        <span className="text-[10px] sm:text-xs text-amber-400 font-mono tracking-normal normal-case block mt-0.5">(Single event)</span>
                      </>
                    ) : e.mission_name.toLowerCase().includes('the last signal') ? (
                      <>
                        <span>THE LAST</span>
                        <br />
                        <span>SIGNAL</span>
                      </>
                    ) : e.mission_name.toLowerCase().includes('lost at sql') ? (
                      <>
                        <span>LOST AT</span>
                        <br />
                        <span>SQL</span>
                      </>
                    ) : e.mission_name.toLowerCase().includes('paper presentation') ? (
                      <>
                        <span>PAPER</span>
                        <br />
                        <span>PRESENTATION</span>
                      </>
                    ) : (
                      <span>{e.mission_name}</span>
                    )}
                  </h3>
                  <p className="font-mono text-[10px] sm:text-[11px] text-[#A1A1AA] mt-2 leading-tight whitespace-pre-line">
                    {e.tagline || e.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------------
            2. NON-TECHNICAL EVENTS ROW (06 - 09) [NEON PINK] + DOODLES
            ------------------------------------------------------------- */}
        <div className="relative mb-6 sm:mb-10">
          {/* Subheading: ✦ NON - TECHNICAL EVENTS ───□ */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="font-mono font-bold text-sm xs:text-base sm:text-lg text-[#FF2E63] tracking-wider flex items-center gap-2">
              <span>✦</span>
              <span>NON - TECHNICAL EVENTS</span>
              <span className="inline-block w-8 sm:w-12 h-[1.5px] bg-[#FF2E63]" />
              <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-[#FF2E63]" />
            </span>
          </div>

          {/* 6 Columns Grid:
              Col 1: Cloud & Star Doodle (underneath Debugging 01)
              Col 2: 06 BORDERLAND @ GCEE (underneath The Last Signal 02)
              Col 3: 07 THINK, STRIKE AND WIN (underneath Lost at SQL 03)
              Col 4: 08 PLOT TWIST (underneath Gadget Codes 04)
              Col 5: 09 SHORT FLIM (underneath Paper Presentation 05)
              Col 6: Flying Paper Airplane Doodle
          */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 items-center">
            
            {/* Column 1 on Desktop: Detailed Comic Cloud Sketch & Star */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col items-center justify-center relative select-none pointer-events-none min-h-[220px] sm:min-h-[295px] pr-2">
              <div className="relative w-full max-w-[190px] h-[170px] flex items-center justify-center">
                {/* Comic Hatching Cumulus Cloud */}
                <svg className="w-full h-full" viewBox="0 0 160 140" fill="none">
                  {/* Outer Cloud Outline with White Puff Top and Ink Border */}
                  <path
                    d="M20 112C10 112 3 102 3 88C3 74 15 64 28 64C28 42 46 26 68 30C78 16 102 18 112 36C124 36 138 48 138 66C138 84 126 94 112 96C108 96 88 102 64 108C40 112 28 112 20 112Z"
                    fill="#E4E4E7"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dense Bottom & Left Hatching Shading (Comic Inking) */}
                  <g stroke="#18181B" strokeWidth="1.8">
                    <line x1="8" y1="92" x2="26" y2="74" />
                    <line x1="12" y1="98" x2="34" y2="76" />
                    <line x1="18" y1="104" x2="44" y2="78" />
                    <line x1="26" y1="108" x2="56" y2="78" />
                    <line x1="36" y1="110" x2="68" y2="78" />
                    <line x1="46" y1="110" x2="80" y2="76" />
                    <line x1="56" y1="108" x2="90" y2="76" />
                    <line x1="68" y1="106" x2="102" y2="76" />
                    <line x1="80" y1="102" x2="114" y2="78" />
                    <line x1="92" y1="98" x2="122" y2="78" />
                    <line x1="104" y1="94" x2="130" y2="76" />
                    {/* Cross-hatch accent lines */}
                    <line x1="16" y1="78" x2="38" y2="102" />
                    <line x1="28" y1="78" x2="52" y2="104" />
                    <line x1="42" y1="78" x2="68" y2="106" />
                    <line x1="58" y1="76" x2="84" y2="104" />
                  </g>

                  {/* Billowing cumulus puff lobe curves */}
                  <path
                    d="M28 64C32 54 40 46 50 42C60 38 70 40 78 46C86 36 100 34 110 40C120 46 126 56 126 66"
                    stroke="#A1A1AA"
                    strokeWidth="2.2"
                    fill="none"
                  />
                  <path
                    d="M48 64C54 56 64 52 74 54C82 56 88 62 92 70"
                    stroke="#A1A1AA"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </svg>

                {/* Comic 4-Point Star Doodle Floating on Cloud */}
                <div className="absolute top-7 right-1">
                  <svg className="w-8 h-8 animate-pulse" viewBox="0 0 32 32" fill="none">
                    <path
                      d="M16 2L18.5 12.5L29 16L18.5 19.5L16 30L13.5 19.5L3 16L13.5 12.5L16 2Z"
                      fill="none"
                      stroke="#F5D90A"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Columns 2 to 5: The 4 Non-Technical Cards (06, 07, 08, 09) */}
            {nonTechEvents.map((e) => (
              <div
                key={e.id}
                onClick={() => {
                  triggerComicFX('ARENA!');
                  setSelectedEvent(e);
                }}
                className="group relative bg-[#080406] border-[1.5px] border-[#FF2E63] rounded-xl p-3.5 sm:p-4 pt-8 sm:pt-9 flex flex-col items-center text-center justify-between min-h-[260px] sm:min-h-[295px] cursor-pointer shadow-[0_0_15px_rgba(255,46,99,0.07)] hover:shadow-[0_0_25px_rgba(255,46,99,0.35),_3px_3px_0px_#C41E45] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200"
              >
                {/* --- COMIC SCRABBLING & CORNER MARKS (EXACT MATCH TO CROP) --- */}
                {/* Top-Left Ribbon Badge with Notch & Stitch */}
                <div className="absolute -top-[1.5px] -left-[1.5px] z-10">
                  <div 
                    className="relative bg-[#FF2E63] text-white font-mono font-black text-xs px-3 py-0.5 shadow-sm flex items-center justify-center rounded-tl-xl"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)',
                      paddingRight: '14px',
                    }}
                  >
                    <span>{e.code}</span>
                    {/* Ribbon top stitch tick */}
                    <span className="absolute -top-0.5 right-2.5 w-1 h-1.5 bg-black/60 rotate-12" />
                  </div>
                  {/* Scratch tick mark right under ribbon */}
                  <span className="absolute -bottom-2 left-0 w-[1.5px] h-2 bg-[#FF2E63] opacity-90" />
                </div>

                {/* Top-Right Corner Scratch Tick */}
                <svg className="absolute -top-1 -right-1 w-4 h-4 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <line x1="14" y1="2" x2="14" y2="8" stroke="#FF2E63" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="15" y1="7" x2="12" y2="12" stroke="#FF2E63" strokeWidth="1.2" strokeLinecap="round" />
                </svg>

                {/* Bottom-Left Corner Scratch Tick */}
                <svg className="absolute -bottom-1 -left-1 w-4 h-4 pointer-events-none" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="8" x2="2" y2="14" stroke="#FF2E63" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="1" y1="11" x2="5" y2="15" stroke="#FF2E63" strokeWidth="1.2" strokeLinecap="round" />
                </svg>

                {/* Bottom-Right Corner Scrabbling Marks (//) */}
                <svg className="absolute -bottom-1 -right-1 w-5 h-5 pointer-events-none" viewBox="0 0 20 20" fill="none">
                  <line x1="18" y1="8" x2="18" y2="18" stroke="#FF2E63" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="13" y1="11" x2="9" y2="19" stroke="#FF2E63" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="18" y1="12" x2="14" y2="20" stroke="#FF2E63" strokeWidth="1.2" strokeLinecap="round" />
                </svg>

                {/* Subtle comic halftone screen-tone at top */}
                <div 
                  className="absolute inset-x-0 top-0 h-24 pointer-events-none opacity-15 rounded-t-xl"
                  style={{
                    backgroundImage: 'radial-gradient(#FF2E63 1px, transparent 1px)',
                    backgroundSize: '7px 7px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1), transparent)'
                  }}
                />

                {/* Centered Large Line-Art Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-[#FF2E63] group-hover:scale-110 transition-transform my-auto">
                  {e.id.includes('borderland') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#FF2E63" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M32 10L48 18V32C48 42 41 50 32 54C23 50 16 42 16 32V18L32 10Z" />
                      <circle cx="32" cy="30" r="7" />
                      <path d="M32 23V37M25 30H39" />
                    </svg>
                  )}
                  {e.id.includes('strike') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#FF2E63" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="32" r="20" />
                      <circle cx="32" cy="32" r="13" />
                      <circle cx="32" cy="32" r="6" fill="#FF2E63" />
                      <path d="M32 6V12M32 52V58M6 32H12M52 32H58" />
                    </svg>
                  )}
                  {e.id.includes('twist') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#FF2E63" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="14" y="16" width="36" height="32" rx="6" />
                      <path d="M22 28C22 26 25 24 28 26" />
                      <path d="M36 26C39 24 42 26 42 28" />
                      <path d="M22 38C26 42 38 42 42 38" />
                      <circle cx="25" cy="27" r="2" fill="#FF2E63" />
                      <circle cx="39" cy="27" r="2" fill="#FF2E63" />
                    </svg>
                  )}
                  {e.id.includes('flim') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#FF2E63" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="10" y="20" width="34" height="28" rx="5" />
                      <path d="M44 28L54 22V46L44 40V28Z" />
                      <circle cx="27" cy="34" r="6" />
                      <circle cx="27" cy="34" r="3" fill="#FF2E63" />
                      <path d="M18 14L22 20M30 14L34 20" />
                    </svg>
                  )}
                </div>

                {/* Event Title (Stacked Lines) & Tagline */}
                <div className="w-full mt-auto">
                  <h3 className="font-sans font-black text-sm xs:text-base sm:text-lg text-white uppercase tracking-wider group-hover:text-[#FF2E63] transition-colors leading-tight">
                    {e.mission_name.toLowerCase().includes('borderland') ? (
                      <>
                        <span>BORDERLAND</span>
                        <br />
                        <span className="text-xs sm:text-sm">@ GCEE</span>
                      </>
                    ) : e.mission_name.toLowerCase().includes('strike') ? (
                      <>
                        <span>THINK, STRIKE</span>
                        <br />
                        <span>AND WIN</span>
                      </>
                    ) : e.mission_name.toLowerCase().includes('plot') ? (
                      <>
                        <span>PLOT</span>
                        <br />
                        <span>TWIST</span>
                      </>
                    ) : e.mission_name.toLowerCase().includes('flim') || e.mission_name.toLowerCase().includes('film') ? (
                      <>
                        <span>SHORT</span>
                        <br />
                        <span>FLIM</span>
                      </>
                    ) : (
                      <span>{e.mission_name}</span>
                    )}
                  </h3>
                  <p className="font-mono text-[10px] sm:text-[11px] text-[#A1A1AA] mt-2 leading-tight whitespace-pre-line">
                    {e.tagline || e.title}
                  </p>
                </div>
              </div>
            ))}

            {/* Column 6 on Desktop: Flying Paper Airplane Doodle with Looped Trail */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-center justify-center relative pointer-events-none select-none min-h-[220px] sm:min-h-[295px]">
              <svg className="w-full h-full max-w-[200px] max-h-[190px]" viewBox="0 0 200 190" fill="none">
                {/* Dashed flight loop */}
                <path 
                  d="M15 155C45 185 70 120 55 95C40 70 30 120 75 110C120 100 145 60 175 30" 
                  stroke="#FF2E63" 
                  strokeWidth="2" 
                  strokeDasharray="5 5" 
                  fill="none" 
                />
                {/* Flying Paper Airplane */}
                <g transform="translate(150, 10) rotate(12)">
                  <path d="M0 30L42 0L30 42L18 30L0 30Z" fill="#141417" stroke="#FF2E63" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M42 0L18 30" stroke="#FF2E63" strokeWidth="1.8" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          EVENT DETAILS INTERACTIVE MODAL
          ========================================================================= */}
      {selectedEvent && (
        <div 
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-100 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141417] border-[3px] ${
              selectedEvent.event_type === 'TECH' ? 'border-[#3CE7FF]' : 'border-[#FF3366]'
            } shadow-[8px_8px_0px_#000000] p-5 sm:p-7 rounded-2xl space-y-5 select-text`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#2A2A2E] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 font-mono font-black text-xs rounded uppercase ${
                    selectedEvent.event_type === 'TECH' ? 'bg-[#3CE7FF] text-[#0D0D0F]' : 'bg-[#FF3366] text-white'
                  }`}>
                    {selectedEvent.code}
                  </span>
                  <span className="font-mono text-xs text-[#A8A8AC] uppercase">
                    {selectedEvent.category}
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide">
                  {selectedEvent.mission_name}
                </h3>
                <p className={`font-comic text-xs sm:text-sm font-bold ${
                  selectedEvent.event_type === 'TECH' ? 'text-[#3CE7FF]' : 'text-[#FF3366]'
                }`}>
                  {selectedEvent.tagline || selectedEvent.title}
                </p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 bg-[#222226] hover:bg-[#FF3366] text-[#F2F2F0] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Meta Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#F5D90A]" /> TEAM SIZE
                </div>
                <div className="text-white font-bold mt-0.5">
                  {selectedEvent.team_size_min}{selectedEvent.team_size_min !== selectedEvent.team_size_max ? ` - ${selectedEvent.team_size_max}` : ''} Members
                </div>
              </div>
              <div className="p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#F5D90A]" /> TIME
                </div>
                <div className="text-white font-bold mt-0.5 truncate">
                  {selectedEvent.schedule_time}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                <div className="text-[#A8A8AC] text-[10px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#3CE7FF]" /> VENUE
                </div>
                <div className="text-white font-bold mt-0.5 truncate">
                  {selectedEvent.venue}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold">
                // BRIEFING
              </h4>
              <p className="font-comic text-sm text-[#D0D0D4] leading-relaxed">
                {selectedEvent.description}
              </p>
            </div>

            {/* Rules */}
            {selectedEvent.rules && selectedEvent.rules.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold">
                  // RULES & GUIDELINES
                </h4>
                <ul className="space-y-1.5">
                  {selectedEvent.rules.map((rule, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2 text-xs font-comic text-[#C0C0C5]">
                      <span className="text-[#3CE7FF] shrink-0 font-bold">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cash Prizes */}
            {selectedEvent.prizes && (
              <div className="p-3 bg-[#1A1A1E] border border-[#2E2E33] rounded-xl space-y-2">
                <h4 className="font-mono text-xs text-[#F5D90A] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#F5D90A]" /> PRIZE REWARDS
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-[#222228] rounded border border-[#3A3A40]">
                    <div className="text-[10px] text-[#A8A8AC]">1ST PRIZE</div>
                    <div className="text-[#F5D90A] font-bold text-xs sm:text-sm mt-0.5">{selectedEvent.prizes.first}</div>
                  </div>
                  <div className="p-2 bg-[#222228] rounded border border-[#3A3A40]">
                    <div className="text-[10px] text-[#A8A8AC]">2ND PRIZE</div>
                    <div className="text-white font-bold text-xs sm:text-sm mt-0.5">{selectedEvent.prizes.second}</div>
                  </div>
                  <div className="p-2 bg-[#222228] rounded border border-[#3A3A40]">
                    <div className="text-[10px] text-[#A8A8AC]">3RD PRIZE</div>
                    <div className="text-[#A8A8AC] font-bold text-xs sm:text-sm mt-0.5">{selectedEvent.prizes.third}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Coordinators */}
            {selectedEvent.coordinators && selectedEvent.coordinators.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-mono text-xs text-[#A8A8AC] uppercase tracking-wider font-bold">
                  // HELPLINE & COORDINATORS
                </h4>
                <div className="flex flex-wrap gap-3">
                  {selectedEvent.coordinators.map((c, cIdx) => (
                    <div key={cIdx} className="text-xs font-mono text-[#D0D0D4] flex items-center gap-1.5 bg-[#1A1A1E] px-2.5 py-1 rounded border border-[#2E2E33]">
                      <span>{c.name} ({c.role}):</span>
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-[#3CE7FF] hover:underline font-bold">
                          {c.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Register CTA Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  triggerComicFX('DEPLOY!');
                  navigate(`/register?mission=${selectedEvent.id}`);
                }}
                className={`w-full py-3 font-display text-sm sm:text-base tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${
                  selectedEvent.event_type === 'TECH'
                    ? 'bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[#3CE7FF]'
                    : 'bg-[#FF3366] hover:bg-[#F5D90A] text-white hover:text-[#0D0D0F] border-[#FF3366]'
                }`}
              >
                <span>REGISTER FOR {selectedEvent.mission_name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* =========================================================================
          5. FOOTER COMPONENT
          ========================================================================= */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteHomePage;

