import React, { useState, useEffect } from 'react';
import { audioManager } from '../core/AudioManager';

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
    <div className="relative w-screen h-screen max-h-screen overflow-hidden bg-[#FFFDF0] text-[#0F0F14] flex flex-col justify-between p-2.5 sm:p-3 select-none">
      {/* =========================================================================
          COMIC PAGE BACKGROUND TEXTURES & PRINTS
          ========================================================================= */}
      {/* Halftone Dot Matrix Overlay */}
      <div className="absolute inset-0 bg-halftone-dots opacity-10 pointer-events-none z-0" />

      {/* Comic Page Center Crease / Spine Fold */}
      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-black/10 pointer-events-none z-0" />

      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-5 py-2 bg-[#FFE600] border-3 border-black shadow-[6px_6px_0px_#000000] rotate-6">
            <span className="font-display text-3xl sm:text-5xl text-[#FF2E63] text-stroke-comic-sm tracking-wider">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* Comic Book Header Stamp Top Left & Right */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between text-[8px] sm:text-[9px] font-mono tracking-widest text-black/40 uppercase hidden sm:flex z-10">
        <span>VOL. 2026 &bull; ISSUE #01 &bull; SPECIAL EDITION &bull; GCE ERODE CSE</span>
        <span>ALL-NEW 2D SYMPO EXPERIENCE &bull; 17 SEPTEMBER 2026</span>
      </div>

      {/* =========================================================================
          1. TOP NAVBAR (100% 2D Illustrated Comic Style)
          ========================================================================= */}
      <header className="relative z-60 max-w-5xl mx-auto w-full flex items-center justify-between gap-3 pt-0.5 px-1">
        {/* Left: Illustrated ZINNIA Comic Logo */}
        <div className="flex items-center gap-2">
          {/* Logo Badge */}
          <div
            onClick={() => triggerComicFX('BOOM!')}
            className="cursor-pointer group relative px-3 py-1 bg-[#FFE600] border-[3px] border-black shadow-[3.5px_3.5px_0px_#000000] -rotate-1 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-display text-xl sm:text-2xl text-black tracking-wide">
                ZINNIA
              </span>
              <span className="font-comic text-lg sm:text-xl text-[#FF2E63] text-stroke-comic-sm">
                '26
              </span>
            </div>
            {/* Speech Tail */}
            <div className="absolute -bottom-2 left-4 w-2.5 h-2.5 bg-[#FFE600] border-r-[3px] border-b-[3px] border-black rotate-45" />
          </div>

          {/* Comics Code Authority Parody Stamp */}
          <div className="hidden sm:flex flex-col items-center justify-center p-0.5 px-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] rotate-2 text-[6px] font-mono leading-tight uppercase font-black text-center">
            <span>APPROVED</span>
            <span className="text-[5px] text-[#FF2E63]">BY THE</span>
            <span>CSE CODE</span>
          </div>
        </div>

        {/* Center/Right Comic Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => triggerComicFX('INFO!')}
            className="px-3 py-1 bg-white hover:bg-[#E0F7FA] border-2 border-black shadow-[2.5px_2.5px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase transition-all hover:-translate-y-0.5"
          >
            ABOUT
          </button>

          <button
            onClick={() => triggerComicFX('HELLO!')}
            className="px-3 py-1 bg-white hover:bg-[#FFE600] border-2 border-black shadow-[2.5px_2.5px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase transition-all hover:-translate-y-0.5"
          >
            CONTACT
          </button>

          {/* Register Navbar Button */}
          <button
            onClick={() => triggerComicFX('POW!')}
            className="px-3.5 sm:px-4 py-1 bg-[#00E5FF] hover:bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000000] font-display text-xs sm:text-sm tracking-wider uppercase transition-all hover:-translate-y-0.5"
          >
            REGISTER
          </button>
        </nav>
      </header>

      {/* =========================================================================
          2. CENTER HERO: LARGE COMIC PANEL (Main Visual Focus)
          ========================================================================= */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full my-auto py-1 px-1">
        {/* Outer unclipped wrapper for top floating badges */}
        <div className="relative w-full">
          {/* Top-Left Panel Narration Box */}
          <div className="absolute -top-3 left-2 sm:left-4 z-50 bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000000] px-2.5 py-0.5 -rotate-2">
            <span className="font-comic text-[10px] sm:text-xs uppercase tracking-wider text-black font-bold">
              CHAPTER 01: THE AWAKENING
            </span>
          </div>

          {/* Top-Right Prize Starburst Sticker */}
          <div
            onClick={() => triggerComicFX('KACHING!')}
            className="cursor-pointer absolute -top-3.5 right-2 sm:right-4 z-50 bg-[#FF2E63] border-2 border-black shadow-[3px_3px_0px_#000000] px-3 py-1 rotate-4 hover:rotate-8 transition-transform hover:scale-105"
          >
            <div className="flex flex-col items-center justify-center leading-none text-center">
              <span className="font-display text-xs sm:text-sm text-white text-stroke-comic-sm tracking-wide">
                ₹25,000+
              </span>
              <span className="font-comic text-[8px] sm:text-[9px] text-[#FFE600] tracking-wider uppercase mt-0.5">
                PRIZE POOL!
              </span>
            </div>
          </div>

          {/* Main Comic Panel Frame */}
          <div className="relative w-full bg-white border-[4px] border-black shadow-[6px_6px_0px_#000000] p-3 sm:p-4 md:p-5 pt-4 sm:pt-5">
            {/* Panel Background: Halftone & Sunburst Texture */}
            <div className="absolute inset-0 bg-comic-sunburst-cyan opacity-25 pointer-events-none" />
            <div className="absolute inset-0 bg-halftone-dots-cyan opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-comic-hatch opacity-15 pointer-events-none" />

            {/* -------------------------------------------------------------
                HERO CONTENT GRID INSIDE THE COMIC PANEL
                ------------------------------------------------------------- */}
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-4 items-center">
              {/* Left Column (7 cols): Comic Title, Narrative & Speech Bubble */}
              <div className="md:col-span-7 space-y-1.5 sm:space-y-2 text-left">
                {/* Event Subtitle Badge */}
                <div className="inline-block px-2 py-0.5 bg-black text-[#FFE600] font-comic text-[9px] sm:text-[10px] uppercase tracking-widest rotate-1">
                  GOVT COLLEGE OF ENGINEERING, ERODE &bull; CSE DEPT
                </div>

                {/* Giant Comic Title */}
                <div className="space-y-0">
                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-black tracking-tight leading-none uppercase">
                    ZINNIA
                  </h1>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="font-comic text-xl sm:text-2xl text-[#00E5FF] text-stroke-comic-sm">
                      2026
                    </span>
                    <span className="px-2 py-0.2 bg-[#FF2E63] text-white border border-black font-bungee text-[9px] sm:text-[10px] -rotate-2">
                      NATIONAL LEVEL
                    </span>
                  </div>
                </div>

                {/* Comic Speech Bubble / Narrative Box */}
                <div className="relative p-2 sm:p-2.5 bg-[#FFFDF0] border-2 border-black shadow-[3px_3px_0px_#000000]">
                  <p className="font-comic text-[11px] sm:text-xs text-gray-800 leading-snug">
                    "A TIMELINE WAS BROKEN. SOMETHING EMERGED FROM IT. NINE BATTLEGROUNDS AWAIT THE BOLDEST MINDS IN COMPUTATION!"
                  </p>
                  {/* Speech Arrow */}
                  <div className="absolute -bottom-2 left-5 w-2.5 h-2.5 bg-[#FFFDF0] border-r-2 border-b-2 border-black rotate-45" />
                </div>

                {/* 9 Battlegrounds Sticker Strip */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="px-2 py-0.5 bg-[#E0F7FA] border border-black font-mono text-[9px] sm:text-[10px] font-bold">
                    ⚡ 9 ACTIVE EVENTS
                  </span>
                  <span className="px-2 py-0.5 bg-[#FFF9C4] border border-black font-mono text-[9px] sm:text-[10px] font-bold">
                    ⚡ ANNA UNIV VERIFIED
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): 2D Hand-Drawn Illustrated Hero Art */}
              <div className="md:col-span-5 relative flex items-center justify-center">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 flex items-center justify-center">
                  {/* Halftone Starburst Radial Badge Behind Character */}
                  <div className="absolute inset-0 bg-[#FFE600] border-3 border-black rounded-full shadow-[4px_4px_0px_#000000] rotate-12 flex items-center justify-center">
                    <div className="w-full h-full bg-halftone-dots opacity-20 rounded-full" />
                  </div>

                  {/* 2D Comic Illustrated Cyborg Character (SVG Ink Art) */}
                  <svg
                    viewBox="0 0 200 200"
                    className="relative z-30 w-full h-full drop-shadow-[4px_4px_0px_#000000] hover:scale-105 transition-transform duration-200"
                  >
                    {/* Comic Speed Lines */}
                    <path d="M 10 30 L 50 50 M 10 100 L 40 100 M 15 170 L 50 150" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M 190 30 L 150 50 M 190 100 L 160 100 M 185 170 L 150 150" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Torso & Clavicle Armor Plates */}
                    <polygon points="65,130 135,130 145,190 55,190" fill="#383F4D" stroke="#000" strokeWidth="4.5" />
                    <polygon points="80,135 120,135 110,180 90,180" fill="#00E5FF" stroke="#000" strokeWidth="3.5" />
                    <circle cx="100" cy="155" r="10" fill="#FFE600" stroke="#000" strokeWidth="3.5" />

                    {/* Neck & Vertebrae */}
                    <rect x="90" y="115" width="20" height="20" fill="#5E6878" stroke="#000" strokeWidth="4" />
                    <line x1="90" y1="122" x2="110" y2="122" stroke="#000" strokeWidth="3" />
                    <line x1="90" y1="128" x2="110" y2="128" stroke="#000" strokeWidth="3" />

                    {/* Shoulders */}
                    <polygon points="40,135 65,125 65,155 35,160" fill="#5E6878" stroke="#000" strokeWidth="4" />
                    <polygon points="160,135 135,125 135,155 165,160" fill="#5E6878" stroke="#000" strokeWidth="4" />

                    {/* Helmet / Head Shell */}
                    <polygon points="70,45 130,45 145,90 125,120 75,120 55,90" fill="#383F4D" stroke="#000" strokeWidth="4.5" />
                    {/* Forehead Brow Armor */}
                    <polygon points="75,55 125,55 135,75 65,75" fill="#5E6878" stroke="#000" strokeWidth="3.5" />
                    {/* Temporal Crests */}
                    <polygon points="55,60 65,45 65,85 50,75" fill="#FFE600" stroke="#000" strokeWidth="3.5" />
                    <polygon points="145,60 135,45 135,85 150,75" fill="#FFE600" stroke="#000" strokeWidth="3.5" />

                    {/* Angular Slit Luminous Eyes (Emerald) */}
                    <polygon points="75,82 92,85 92,90 77,88" fill="#00FF88" stroke="#000" strokeWidth="2.5" />
                    <polygon points="125,82 108,85 108,90 123,88" fill="#00FF88" stroke="#000" strokeWidth="2.5" />

                    {/* Faceplate Jaw & Intake Vents */}
                    <polygon points="85,98 115,98 110,118 90,118" fill="#14171F" stroke="#000" strokeWidth="3.5" />
                    <line x1="92" y1="104" x2="108" y2="104" stroke="#00FF88" strokeWidth="2.5" />
                    <line x1="94" y1="110" x2="106" y2="110" stroke="#00FF88" strokeWidth="2.5" />

                    {/* Comic Hatching Lines on Armor */}
                    <line x1="60" y1="90" x2="68" y2="105" stroke="#000" strokeWidth="2" />
                    <line x1="66" y1="90" x2="74" y2="105" stroke="#000" strokeWidth="2" />
                    <line x1="135" y1="90" x2="127" y2="105" stroke="#000" strokeWidth="2" />
                  </svg>

                  {/* "CRACKLE!" Sound Effect Overlay Sticker */}
                  <div
                    onClick={() => triggerComicFX('ZAP!')}
                    className="cursor-pointer absolute -bottom-2 -left-2 z-40 bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_#000000] px-2 py-0.5 -rotate-12 hover:rotate-0 transition-transform"
                  >
                    <span className="font-display text-xs sm:text-sm text-[#FF2E63] text-stroke-comic-sm">
                      ⚡ CRACKLE!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. COUNTDOWN & 4. REGISTER CTA (Directly Below Artwork)
            ========================================================================= */}
        <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6 pt-2 w-full">
          {/* Illustrated Comic Countdown Module */}
          <div className="flex flex-col items-center sm:items-start">
            {/* Caption Header */}
            <div className="px-2 py-0.2 bg-black text-white font-comic text-[9px] sm:text-[10px] uppercase tracking-widest border border-black -rotate-1">
              REGISTRATION OPENS IN
            </div>

            {/* Countdown Comic Number Boxes */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {/* Days */}
              <div className="flex flex-col items-center p-1 bg-white border-2 border-black shadow-[2.5px_2.5px_0px_#000000] min-w-[38px] sm:min-w-[44px]">
                <span className="font-display text-lg sm:text-xl text-black leading-none">
                  {timeLeft.days}
                </span>
                <span className="font-comic text-[7px] text-gray-500 font-bold uppercase mt-0.5">
                  DAYS
                </span>
              </div>

              <span className="font-display text-lg text-black animate-pulse">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center p-1 bg-white border-2 border-black shadow-[2.5px_2.5px_0px_#000000] min-w-[38px] sm:min-w-[44px]">
                <span className="font-display text-lg sm:text-xl text-black leading-none">
                  {timeLeft.hours}
                </span>
                <span className="font-comic text-[7px] text-gray-500 font-bold uppercase mt-0.5">
                  HRS
                </span>
              </div>

              <span className="font-display text-lg text-black animate-pulse">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center p-1 bg-white border-2 border-black shadow-[2.5px_2.5px_0px_#000000] min-w-[38px] sm:min-w-[44px]">
                <span className="font-display text-lg sm:text-xl text-black leading-none">
                  {timeLeft.minutes}
                </span>
                <span className="font-comic text-[7px] text-gray-500 font-bold uppercase mt-0.5">
                  MIN
                </span>
              </div>

              <span className="font-display text-lg text-black animate-pulse">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center p-1 bg-[#FFE600] border-2 border-black shadow-[2.5px_2.5px_0px_#000000] min-w-[38px] sm:min-w-[44px]">
                <span className="font-display text-lg sm:text-xl text-[#FF2E63] text-stroke-comic-sm leading-none">
                  {timeLeft.seconds}
                </span>
                <span className="font-comic text-[7px] text-black font-bold uppercase mt-0.5">
                  SEC
                </span>
              </div>
            </div>
          </div>

          {/* Large Comic Register CTA Button */}
          <button
            onClick={() => triggerComicFX('REGISTERED!')}
            className="btn-comic group px-6 sm:px-8 py-2 sm:py-2.5 bg-[#FFE600] hover:bg-[#00E5FF] border-[3px] border-black shadow-[5px_5px_0px_#000000] font-display text-base sm:text-lg text-black tracking-wider uppercase -rotate-1 hover:rotate-0 cursor-pointer flex items-center gap-2"
          >
            <span>REGISTER</span>
            <span className="font-display text-lg sm:text-xl text-[#FF2E63] group-hover:translate-x-1 transition-transform">
              &rarr;
            </span>
          </button>
        </div>
      </main>

      {/* =========================================================================
          5. FOOTER (Hand-Drawn Divider + Comic Stamp Footer)
          ========================================================================= */}
      <footer className="relative z-30 max-w-5xl mx-auto w-full pt-0.5">
        {/* Hand-Drawn Ink Divider (Cross-hatched jagged line) */}
        <div className="w-full h-[2px] bg-black mb-1 relative">
          <div className="absolute -top-1 left-1/4 w-2.5 h-2.5 bg-black rotate-45" />
          <div className="absolute -top-1 right-1/4 w-2.5 h-2.5 bg-black rotate-45" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-1 text-[9px] sm:text-[10px] font-comic tracking-wider text-black">
          {/* Left Copyright */}
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#FFE600] px-1.5 py-0.2 text-[8px] font-bold">
              ZINNIA &copy; 2026
            </span>
            <span className="text-gray-600 hidden md:inline">
              DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
            </span>
          </div>

          {/* Right Links & Socials */}
          <div className="flex items-center gap-3 text-gray-700 uppercase font-bold">
            <button
              onClick={() => triggerComicFX('ABOUT')}
              className="hover:text-[#FF2E63] hover:underline transition-colors"
            >
              ABOUT
            </button>
            <span>&bull;</span>
            <button
              onClick={() => triggerComicFX('CONTACT')}
              className="hover:text-[#FF2E63] hover:underline transition-colors"
            >
              CONTACT
            </button>
            <span>&bull;</span>
            <button
              onClick={() => triggerComicFX('INSTA')}
              className="hover:text-[#FF2E63] hover:underline transition-colors"
            >
              INSTAGRAM
            </button>
            <span>&bull;</span>
            <button
              onClick={() => triggerComicFX('EMAIL')}
              className="hover:text-[#FF2E63] hover:underline transition-colors"
            >
              EMAIL
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteHomePage;
