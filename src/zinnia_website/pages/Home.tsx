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
    <div className="relative w-screen h-screen max-h-screen overflow-hidden bg-[#FFFDF0] text-[#0F0F14] flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#FFE600] border-4 border-black shadow-[6px_6px_0px_#000000] rotate-6">
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
          1. TOP NAVBAR (100% 2D Illustrated Comic Style)
          ========================================================================= */}
      <header className="relative z-60 max-w-6xl mx-auto w-full flex items-center justify-between gap-4 pt-1 px-2">
        {/* Left: Illustrated ZINNIA Comic Logo */}
        <div className="flex items-center gap-3">
          {/* Logo Badge */}
          <div
            onClick={() => triggerComicFX('BOOM!')}
            className="cursor-pointer group relative px-4 py-1.5 bg-[#FFE600] border-[3.5px] border-black shadow-[4px_4px_0px_#000000] -rotate-1 hover:rotate-0 transition-transform active:translate-x-1 active:translate-y-1"
          >
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

          {/* Comics Code Authority Parody Stamp */}
          <div className="hidden sm:flex flex-col items-center justify-center p-1 px-2 bg-white border-2 border-black shadow-[2.5px_2.5px_0px_#000000] rotate-2 text-[7px] font-mono leading-tight uppercase font-black text-center">
            <span>APPROVED</span>
            <span className="text-[6px] text-[#FF2E63]">BY THE</span>
            <span>CSE CODE</span>
          </div>
        </div>

        {/* Center/Right Comic Navigation Tabs */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => triggerComicFX('INFO!')}
            className="px-3.5 sm:px-4 py-1.5 bg-white hover:bg-[#E0F7FA] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold transition-all hover:-translate-y-0.5"
          >
            ABOUT
          </button>

          <button
            onClick={() => triggerComicFX('HELLO!')}
            className="px-3.5 sm:px-4 py-1.5 bg-white hover:bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold transition-all hover:-translate-y-0.5"
          >
            CONTACT
          </button>

          {/* Register Navbar Button */}
          <button
            onClick={() => triggerComicFX('POW!')}
            className="px-4 sm:px-6 py-1.5 bg-[#00E5FF] hover:bg-[#FFE600] border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] font-display text-xs sm:text-sm tracking-wider uppercase transition-all hover:-translate-y-0.5"
          >
            REGISTER
          </button>
        </nav>
      </header>

      {/* =========================================================================
          2. CENTER HERO: LARGE COMIC PANEL (Main Visual Focus)
          ========================================================================= */}
      <main className="relative z-30 flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full my-auto py-2 sm:py-3 px-2">
        {/* Outer unclipped wrapper for top floating badges */}
        <div className="relative w-full">
          {/* Top-Left Panel Narration Box */}
          <div className="absolute -top-3.5 left-3 sm:left-6 z-50 bg-[#FFE600] border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] px-3 sm:px-4 py-1 -rotate-2">
            <span className="font-comic text-[11px] sm:text-xs md:text-sm uppercase tracking-wider text-black font-extrabold">
              CHAPTER 01: THE AWAKENING
            </span>
          </div>

          {/* Top-Right Prize Starburst Sticker */}
          <div
            onClick={() => triggerComicFX('KACHING!')}
            className="cursor-pointer absolute -top-4 right-3 sm:right-6 z-50 bg-[#FF2E63] border-[2.5px] border-black shadow-[3.5px_3.5px_0px_#000000] px-3.5 sm:px-5 py-1.5 rotate-4 hover:rotate-8 transition-transform hover:scale-105"
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
                {/* Event Subtitle Badge */}
                <div className="inline-block px-2.5 py-0.5 bg-black text-[#FFE600] font-comic text-[10px] sm:text-[11px] md:text-xs uppercase tracking-widest rotate-1 font-bold">
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
                    <span className="px-2.5 py-0.5 bg-[#FF2E63] text-white border-[2px] border-black font-bungee text-[10px] sm:text-xs -rotate-2">
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

                {/* 9 Battlegrounds Sticker Strip */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 bg-[#E0F7FA] border-[2px] border-black font-mono text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#000000]">
                    ⚡ 9 ACTIVE EVENTS
                  </span>
                  <span className="px-2.5 py-1 bg-[#FFF9C4] border-[2px] border-black font-mono text-[10px] sm:text-xs font-black shadow-[2px_2px_0px_#000000]">
                    ⚡ ANNA UNIV VERIFIED
                  </span>
                </div>
              </div>

              {/* Right Column (5 cols): 2D Hand-Drawn Illustrated Hero Art */}
              <div className="md:col-span-5 relative flex items-center justify-center">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-72 lg:h-72 flex items-center justify-center">
                  {/* 2D Comic Illustrated Cyborg Character & Exact Hand-Drawn Comic Yellow Shape (SVG Ink Art) */}
                  <svg
                    viewBox="0 0 210 210"
                    className="relative z-30 w-full h-full hover:scale-105 transition-transform duration-200"
                  >
                    {/* Hand-Drawn Hard Black Ink Shadow Arc Underneath */}
                    <path
                      d="M 28 135 C 38 180 88 204 158 194 C 182 188 198 170 200 148 C 196 174 162 198 108 198 C 55 198 32 165 28 135 Z"
                      fill="#000000"
                    />

                    {/* Exact Hand-Drawn Organic Comic Yellow Shape */}
                    <path
                      d="M 105 15 C 160 14 195 48 193 103 C 191 156 156 189 104 187 C 48 185 15 152 17 99 C 19 46 50 16 105 15 Z"
                      fill="#FFE600"
                      stroke="#000000"
                      strokeWidth="5"
                      strokeLinejoin="round"
                    />

                    {/* Dynamic Comic Speed Bursts & Hatch Lines Breaking the Border */}
                    {/* Top-Left diagonal speed line */}
                    <line x1="30" y1="28" x2="72" y2="60" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
                    
                    {/* Top-Right double speed lines */}
                    <line x1="178" y1="28" x2="136" y2="60" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="188" y1="40" x2="148" y2="68" stroke="#000000" strokeWidth="3.2" strokeLinecap="round" />

                    {/* Middle-Left double horizontal speed lines */}
                    <line x1="8" y1="96" x2="52" y2="96" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="12" y1="106" x2="44" y2="106" stroke="#000000" strokeWidth="3.2" strokeLinecap="round" />

                    {/* Middle-Right double horizontal speed lines */}
                    <line x1="198" y1="96" x2="154" y2="96" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="194" y1="106" x2="160" y2="106" stroke="#000000" strokeWidth="3.2" strokeLinecap="round" />

                    {/* Bottom-Left & Bottom-Right speed line bursts */}
                    <line x1="22" y1="162" x2="65" y2="142" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />
                    <line x1="184" y1="162" x2="142" y2="142" stroke="#000000" strokeWidth="4.5" strokeLinecap="round" />

                    {/* Torso & Clavicle Armor Plates */}
                    <polygon points="70,126 140,126 150,186 60,186" fill="#383F4D" stroke="#000" strokeWidth="4.5" />
                    <polygon points="85,131 125,131 115,176 95,176" fill="#00E5FF" stroke="#000" strokeWidth="3.5" />
                    <circle cx="105" cy="151" r="10" fill="#FFE600" stroke="#000" strokeWidth="3.5" />

                    {/* Neck & Vertebrae */}
                    <rect x="95" y="113" width="20" height="18" fill="#5E6878" stroke="#000" strokeWidth="4" />
                    <line x1="95" y1="119" x2="115" y2="119" stroke="#000" strokeWidth="3" />
                    <line x1="95" y1="125" x2="115" y2="125" stroke="#000" strokeWidth="3" />

                    {/* Shoulders */}
                    <polygon points="40,131 70,121 70,156 35,159" fill="#5E6878" stroke="#000" strokeWidth="4" />
                    <polygon points="170,131 140,121 140,156 175,159" fill="#5E6878" stroke="#000" strokeWidth="4" />

                    {/* Helmet / Head Shell */}
                    <polygon points="75,46 135,46 150,91 130,121 80,121 60,91" fill="#383F4D" stroke="#000" strokeWidth="4.5" />
                    {/* Forehead Brow Armor */}
                    <polygon points="80,56 130,56 140,76 70,76" fill="#5E6878" stroke="#000" strokeWidth="3.5" />
                    {/* Temporal Crests (Yellow Horns) */}
                    <polygon points="60,61 70,46 70,86 55,76" fill="#FFE600" stroke="#000" strokeWidth="3.5" />
                    <polygon points="150,61 140,46 140,86 155,76" fill="#FFE600" stroke="#000" strokeWidth="3.5" />

                    {/* Angular Slit Luminous Eyes (Emerald) */}
                    <polygon points="80,83 97,86 97,91 82,89" fill="#00FF88" stroke="#000" strokeWidth="2.5" />
                    <polygon points="130,83 113,86 113,91 128,89" fill="#00FF88" stroke="#000" strokeWidth="2.5" />

                    {/* Faceplate Jaw & Intake Vents */}
                    <polygon points="90,99 120,99 115,119 95,119" fill="#14171F" stroke="#000" strokeWidth="3.5" />
                    <line x1="97" y1="105" x2="113" y2="105" stroke="#00FF88" strokeWidth="2.5" />
                    <line x1="99" y1="111" x2="111" y2="111" stroke="#00FF88" strokeWidth="2.5" />

                    {/* Comic Hatching Lines on Armor */}
                    <line x1="65" y1="91" x2="73" y2="106" stroke="#000" strokeWidth="2" />
                    <line x1="71" y1="91" x2="79" y2="106" stroke="#000" strokeWidth="2" />
                    <line x1="140" y1="91" x2="132" y2="106" stroke="#000" strokeWidth="2" />
                  </svg>

                  {/* "⚡ CRACKLE!" Sound Effect Overlay Sticker */}
                  <div
                    onClick={() => triggerComicFX('ZAP!')}
                    className="cursor-pointer absolute -bottom-1 -left-3 sm:-bottom-2 sm:-left-4 z-40 bg-[#FFE600] border-[2.5px] border-black shadow-[4px_4px_0px_#000000] px-3 py-1 -rotate-12 hover:rotate-0 transition-transform active:translate-x-0.5 active:translate-y-0.5"
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
            3. COUNTDOWN & 4. REGISTER CTA (Directly Below Artwork)
            ========================================================================= */}
        <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 pt-3 sm:pt-4 w-full">
          {/* Illustrated Comic Countdown Module */}
          <div className="flex flex-col items-center sm:items-start">
            {/* Caption Header */}
            <div className="px-2.5 py-0.5 bg-black text-white font-comic text-[10px] sm:text-xs uppercase tracking-widest border border-black -rotate-1 font-bold">
              REGISTRATION OPENS IN
            </div>

            {/* Countdown Comic Number Boxes */}
            <div className="flex items-center gap-2 pt-1">
              {/* Days */}
              <div className="flex flex-col items-center p-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px]">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-black leading-none">
                  {timeLeft.days}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                  DAYS
                </span>
              </div>

              <span className="font-display text-xl text-black animate-pulse">:</span>

              {/* Hours */}
              <div className="flex flex-col items-center p-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px]">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-black leading-none">
                  {timeLeft.hours}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                  HRS
                </span>
              </div>

              <span className="font-display text-xl text-black animate-pulse">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center p-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px]">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-black leading-none">
                  {timeLeft.minutes}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                  MIN
                </span>
              </div>

              <span className="font-display text-xl text-black animate-pulse">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center p-1.5 bg-[#FFE600] border-[2.5px] border-black shadow-[3px_3px_0px_#000000] min-w-[46px] sm:min-w-[54px]">
                <span className="font-display text-xl sm:text-2xl md:text-3xl text-[#FF2E63] leading-none font-black">
                  {timeLeft.seconds}
                </span>
                <span className="font-comic text-[8px] sm:text-[9px] text-black font-extrabold uppercase mt-0.5">
                  SEC
                </span>
              </div>
            </div>
          </div>

          {/* Large Comic Register CTA Button */}
          <button
            onClick={() => triggerComicFX('REGISTERED!')}
            className="btn-comic group px-8 sm:px-12 py-3 sm:py-3.5 bg-[#FFE600] hover:bg-[#00E5FF] border-[3.5px] border-black shadow-[6px_6px_0px_#000000] font-display text-lg sm:text-xl md:text-2xl text-black tracking-wider uppercase -rotate-1 hover:rotate-0 cursor-pointer flex items-center gap-3 transition-all hover:scale-105 active:translate-x-1 active:translate-y-1"
          >
            <span>REGISTER</span>
            <span className="font-display text-2xl sm:text-3xl text-[#FF2E63] group-hover:translate-x-1.5 transition-transform">
              &rarr;
            </span>
          </button>
        </div>
      </main>

      {/* =========================================================================
          5. FOOTER (Hand-Drawn Divider + Comic Stamp Footer)
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
            <span className="bg-black text-[#FFE600] px-2 py-0.5 text-[9px] sm:text-[10px] font-bold">
              ZINNIA &copy; 2026
            </span>
            <span className="text-gray-700 hidden md:inline font-bold">
              DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
            </span>
          </div>

          {/* Right Links & Socials */}
          <div className="flex items-center gap-3.5 text-gray-800 uppercase font-black">
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
