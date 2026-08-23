import React, { useState, useEffect } from 'react';
import { audioManager } from '../core/AudioManager';
import ultronImg from '../../assets/ultron.svg';

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
  // Real-time ticking countdown to September 17, 2026
  const [timeLeft, setTimeLeft] = useState({
    days: '12',
    hours: '48',
    minutes: '32',
    seconds: '15',
  });

  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);

  useEffect(() => {
    const targetDate = new Date('2026-09-17T09:00:00+05:30').getTime();

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

  const triggerComicFX = (sound: string) => {
    audioManager.playTimelineTick();
    setInteractiveSoundText(sound);
    setTimeout(() => setInteractiveSoundText(null), 1000);
  };

  return (
    <div className="relative w-screen h-screen max-h-screen overflow-hidden bg-[#FFFDF0] text-[#0F0F14] flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#FFE600] border-4 border-black shadow-[6px_6px_0px_#000000] rotate-6 sticker-pop">
            <span className="font-display text-4xl sm:text-6xl text-[#FF2E63] tracking-wider">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* Comic Book Header Stamp Top Left & Right */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between text-[9px] sm:text-[11px] font-mono tracking-widest text-black/50 uppercase hidden sm:flex z-10 px-2">
        <span>VOL. 2026 &bull; ISSUE #01 &bull; SPECIAL EDITION &bull; GCE ERODE CSE</span>
        <span>ALL-NEW 2D SYMPO EXPERIENCE &bull; 17 SEPTEMBER 2026</span>
      </div>

      {/* =========================================================================
          1. TOP NAVBAR (100% 2D Illustrated Comic Style with Magnetic Buttons)
          ========================================================================= */}
      <header className="relative z-60 max-w-6xl mx-auto w-full flex items-center justify-between gap-4 pt-1 px-2">
        {/* Left: Illustrated ZINNIA Comic Logo with Magnetic Pull */}
        <div className="flex items-center gap-3">
          {/* Magnetic Logo Badge */}
          <MagneticElement strength={0.25} onClick={() => triggerComicFX('BOOM!')}>
            <div className="cursor-pointer group relative px-4 py-1.5 bg-[#FFE600] border-[3.5px] border-black shadow-[4px_4px_0px_#000000] -rotate-1 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl sm:text-3xl text-black tracking-wide">
                  ZINNIA
                </span>
                <span className="font-comic text-xl sm:text-2xl text-[#FF2E63] font-black">
                  '26
                </span>
              </div>
              {/* Speech Tail */}
              <div className="absolute -bottom-2.5 left-5 w-3 h-3 bg-[#FFE600] border-r-[3.5px] border-b-[3.5px] border-black rotate-45" />
            </div>
          </MagneticElement>

          {/* Comics Code Authority Parody Stamp with Bouncy Hover */}
          <div className="hidden sm:flex flex-col items-center justify-center p-1 px-2 bg-white border-2 border-black shadow-[2.5px_2.5px_0px_#000000] rotate-2 text-[7px] font-mono leading-tight uppercase font-black text-center sticker-pop-alt cursor-pointer">
            <span>APPROVED</span>
            <span className="text-[6px] text-[#FF2E63]">BY THE</span>
            <span>CSE CODE</span>
          </div>
        </div>

        {/* Center/Right Comic Navigation Tabs with Magnetic Pull */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <MagneticElement strength={0.3} onClick={() => triggerComicFX('INFO!')}>
            <button className="px-3.5 sm:px-4 py-1.5 bg-white hover:bg-[#E0F7FA] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold cursor-pointer">
              ABOUT
            </button>
          </MagneticElement>

          <MagneticElement strength={0.3} onClick={() => triggerComicFX('HELLO!')}>
            <button className="px-3.5 sm:px-4 py-1.5 bg-white hover:bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold cursor-pointer">
              CONTACT
            </button>
          </MagneticElement>

          {/* Register Navbar Magnetic Button */}
          <MagneticElement strength={0.35} onClick={() => triggerComicFX('POW!')}>
            <button className="px-4 sm:px-6 py-1.5 bg-[#00E5FF] hover:bg-[#FFE600] border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] font-display text-xs sm:text-sm tracking-wider uppercase cursor-pointer">
              REGISTER
            </button>
          </MagneticElement>
        </nav>
      </header>

      {/* =========================================================================
          2. CENTER HERO: LARGE COMIC PANEL (Main Visual Focus)
          ========================================================================= */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full my-auto py-2 sm:py-3 px-2">
        {/* Outer unclipped wrapper for top floating badges */}
        <div className="relative w-full">
          {/* Top-Left Panel Narration Box with Tactile Sticker Pop */}
          <div
            onClick={() => triggerComicFX('CHAPTER 01!')}
            className="cursor-pointer absolute -top-3.5 left-3 sm:left-6 z-50 bg-[#FFE600] border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] px-3 sm:px-4 py-1 -rotate-2 sticker-pop"
          >
            <span className="font-comic text-[11px] sm:text-xs md:text-sm uppercase tracking-wider text-black font-extrabold">
              CHAPTER 01: THE AWAKENING
            </span>
          </div>

          {/* Top-Right Prize Starburst Sticker with Tactile Sticker Pop */}
          <div
            onClick={() => triggerComicFX('KACHING!')}
            className="cursor-pointer absolute -top-4 right-3 sm:right-6 z-50 bg-[#FF2E63] border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] px-3.5 sm:px-5 py-1.5 rotate-4 sticker-pop-alt"
          >
            <div className="flex flex-col items-center justify-center leading-none text-center">
              <span className="font-display text-sm sm:text-base md:text-lg text-white font-extrabold tracking-wide">
                ₹25,000+
              </span>
              <span className="font-comic text-[8px] sm:text-[10px] text-[#FFE600] tracking-wider uppercase mt-0.5 font-black">
                PRIZE POOL!
              </span>
            </div>
          </div>

          {/* Main Comic Panel Frame - Pure Solid White */}
          <div className="relative w-full bg-white border-[4px] sm:border-[5px] border-black shadow-[7px_7px_0px_#000000] p-4 sm:p-6 md:p-8 pt-6 sm:pt-7">
            {/* -------------------------------------------------------------
                HERO CONTENT GRID INSIDE THE COMIC PANEL
                ------------------------------------------------------------- */}
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center">
              {/* Left Column (7 cols): Comic Title, Narrative & Speech Bubble */}
              <div className="md:col-span-7 space-y-2 sm:space-y-3 text-left">
                {/* Event Subtitle Badge with Sticker Pop */}
                <div className="inline-block px-2.5 py-0.5 bg-black text-[#FFE600] font-comic text-[10px] sm:text-[11px] md:text-xs uppercase tracking-widest rotate-1 font-bold sticker-pop cursor-pointer">
                  GOVT COLLEGE OF ENGINEERING, ERODE &bull; CSE DEPT
                </div>

                {/* Giant Comic Title */}
                <div className="space-y-0.5">
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-black tracking-tight leading-none uppercase">
                    ZINNIA
                  </h1>
                  <div className="flex items-center gap-3 pt-0.5">
                    <span className="font-comic text-2xl sm:text-3xl md:text-4xl text-[#0891B2] font-black">
                      2026
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#FF2E63] text-white border-[2px] border-black font-bungee text-[10px] sm:text-xs -rotate-2 sticker-pop-alt cursor-pointer">
                      NATIONAL LEVEL
                    </span>
                  </div>
                </div>

                {/* Comic Speech Bubble / Narrative Box - Pure Clean White */}
                <div className="relative p-2.5 sm:p-3.5 bg-white border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000]">
                  <p className="font-comic text-xs sm:text-sm md:text-[15px] text-gray-900 leading-snug font-medium">
                    "A TIMELINE WAS BROKEN. SOMETHING EMERGED FROM IT. NINE BATTLEGROUNDS AWAIT THE BOLDEST MINDS IN COMPUTATION!"
                  </p>
                  {/* Speech Arrow */}
                  <div className="absolute -bottom-2.5 left-6 w-3 h-3 bg-white border-r-[2.5px] border-b-[2.5px] border-black rotate-45" />
                </div>

                {/* 9 Battlegrounds Sticker Strip with Tactile Sticker Pop */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    onClick={() => triggerComicFX('9 BATTLES!')}
                    className="px-2.5 py-1 bg-[#E0F7FA] border-[2px] border-black font-mono text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#000000] sticker-pop cursor-pointer"
                  >
                    ⚡ 9 ACTIVE EVENTS
                  </span>
                  <span
                    onClick={() => triggerComicFX('VERIFIED!')}
                    className="px-2.5 py-1 bg-[#FFF9C4] border-[2px] border-black font-mono text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#000000] sticker-pop-alt cursor-pointer"
                  >
                    ⚡ ANNA UNIV VERIFIED
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): 2D Hand-Drawn Illustrated Hero Art with Ultron SVG */}
              <div className="md:col-span-5 relative flex items-center justify-center">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-68 lg:h-68 flex items-center justify-center">
                  {/* 2D Comic Illustrated Ultron Character with Hand-Drawn Yellow Background Shape */}
                  <svg
                    viewBox="0 0 200 200"
                    className="relative z-30 w-full h-full overflow-visible hover:scale-105 transition-transform duration-200"
                  >
                    <defs>
                      {/* Pop-Out Clip Path: Open at top so head breaks above circle, curved at bottom to match circle */}
                      <clipPath id="ultronPopOutClip">
                        <path
                          d="M -50 -100
                             L 250 -100
                             L 250 115
                             C 220 154, 175 192, 142 192
                             C 114 198, 81 194, 56 182
                             C 28 170, -5 143, -15 115
                             Z"
                        />
                      </clipPath>
                    </defs>

                    {/* Hand-Drawn Irregular Comic Yellow Background Silhouette */}
                    <path
                      d="M 102 14
                         C 130 13, 158 24, 175 46
                         C 191 66, 194 96, 191 123
                         C 188 152, 169 178, 142 188
                         C 114 197, 81 193, 56 181
                         C 31 169, 14 143, 11 116
                         C 8 86, 21 54, 46 34
                         C 62 21, 82 14, 102 14 Z"
                      fill="#FFE600"
                      stroke="#000000"
                      strokeWidth="5.5"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />

                    {/* Comic Speed Lines Behind & Framing Ultron */}
                    <line x1="15" y1="50" x2="60" y2="70" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="25" y1="35" x2="65" y2="60" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                    <line x1="10" y1="100" x2="45" y2="100" stroke="#000" strokeWidth="4" strokeLinecap="round" />
                    <line x1="12" y1="108" x2="38" y2="108" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                    <line x1="20" y1="160" x2="55" y2="145" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />

                    <line x1="185" y1="50" x2="140" y2="70" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="175" y1="35" x2="135" y2="60" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                    <line x1="190" y1="100" x2="155" y2="100" stroke="#000" strokeWidth="4" strokeLinecap="round" />
                    <line x1="188" y1="108" x2="162" y2="108" stroke="#000" strokeWidth="3" strokeLinecap="round" />
                    <line x1="180" y1="160" x2="145" y2="145" stroke="#000" strokeWidth="4.5" strokeLinecap="round" />

                    {/* Ultron Vector Art: Enlarged with top half of head extending above circle, bottom cropped to circle */}
                    <image
                      href={ultronImg}
                      x="-8"
                      y="-28"
                      width="216"
                      height="216"
                      clipPath="url(#ultronPopOutClip)"
                      preserveAspectRatio="xMidYMin slice"
                    />
                  </svg>

                  {/* "⚡ CRACKLE!" Sound Effect Overlay Sticker with Tactile Pop */}
                  <div
                    onClick={() => triggerComicFX('ZAP!')}
                    className="cursor-pointer absolute -bottom-2 -left-4 sm:-bottom-3 sm:-left-6 z-40 bg-[#FFE600] border-[2.5px] border-black shadow-[4px_4px_0px_#000000] px-3 py-1 -rotate-12 sticker-pop-alt active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <span className="font-display text-xs sm:text-sm md:text-base text-[#FF2E63] font-black tracking-wide">
                      ⚡ CRACKLE!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. COUNTDOWN & 4. REGISTER CTA (Directly Below Artwork with Magnetic Pull)
            ========================================================================= */}
        <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 pt-3 sm:pt-4 w-full">
          {/* Illustrated Comic Countdown Module */}
          <div className="flex flex-col items-center sm:items-start">
            {/* Caption Header */}
            <div className="px-2.5 py-0.5 bg-black text-white font-comic text-[10px] sm:text-xs uppercase tracking-widest border border-black -rotate-1 font-bold sticker-pop cursor-pointer">
              REGISTRATION OPENS IN
            </div>

            {/* Countdown Comic Number Boxes with Tactile Sticker Pop */}
            <div className="flex items-center gap-2 pt-1">
              {/* Days */}
              <div className="flex flex-col items-center p-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px] sticker-pop cursor-pointer">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-black leading-none">
                  {timeLeft.days}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                  DAYS
                </span>
              </div>

              <span className="font-display text-xl text-black animate-pulse">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center p-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px] sticker-pop cursor-pointer">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-black leading-none">
                  {timeLeft.hours}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                  HRS
                </span>
              </div>

              <span className="font-display text-xl text-black animate-pulse">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center p-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px] sticker-pop cursor-pointer">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-black leading-none">
                  {timeLeft.minutes}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                  MIN
                </span>
              </div>

              <span className="font-display text-xl text-black animate-pulse">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center p-1.5 bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px] sticker-pop-alt cursor-pointer">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-[#FF2E63] leading-none font-black">
                  {timeLeft.seconds}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-black font-extrabold uppercase mt-0.5">
                  SEC
                </span>
              </div>
            </div>
          </div>

          {/* Large Comic Register Magnetic CTA Button (2D Translation Magnetic Physics) */}
          <MagneticElement strength={0.35} onClick={() => triggerComicFX('REGISTERED!')}>
            <button
              className="btn-comic group px-8 sm:px-12 py-3 sm:py-3.5 bg-[#FFE600] hover:bg-[#00E5FF] border-[3.5px] border-black shadow-[6px_6px_0px_#000000] font-display text-lg sm:text-xl md:text-2xl text-black tracking-wider uppercase -rotate-1 hover:rotate-0 cursor-pointer flex items-center gap-3 active:translate-x-1 active:translate-y-1"
            >
              <span>REGISTER</span>
              <span className="font-display text-2xl sm:text-3xl text-[#FF2E63] group-hover:translate-x-2 transition-transform">
                &rarr;
              </span>
            </button>
          </MagneticElement>
        </div>
      </main>

      {/* =========================================================================
          5. FOOTER (Hand-Drawn Divider + Comic Stamp Footer with Magnetic Links)
          ========================================================================= */}
      <footer className="relative z-30 max-w-6xl mx-auto w-full pt-1 px-2">
        {/* Hand-Drawn Ink Divider (Cross-hatched jagged line) */}
        <div className="w-full h-[2.5px] bg-black mb-1.5 relative">
          <div className="absolute -top-1 left-1/4 w-3 h-3 bg-black rotate-45" />
          <div className="absolute -top-1 right-1/4 w-3 h-3 bg-black rotate-45" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10px] sm:text-xs font-comic tracking-wider text-black">
          {/* Left Copyright */}
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#FFE600] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold sticker-pop cursor-pointer">
              ZINNIA &copy; 2026
            </span>
            <span className="text-gray-700 hidden md:inline font-bold">
              DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
            </span>
          </div>

          {/* Right Links & Socials with Magnetic Pull */}
          <div className="flex items-center gap-3.5 text-gray-800 uppercase font-black">
            <MagneticElement strength={0.2} onClick={() => triggerComicFX('ABOUT')}>
              <button className="hover:text-[#FF2E63] hover:underline transition-colors cursor-pointer">
                ABOUT
              </button>
            </MagneticElement>
            <span>&bull;</span>
            <MagneticElement strength={0.2} onClick={() => triggerComicFX('CONTACT')}>
              <button className="hover:text-[#FF2E63] hover:underline transition-colors cursor-pointer">
                CONTACT
              </button>
            </MagneticElement>
            <span>&bull;</span>
            <MagneticElement strength={0.2} onClick={() => triggerComicFX('INSTA')}>
              <button className="hover:text-[#FF2E63] hover:underline transition-colors cursor-pointer">
                INSTAGRAM
              </button>
            </MagneticElement>
            <span>&bull;</span>
            <MagneticElement strength={0.2} onClick={() => triggerComicFX('EMAIL')}>
              <button className="hover:text-[#FF2E63] hover:underline transition-colors cursor-pointer">
                EMAIL
              </button>
            </MagneticElement>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteHomePage;
