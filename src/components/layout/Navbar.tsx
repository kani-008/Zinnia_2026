import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
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
    setMobileMenuOpen(false);
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

      {/* Top Header Navbar (Sticky) */}
      <div className={`sticky top-0 ${mobileMenuOpen ? 'z-[110]' : 'z-50'} w-full bg-[#08090A]/90 backdrop-blur-md border-b border-[#EEEEEA]/10 select-none shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors`}>
        <header className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 sm:gap-4 py-1.5 px-3 sm:px-6">
          {/* Left: Illustrated ZINNIA Comic Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <MagneticElement strength={0.25} onClick={() => handleNavClick('home', 'BOOM!')}>
              <div className="cursor-pointer group relative -rotate-2 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1 flex items-center">
                <img
                  src={zinniaSvg}
                  alt="ZINNIA '26 Logo"
                  className="h-10 sm:h-12 md:h-13 lg:h-14 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                />
              </div>
            </MagneticElement>
          </div>

          {/* Mobile Menu Button: three bars that rotate into a cross */}
          <button
            type="button"
            className="sm:hidden relative flex flex-col items-center justify-center gap-1 w-9 h-9 bg-[#111214] border-2 border-[#EEEEEA]/80 shadow-[2px_2px_0px_#090A0B] cursor-pointer active:scale-95 transition-transform"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            <span
              className={`block h-[2px] w-4.5 bg-[#EEEEEA] rounded-full transition-transform duration-300 ease-out ${
                mobileMenuOpen ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-4.5 bg-[#EEEEEA] rounded-full transition-opacity duration-200 ${
                mobileMenuOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block h-[2px] w-4.5 bg-[#EEEEEA] rounded-full transition-transform duration-300 ease-out ${
                mobileMenuOpen ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
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
      </div>

      {/* Portalled to <body>: a page-level overflow clip would otherwise
          cut the fixed drawer off. */}
      {createPortal(
        <>
        {/* Backdrop */}
        <div
          className={`sm:hidden fixed inset-0 z-[125] bg-[#08090A]/70 transition-opacity duration-200 ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Mobile Menu Drawer: 40% wide, links stacked one below another */}
        <aside
          className="sm:hidden fixed top-0 right-0 bottom-0 z-[130] w-[40%] bg-[#08090A] border-l-2 border-[#EEEEEA]/30 shadow-[-6px_0_20px_rgba(0,0,0,0.6)] flex flex-col gap-3 px-3 pt-16 pb-6 overflow-y-auto transition-transform duration-300 ease-out"
          style={{ transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)' }}
          aria-hidden={!mobileMenuOpen}
        >
          {/* Close button lives inside the panel, so it slides in with it */}
          <button
            type="button"
            className="absolute top-2.5 right-3 flex flex-col items-center justify-center gap-1 w-9 h-9 bg-[#111214] border-2 border-[#EEEEEA]/80 shadow-[2px_2px_0px_#090A0B] cursor-pointer active:scale-95 transition-transform"
            onClick={() => setMobileMenuOpen(false)}
            tabIndex={mobileMenuOpen ? 0 : -1}
            aria-label="Close navigation menu"
          >
            <span className="block h-[2px] w-4.5 bg-[#EEEEEA] rounded-full translate-y-[6px] rotate-45" />
            <span className="block h-[2px] w-4.5 bg-[#EEEEEA] rounded-full opacity-0" />
            <span className="block h-[2px] w-4.5 bg-[#EEEEEA] rounded-full -translate-y-[6px] -rotate-45" />
          </button>

          <button
            className="comic-button comic-button-fluid"
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => handleNavClick('home', 'HOME!')}
          >
            <span className="back-box" />
            <span className="front-box">
              <span>HOME</span>
            </span>
          </button>

          <button
            className="comic-button comic-button-fluid"
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => handleNavClick('events', 'EVENTS!')}
          >
            <span className="back-box" />
            <span className="front-box">
              <span className="lightning">⚡</span>
              <span>EVENTS</span>
            </span>
          </button>

          <button
            className="comic-button comic-button-fluid"
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => handleNavClick('contact', 'CONTACT!')}
          >
            <span className="back-box" />
            <span className="front-box">
              <span>CONTACT</span>
            </span>
          </button>

          <button
            className="comic-button-cyan comic-button-fluid"
            type="button"
            tabIndex={mobileMenuOpen ? 0 : -1}
            onClick={() => handleNavClick('register', 'REGISTER!')}
          >
            <span className="back-box-cyan" />
            <span className="front-box-cyan">
              <span>REGISTER</span>
            </span>
          </button>
        </aside>
        </>,
        document.body
      )}

    </>
  );
};

export default WebsiteNavbar;
