import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import zinniaSvg from '../../assets/zinnia.svg';

interface MagneticElementProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
  onClick?: () => void;
}

export const MagneticElement: React.FC<MagneticElementProps> = ({
  children,
  strength = 0.35,
  className = '',
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;
    setPosition({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      {children}
    </div>
  );
};

export const WebsiteNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const triggerComicFX = (txt: string) => {
    setInteractiveSoundText(txt);
    setTimeout(() => setInteractiveSoundText(null), 800);
  };

  const handleNavClick = (target: string, fx: string) => {
    triggerComicFX(fx);
    if (target === 'home') {
      navigate('/');
    } else if (target === 'events') {
      if (location.pathname === '/') {
        const el = document.getElementById('events');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else navigate('/#events');
      } else {
        navigate('/#events');
      }
    } else if (target === 'pass' || target === 'passport') {
      navigate('/passport');
    } else if (target === 'contact') {
      navigate('/contact');
    } else if (target === 'register') {
      navigate('/register');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <>
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#E5BD00] border-3 border-[#090A0B] shadow-[6px_6px_0px_#090A0B] rotate-6 sticker-pop">
            <span className="font-display text-4xl sm:text-6xl text-[#D51F55] tracking-wider">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* Top Header Navbar */}
      <header className="relative z-60 max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 pt-1 px-1 sm:px-3 select-none">
        {/* Left: Illustrated ZINNIA Comic Logo */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <MagneticElement strength={0.25} onClick={() => handleNavClick('home', 'BOOM!')}>
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
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#EEEEEA]" /> : <Menu className="w-6 h-6 text-[#EEEEEA]" />}
        </button>

        {/* Desktop Comic Navigation Tabs with Magnetic Pull */}
        <nav className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* EVENTS TAB */}
          <MagneticElement strength={0.3} onClick={() => handleNavClick('events', 'EVENTS!')}>
            <button className="comic-button" type="button">
              <span className="back-box" />
              <span className="front-box">
                <span className="lightning">⚡</span>
                <span>EVENTS</span>
              </span>
            </button>
          </MagneticElement>

          {/* CONTACT TAB */}
          <MagneticElement strength={0.3} onClick={() => handleNavClick('contact', 'CONTACT!')}>
            <button className="comic-button" type="button">
              <span className="back-box" />
              <span className="front-box">
                <span>CONTACT</span>
              </span>
            </button>
          </MagneticElement>

          {/* REGISTER TAB */}
          <MagneticElement strength={0.35} onClick={() => handleNavClick('register', 'REGISTER!')}>
            <button className="comic-button-cyan" type="button">
              <span className="back-box-cyan" />
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
              
              {/* 1. HOME (Slightly tilted -0.8deg with hand-drawn layered borders) */}
              <div
                className="relative group cursor-pointer select-none"
                style={{ transform: 'rotate(-0.8deg)' }}
                onClick={() => handleNavClick('home', 'HOME!')}
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

              {/* 2. EVENTS (Slightly tilted +1.1deg with yellow lightning icon) */}
              <div
                className="relative group cursor-pointer select-none"
                style={{ transform: 'rotate(1.1deg)' }}
                onClick={() => handleNavClick('events', 'EVENTS!')}
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


              {/* 4. CONTACT (Slightly tilted -0.9deg with hand-drawn layered borders) */}
              <div
                className="relative group cursor-pointer select-none"
                style={{ transform: 'rotate(-0.9deg)' }}
                onClick={() => handleNavClick('contact', 'CONTACT!')}
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

            {/* 5. REGISTER (Layered Cyan Comic Panel with Hand-Drawn Arrow) */}
            <div
              className="w-full mt-1 cursor-pointer select-none group"
              onClick={() => handleNavClick('register', 'REGISTER!')}
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
    </>
  );
};

export default WebsiteNavbar;
