import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebsiteFooter } from '../components/layout/Footer';
import { registerNav } from '../services/registerNavigation';
import { Phone, Mail, MapPin, Navigation, Calendar, Copy, Check, ExternalLink, Bus, Train, ArrowRight } from 'lucide-react';

// 2D-only Magnetic Interaction Component (Matching Home page)
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

export const WebsiteContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);

  const triggerComicFX = (soundText: string) => {
    setInteractiveSoundText(soundText);
    setTimeout(() => {
      setInteractiveSoundText(null);
    }, 900);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('zinnia2026@gcee.ac.in');
    setCopied(true);
    triggerComicFX('COPIED!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0A0A0D] text-[#ECECED] flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none scroll-smooth">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#F5D90A] border-[2.5px] border-[#0A0A0D] shadow-[5px_5px_0px_#8A7400] rotate-3 sticker-pop">
            <span className="font-display text-3xl sm:text-5xl text-[#0A0A0D] tracking-wider font-black">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. TOP NAVBAR (Exact Match to Home Page Layout & Structure)
          ========================================================================= */}
      <header className="relative z-60 max-w-6xl mx-auto w-full flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 pt-1 px-1.5 sm:px-2">
        {/* Left: Illustrated ZINNIA Comic Logo with Magnetic Pull */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <MagneticElement
            strength={0.25}
            onClick={() => {
              triggerComicFX('HOME!');
              navigate('/');
            }}
          >
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

          {/* Comics Code Authority Parody Stamp */}
          <div className="hidden md:flex flex-col items-center justify-center p-1 px-2 bg-[#15151A] border border-[#2E2E38] shadow-[2px_2px_0px_#000000] rotate-2 text-[7px] font-mono leading-tight uppercase font-bold text-center text-[#8E8E98]">
            <span>APPROVED</span>
            <span className="text-[6px] text-[#F5D90A]">BY THE</span>
            <span>CSE CODE</span>
          </div>
        </div>

        {/* Center/Right Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
          {/* HOME TAB */}
          <MagneticElement
            strength={0.3}
            onClick={() => {
              triggerComicFX('HOME!');
              navigate('/');
            }}
          >
            <button className="px-3 sm:px-4 py-1 sm:py-1.5 bg-[#15151A] hover:bg-[#202028] text-zinc-300 hover:text-white border border-[#2E2E38] hover:border-zinc-500 shadow-[2px_2px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold cursor-pointer transition-all flex items-center gap-1">
              <span>HOME</span>
            </button>
          </MagneticElement>

          {/* EVENTS TAB */}
          <MagneticElement
            strength={0.3}
            onClick={() => {
              triggerComicFX('EVENTS!');
              navigate('/events');
            }}
          >
            <button className="px-3 sm:px-4 py-1 sm:py-1.5 bg-[#15151A] hover:bg-[#202028] text-zinc-300 hover:text-white border border-[#2E2E38] hover:border-zinc-500 shadow-[2px_2px_0px_#000000] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold cursor-pointer transition-all flex items-center gap-1">
              <span>EVENTS</span>
            </button>
          </MagneticElement>

          {/* CONTACT TAB (Active) */}
          <MagneticElement
            strength={0.3}
            onClick={() => {
              triggerComicFX('CONTACT!');
            }}
          >
            <button className="px-3 sm:px-4 py-1 sm:py-1.5 bg-[#1F1F28] text-[#F5D90A] border-2 border-[#F5D90A]/80 shadow-[2px_2px_0px_#8A7400] font-comic text-xs sm:text-sm tracking-wider uppercase font-bold cursor-pointer transition-all flex items-center gap-1">
              <span>CONTACT</span>
            </button>
          </MagneticElement>

          {/* REGISTER Button */}
          <MagneticElement
            strength={0.35}
            onClick={() => {
              navigate('/register');
            }}
          >
            <button className="px-3.5 sm:px-5 py-1 sm:py-1.5 bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] border-2 border-[#F5D90A] shadow-[2.5px_2.5px_0px_#8A7400] font-display text-xs sm:text-sm tracking-wider uppercase font-black cursor-pointer transition-all shrink-0 active:translate-x-0.5 active:translate-y-0.5">
              REGISTER
            </button>
          </MagneticElement>
        </nav>
      </header>

      {/* =========================================================================
          2. MAIN CONTENT AREA (Harmonious, Modern Dark Theme)
          ========================================================================= */}
      <main className="relative z-20 max-w-6xl mx-auto w-full pt-10 sm:pt-14 pb-16 px-2 sm:px-4 flex-1">
        {/* Page Header */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#181820] border border-[#2E2E3A] text-zinc-400 font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#F5D90A] animate-pulse" />
            <span>COMMUNICATION DESK</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white">
            CONTACT <span className="text-[#F5D90A]">US</span>
          </h1>

          <p className="font-mono text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Have questions about event guidelines, accommodation, schedule, or registrations? We are here to help.
          </p>
        </div>

        {/* Contact Information Grid - 2x2 Clean Balanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          
          {/* CARD 1: Official Email & Helplines */}
          <div className="bg-[#121217] border border-[#252530] rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#000000] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A22] border border-[#2E2E3C] text-[#F5D90A] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide">
                    OFFICIAL CORRESPONDENCE
                  </h3>
                  <p className="font-mono text-xs text-zinc-400">Direct inquiries &amp; verification desk</p>
                </div>
              </div>

              {/* Primary Email Box */}
              <div className="bg-[#181820] border border-[#2A2A36] rounded-xl p-4 sm:p-5 mb-5 group hover:border-zinc-500 transition-colors">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                  DEPARTMENT EMAIL ID
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <a
                    href="mailto:zinnia2026@gcee.ac.in"
                    className="font-mono text-base sm:text-lg font-bold text-white hover:text-[#F5D90A] transition-colors tracking-wide select-all"
                  >
                    zinnia2026@gcee.ac.in
                  </a>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyEmail}
                      className="px-3 py-1.5 bg-[#22222C] hover:bg-[#2C2C38] border border-[#383846] text-xs font-mono font-medium rounded-lg flex items-center gap-1.5 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Copy email to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#F5D90A]" />
                          <span className="text-[#F5D90A]">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>COPY</span>
                        </>
                      )}
                    </button>
                    <a
                      href="mailto:zinnia2026@gcee.ac.in"
                      className="px-3 py-1.5 bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] font-comic font-bold text-xs rounded-lg border border-[#F5D90A] shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 transition-all"
                    >
                      <span>MAIL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Helpline Rows */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 bg-[#181820] border border-[#242430] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#20202A] text-zinc-300 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Saran S (Student Coordinator)</p>
                      <p className="font-bold text-zinc-200">+91 96299 93985</p>
                    </div>
                  </div>
                  <a
                    href="tel:+919629993985"
                    className="text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 font-semibold px-2.5 py-1 bg-[#22222C] border border-[#30303E] rounded transition-colors"
                  >
                    CALL
                  </a>
                </div>

                <div className="p-3 bg-[#181820] border border-[#242430] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#20202A] text-zinc-300 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase">Bharani E K (Student Coordinator)</p>
                      <p className="font-bold text-zinc-200">+91 88071 76399</p>
                    </div>
                  </div>
                  <a
                    href="tel:+918807176399"
                    className="text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500 font-semibold px-2.5 py-1 bg-[#22222C] border border-[#30303E] rounded transition-colors"
                  >
                    CALL
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-[#20202A] text-zinc-500 text-xs font-mono flex items-center justify-between">
              <span>Operational Hours: 11:00 AM – 4:00 PM</span>
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                ONLINE DESK
              </span>
            </div>
          </div>

          {/* CARD 2: Campus Headquarters & Location */}
          <div className="bg-[#121217] border border-[#252530] rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#000000] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A22] border border-[#2E2E3C] text-[#F5D90A] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide">
                    CAMPUS HEADQUARTERS
                  </h3>
                  <p className="font-mono text-xs text-zinc-400">Government College of Engineering, Erode</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-zinc-300 leading-relaxed bg-[#181820] border border-[#2A2A36] rounded-xl p-4 mb-4">
                <p className="font-bold text-white text-sm">Department of Computer Science &amp; Engineering</p>
                <p className="text-zinc-400">NH-544 (Salem - Cochin National Highway), Chithode,</p>
                <p className="text-zinc-400">Erode - 638316, Tamil Nadu, India</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono mb-4">
                <div className="p-3 bg-[#181820] border border-[#242430] rounded-lg flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">SYMPOSIUM DATE</div>
                    <div className="font-bold text-white">Sep 24, 2026</div>
                  </div>
                </div>
                <div className="p-3 bg-[#181820] border border-[#242430] rounded-lg flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-zinc-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">TRANSIT DISTANCE</div>
                    <div className="font-bold text-white">~14 km from Erode Bus Stand</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#20202A]">
              <a
                href="https://maps.google.com/?q=Government+College+of+Engineering+Erode"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-[#181820] hover:bg-[#22222C] border border-[#30303E] hover:border-zinc-500 text-zinc-200 hover:text-white font-mono text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#F5D90A]" />
                <span>OPEN IN GOOGLE MAPS</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* CARD 3: Organizing Committee */}
          <div className="bg-[#121217] border border-[#252530] rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#1A1A22] border border-[#2E2E3C] text-[#F5D90A] flex items-center justify-center shrink-0">
                <span className="font-black text-sm">CSE</span>
              </div>
              <div>
                <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide">
                  ORGANIZING COMMITTEE
                </h3>
                <p className="font-mono text-xs text-zinc-400">Symposium leadership &amp; coordinators</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
              {/* Student Coordinator 1 */}
              <div className="p-4 bg-[#181820] border border-[#2A2A36] rounded-lg space-y-1.5 hover:border-zinc-500 transition-colors">
                <span className="text-[10px] text-[#F5D90A] font-bold tracking-widest uppercase">
                  STUDENT COORDINATOR
                </span>
                <h4 className="font-bold text-sm text-white">Saran S</h4>
                <p className="text-zinc-400 text-[11px]">Final Year CSE &bull; Student Coordinator</p>
                <a
                  href="tel:+919629993985"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#F5D90A] transition-colors pt-1 font-bold"
                >
                  <Phone className="w-3 h-3 text-[#F5D90A]" />
                  <span>+91 96299 93985</span>
                </a>
              </div>

              {/* Student Coordinator 2 */}
              <div className="p-4 bg-[#181820] border border-[#2A2A36] rounded-lg space-y-1.5 hover:border-zinc-500 transition-colors">
                <span className="text-[10px] text-[#F5D90A] font-bold tracking-widest uppercase">
                  STUDENT COORDINATOR
                </span>
                <h4 className="font-bold text-sm text-white">Bharani E K</h4>
                <p className="text-zinc-400 text-[11px]">Final Year CSE &bull; Student Coordinator</p>
                <a
                  href="tel:+918807176399"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#F5D90A] transition-colors pt-1 font-bold"
                >
                  <Phone className="w-3 h-3 text-[#F5D90A]" />
                  <span>+91 88071 76399</span>
                </a>
              </div>
            </div>
          </div>

          {/* CARD 4: Transit & Arrival Guide */}
          <div className="bg-[#121217] border border-[#252530] rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#000000]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#1A1A22] border border-[#2E2E3C] text-[#F5D90A] flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-comic font-black text-lg text-white uppercase tracking-wide">
                  HOW TO REACH THE VENUE
                </h3>
                <p className="font-mono text-xs text-zinc-400">Campus transit &amp; connectivity details</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono text-zinc-300">
              <div className="p-3.5 bg-[#181820] border border-[#242430] rounded-lg flex items-start gap-3">
                <Bus className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">By Bus</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    Frequent town &amp; mofussil buses operate from Erode Central Bus Stand towards Bhavani / Chithode route. Alight at the IRTT / GCEE main arch stop.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#181820] border border-[#242430] rounded-lg flex items-start gap-3">
                <Train className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">By Train</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    Erode Junction (ED) is well connected across all major routes. The campus is ~15 km from the station; autorickshaws and buses operate round the clock.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* =========================================================================
          3. FOOTER COMPONENT
          ========================================================================= */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteContactPage;
