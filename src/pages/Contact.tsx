import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
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
    <div className="relative w-full min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none scroll-smooth">
      {/* Floating Interactive Comic Sound FX Pop */}
      {interactiveSoundText && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-80 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 bg-[#E5BD00] border-2 border-[#090A0B] shadow-[5px_5px_0px_#090A0B] rotate-3 sticker-pop">
            <span className="font-display text-3xl sm:text-5xl text-[#090A0B] tracking-wider font-black">
              {interactiveSoundText}
            </span>
          </div>
        </div>
      )}

      {/* Universal Comic Navbar */}
      <WebsiteNavbar />

      {/* =========================================================================
          2. MAIN CONTENT AREA
          ========================================================================= */}
      <main className="relative z-20 max-w-6xl mx-auto w-full pt-10 sm:pt-14 pb-16 px-2 sm:px-4 flex-1">
        {/* Page Header */}
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#111214] border border-[#B8B8B2]/30 text-[#B8B8B2] font-mono text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#E5BD00] animate-pulse" />
            <span>COMMUNICATION DESK</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#EEEEEA]">
            CONTACT <span className="text-[#E5BD00]">US</span>
          </h1>

          <p className="font-mono text-xs sm:text-sm text-[#B8B8B2] max-w-xl mx-auto leading-relaxed">
            Have questions about event guidelines, accommodation, schedule, or registrations? We are here to help.
          </p>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          
          {/* CARD 1: Official Email & Helplines */}
          <div className="bg-[#111214] border border-[#B8B8B2]/20 rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#090A0B] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#17181C] border border-[#B8B8B2]/30 text-[#E5BD00] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-comic font-black text-lg text-[#EEEEEA] uppercase tracking-wide">
                    OFFICIAL CORRESPONDENCE
                  </h3>
                  <p className="font-mono text-xs text-[#B8B8B2]">Direct inquiries &amp; verification desk</p>
                </div>
              </div>

              {/* Primary Email Box */}
              <div className="bg-[#17181C] border border-[#B8B8B2]/20 rounded-xl p-4 sm:p-5 mb-5 group hover:border-[#B8B8B2] transition-colors">
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#B8B8B2] font-bold mb-1.5">
                  DEPARTMENT EMAIL ID
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <a
                    href="mailto:zinnia2026@gcee.ac.in"
                    className="font-mono text-base sm:text-lg font-bold text-[#EEEEEA] hover:text-[#E5BD00] transition-colors tracking-wide select-all"
                  >
                    zinnia2026@gcee.ac.in
                  </a>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyEmail}
                      className="px-3 py-1.5 bg-[#111214] hover:bg-[#1A1A20] border border-[#B8B8B2]/40 text-xs font-mono font-medium rounded-lg flex items-center gap-1.5 text-[#B8B8B2] hover:text-[#EEEEEA] transition-all cursor-pointer"
                      title="Copy email to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#E5BD00]" />
                          <span className="text-[#E5BD00]">COPIED</span>
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
                      className="px-3 py-1.5 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-comic font-bold text-xs rounded-lg border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center gap-1.5 transition-all"
                    >
                      <span>MAIL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Helpline Rows */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#111214] text-[#B8B8B2] flex items-center justify-center shrink-0">
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

                <div className="p-3 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-md bg-[#111214] text-[#B8B8B2] flex items-center justify-center shrink-0">
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

            <div className="mt-5 pt-3.5 border-t border-[#B8B8B2]/20 text-[#B8B8B2] text-xs font-mono flex items-center justify-between">
              <span>Operational Hours: 11:00 AM – 4:00 PM</span>
              <span className="text-[#B8B8B2] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0FA9C6] inline-block" />
                ONLINE DESK
              </span>
            </div>
          </div>

          {/* CARD 2: Campus Headquarters & Location */}
          <div className="bg-[#111214] border border-[#B8B8B2]/20 rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#090A0B] flex flex-col justify-between relative">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[#17181C] border border-[#B8B8B2]/30 text-[#E5BD00] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-comic font-black text-lg text-[#EEEEEA] uppercase tracking-wide">
                    CAMPUS HEADQUARTERS
                  </h3>
                  <p className="font-mono text-xs text-[#B8B8B2]">Government College of Engineering, Erode</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-[#EEEEEA] leading-relaxed bg-[#17181C] border border-[#B8B8B2]/20 rounded-xl p-4 mb-4">
                <p className="font-bold text-[#EEEEEA] text-sm">Department of Computer Science &amp; Engineering</p>
                <p className="text-[#B8B8B2]">NH-544 (Salem - Cochin National Highway), Chithode,</p>
                <p className="text-[#B8B8B2]">Erode - 638316, Tamil Nadu, India</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono mb-4">
                <div className="p-3 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#B8B8B2] shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#B8B8B2]/70 uppercase">SYMPOSIUM DATE</div>
                    <div className="font-bold text-[#EEEEEA]">Sep 24, 2026</div>
                  </div>
                </div>
                <div className="p-3 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-center gap-2.5">
                  <Navigation className="w-4 h-4 text-[#B8B8B2] shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#B8B8B2]/70 uppercase">TRANSIT DISTANCE</div>
                    <div className="font-bold text-[#EEEEEA]">~14 km from Erode Bus Stand</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#B8B8B2]/20">
              <a
                href="https://maps.google.com/?q=Government+College+of+Engineering+Erode"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-[#17181C] hover:bg-[#111214] border border-[#B8B8B2]/30 hover:border-[#B8B8B2] text-[#EEEEEA] font-mono text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all shadow-[2px_2px_0px_#090A0B] cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#E5BD00]" />
                <span>OPEN IN GOOGLE MAPS</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#B8B8B2]" />
              </a>
            </div>
          </div>

          {/* CARD 3: Student Coordinators */}
          <div className="bg-[#111214] border border-[#B8B8B2]/20 rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#090A0B]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#17181C] border border-[#B8B8B2]/30 text-[#E5BD00] flex items-center justify-center shrink-0">
                <span className="font-black text-sm text-[#0FA9C6]">CSE</span>
              </div>
              <div>
                <h3 className="font-comic font-black text-lg text-[#EEEEEA] uppercase tracking-wide">
                  STUDENT COORDINATORS
                </h3>
                <p className="font-mono text-xs text-[#B8B8B2]">Symposium event leads &amp; inquiries</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
              {/* Coordinator 1: Saran S */}
              <div className="p-4 bg-[#181820] border border-[#2A2A36] rounded-lg space-y-1.5 hover:border-zinc-500 transition-colors">
                <span className="text-[10px] text-[#F5D90A] font-bold tracking-widest uppercase">
                  STUDENT COORDINATOR
                </span>
                <h4 className="font-bold text-sm text-white">Saran S</h4>
                <p className="text-zinc-400 text-[11px]">Event Coordinator &bull; CSE</p>
                <a
                  href="tel:+919629993985"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#F5D90A] transition-colors pt-1"
                >
                  <Phone className="w-3 h-3 text-[#F5D90A]" />
                  <span>+91 96299 93985</span>
                </a>
              </div>

              {/* Coordinator 2: Bharani E K */}
              <div className="p-4 bg-[#181820] border border-[#2A2A36] rounded-lg space-y-1.5 hover:border-zinc-500 transition-colors">
                <span className="text-[10px] text-[#F5D90A] font-bold tracking-widest uppercase">
                  STUDENT COORDINATOR
                </span>
                <h4 className="font-bold text-sm text-white">Bharani E K</h4>
                <p className="text-zinc-400 text-[11px]">Event Coordinator &bull; CSE</p>
                <a
                  href="tel:+918807176399"
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-[#F5D90A] transition-colors pt-1"
                >
                  <Phone className="w-3 h-3 text-[#F5D90A]" />
                  <span>+91 88071 76399</span>
                </a>
              </div>
            </div>
          </div>

          {/* CARD 4: Transit & Arrival Guide */}
          <div className="bg-[#111214] border border-[#B8B8B2]/20 rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#090A0B]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#17181C] border border-[#B8B8B2]/30 text-[#E5BD00] flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-[#0FA9C6]" />
              </div>
              <div>
                <h3 className="font-comic font-black text-lg text-[#EEEEEA] uppercase tracking-wide">
                  HOW TO REACH THE VENUE
                </h3>
                <p className="font-mono text-xs text-[#B8B8B2]">Campus transit &amp; connectivity details</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono text-[#B8B8B2]">
              <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-start gap-3">
                <Bus className="w-4 h-4 text-[#0FA9C6] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#EEEEEA]">By Bus</div>
                  <div className="text-[#B8B8B2] text-[11px] mt-0.5 leading-relaxed">
                    Frequent town &amp; mofussil buses operate from Erode Central Bus Stand towards Bhavani / Chithode route. Alight at the IRTT / GCEE main arch stop.
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-start gap-3">
                <Train className="w-4 h-4 text-[#0FA9C6] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#EEEEEA]">By Train</div>
                  <div className="text-[#B8B8B2] text-[11px] mt-0.5 leading-relaxed">
                    Erode Junction (ED) is well connected across all major routes. The campus is ~15 km from the station; autorickshaws and buses operate round the clock.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Website Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteContactPage;
