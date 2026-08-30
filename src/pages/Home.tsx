import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../services/store';
import { registerNav } from '../services/registerNavigation';
import { WebsiteFooter } from '../components/layout/Footer';
import robotMascot from '../assets/1.svg';
import megaphoneSvg from '../assets/megaphone.svg';
import zinniaSvg from '../assets/zinnia.svg';
import nationalBadge from '../assets/national.svg';
import evenBadge from '../assets/even.svg';
import annBadge from '../assets/ann.svg';
import cloudSvg from '../assets/cloud.svg';
import priceSvg from '../assets/price.svg';
import { Users, Clock, MapPin, ArrowRight, Trophy, Zap, Shield, Sparkles, Layers, Terminal, Gamepad2, Award, X, Phone, CheckCircle2, Mail, Send } from 'lucide-react';
import { ComicHandDrawnCard } from '../components/events/ComicHandDrawnCard';

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
    <div className="relative w-full min-h-screen bg-transparent text-[#F2F2F0] flex flex-col justify-between px-2 sm:px-4 md:px-6 pt-1 pb-4 select-none scroll-smooth">
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
      <header className="relative z-60 max-w-7xl mx-auto w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 pt-1 px-1 sm:px-3">
        {/* Left: Illustrated ZINNIA Comic Logo with Magnetic Pull */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Magnetic Logo Badge (ZINNIA '26 SVG Asset) */}
          <MagneticElement strength={0.25} onClick={() => triggerComicFX('BOOM!')}>
            <div className="cursor-pointer group relative -rotate-2 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1 flex items-center">
              <img
                src={zinniaSvg}
                alt="ZINNIA '26 Logo"
                className="h-12 sm:h-15 md:h-18 lg:h-20 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              />
            </div>
          </MagneticElement>

          {/* Comics Code Authority Parody Stamp ("APPROVED BY THE CSE CODE") */}
          <div
            onClick={() => triggerComicFX('CODE APPROVED!')}
            className="hidden sm:flex flex-col items-center justify-center relative p-1.5 sm:p-2 bg-black border-[2px] border-white/80 shadow-[3px_3px_0px_#000000] rotate-2 cursor-pointer hover:rotate-0 transition-transform active:scale-95 select-none group"
          >
            {/* Outer Sketched Frame Accent */}
            <div className="absolute -bottom-1 -left-1 inset-0 border border-white/40 pointer-events-none" />
            <span className="font-comic font-black text-white text-[10px] sm:text-xs tracking-wider leading-none">
              APPROVED
            </span>
            <span className="font-comic font-black text-[#E81C65] text-[8px] sm:text-[10px] italic tracking-wide leading-tight my-0.5">
              BY THE
            </span>
            <span className="font-comic font-black text-white text-[10px] sm:text-xs tracking-wider leading-none">
              CSE CODE
            </span>
          </div>
        </div>

        {/* Center/Right Comic Navigation Tabs with Magnetic Pull */}
        <nav className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* EVENTS TAB */}
          <MagneticElement strength={0.3} onClick={() => scrollToSection('events', 'EVENTS!')}>
            <button className="comic-button" type="button">
              {/* FIXED BOTTOM BOX */}
              <span className="back-box" />
              {/* MOVING TOP BOX */}
              <span className="front-box">
                <span className="lightning">⚡</span>
                <span>EVENTS</span>
              </span>
            </button>
          </MagneticElement>

          {/* ABOUT TAB */}
          <MagneticElement strength={0.3} onClick={() => scrollToSection('about', 'ABOUT!')}>
            <button className="comic-button" type="button">
              {/* FIXED BOTTOM BOX */}
              <span className="back-box" />
              {/* MOVING TOP BOX */}
              <span className="front-box">
                <span>ABOUT</span>
              </span>
            </button>
          </MagneticElement>

          {/* Register Navbar Magnetic Button */}
          <MagneticElement strength={0.35} onClick={() => navigate('/register')}>
            <button className="comic-button-cyan" type="button">
              {/* FIXED BOTTOM BOX */}
              <span className="back-box-cyan" />
              {/* MOVING TOP BOX */}
              <span className="front-box-cyan">
                <span>REGISTER</span>
              </span>
            </button>
          </MagneticElement>
        </nav>
      </header>

      {/* =========================================================================
          2. HERO SECTION (Matched to Reference Image)
          ========================================================================= */}
      <section className="relative z-30 max-w-6xl mx-auto w-full pt-1 sm:pt-2 pb-1 sm:pb-2 px-3 sm:px-6 select-none overflow-visible">

        {/* Background Comic Halftone Decorative Layer (Behind all content, center stays clean black) */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-0">
          {/* 1. Bottom-left strictly behind/below the robot */}
          <div className="comic-halftone -bottom-10 -left-6 opacity-85 scale-110" />

          {/* 2. Bottom-right strictly behind/around the speaker */}
          <div className="comic-halftone -bottom-14 -right-10 opacity-85 scale-110" />
        </div>

        {/* Hand-Drawn Rough Comic Ink Scribbles & Doodles Layer (Minimal framing in hero) */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-10 select-none">
          {/* Left Mid Pink Comic Star */}
          <div className="absolute top-44 left-3 sm:left-6 rotate-12">
            <svg viewBox="0 0 50 50" className="w-6 sm:w-8 h-6 sm:h-8 fill-none opacity-85">
              <path
                d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z"
                fill="#E81C65"
                stroke="#E81C65"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Right Mid Pink Comic Star near Prize Badge */}
          <div className="absolute top-28 right-2 sm:right-6 -rotate-12">
            <svg viewBox="0 0 50 50" className="w-6 sm:w-7 h-6 sm:h-7 fill-none opacity-85">
              <path
                d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z"
                fill="#E81C65"
                stroke="#E81C65"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Institution & Department Header (Full Width, Centered) */}
        <div className="relative z-20 flex flex-col items-center text-center w-full mb-2 sm:mb-4">
          <h3 className="font-comic font-black text-[#FFE600] italic uppercase text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl tracking-wider leading-tight drop-shadow-[2px_2px_0px_#000]">
            GOVERNMENT COLLEGE OF ENGINEERING, ERODE
          </h3>
          <p className="font-comic font-extrabold text-[#00D2FF] italic uppercase text-xs xs:text-sm sm:text-lg md:text-xl lg:text-2xl tracking-wide leading-tight drop-shadow-[1.5px_1.5px_0px_#000] mt-0.5">
            DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING
          </p>
        </div>

        {/* ---- MAIN HERO ROW: [Robot] [ZINNIA + Badges + CTA] [Starburst + Megaphone] ---- */}
        <div className="relative z-20 flex items-end justify-center w-full">

          {/* LEFT: Robot Mascot — absolutely positioned to overlap from the left */}
          <div className="hidden md:block absolute left-0 bottom-0 z-30" style={{ width: '340px' }}>
            <img
              src={robotMascot}
              alt="Zinnia Robot Mascot"
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)]"
            />
          </div>
          {/* Mobile robot (inline, centered above title) */}
          <div className="md:hidden flex justify-center w-full mb-3">
            <img
              src={robotMascot}
              alt="Zinnia Robot Mascot"
              className="w-48 xs:w-56 sm:w-64 h-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* CENTER: Title + Badges + Register CTA */}
          <div className="flex flex-col items-center text-center w-full md:pl-[240px] lg:pl-[280px] md:pr-[160px] lg:pr-[200px]">

            {/* Giant ZINNIA '26 Title */}
            <div className="relative inline-flex items-start justify-center max-w-full">
              <h1 className="font-display text-5xl xs:text-6xl sm:text-7xl md:text-[8rem] lg:text-[10rem] text-white tracking-tight leading-none uppercase select-none drop-shadow-[5px_5px_0px_#000]">
                ZINNIA
              </h1>
              <span className="font-comic text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#00D2FF] font-black leading-none -translate-y-1 sm:-translate-y-3 ml-1 sm:ml-2 select-none drop-shadow-[3px_3px_0px_#000]">
                '26
              </span>
            </div>

            {/* Subtitle Badges Row (SVG Assets: National, Events, Anna Univ) */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 md:gap-5 mt-1 sm:mt-2 sm:-translate-x-4 md:-translate-x-8 lg:-translate-x-10">
              {/* NATIONAL LEVEL */}
              <div
                onClick={() => triggerComicFX('NATIONAL LEVEL!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center"
              >
                <img
                  src={nationalBadge}
                  alt="National Level"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* 9 ACTIVE EVENTS */}
              <div
                onClick={() => triggerComicFX('9 BATTLES!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center"
              >
                <img
                  src={evenBadge}
                  alt="9 Active Events"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                />
              </div>

              {/* ANNA UNIV VERIFIED */}
              <div
                onClick={() => triggerComicFX('ANNA UNIV VERIFIED!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center"
              >
                <img
                  src={annBadge}
                  alt="Anna Univ Verified"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                />
              </div>
            </div>

            {/* REGISTER FOR ZINNIA → CTA Button (Hand-Inked Comic Panel & Screen-Print Offset Effect) */}
            <div className="mt-2.5 sm:mt-3.5 w-full max-w-md flex justify-center sm:-translate-x-4 md:-translate-x-8 lg:-translate-x-10">
              <MagneticElement strength={0.3} onClick={() => navigate('/register')} className="w-full sm:w-auto">
                <div className="comic-cta-wrapper w-full sm:w-auto group">

                  {/* Fixed Lower Box (Screen-print offset shadow with uneven printed outline) */}
                  <span className="comic-cta-back" />

                  {/* Offset Screen-Print Registration Lines (Hand-drawn ink strokes below & around box) */}
                  <div className="absolute -inset-2 pointer-events-none z-0">
                    {/* Bottom sketched pen hatch lines */}
                    <svg viewBox="0 0 400 30" className="absolute -bottom-3.5 left-2 right-2 w-[96%] h-4 stroke-white/50 fill-none">
                      <path d="M 10 12 Q 180 16 380 11" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M 30 18 Q 200 22 360 17" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                    </svg>

                    {/* Top-Right Corner Pen Tick / Registration Mark */}
                    <svg viewBox="0 0 30 30" className="absolute -top-2.5 -right-2 w-6 h-6 stroke-[#00D2FF] fill-none">
                      <path d="M 6 12 L 20 6 L 14 20" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="22" y1="4" x2="26" y2="2" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>

                    {/* Bottom-Left Corner Pen Scribble */}
                    <svg viewBox="0 0 30 30" className="absolute -bottom-2 -left-2.5 w-6 h-6 stroke-white/70 fill-none">
                      <path d="M 8 18 L 16 26 L 24 20" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="4" y1="20" x2="10" y2="28" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>

                    {/* Left Speed/Motion Ink Flecks */}
                    <svg viewBox="0 0 20 40" className="absolute top-1/4 -left-3 w-4 h-8 stroke-white/60 fill-none">
                      <line x1="12" y1="6" x2="2" y2="12" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="14" y1="20" x2="4" y2="24" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>

                    {/* Right Speed/Motion Ink Flecks */}
                    <svg viewBox="0 0 20 40" className="absolute top-1/4 -right-3 w-4 h-8 stroke-[#00D2FF] fill-none">
                      <line x1="4" y1="8" x2="16" y2="14" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="2" y1="22" x2="12" y2="26" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Moving Top Cyan Box (Hand-Inked Front Panel) */}
                  <button
                    type="button"
                    className="comic-cta-front px-8 sm:px-12 md:px-14 py-3 sm:py-3.5 flex items-center justify-center gap-3 w-full sm:w-auto"
                  >
                    <span className="font-comic font-black text-base sm:text-lg md:text-xl lg:text-2xl tracking-wider uppercase italic">
                      REGISTER FOR ZINNIA
                    </span>

                    {/* Hand-Drawn Comic Arrow */}
                    <svg viewBox="0 0 32 20" className="w-6 sm:w-7 h-4 sm:h-5 stroke-black fill-none shrink-0 group-hover:translate-x-1.5 transition-transform duration-150">
                      <path d="M 3 10 L 25 10" strokeWidth="3.2" strokeLinecap="round" />
                      <path d="M 16 3 L 27 10 L 16 17" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                </div>
              </MagneticElement>
            </div>
          </div>

          {/* RIGHT: Megaphone (desktop only, absolutely positioned) */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 z-20" style={{ width: '230px' }}>

            {/* Megaphone with Lightning Sparks */}
            <div className="absolute -bottom-8 -right-4 group cursor-pointer hover:scale-110 transition-transform duration-300" onClick={() => triggerComicFX('LOUD!')}>

              <img src={megaphoneSvg} alt="Megaphone" className="w-64 md:w-80 lg:w-96 h-auto drop-shadow-[0_6px_20px_rgba(0,0,0,0.85)] -rotate-12 select-none pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
            3. COUNTDOWN (Framed by Hand-Drawn Comic Scribbles)
            ========================================================================= */}
      <div className="relative z-30 flex flex-col items-center justify-center mt-2 sm:mt-3 md:mt-4 pt-1 sm:pt-2 w-full md:pl-[200px] lg:pl-[240px] md:pr-[140px] lg:pr-[180px] sm:-translate-x-4 md:-translate-x-8 lg:-translate-x-10">
        {/* Background Layer: Halftones + Scattered Hand-Inked Scribbles Distributed Around Timer & CTA */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-0 select-none">
          {/* Ambient Halftones */}
          <div className="comic-halftone -top-10 -left-12 opacity-30 scale-75" />
          <div className="comic-halftone -top-10 -right-12 opacity-30 scale-75" />

          {/* --- SCATTERED DOODLES (Framing Counter & Registration) --- */}

          {/* 1. White Action / Speed Lines (Mid-Left flank of Counter) */}
          <div className="absolute top-10 left-2 sm:left-6 md:left-12 -rotate-6">
            <svg viewBox="0 0 80 80" className="w-9 sm:w-12 h-9 sm:h-12 fill-none opacity-75">
              <path d="M 12 68 Q 26 44 42 16" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 38 22 L 46 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 28 74 Q 44 48 64 12" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 50 76 Q 62 54 76 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 3. Pink Comic Accent Star (Lower-Left of Counter) */}
          <div className="absolute -bottom-6 left-6 sm:left-16 md:left-24 rotate-12">
            <svg viewBox="0 0 50 50" className="w-5 sm:w-7 h-5 sm:h-7 fill-none opacity-85">
              <path
                d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z"
                fill="#E81C65"
                stroke="#E81C65"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 4. Irregular 3-Bump White Cloud (Bottom-Center-Left under Counter) */}
          <div className="hidden sm:block absolute -bottom-10 left-28 sm:left-40 md:left-56 rotate-6">
            <svg viewBox="0 0 100 70" className="w-12 sm:w-15 h-9 sm:h-11 fill-none opacity-70">
              <path
                d="M 12 48 C 6 36, 18 22, 34 26 C 42 12, 62 10, 72 22 C 86 18, 96 32, 88 46 C 82 54, 68 56, 52 52 C 38 56, 22 54, 12 48"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M 24 53 C 38 57, 60 55, 74 49" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          {/* 5. White Zig-Zag Speed Scribble (Upper-Right flank of Counter / below CTA) */}
          <div className="absolute -top-4 right-10 sm:right-24 md:right-36 -rotate-6">
            <svg viewBox="0 0 60 70" className="w-8 sm:w-11 h-10 sm:h-13 fill-none opacity-75">
              <path
                d="M 46 8 L 22 24 L 40 36 L 12 52 L 42 64"
                stroke="white"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M 28 22 L 16 30 L 30 38" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>

          {/* 6. Yellow Hand-Inked Lightning Bolt (Mid-Right flank of Counter) */}
          <div className="absolute top-12 right-4 sm:right-10 md:right-16 rotate-12">
            <svg viewBox="0 0 70 90" className="w-8 sm:w-10 h-10 sm:h-14 fill-none drop-shadow-[0_2px_8px_rgba(255,230,0,0.4)]">
              <path
                d="M 38 6 L 16 42 L 34 40 L 22 84 L 54 36 L 36 38 L 48 6 Z"
                fill="#FFE600"
                stroke="#FFE600"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M 10 28 L 6 38" stroke="#FFE600" strokeWidth="2" strokeLinecap="round" />
              <path d="M 52 20 L 62 14" stroke="#FFE600" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* 7. Irregular 3-Bump White Cloud (Bottom-Right under Counter) */}
          <div className="hidden sm:block absolute -bottom-10 right-8 sm:right-20 md:right-32 -rotate-6">
            <svg viewBox="0 0 100 70" className="w-12 sm:w-15 h-9 sm:h-11 fill-none opacity-70">
              <path
                d="M 14 46 C 8 34, 20 20, 36 24 C 44 10, 64 8, 74 20 C 88 16, 98 30, 90 44 C 84 52, 70 54, 54 50 C 40 54, 24 52, 14 46"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M 26 51 C 40 55, 62 53, 76 47" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          {/* 8. Pink Comic Accent Star (Far-Right of Counter) */}
          <div className="absolute top-4 right-2 sm:right-6 md:right-10 -rotate-12">
            <svg viewBox="0 0 50 50" className="w-4 sm:w-6 h-4 sm:h-6 fill-none opacity-85">
              <path
                d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z"
                fill="#E81C65"
                stroke="#E81C65"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Illustrated Comic Countdown Module */}
        <div className="relative z-10 flex flex-col items-center max-w-full px-1">
          {/* ₹15,000+ PRIZE POOL! Starburst (price.svg asset vertically flipped with matching overlay text) */}
          <div
            className="hidden lg:block absolute -left-36 sm:-left-48 md:-left-56 lg:-left-64 -top-16 sm:-top-20 md:-top-24 hover:scale-105 transition-transform cursor-pointer z-30 select-none"
            onClick={() => triggerComicFX('PRIZES!')}
          >
            <div className="relative flex items-center justify-center w-36 sm:w-44 md:w-52 lg:w-56 h-36 sm:h-44 md:h-52 lg:h-56">
              <img
                src={priceSvg}
                alt="Prize Pool"
                className="w-full h-full object-contain select-none pointer-events-none scale-y-[-1] drop-shadow-[0_6px_22px_rgba(249,3,99,0.55)]"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center -rotate-[25deg]">
                <span className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[32px] text-white leading-none font-black drop-shadow-[2px_2px_0px_#000]">
                  ₹15,000+
                </span>
                <span className="font-comic text-[11px] sm:text-sm md:text-base text-[#FFE600] font-black leading-tight drop-shadow-[1.5px_1.5px_0px_#000] mt-1 tracking-wide">
                  PRIZE POOL!
                </span>
              </div>
            </div>
          </div>

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


      {/* =========================================================================
          EVENTS SECTION (100% Pixel-Faithful to Reference Design)
          ========================================================================= */}
      <section
        id="events"
        className="relative z-30 max-w-7xl mx-auto w-full pt-6 sm:pt-10 pb-0 px-2 sm:px-4 mt-2 sm:mt-4 mb-0 overflow-visible"
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {techEvents.map((e) => (
              <ComicHandDrawnCard
                key={e.id}
                code={e.code}
                variant="tech"
                onClick={() => {
                  triggerComicFX('ARENA!');
                  setSelectedEvent(e);
                }}
              >
                {/* Centered Large Line-Art Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-[#00d9f7] group-hover:scale-110 transition-transform my-auto">
                  {e.id.includes('debug') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00d9f7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 28C22 22 26 18 32 18C38 18 42 22 42 28V36C42 42 38 46 32 46C26 46 22 42 22 36V28Z" />
                      <path d="M32 18V12M28 12H36" />
                      <path d="M14 26L22 30M12 36H22M14 46L22 42" />
                      <path d="M50 26L42 30M52 36H42M50 46L42 42" />
                      <circle cx="32" cy="32" r="3" fill="#00d9f7" />
                    </svg>
                  )}
                  {e.id.includes('signal') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00d9f7" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="46" r="4" fill="#00d9f7" />
                      <path d="M32 42V28" strokeWidth="2.8" />
                      <path d="M24 38C20 34 20 28 24 24" />
                      <path d="M40 38C44 34 44 28 40 24" />
                      <path d="M18 44C12 36 12 24 18 16" />
                      <path d="M46 44C52 36 52 24 46 16" />
                      <path d="M26 52L32 46L38 52" />
                    </svg>
                  )}
                  {e.id.includes('sql') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00d9f7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="32" cy="18" rx="18" ry="6" />
                      <path d="M14 18V32C14 35.3 22 38 32 38C42 38 50 35.3 50 32V18" />
                      <path d="M14 32V46C14 49.3 22 52 32 52C42 52 50 49.3 50 46V32" />
                      <circle cx="24" cy="32" r="2" fill="#00d9f7" />
                      <circle cx="24" cy="46" r="2" fill="#00d9f7" />
                    </svg>
                  )}
                  {e.id.includes('gadget') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00d9f7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="19" y="19" width="26" height="26" rx="4" />
                      <rect x="26" y="26" width="12" height="12" rx="2" fill="#00d9f7" fillOpacity="0.2" />
                      <path d="M24 9V19M32 9V19M40 9V19" />
                      <path d="M24 45V55M32 45V55M40 45V55" />
                      <path d="M9 24H19M9 32H19M9 40H19" />
                      <path d="M45 24H55M45 32H55M45 40H55" />
                    </svg>
                  )}
                  {e.id.includes('paper') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#00d9f7" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 14H52" strokeWidth="3" />
                      <rect x="14" y="16" width="36" height="24" rx="2" />
                      <path d="M20 32L28 24L36 28L44 18" strokeWidth="2.2" />
                      <circle cx="44" cy="18" r="2.5" fill="#00d9f7" />
                      <path d="M32 40V52M22 52L32 40L42 52" strokeWidth="2.5" />
                    </svg>
                  )}
                </div>

                {/* Event Title (Stacked Lines) & Tagline */}
                <div className="w-full mt-auto">
                  <h3 className="font-sans font-black text-sm xs:text-base sm:text-lg text-white uppercase tracking-wider group-hover:text-[#00d9f7] transition-colors leading-tight">
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
              </ComicHandDrawnCard>
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------------
            2. NON-TECHNICAL EVENTS ROW (06 - 09) [NEON PINK] + DOODLES
            ------------------------------------------------------------- */}
        <div className="relative mb-2 sm:mb-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 items-center">

            {/* Column 1 on Desktop: Official Comic Cloud Asset */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex flex-col items-center justify-center relative select-none pointer-events-none min-h-[220px] sm:min-h-[295px] pr-2">
              <div className="relative w-full max-w-[210px] flex items-center justify-center">
                <img
                  src={cloudSvg}
                  alt="Comic Cloud"
                  className="w-full h-auto object-contain select-none pointer-events-none mix-blend-screen drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]"
                />
              </div>
            </div>

            {/* Columns 2 to 5: The 4 Non-Technical Cards (06, 07, 08, 09) */}
            {nonTechEvents.map((e) => (
              <ComicHandDrawnCard
                key={e.id}
                code={e.code}
                variant="non-tech"
                onClick={() => {
                  triggerComicFX('ARENA!');
                  setSelectedEvent(e);
                }}
              >
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
              </ComicHandDrawnCard>
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
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#141417] border-[3px] ${selectedEvent.event_type === 'TECH' ? 'border-[#3CE7FF]' : 'border-[#FF3366]'
              } shadow-[8px_8px_0px_#000000] p-5 sm:p-7 rounded-2xl space-y-5 select-text`}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#2A2A2E] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 font-mono font-black text-xs rounded uppercase ${selectedEvent.event_type === 'TECH' ? 'bg-[#3CE7FF] text-[#0D0D0F]' : 'bg-[#FF3366] text-white'
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
                <p className={`font-comic text-xs sm:text-sm font-bold ${selectedEvent.event_type === 'TECH' ? 'text-[#3CE7FF]' : 'text-[#FF3366]'
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
                className={`w-full py-3 font-display text-sm sm:text-base tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${selectedEvent.event_type === 'TECH'
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

