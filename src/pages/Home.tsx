import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { Users, Clock, MapPin, ArrowRight, Trophy, Zap, Shield, Sparkles, Layers, Terminal, Gamepad2, Award, X, Phone, CheckCircle2, Mail, Send, Menu, ChevronDown } from 'lucide-react';
import { EventScheduleView } from '../components/ui/EventScheduleView';
import { ComicHandDrawnCard } from '../components/events/ComicHandDrawnCard';
import { EventMission } from '../types';

// 2D Comic Digit Swap Component (Printed comic stamp with Bangers font)
const ComicFlipNumber: React.FC<{
  value: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ value, className = '', style }) => {
  const [current, setCurrent] = useState(value);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    if (value !== current) {
      setCurrent(value);
      setTick(true);
      const timer = setTimeout(() => setTick(false), 160);
      return () => clearTimeout(timer);
    }
  }, [value, current]);

  return (
    <div className={`flex items-center justify-center overflow-visible ${className}`}>
      <span
        key={current}
        style={{
          fontFamily: '"Bangers", cursive',
          letterSpacing: '0.03em',
          ...style,
        }}
        className={`timer-value leading-none select-none font-bold ${tick ? 'tick' : ''}`}
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

const TARGET_EVENT_DATE = new Date('2026-09-24T09:00:00+05:30').getTime();

const calculateTimeLeft = () => {
  const now = new Date().getTime();
  const diff = Math.max(0, TARGET_EVENT_DATE - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
};

export const WebsiteHomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Real-time ticking countdown to September 24, 2026 (calculated instantly without initial dummy values)
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [secSnap, setSecSnap] = useState(false);
  const isFirstMountRef = React.useRef(true);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    setSecSnap(true);
    const timer = setTimeout(() => setSecSnap(false), 160);
    return () => clearTimeout(timer);
  }, [timeLeft.seconds]);

  // Selected Event Modal State
  const [selectedEvent, setSelectedEvent] = useState<EventMission | null>(null);

  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedEvent]);

  // Live Events Sync from Supabase DB / Store
  const [events, setEvents] = useState<EventMission[]>(() => store.getEvents());
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Handle hash / event selection when coming from other pages (e.g. /#events or ?event=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const eventParam = params.get('event') || params.get('mission');
    const state = location.state as { scrollTo?: string; eventId?: string } | null;
    const targetEventId = eventParam || state?.eventId;

    if (targetEventId && events.length > 0) {
      const found = events.find(
        (e) =>
          e.id.toLowerCase() === targetEventId.toLowerCase() ||
          e.code?.toLowerCase() === targetEventId.toLowerCase() ||
          e.title.toLowerCase().includes(targetEventId.toLowerCase())
      );
      if (found) {
        setSelectedEvent(found);
      }
    }

    if (
      location.hash === '#events' ||
      window.location.hash === '#events' ||
      state?.scrollTo === 'events' ||
      targetEventId
    ) {
      const timer = setTimeout(() => {
        const eventsEl = document.getElementById('events');
        if (eventsEl) {
          eventsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.search, location.state, events]);

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

  const techEvents = events.filter((e) => e.event_type === 'TECH' && e.id !== 'prize-distribution');
  const nonTechEvents = events.filter((e) => e.event_type === 'NON_TECH' && e.id !== 'prize-distribution');

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
    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };
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
    <div className="relative w-full min-h-screen bg-transparent text-[#EEEEEA] flex flex-col justify-between px-2 sm:px-4 md:px-6 pt-1 pb-4 select-none scroll-smooth">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#E5BD00] border-3 border-[#090A0B] shadow-[6px_6px_0px_#090A0B] rotate-6 sticker-pop">
            <span className="font-display text-4xl sm:text-6xl text-[#D51F55] tracking-wider">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. TOP NAVBAR (100% 2D Illustrated Comic Style with Magnetic Buttons)
          ========================================================================= */}
      <header className="relative z-60 max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 pt-1 px-1 sm:px-3">
        {/* Left: Illustrated ZINNIA Comic Logo with Magnetic Pull */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Magnetic Logo Badge (ZINNIA '26 SVG Asset) */}
          <MagneticElement strength={0.25} onClick={() => triggerComicFX('BOOM!')}>
            <div className="cursor-pointer group relative -rotate-2 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1 flex items-center">
              <img
                src={zinniaSvg}
                alt="ZINNIA '26 Logo"
                className="h-20 sm:h-16 md:h-18 lg:h-20 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              />
            </div>
          </MagneticElement>


        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          className="sm:hidden flex items-center justify-center w-11 h-11 bg-[#111214] border-2 border-[#EEEEEA]/80 shadow-[3px_3px_0px_#090A0B] cursor-pointer active:scale-95 transition-transform"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#EEEEEA]" /> : <Menu className="w-6 h-6 text-[#EEEEEA]" />}
        </button>

        {/* Desktop Comic Navigation Tabs with Magnetic Pull */}
        <nav className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
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


          {/* CONTACT US TAB */}
          <MagneticElement strength={0.3} onClick={() => { triggerComicFX('CONTACT!'); navigate('/contact'); }}>
            <button className="comic-button" type="button">
              {/* FIXED BOTTOM BOX */}
              <span className="back-box" />
              {/* MOVING TOP BOX */}
              <span className="front-box">
                <span>CONTACT</span>
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

      {/* Mobile Menu Drawer (Authentic Hand-Drawn 2D Comic Panel) */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-[100] bg-[#08090A] flex flex-col items-center justify-center p-4 select-none overflow-y-auto animate-in fade-in duration-150">
          {/* 1–2 Sparse Localized Halftone & Ink Doodles (Not covering whole screen) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
            {/* Top-left small halftone patch */}
            <div className="comic-halftone -top-10 -left-10 opacity-25 scale-75" />
            {/* Bottom-right small halftone patch */}
            <div className="comic-halftone -bottom-10 -right-10 opacity-25 scale-75" />

            {/* Hand-drawn pink star doodle (top-left) */}
            <div className="absolute top-16 left-6 rotate-12 opacity-60">
              <svg viewBox="0 0 50 50" className="w-6 h-6 fill-none">
                <path d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z" fill="#D51F55" stroke="#D51F55" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Hand-drawn yellow lightning doodle (bottom-right) */}
            <div className="absolute bottom-20 right-6 -rotate-12 opacity-70">
              <svg viewBox="0 0 40 50" className="w-5 h-7 fill-[#E5BD00]">
                <path d="M 22 2 L 6 26 L 18 24 L 10 48 L 34 18 L 22 20 Z" />
              </svg>
            </div>
          </div>

          {/* Close Button (Hand-Drawn Comic Square) */}
          <button
            type="button"
            className="absolute top-4 right-4 z-20 w-10 h-10 bg-[#111214] border-2 border-[#EEEEEA] text-[#EEEEEA] shadow-[3px_3px_0px_#090A0B] flex items-center justify-center cursor-pointer active:translate-x-0.5 active:translate-y-0.5 -rotate-3 transition-transform"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Menu Card Content Container */}
          <div className="relative z-10 w-full max-w-[310px] xs:max-w-[340px] flex flex-col items-center gap-3.5">
            
            {/* NAVIGATION MENU Sticker (Irregular quadrilateral yellow comic sticker) */}
            <div className="mb-1">
              <div
                className="relative inline-block px-4 py-1.5 bg-[#E5BD00] border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] -rotate-2"
                style={{
                  clipPath: 'polygon(2% 8%, 98% 1%, 100% 93%, 1% 98%)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[#090A0B] text-xs font-black">⚡</span>
                  <span className="font-comic font-black italic text-[#090A0B] text-xs xs:text-sm tracking-wider uppercase">
                    NAVIGATION MENU
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Navigation Buttons (Sticker arrangement: HOME, EVENTS, PASSES, CONTACT) */}
            <div className="grid grid-cols-2 gap-3 w-full">
              
              {/* 1. HOME */}
              <div
                className="relative group cursor-pointer select-none"
                style={{ transform: 'rotate(-0.8deg)' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerComicFX('HOME!');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {/* Slightly offset back border box */}
                <div
                  className="absolute inset-0 bg-[#090A0B] border-[1.5px] border-[#B8B8B2]"
                  style={{
                    transform: 'translate(3px, 3px)',
                    clipPath: 'polygon(1% 5%, 98% 2%, 99% 95%, 2% 98%)',
                  }}
                />
                {/* Front comic button */}
                <div
                  className="relative z-10 bg-[#111214] border-2 border-[#EEEEEA] px-3 py-2.5 flex items-center justify-center transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    clipPath: 'polygon(2% 3%, 99% 1%, 98% 97%, 1% 95%)',
                  }}
                >
                  <svg className="absolute -top-1 -left-1 w-2.5 h-2.5 text-[#EEEEEA] pointer-events-none" viewBox="0 0 10 10" fill="none">
                    <path d="M1 8 L1 1 L8 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <svg className="absolute -bottom-1 -right-1 w-2.5 h-2.5 text-[#EEEEEA] pointer-events-none" viewBox="0 0 10 10" fill="none">
                    <path d="M9 2 L9 9 L2 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <div className="absolute top-1 right-2 w-1.5 h-[1.5px] bg-[#0FA9C6] opacity-80" />
                  <span className="font-comic font-black text-sm xs:text-base text-[#EEEEEA] uppercase tracking-wider">
                    HOME
                  </span>
                </div>
              </div>

              {/* 2. EVENTS */}
              <div
                className="relative group cursor-pointer select-none"
                style={{ transform: 'rotate(1.1deg)' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToSection('events', 'EVENTS!');
                }}
              >
                {/* Slightly offset back border box */}
                <div
                  className="absolute inset-0 bg-[#090A0B] border-[1.5px] border-[#B8B8B2]"
                  style={{
                    transform: 'translate(3px, 3px)',
                    clipPath: 'polygon(2% 2%, 99% 4%, 97% 98%, 1% 94%)',
                  }}
                />
                {/* Front comic button */}
                <div
                  className="relative z-10 bg-[#111214] border-2 border-[#EEEEEA] px-3 py-2.5 flex items-center justify-center gap-1 transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    clipPath: 'polygon(1% 1%, 98% 3%, 99% 96%, 2% 98%)',
                  }}
                >
                  <svg className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[#EEEEEA] pointer-events-none" viewBox="0 0 10 10" fill="none">
                    <path d="M9 8 L9 1 L2 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <svg className="absolute -bottom-1 -left-1 w-2.5 h-2.5 text-[#EEEEEA] pointer-events-none" viewBox="0 0 10 10" fill="none">
                    <path d="M1 2 L1 9 L8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span className="text-[#E5BD00] text-xs font-black">⚡</span>
                  <span className="font-comic font-black text-sm xs:text-base text-[#EEEEEA] uppercase tracking-wider">
                    EVENTS
                  </span>
                </div>
              </div>


              {/* 4. CONTACT */}
              <div
                className="relative group cursor-pointer select-none"
                style={{ transform: 'rotate(-0.9deg)' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerComicFX('CONTACT!');
                  navigate('/contact');
                }}
              >
                {/* Slightly offset back border box */}
                <div
                  className="absolute inset-0 bg-[#090A0B] border-[1.5px] border-[#B8B8B2]"
                  style={{
                    transform: 'translate(3px, 3px)',
                    clipPath: 'polygon(1% 2%, 98% 4%, 99% 97%, 2% 95%)',
                  }}
                />
                {/* Front comic button */}
                <div
                  className="relative z-10 bg-[#111214] border-2 border-[#EEEEEA] px-3 py-2.5 flex items-center justify-center transition-transform active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    clipPath: 'polygon(2% 1%, 99% 2%, 98% 98%, 1% 96%)',
                  }}
                >
                  <svg className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[#EEEEEA] pointer-events-none" viewBox="0 0 10 10" fill="none">
                    <path d="M9 8 L9 1 L2 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <svg className="absolute -bottom-1 -left-1 w-2.5 h-2.5 text-[#EEEEEA] pointer-events-none" viewBox="0 0 10 10" fill="none">
                    <path d="M1 2 L1 9 L8 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  <span className="font-comic font-black text-sm xs:text-base text-[#EEEEEA] uppercase tracking-wider">
                    CONTACT
                  </span>
                </div>
              </div>
            </div>

            {/* 5. REGISTER */}
            <div
              className="w-full mt-1 cursor-pointer select-none group"
              onClick={() => {
                setMobileMenuOpen(false);
                triggerComicFX('REGISTER!');
                navigate('/register');
              }}
            >
              <div className="relative w-full">
                {/* Fixed offset back-box underneath */}
                <div
                  className="absolute inset-0 bg-[#090A0B] border-2 border-[#B8B8B2]"
                  style={{
                    transform: 'translate(4px, 4px)',
                    clipPath: 'polygon(1.2% 4.5%, 98.5% 1%, 100% 6.5%, 98.5% 95.5%, 96% 99%, 3.5% 98.5%, 0.5% 92.5%)',
                  }}
                />
                {/* Moving top cyan panel */}
                <div
                  className="relative z-10 w-full bg-[#0FA9C6] hover:bg-[#E5BD00] border-[2.5px] border-[#090A0B] px-5 py-3 flex items-center justify-center gap-2.5 transition-all active:translate-x-1 active:translate-y-1"
                  style={{
                    clipPath: 'polygon(0.8% 3.5%, 99.2% 1.2%, 100% 5.8%, 99% 94.5%, 96.5% 98.5%, 3% 97.2%, 0.8% 92%)',
                  }}
                >
                  <span className="font-comic font-black text-lg xs:text-xl tracking-wider uppercase italic text-[#090A0B]">
                    REGISTER
                  </span>
                  <svg viewBox="0 0 32 20" className="w-6 h-4 stroke-[#090A0B] fill-none shrink-0 group-hover:translate-x-1 transition-transform">
                    <path d="M 3 10 L 25 10" strokeWidth="3.2" strokeLinecap="round" />
                    <path d="M 16 3 L 27 10 L 16 17" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          2. HERO SECTION (Matched to Reference Image)
          ========================================================================= */}
      <section className="relative z-30 max-w-6xl mx-auto w-full pt-1 sm:pt-2 pb-1 sm:pb-2 px-3 sm:px-6 select-none overflow-visible">

        {/* Background Comic Halftone Decorative Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-0">
          <div className="comic-halftone -bottom-10 -left-6 opacity-85 scale-110" />
          <div className="comic-halftone -bottom-14 -right-10 opacity-85 scale-110" />
        </div>

        {/* Hand-Drawn Rough Comic Ink Scribbles & Doodles Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-10 select-none">
          {/* Left Mid Pink Comic Star */}
          <div className="absolute top-44 left-3 sm:left-6 rotate-12">
            <svg viewBox="0 0 50 50" className="w-6 sm:w-8 h-6 sm:h-8 fill-none opacity-85">
              <path
                d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z"
                fill="#D51F55"
                stroke="#D51F55"
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
                fill="#D51F55"
                stroke="#D51F55"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Institution & Department Header */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center w-full mb-1 sm:mb-3 px-2">
          <h3
            className="text-[#E5BD00] uppercase text-xs xs:text-sm sm:text-2xl md:text-3xl tracking-widest leading-tight drop-shadow-[2px_2px_0px_#090A0B] font-mono font-bold"
          >
            GOVERNMENT COLLEGE OF ENGINEERING, ERODE
          </h3>
          <p
            className="text-[#3CE7FF] uppercase text-[11px] xs:text-xs sm:text-xl md:text-2xl tracking-widest leading-tight drop-shadow-[1.5px_1.5px_0px_#090A0B] mt-0.5 font-mono font-bold"
          >
            DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING
          </p>
        </div>

        {/* ---- MAIN HERO ROW ---- */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center w-full">

          {/* LEFT: Robot Mascot */}
          <div
            className="hidden md:block absolute bottom-0 z-30 pointer-events-none"
            style={{
              left: '-85px',
              width: '220px',
            }}
          >
            <img
              src={robotMascot}
              alt="Zinnia Robot Mascot"
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)]"
            />
          </div>

          {/* Mobile: Comic Poster Composition (Centering & Highlighting ZINNIA '26) */}
          <div className="md:hidden relative w-full pt-1 pb-2 overflow-visible">

            {/* Background Lightning Accents */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-visible">
              <div className="absolute top-0 left-1 rotate-[-15deg]">
                <svg viewBox="0 0 40 50" className="w-5 h-7 fill-[#E5BD00]">
                  <path d="M 22 2 L 6 26 L 18 24 L 10 48 L 34 18 L 22 20 Z" />
                </svg>
              </div>
              <div className="absolute top-40 left-0 rotate-12">
                <svg viewBox="0 0 40 50" className="w-5 h-7 fill-[#E5BD00]">
                  <path d="M 22 2 L 6 26 L 18 24 L 10 48 L 34 18 L 22 20 Z" />
                </svg>
              </div>
              <div className="absolute top-0 right-1 rotate-12">
                <svg viewBox="0 0 40 50" className="w-5 h-7 stroke-[#EEEEEA] fill-none stroke-[2]">
                  <path d="M 22 2 L 8 22 L 20 20 L 12 46 L 36 16 L 22 18 Z" />
                </svg>
              </div>
              <div className="absolute bottom-12 right-0 rotate-[-20deg]">
                <svg viewBox="0 0 40 50" className="w-6 h-8 fill-[#E5BD00]">
                  <path d="M 22 2 L 6 26 L 18 24 L 10 48 L 34 18 L 22 20 Z" />
                </svg>
              </div>
            </div>

            {/* Centered ZINNIA '26 Title Block on Mobile (Equal Top & Bottom Gap) */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center w-full mt-5 xs:mt-6 mb-1 px-1">
              
              {/* LEFT SIDE 1: Mascot Peeking Top-Left (Nudged up for gap) */}
              <div className="absolute -top-9 xs:-top-10 -left-3 xs:-left-2 z-30 pointer-events-none">
                <img
                  src={robotMascot}
                  alt="Zinnia Robot Mascot"
                  className="w-13 xs:w-16 sm:w-18 h-auto object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* LEFT SIDE 2: Prize Pool Starburst (Positioned in middle with clear gap above and below) */}
              <div
                className="absolute top-[62px] xs:top-[68px] -left-2 xs:left-0 z-40 cursor-pointer active:scale-95 transition-transform"
                onClick={() => triggerComicFX('PRIZES!')}
              >
                <div className="relative flex items-center justify-center w-13 h-13 xs:w-15 xs:h-15">
                  <img
                    src={priceSvg}
                    alt="Prize Pool"
                    className="w-full h-full object-contain scale-y-[-1]"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center -rotate-[22deg]">
                    <span className="font-display text-[8.5px] xs:text-[9.5px] text-[#EEEEEA] leading-none font-black drop-shadow-[1.5px_1.5px_0px_#090A0B]">
                      ₹20,000+
                    </span>
                    <span className="font-comic text-[5.5px] xs:text-[6.5px] text-[#E5BD00] font-black leading-tight drop-shadow-[1px_1px_0px_#090A0B] mt-0.5 tracking-wide">
                      PRIZE POOL!
                    </span>
                  </div>
                </div>
              </div>

              {/* CENTER: ZINNIA '26 Title (UNTOUCHED & FIXED) */}
              <div className="relative inline-flex items-start justify-center py-2 px-6">
                <h1
                  className="font-display text-[#FFFFFF] uppercase select-none -rotate-[2deg] text-center whitespace-nowrap tracking-wider relative z-10"
                  style={{
                    fontSize: 'clamp(60px, 18vw, 110px)',
                    lineHeight: '0.85',
                    letterSpacing: '0.02em',
                    textShadow: '4px 4px 0px #090A0B, 7px 7px 0px #000, 0 0 25px rgba(60, 231, 255, 0.45)',
                  }}
                >
                  ZINNIA
                </h1>
                <span className="font-comic text-2xl xs:text-3xl text-[#0FA9C6] font-black leading-none select-none drop-shadow-[3px_3px_0px_#090A0B] -rotate-3 tracking-wider -translate-y-2 xs:-translate-y-3 ml-1.5 xs:ml-2 shrink-0 relative z-20">
                  '26
                </span>
              </div>

              {/* RIGHT SIDE: Megaphone Horn */}
              <div
                className="absolute top-1 -right-3 sm:right-0 z-30 cursor-pointer active:scale-95 transition-transform"
                onClick={() => triggerComicFX('LOUD!')}
              >
                <img
                  src={megaphoneSvg}
                  alt="Megaphone"
                  className="w-18 xs:w-22 h-auto object-contain select-none pointer-events-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.85)] -rotate-12"
                />
              </div>

            </div>

            {/* Badges Row below with clear gap from Prize Pool */}
            <div className="relative z-20 flex items-center justify-center gap-2 xs:gap-3 mt-10 xs:mt-12 mb-4 w-full px-1 flex-wrap xs:flex-nowrap">
              <div
                onClick={() => triggerComicFX('NATIONAL LEVEL!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center justify-center flex-1 min-w-0"
              >
                <img src={nationalBadge} alt="National Level" className="h-8 xs:h-9 sm:h-10 w-full max-h-[38px] object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]" />
              </div>
              <div
                onClick={() => triggerComicFX('9 BATTLES!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center justify-center flex-1 min-w-0"
              >
                <img src={evenBadge} alt="9 Active Events" className="h-8 xs:h-9 sm:h-10 w-full max-h-[38px] object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]" />
              </div>
              <div
                onClick={() => triggerComicFX('ANNA UNIV VERIFIED!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center justify-center flex-1 min-w-0"
              >
                <img src={annBadge} alt="Anna Univ Verified" className="h-8 xs:h-9 sm:h-10 w-full max-h-[38px] object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]" />
              </div>
            </div>

            {/* Register CTA (mobile) */}
            <div className="relative z-20 my-4 w-full flex justify-center px-1">
              <MagneticElement strength={0.3} onClick={() => navigate('/register')} className="w-full">
                <div className="comic-cta-wrapper w-full group">
                  <span className="comic-cta-back" />
                  <button
                    type="button"
                    className="comic-cta-front px-5 py-3.5 flex items-center justify-center gap-3 w-full"
                  >
                    <span className="font-comic font-black text-sm xs:text-base tracking-wider uppercase italic text-[#090A0B] whitespace-nowrap">
                      REGISTER FOR ZINNIA
                    </span>
                    <svg viewBox="0 0 32 20" className="w-5 h-4 stroke-[#090A0B] fill-none shrink-0 group-hover:translate-x-1.5 transition-transform duration-150">
                      <path d="M 3 10 L 25 10" strokeWidth="3.2" strokeLinecap="round" />
                      <path d="M 16 3 L 27 10 L 16 17" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </MagneticElement>
            </div>
          </div>

          {/* Desktop: Title + Badges + Register CTA */}
          <div className="hidden md:flex flex-col items-center text-center w-full max-w-4xl mx-auto px-4 z-20">

            {/* Giant ZINNIA '26 Title (Desktop) */}
            <div className="relative inline-flex items-start justify-center max-w-full">
              <h1
                className="font-display md:text-[7.5rem] lg:text-[9.5rem] text-[#FFFFFF] tracking-tight leading-none uppercase select-none"
                style={{
                  textShadow: '5px 5px 0px #090A0B, 9px 9px 0px #000, 0 0 35px rgba(60, 231, 255, 0.45)',
                }}
              >
                ZINNIA
              </h1>
              <span className="font-comic md:text-5xl lg:text-6xl text-[#0FA9C6] font-black leading-none -translate-y-3 ml-2 select-none drop-shadow-[3px_3px_0px_#090A0B]">
                '26
              </span>
            </div>

            {/* Subtitle Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-5 mt-2">
              <div
                onClick={() => triggerComicFX('NATIONAL LEVEL!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center"
              >
                <img src={nationalBadge} alt="National Level" className="h-10 md:h-12 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" />
              </div>
              <div
                onClick={() => triggerComicFX('9 BATTLES!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center"
              >
                <img src={evenBadge} alt="9 Active Events" className="h-10 md:h-12 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" />
              </div>
              <div
                onClick={() => triggerComicFX('ANNA UNIV VERIFIED!')}
                className="relative group cursor-pointer hover:scale-105 transition-transform duration-150 active:scale-95 flex items-center"
              >
                <img src={annBadge} alt="Anna Univ Verified" className="h-10 md:h-12 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" />
              </div>
            </div>

            {/* REGISTER FOR ZINNIA → CTA Button */}
            <div className="mt-3.5 w-full max-w-md flex justify-center">
              <MagneticElement strength={0.3} onClick={() => navigate('/register')} className="w-auto">
                <div className="comic-cta-wrapper w-auto group">
                  <span className="comic-cta-back" />
                  <div className="absolute -inset-2 pointer-events-none z-0">
                    <svg viewBox="0 0 400 30" className="absolute -bottom-3.5 left-2 right-2 w-[96%] h-4 stroke-[#EEEEEA]/50 fill-none">
                      <path d="M 10 12 Q 180 16 380 11" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M 30 18 Q 200 22 360 17" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                    </svg>
                    <svg viewBox="0 0 30 30" className="absolute -top-2.5 -right-2 w-6 h-6 stroke-[#0FA9C6] fill-none">
                      <path d="M 6 12 L 20 6 L 14 20" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="22" y1="4" x2="26" y2="2" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <svg viewBox="0 0 30 30" className="absolute -bottom-2 -left-2.5 w-6 h-6 stroke-[#EEEEEA]/70 fill-none">
                      <path d="M 8 18 L 16 26 L 24 20" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="4" y1="20" x2="10" y2="28" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <svg viewBox="0 0 20 40" className="absolute top-1/4 -left-3 w-4 h-8 stroke-[#EEEEEA]/60 fill-none">
                      <line x1="12" y1="6" x2="2" y2="12" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="14" y1="20" x2="4" y2="24" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <svg viewBox="0 0 20 40" className="absolute top-1/4 -right-3 w-4 h-8 stroke-[#0FA9C6] fill-none">
                      <line x1="4" y1="8" x2="16" y2="14" strokeWidth="1.8" strokeLinecap="round" />
                      <line x1="2" y1="22" x2="12" y2="26" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    className="comic-cta-front px-12 md:px-14 py-3.5 flex items-center justify-center gap-3 w-auto"
                  >
                    <span className="font-comic font-black text-lg md:text-xl lg:text-2xl tracking-wider uppercase italic text-[#090A0B]">
                      REGISTER FOR ZINNIA
                    </span>
                    <svg viewBox="0 0 32 20" className="w-7 h-5 stroke-[#090A0B] fill-none shrink-0 group-hover:translate-x-1.5 transition-transform duration-150">
                      <path d="M 3 10 L 25 10" strokeWidth="3.2" strokeLinecap="round" />
                      <path d="M 16 3 L 27 10 L 16 17" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </MagneticElement>
            </div>
          </div>

          {/* RIGHT: Megaphone */}
          <div className="hidden lg:block absolute -right-6 lg:-right-8 top-0 bottom-0 z-20 w-[200px] lg:w-[220px]">
            <div className="absolute -bottom-8 right-0 group cursor-pointer hover:scale-110 transition-transform duration-300" onClick={() => triggerComicFX('LOUD!')}>
              <img src={megaphoneSvg} alt="Megaphone" className="w-56 md:w-64 lg:w-72 h-auto drop-shadow-[0_6px_20px_rgba(0,0,0,0.85)] -rotate-12 select-none pointer-events-none" />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
            3. COUNTDOWN SECTION
            ========================================================================= */}
      <div className="relative z-30 flex flex-col items-center justify-center mt-3 md:mt-4 pt-2 w-full px-2 max-w-5xl mx-auto">
        {/* Background Layer: Halftones + Scattered Hand-Inked Scribbles */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-0 select-none">
          <div className="comic-halftone -top-10 -left-12 opacity-30 scale-75" />
          <div className="comic-halftone -top-10 -right-12 opacity-30 scale-75" />

          {/* 1. White Action / Speed Lines */}
          <div className="absolute top-10 left-2 sm:left-6 md:left-12 -rotate-6">
            <svg viewBox="0 0 80 80" className="w-8 sm:w-12 h-8 sm:h-12 fill-none opacity-75">
              <path d="M 12 68 Q 26 44 42 16" stroke="#EEEEEA" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 38 22 L 46 8" stroke="#EEEEEA" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M 28 74 Q 44 48 64 12" stroke="#EEEEEA" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 50 76 Q 62 54 76 30" stroke="#EEEEEA" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>

          {/* 3. Pink Comic Accent Star */}
          <div className="absolute -bottom-6 left-6 sm:left-16 md:left-24 rotate-12">
            <svg viewBox="0 0 50 50" className="w-5 sm:w-7 h-5 sm:h-7 fill-none opacity-85">
              <path d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z" fill="#D51F55" stroke="#D51F55" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>

          {/* 4. White Cloud */}
          <div className="hidden xs:block absolute -bottom-10 left-32 md:left-56 rotate-6">
            <svg viewBox="0 0 100 70" className="w-12 sm:w-15 h-8 sm:h-11 fill-none opacity-70">
              <path d="M 12 48 C 6 36, 18 22, 34 26 C 42 12, 62 10, 72 22 C 86 18, 96 32, 88 46 C 82 54, 68 56, 52 52 C 38 56, 22 54, 12 48" stroke="#EEEEEA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 24 53 C 38 57, 60 55, 74 49" stroke="#EEEEEA" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          {/* 5. Zig-Zag */}
          <div className="absolute -top-4 right-16 sm:right-24 md:right-36 -rotate-6">
            <svg viewBox="0 0 60 70" className="w-8 sm:w-11 h-10 sm:h-13 fill-none opacity-75">
              <path d="M 46 8 L 22 24 L 40 36 L 12 52 L 42 64" stroke="#EEEEEA" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 28 22 L 16 30 L 30 38" stroke="#EEEEEA" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>

          {/* 6. Yellow Lightning */}
          <div className="absolute top-8 sm:top-12 right-4 sm:right-10 md:right-16 rotate-12">
            <svg viewBox="0 0 70 90" className="w-7 sm:w-10 h-10 sm:h-14 fill-none">
              <path d="M 38 6 L 16 42 L 34 40 L 22 84 L 54 36 L 36 38 L 48 6 Z" fill="#E5BD00" stroke="#E5BD00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 10 28 L 6 38" stroke="#E5BD00" strokeWidth="2" strokeLinecap="round" />
              <path d="M 52 20 L 62 14" stroke="#E5BD00" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* 7. White Cloud Right */}
          <div className="hidden xs:block absolute -bottom-10 right-14 sm:right-20 md:right-32 -rotate-6">
            <svg viewBox="0 0 100 70" className="w-12 sm:w-15 h-8 sm:h-11 fill-none opacity-70">
              <path d="M 14 46 C 8 34, 20 20, 36 24 C 44 10, 64 8, 74 20 C 88 16, 98 30, 90 44 C 84 52, 70 54, 54 50 C 40 54, 24 52, 14 46" stroke="#EEEEEA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 26 51 C 40 55, 62 53, 76 47" stroke="#EEEEEA" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          {/* 8. Pink Star Right */}
          <div className="absolute top-4 right-2 sm:right-6 md:right-10 -rotate-12">
            <svg viewBox="0 0 50 50" className="w-5 sm:w-6 h-5 sm:h-6 fill-none opacity-85">
              <path d="M 25 4 Q 26 20 44 24 Q 28 26 24 44 Q 22 28 4 25 Q 20 22 25 4 Z" fill="#D51F55" stroke="#D51F55" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Countdown Module */}
        <div className="relative z-10 flex flex-col items-center max-w-full px-1">
          {/* ₹20,000+ PRIZE POOL! Starburst */}
          <div
            className="hidden lg:block absolute -left-36 md:-left-56 lg:-left-64 -top-16 md:-top-24 hover:scale-105 transition-transform cursor-pointer z-30 select-none"
            onClick={() => triggerComicFX('PRIZES!')}
          >
            <div className="relative flex items-center justify-center w-44 md:w-52 lg:w-56 h-44 md:h-52 lg:h-56">
              <img src={priceSvg} alt="Prize Pool" className="w-full h-full object-contain select-none pointer-events-none scale-y-[-1]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center -rotate-[25deg]">
                <span className="font-display text-2xl md:text-3xl lg:text-[32px] text-[#EEEEEA] leading-none font-black drop-shadow-[2px_2px_0px_#090A0B]">₹20,000+</span>
                <span className="font-comic text-sm md:text-base text-[#E5BD00] font-black leading-tight drop-shadow-[1.5px_1.5px_0px_#090A0B] mt-1 tracking-wide">PRIZE POOL!</span>
              </div>
            </div>
          </div>

          {/* Caption Header: Hand-Drawn Gray Comic Label / Sticker with Rough Edges */}
          <div
            onClick={() => triggerComicFX('SYMPOSIUM!')}
            className="relative inline-flex items-center justify-center px-4 py-1 bg-[#111214] text-[#B8B8B2] text-xs sm:text-sm uppercase -rotate-1 cursor-pointer mb-3 select-none active:scale-95 transition-transform"
            style={{
              fontFamily: '"Bangers", cursive',
              letterSpacing: '0.12em',
              clipPath: 'polygon(1.2% 14%, 98.8% 2%, 100% 88%, 0.8% 97%)',
              border: '2px solid #B8B8B2',
              boxShadow: '3px 3px 0px #090A0B',
            }}
          >
            SYMPOSIUM COMMENCES IN
          </div>

          {/* Countdown Comic Number Boxes (Hand-Drawn Double Outline & Offset Layers) */}
          <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-3.5">
            
            {/* 1. DAYS BOX (Hand-drawn Comic Panel) */}
            <div
              className="relative group cursor-pointer select-none"
              style={{ transform: 'rotate(-1deg)' }}
            >
              {/* Offset secondary print-registration outline behind */}
              <div
                className="absolute inset-0 bg-[#090A0B] border-[1.8px] border-[#B8B8B2]/40"
                style={{
                  transform: 'translate(3px, 3px)',
                  clipPath: 'polygon(2% 4%, 98.5% 1%, 99% 96%, 1% 97%)',
                }}
              />
              {/* Front hand-drawn dark black panel */}
              <div
                className="relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#111214] border-2 border-[#EEEEEA]/85 min-w-[58px] xs:min-w-[66px] sm:min-w-[76px] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  clipPath: 'polygon(1.8% 2%, 99% 1.2%, 98.2% 98%, 1% 96.5%)',
                }}
              >
                {/* Hand-drawn ink scratches & corner ticks */}
                <svg className="absolute -top-1 -left-1 w-3 h-3 text-[#EEEEEA]/60 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M1 9 L1 1 L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M3 5 L5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <svg className="absolute -bottom-1 -right-1 w-3 h-3 text-[#EEEEEA]/60 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M11 3 L11 11 L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                <ComicFlipNumber
                  value={timeLeft.days}
                  className="text-3xl xs:text-4xl sm:text-5xl text-[#EEEEEA]"
                  style={{ transform: 'rotate(-1deg) translateY(-1px)' }}
                />
                <span
                  style={{ fontFamily: '"Bangers", cursive', letterSpacing: '0.08em', transform: 'rotate(-0.5deg)' }}
                  className="text-[10px] xs:text-xs sm:text-sm text-[#B8B8B2] font-bold uppercase mt-0.5"
                >
                  DAYS
                </span>
              </div>
            </div>

            {/* Comic Separator: Two hand-placed irregular ink dots */}
            <div className="flex flex-col items-center justify-center gap-2 px-0.5 sm:px-1 select-none pointer-events-none">
              <svg viewBox="0 0 10 10" className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#EEEEEA] opacity-75">
                <path d="M 5 1.5 C 7.5 1.2, 8.8 3.2, 8.2 5.5 C 7.6 7.8, 5.8 8.6, 3.8 8.2 C 1.8 7.8, 1.2 5.6, 2.1 3.5 C 2.8 1.8, 3.8 1.6, 5 1.5 Z" />
              </svg>
              <svg viewBox="0 0 10 10" className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#EEEEEA] opacity-75 -rotate-45">
                <path d="M 4.8 1.8 C 7.2 1.5, 8.5 3.5, 8 5.8 C 7.5 8, 5.5 8.4, 3.5 8 C 1.6 7.6, 1.4 5.2, 2.4 3.2 C 3.1 1.9, 3.9 1.9, 4.8 1.8 Z" />
              </svg>
            </div>

            {/* 2. HRS BOX (Hand-drawn Comic Panel) */}
            <div
              className="relative group cursor-pointer select-none"
              style={{ transform: 'rotate(0.8deg)' }}
            >
              {/* Offset secondary print-registration outline behind */}
              <div
                className="absolute inset-0 bg-[#090A0B] border-[1.8px] border-[#B8B8B2]/40"
                style={{
                  transform: 'translate(3px, 3px)',
                  clipPath: 'polygon(1% 2%, 99% 3.5%, 98% 98%, 2% 95%)',
                }}
              />
              {/* Front hand-drawn dark black panel */}
              <div
                className="relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#111214] border-2 border-[#EEEEEA]/85 min-w-[58px] xs:min-w-[66px] sm:min-w-[76px] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  clipPath: 'polygon(1.2% 1.5%, 98.8% 3%, 99% 97%, 1.5% 98%)',
                }}
              >
                {/* Hand-drawn ink scratches & corner ticks */}
                <svg className="absolute -top-1 -right-1 w-3 h-3 text-[#EEEEEA]/60 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M11 9 L11 1 L3 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M7 3 L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <svg className="absolute -bottom-1 -left-1 w-3 h-3 text-[#EEEEEA]/60 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3 L1 11 L9 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                <ComicFlipNumber
                  value={timeLeft.hours}
                  className="text-3xl xs:text-4xl sm:text-5xl text-[#EEEEEA]"
                  style={{ transform: 'rotate(0.5deg) translateY(0.5px)' }}
                />
                <span
                  style={{ fontFamily: '"Bangers", cursive', letterSpacing: '0.08em', transform: 'rotate(0.8deg)' }}
                  className="text-[10px] xs:text-xs sm:text-sm text-[#B8B8B2] font-bold uppercase mt-0.5"
                >
                  HRS
                </span>
              </div>
            </div>

            {/* Comic Separator: Two hand-placed irregular ink dots */}
            <div className="flex flex-col items-center justify-center gap-2 px-0.5 sm:px-1 select-none pointer-events-none">
              <svg viewBox="0 0 10 10" className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#EEEEEA] opacity-75">
                <path d="M 5 1.5 C 7.5 1.2, 8.8 3.2, 8.2 5.5 C 7.6 7.8, 5.8 8.6, 3.8 8.2 C 1.8 7.8, 1.2 5.6, 2.1 3.5 C 2.8 1.8, 3.8 1.6, 5 1.5 Z" />
              </svg>
              <svg viewBox="0 0 10 10" className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#EEEEEA] opacity-75 -rotate-45">
                <path d="M 4.8 1.8 C 7.2 1.5, 8.5 3.5, 8 5.8 C 7.5 8, 5.5 8.4, 3.5 8 C 1.6 7.6, 1.4 5.2, 2.4 3.2 C 3.1 1.9, 3.9 1.9, 4.8 1.8 Z" />
              </svg>
            </div>

            {/* 3. MIN BOX (Hand-drawn Comic Panel) */}
            <div
              className="relative group cursor-pointer select-none"
              style={{ transform: 'rotate(-0.7deg)' }}
            >
              {/* Offset secondary print-registration outline behind */}
              <div
                className="absolute inset-0 bg-[#090A0B] border-[1.8px] border-[#B8B8B2]/40"
                style={{
                  transform: 'translate(3px, 3px)',
                  clipPath: 'polygon(2% 1%, 98% 3%, 99% 97%, 1% 95%)',
                }}
              />
              {/* Front hand-drawn dark black panel */}
              <div
                className="relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#111214] border-2 border-[#EEEEEA]/85 min-w-[58px] xs:min-w-[66px] sm:min-w-[76px] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  clipPath: 'polygon(1.5% 2.5%, 98.5% 1%, 98% 97.5%, 1.2% 96%)',
                }}
              >
                {/* Hand-drawn ink scratches & corner ticks */}
                <svg className="absolute -top-1 -left-1 w-3 h-3 text-[#EEEEEA]/60 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M1 9 L1 1 L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M3 5 L5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <svg className="absolute -bottom-1 -right-1 w-3 h-3 text-[#EEEEEA]/60 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M11 3 L11 11 L3 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>

                <ComicFlipNumber
                  value={timeLeft.minutes}
                  className="text-3xl xs:text-4xl sm:text-5xl text-[#EEEEEA]"
                  style={{ transform: 'rotate(-0.7deg) translateY(-0.5px)' }}
                />
                <span
                  style={{ fontFamily: '"Bangers", cursive', letterSpacing: '0.08em', transform: 'rotate(-0.4deg)' }}
                  className="text-[10px] xs:text-xs sm:text-sm text-[#B8B8B2] font-bold uppercase mt-0.5"
                >
                  MIN
                </span>
              </div>
            </div>

            {/* Comic Separator: Two hand-placed irregular ink dots */}
            <div className="flex flex-col items-center justify-center gap-2 px-0.5 sm:px-1 select-none pointer-events-none">
              <svg viewBox="0 0 10 10" className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#EEEEEA] opacity-75">
                <path d="M 5 1.5 C 7.5 1.2, 8.8 3.2, 8.2 5.5 C 7.6 7.8, 5.8 8.6, 3.8 8.2 C 1.8 7.8, 1.2 5.6, 2.1 3.5 C 2.8 1.8, 3.8 1.6, 5 1.5 Z" />
              </svg>
              <svg viewBox="0 0 10 10" className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#EEEEEA] opacity-75 -rotate-45">
                <path d="M 4.8 1.8 C 7.2 1.5, 8.5 3.5, 8 5.8 C 7.5 8, 5.5 8.4, 3.5 8 C 1.6 7.6, 1.4 5.2, 2.4 3.2 C 3.1 1.9, 3.9 1.9, 4.8 1.8 Z" />
              </svg>
            </div>

            {/* 4. SEC BOX (Hand-drawn Comic Restrained Pink Panel #D51F55 + Dark Pink Offset #A81443) */}
            <div
              className={`relative group cursor-pointer select-none ${secSnap ? 'sec-box-snap' : ''}`}
              style={{ transform: 'rotate(1.1deg)' }}
            >
              {/* Offset darker pink ink outline behind */}
              <div
                className="absolute inset-0 bg-[#090A0B] border-[2px] border-[#A81443]"
                style={{
                  transform: 'translate(3.5px, 3.5px)',
                  clipPath: 'polygon(1% 3%, 99% 1%, 98% 96%, 2% 98%)',
                }}
              />
              {/* Front restrained printed pink panel */}
              <div
                className="relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#D51F55] border-2 border-[#A81443] min-w-[58px] xs:min-w-[66px] sm:min-w-[76px] transition-transform active:translate-x-0.5 active:translate-y-0.5"
                style={{
                  clipPath: 'polygon(1.2% 1.8%, 98.8% 1.2%, 99% 96%, 1% 97.5%)',
                }}
              >
                {/* Corner ink scratches in dark pink / black ink */}
                <svg className="absolute -top-1 -right-1 w-3 h-3 text-[#090A0B]/70 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M11 9 L11 1 L3 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M7 3 L9 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <svg className="absolute -bottom-1 -left-1 w-3 h-3 text-[#090A0B]/70 pointer-events-none" viewBox="0 0 12 12" fill="none">
                  <path d="M1 3 L1 11 L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>

                <ComicFlipNumber
                  value={timeLeft.seconds}
                  className="text-3xl xs:text-4xl sm:text-5xl text-[#EEEEEA]"
                  style={{ transform: 'rotate(1deg) translateY(0.5px)' }}
                />
                <span
                  style={{ fontFamily: '"Bangers", cursive', letterSpacing: '0.08em', transform: 'rotate(0.6deg)' }}
                  className="text-[10px] xs:text-xs sm:text-sm text-[#E5BD00] font-bold uppercase mt-0.5 drop-shadow-[1.5px_1.5px_0px_#090A0B]"
                >
                  SEC
                </span>
              </div>
            </div>

          </div>

          {/* Timeline Status Callout */}
          <div
            onClick={() => triggerComicFX('TIMELINE!')}
            className="mt-3.5 sm:mt-4 px-3 xs:px-4 py-1 bg-[#111214] border-[1.5px] sm:border-[2px] border-[#E5BD00] shadow-[2px_2px_0px_#090A0B] sm:shadow-[2.5px_2.5px_0px_#090A0B] rotate-1 sticker-pop cursor-pointer max-w-full text-center"
          >
            <span className="font-comic text-[10px] xs:text-xs uppercase text-[#E5BD00] font-bold tracking-wider">
              ⏰ TIMELINE MONITORED &bull; 24 SEPTEMBER 2026 &bull; GCE ERODE CSE
            </span>
          </div>

          {/* Down Chevron Arrow */}
          <div className="flex justify-center mt-3">
            <button
              type="button"
              className="text-[#B8B8B2] hover:text-[#EEEEEA] transition-colors cursor-pointer animate-bounce"
              onClick={() => scrollToSection('events', 'EVENTS!')}
            >
              <ChevronDown className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        </div>
      </div>


      {/* =========================================================================
          EVENTS SECTION
          ========================================================================= */}
      <section
        id="events"
        className="relative z-30 max-w-7xl mx-auto w-full pt-6 sm:pt-10 pb-0 px-2 sm:px-4 mt-2 sm:mt-4 mb-0 overflow-visible"
      >
        {/* Section Header */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-8 sm:mb-12">
          <div className="flex items-center gap-1.5 text-[#B8B8B2]/50">
            <span className="h-[1px] w-8 sm:w-28 bg-[#B8B8B2]/50" />
            <span className="w-1 h-1 rounded-full bg-[#B8B8B2]/60" />
            <span className="w-1 h-1 rounded-full bg-[#B8B8B2]/60" />
            <span className="w-1 h-1 rounded-full bg-[#B8B8B2]/60" />
            <span className="h-[1px] w-4 sm:w-16 bg-[#B8B8B2]/50" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[#E5BD00] text-2xl sm:text-4xl font-black select-none">⚡</span>
            <h2 className="font-display italic text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#EEEEEA] tracking-widest uppercase select-none">
              EVENTS
            </h2>
            <span className="text-[#E5BD00] text-2xl sm:text-4xl font-black select-none">⚡</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#B8B8B2]/50">
            <span className="h-[1px] w-4 sm:w-16 bg-[#B8B8B2]/50" />
            <span className="w-1 h-1 rounded-full bg-[#B8B8B2]/60" />
            <span className="w-1 h-1 rounded-full bg-[#B8B8B2]/60" />
            <span className="w-1 h-1 rounded-full bg-[#B8B8B2]/60" />
            <span className="h-[1px] w-8 sm:w-28 bg-[#B8B8B2]/50" />
          </div>
        </div>

        {/* -------------------------------------------------------------
            1. TECHNICAL EVENTS ROW (01 - 06) [PRINTED CYAN]
            ------------------------------------------------------------- */}
        <div className="mb-10 sm:mb-16">
          {/* Subheading: → TECHNICAL EVENTS ───□ */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="font-mono font-bold text-sm xs:text-base sm:text-lg text-[#0FA9C6] tracking-wider flex items-center gap-2">
              <span>→</span>
              <span>TECHNICAL EVENTS</span>
              <span className="inline-block w-8 sm:w-12 h-[1.5px] bg-[#0FA9C6]" />
              <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-[#0FA9C6]" />
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-[#0FA9C6] group-hover:scale-110 transition-transform my-auto">
                  {e.id.includes('debug') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#0FA9C6" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 28C22 22 26 18 32 18C38 18 42 22 42 28V36C42 42 38 46 32 46C26 46 22 42 22 36V28Z" />
                      <path d="M32 18V12M28 12H36" />
                      <path d="M14 26L22 30M12 36H22M14 46L22 42" />
                      <path d="M50 26L42 30M52 36H42M50 46L42 42" />
                      <circle cx="32" cy="32" r="3" fill="#0FA9C6" />
                    </svg>
                  )}
                  {e.id.includes('signal') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#0FA9C6" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="46" r="4" fill="#0FA9C6" />
                      <path d="M32 42V28" strokeWidth="2.8" />
                      <path d="M24 38C20 34 20 28 24 24" />
                      <path d="M40 38C44 34 44 28 40 24" />
                      <path d="M18 44C12 36 12 24 18 16" />
                      <path d="M46 44C52 36 52 24 46 16" />
                      <path d="M26 52L32 46L38 52" />
                    </svg>
                  )}
                  {e.id.includes('sql') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#0FA9C6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="32" cy="18" rx="18" ry="6" />
                      <path d="M14 18V32C14 35.3 22 38 32 38C42 38 50 35.3 50 32V18" />
                      <path d="M14 32V46C14 49.3 22 52 32 52C42 52 50 49.3 50 46V32" />
                      <circle cx="24" cy="32" r="2" fill="#0FA9C6" />
                      <circle cx="24" cy="46" r="2" fill="#0FA9C6" />
                    </svg>
                  )}
                  {e.id.includes('gadget') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#0FA9C6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="19" y="19" width="26" height="26" rx="4" />
                      <rect x="26" y="26" width="12" height="12" rx="2" fill="#0FA9C6" fillOpacity="0.2" />
                      <path d="M24 9V19M32 9V19M40 9V19" />
                      <path d="M24 45V55M32 45V55M40 45V55" />
                      <path d="M9 24H19M9 32H19M9 40H19" />
                      <path d="M45 24H55M45 32H55M45 40H55" />
                    </svg>
                  )}
                  {e.id.includes('paper') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#0FA9C6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 14H52" strokeWidth="3" />
                      <rect x="14" y="16" width="36" height="24" rx="2" />
                      <path d="M20 32L28 24L36 28L44 18" strokeWidth="2.2" />
                      <circle cx="44" cy="18" r="2.5" fill="#0FA9C6" />
                      <path d="M32 40V52M22 52L32 40L42 52" strokeWidth="2.5" />
                    </svg>
                  )}
                </div>

                {/* Event Title (Stacked Lines) & Tagline */}
                <div className="w-full mt-auto">
                  <h3 className="font-sans font-black text-sm xs:text-base sm:text-lg text-[#EEEEEA] uppercase tracking-wider group-hover:text-[#0FA9C6] transition-colors leading-tight">
                    {e.mission_name.toLowerCase().includes('gadget') ? (
                      <>
                        <span>GADGET CODES</span>
                        <br />
                        <span className="text-[10px] sm:text-xs text-[#E5BD00] font-mono tracking-normal normal-case block mt-0.5">(Single event)</span>
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
                  <p className="font-mono text-[10px] sm:text-[11px] text-[#B8B8B2] mt-2 leading-tight whitespace-pre-line">
                    {e.tagline || e.title}
                  </p>
                </div>
              </ComicHandDrawnCard>
            ))}
          </div>

          {/* Comic Cloud & Star Doodle Graphic */}
          <div className="flex sm:hidden justify-center items-center my-6 relative select-none pointer-events-none">
            <div className="relative w-full max-w-[210px] flex items-center justify-center">
              <img
                src={cloudSvg}
                alt="Comic Cloud"
                className="w-full h-auto object-contain select-none pointer-events-none mix-blend-screen drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]"
              />
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            2. NON-TECHNICAL EVENTS ROW (06 - 09) [PRINTED PINK] + DOODLES
            ------------------------------------------------------------- */}
        <div className="relative mb-2 sm:mb-4">
          {/* Subheading: ✦ NON - TECHNICAL EVENTS ───□ */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="font-mono font-bold text-sm xs:text-base sm:text-lg text-[#D51F55] tracking-wider flex items-center gap-2">
              <span>✦</span>
              <span>NON - TECHNICAL EVENTS</span>
              <span className="inline-block w-8 sm:w-12 h-[1.5px] bg-[#D51F55]" />
              <span className="inline-block w-2.5 h-2.5 border-[1.5px] border-[#D51F55]" />
            </span>
          </div>

          {/* 6 Columns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 lg:gap-6 items-center">

            {/* Column 1 on Desktop: Official Comic Cloud Asset */}
            <div className="hidden sm:flex col-span-1 lg:col-span-1 flex-col items-center justify-center relative select-none pointer-events-none min-h-[220px] sm:min-h-[295px] pr-2">
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
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-[#D51F55] group-hover:scale-110 transition-transform my-auto">
                  {e.id.includes('borderland') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#D51F55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M32 10L48 18V32C48 42 41 50 32 54C23 50 16 42 16 32V18L32 10Z" />
                      <circle cx="32" cy="30" r="7" />
                      <path d="M32 23V37M25 30H39" />
                    </svg>
                  )}
                  {e.id.includes('strike') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#D51F55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="32" cy="32" r="20" />
                      <circle cx="32" cy="32" r="13" />
                      <circle cx="32" cy="32" r="6" fill="#D51F55" />
                      <path d="M32 6V12M32 52V58M6 32H12M52 32H58" />
                    </svg>
                  )}
                  {e.id.includes('twist') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#D51F55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="14" y="16" width="36" height="32" rx="6" />
                      <path d="M22 28C22 26 25 24 28 26" />
                      <path d="M36 26C39 24 42 28 42 28" />
                      <path d="M22 38C26 42 38 42 42 38" />
                      <circle cx="25" cy="27" r="2" fill="#D51F55" />
                      <circle cx="39" cy="27" r="2" fill="#D51F55" />
                    </svg>
                  )}
                  {e.id.includes('flim') && (
                    <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 64 64" fill="none" stroke="#D51F55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="10" y="20" width="34" height="28" rx="5" />
                      <path d="M44 28L54 22V46L44 40V28Z" />
                      <circle cx="27" cy="34" r="6" />
                      <circle cx="27" cy="34" r="3" fill="#D51F55" />
                      <path d="M18 14L22 20M30 14L34 20" />
                    </svg>
                  )}
                </div>

                {/* Event Title (Stacked Lines) & Tagline */}
                <div className="w-full mt-auto">
                  <h3 className="font-sans font-black text-sm xs:text-base sm:text-lg text-[#EEEEEA] uppercase tracking-wider group-hover:text-[#D51F55] transition-colors leading-tight">
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
                  <p className="font-mono text-[10px] sm:text-[11px] text-[#B8B8B2] mt-2 leading-tight whitespace-pre-line">
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
                  stroke="#D51F55"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  fill="none"
                />
                {/* Flying Paper Airplane */}
                <g transform="translate(150, 10) rotate(12)">
                  <path d="M0 30L42 0L30 42L18 30L0 30Z" fill="#111214" stroke="#D51F55" strokeWidth="2.2" strokeLinejoin="round" />
                  <path d="M42 0L18 30" stroke="#D51F55" strokeWidth="1.8" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. EVENT SCHEDULE CONTROL ROOM TIMETABLE SECTION
          ========================================================================= */}
      <div id="schedule" className="relative z-10 max-w-7xl mx-auto w-full px-2 sm:px-4 py-8">
        <EventScheduleView onSelectEvent={(e) => setSelectedEvent(e)} />
      </div>

      {/* =========================================================================
          EVENT DETAILS INTERACTIVE MODAL (DESKTOP & MOBILE RESPONSIVE)
          ========================================================================= */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-[96%] sm:w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-[#141417] border-[2.5px] sm:border-[3px] ${
              selectedEvent.event_type === 'TECH' ? 'border-[#3CE7FF]' : 'border-[#FF3366]'
            } shadow-[4px_4px_0px_#000000] sm:shadow-[8px_8px_0px_#000000] rounded-2xl select-text mx-auto my-auto overflow-hidden`}
          >
            {/* Sticky Header */}
            <div className="p-3 sm:p-5 border-b border-[#2A2A2E] shrink-0 bg-[#141417] z-10 space-y-1 sm:space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 font-mono font-black text-[10px] sm:text-xs rounded uppercase ${
                        selectedEvent.event_type === 'TECH' ? 'bg-[#3CE7FF] text-[#0D0D0F]' : 'bg-[#FF3366] text-white'
                      }`}
                    >
                      {selectedEvent.code}
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs text-[#A8A8AC] uppercase">
                      {selectedEvent.category}
                    </span>
                  </div>
                  <h3 className="font-display text-lg sm:text-3xl text-white uppercase tracking-wide leading-tight mt-0.5">
                    {selectedEvent.mission_name}
                  </h3>
                  <p
                    className={`font-comic text-[11px] sm:text-sm font-bold ${
                      selectedEvent.event_type === 'TECH' ? 'text-[#3CE7FF]' : 'text-[#FF3366]'
                    }`}
                  >
                    {selectedEvent.tagline || selectedEvent.title}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 sm:p-2 bg-[#222226] hover:bg-[#FF3366] text-[#F2F2F0] hover:text-white rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4 flex-1 custom-scrollbar">
              {/* Quick Meta Stats */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono">
                <div className="p-1.5 sm:p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#F5D90A] shrink-0" /> <span className="truncate">TEAM SIZE</span>
                  </div>
                  <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                    {selectedEvent.team_size_min}
                    {selectedEvent.team_size_min !== selectedEvent.team_size_max ? `-${selectedEvent.team_size_max}` : ''} M
                  </div>
                </div>
                <div className="p-1.5 sm:p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#F5D90A] shrink-0" /> <span className="truncate">TIME</span>
                  </div>
                  <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                    {selectedEvent.schedule_time}
                  </div>
                </div>
                <div className="p-1.5 sm:p-2.5 bg-[#1A1A1E] border border-[#2E2E33] rounded-lg">
                  <div className="text-[#A8A8AC] text-[9px] sm:text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#3CE7FF] shrink-0" /> <span className="truncate">VENUE</span>
                  </div>
                  <div className="text-white font-bold mt-0.5 text-[10px] sm:text-xs truncate">
                    {selectedEvent.venue}
                  </div>
                </div>
              </div>

              {/* Briefing */}
              <div className="space-y-0.5 sm:space-y-1.5">
                <h4 className="font-mono text-[10px] sm:text-xs text-[#F5D90A] uppercase tracking-wider font-bold">
                  // BRIEFING
                </h4>
                <p className="font-comic text-[11px] sm:text-sm text-[#D0D0D4] leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Rules & Guidelines */}
              {selectedEvent.rules && selectedEvent.rules.length > 0 && (
                <div className="space-y-1 sm:space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#F5D90A] uppercase tracking-wider font-bold">
                    // RULES &amp; GUIDELINES
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 sm:gap-y-1">
                    {selectedEvent.rules.map((rule, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-1.5 text-[10px] sm:text-xs font-comic text-[#C0C0C5] leading-tight">
                        <span className="text-[#3CE7FF] shrink-0 font-bold">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prize Rewards */}
              {selectedEvent.prizes && (
                <div className="p-2 sm:p-3 bg-[#1A1A1E] border border-[#2E2E33] rounded-xl space-y-1.5 sm:space-y-2">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#F5D90A] uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F5D90A]" /> PRIZE REWARDS
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                    <div className="p-1.5 sm:p-2.5 bg-[#222228] rounded border border-[#3A3A40] text-center flex flex-col justify-center">
                      <div className="text-[9px] sm:text-[10px] text-[#A8A8AC] font-mono">1ST PRIZE</div>
                      <div className="text-[#F5D90A] font-bold text-[10px] sm:text-sm truncate">{selectedEvent.prizes.first}</div>
                    </div>
                    <div className="p-1.5 sm:p-2.5 bg-[#222228] rounded border border-[#3A3A40] text-center flex flex-col justify-center">
                      <div className="text-[9px] sm:text-[10px] text-[#A8A8AC] font-mono">2ND PRIZE</div>
                      <div className="text-white font-bold text-[10px] sm:text-sm truncate">{selectedEvent.prizes.second}</div>
                    </div>
                    <div className="p-1.5 sm:p-2.5 bg-[#222228] rounded border border-[#3A3A40] text-center flex flex-col justify-center">
                      <div className="text-[9px] sm:text-[10px] text-[#A8A8AC] font-mono">3RD PRIZE</div>
                      <div className="text-[#A8A8AC] font-bold text-[10px] sm:text-sm truncate">{selectedEvent.prizes.third || 'Certificate'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Helpline & Coordinators */}
              {selectedEvent.coordinators && selectedEvent.coordinators.length > 0 && (
                <div className="space-y-1 sm:space-y-1.5">
                  <h4 className="font-mono text-[10px] sm:text-xs text-[#A8A8AC] uppercase tracking-wider font-bold">
                    // HELPLINE &amp; COORDINATORS
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedEvent.coordinators.map((c, cIdx) => (
                      <div key={cIdx} className="text-[10px] sm:text-xs font-mono text-[#D0D0D4] flex items-center gap-1 bg-[#1A1A1E] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-[#2E2E33]">
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
            </div>

            {/* Sticky CTA Footer */}
            {selectedEvent.id !== 'prize-distribution' && (
              <div className="p-2.5 sm:p-3.5 bg-[#141417] border-t border-[#2A2A2E] shrink-0 z-10">
                <button
                  onClick={() => {
                    triggerComicFX('DEPLOY!');
                    navigate(`/register?mission=${selectedEvent.id}`);
                  }}
                  className={`w-full py-2.5 sm:py-3.5 font-display text-xs sm:text-base tracking-wider uppercase font-bold cursor-pointer transition-all border-[2px] shadow-[3px_3px_0px_#000000] sm:shadow-[4px_4px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 rounded-xl ${
                    selectedEvent.event_type === 'TECH'
                      ? 'bg-[#3CE7FF] hover:bg-[#F5D90A] text-[#0D0D0F] border-[#3CE7FF]'
                      : 'bg-[#FF3366] hover:bg-[#F5D90A] text-white hover:text-[#0D0D0F] border-[#FF3366]'
                  }`}
                >
                  <span>REGISTER FOR {selectedEvent.mission_name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
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
