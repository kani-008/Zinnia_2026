import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { registerNav } from '../services/registerNavigation';
import { Phone, Mail, MapPin, ArrowRight, Bus } from 'lucide-react';

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
  const [interactiveSoundText, setInteractiveSoundText] = useState<string | null>(null);

  const triggerComicFX = (soundText: string) => {
    setInteractiveSoundText(soundText);
    setTimeout(() => {
      setInteractiveSoundText(null);
    }, 900);
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
                    OFFICIAL COORDINATOR
                  </h3>
                  <p className="font-mono text-xs text-[#B8B8B2]">Direct inquiries &amp; verification desk</p>
                </div>
              </div>

              {/* Helpline Rows */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#111214] text-[#B8B8B2] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-100 font-mono">Vijayanand</p>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Staff Coordinator</p>
                      <p className="text-sm font-bold text-zinc-100 font-mono">+91 98765 43287</p>
                    </div>
                  </div>
                  <a
                    href="tel:+919876543287"
                    className="text-xs text-zinc-300 hover:text-white hover:border-zinc-500 font-semibold px-3 py-1.5 bg-[#22222C] border border-[#30303E] rounded transition-colors shrink-0 font-mono"
                  >
                    CALL
                  </a>
                </div>

                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#111214] text-[#B8B8B2] flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-100 font-mono">Saran S</p>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Student Coordinator</p>
                      <p className="text-sm font-bold text-zinc-100 font-mono">+91 96299 93985</p>
                    </div>
                  </div>
                  <a
                    href="tel:+919629993985"
                    className="text-xs text-zinc-300 hover:text-white hover:border-zinc-500 font-semibold px-3 py-1.5 bg-[#22222C] border border-[#30303E] rounded transition-colors shrink-0 font-mono"
                  >
                    CALL
                  </a>
                </div>
              </div>
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
                    DEPARTMENT OF CSE
                  </h3>
                  <p className="font-mono text-xs text-[#B8B8B2]">Government College of Engineering, Erode</p>
                </div>
              </div>

              {/* Location map - 11.415753, 77.665973 (from the shared maps link) */}
              <div className="rounded-xl overflow-hidden border border-[#B8B8B2]/20 bg-[#17181C] mb-4">
                <iframe
                  title="Department of CSE, Government College of Engineering, Erode"
                  src="https://maps.google.com/maps?q=11.415753,77.665973&z=16&output=embed"
                  className="w-full h-44 sm:h-52 border-0 block"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

            </div>

          </div>

          {/* CARD 3: Bus Timings to the campus */}
          <div className="bg-[#111214] border border-[#B8B8B2]/20 rounded-xl p-6 sm:p-7 shadow-[4px_4px_0px_#090A0B] lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-[#17181C] border border-[#B8B8B2]/30 text-[#E5BD00] flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5 text-[#0FA9C6]" />
              </div>
              <div>
                <h3 className="font-comic font-black text-lg text-[#EEEEEA] uppercase tracking-wide">
                  BUS TIMINGS
                </h3>
                <p className="font-mono text-xs text-[#B8B8B2]">Government bus services to the college campus</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Route buses */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E5BD00]">
                  Route Bus
                </div>

                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg font-mono text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[#EEEEEA]">Erode Bus Stand</span>
                    <span className="text-[#0FA9C6] font-bold shrink-0">8:00 AM</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#B8B8B2]">
                    <ArrowRight className="w-3 h-3 shrink-0 text-[#B8B8B2]/70" />
                    <span>Reaches college by <strong className="text-[#EEEEEA]">8:45 AM</strong></span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg font-mono text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[#EEEEEA]">Chithode Bus Stop</span>
                    <span className="text-[#0FA9C6] font-bold shrink-0">8:20 AM</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#B8B8B2]">
                    <ArrowRight className="w-3 h-3 shrink-0 text-[#B8B8B2]/70" />
                    <span>Reaches college by <strong className="text-[#EEEEEA]">8:45 AM</strong></span>
                  </div>
                </div>
              </div>

              {/* Town buses */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#E5BD00]">
                  Town Bus
                </div>

                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg font-mono text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-[#EEEEEA]">Lakshmi Nagar / Bhavani Bypass</span>
                    <span className="text-[#0FA9C6] font-bold shrink-0">8:10 AM</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#B8B8B2]">
                    <ArrowRight className="w-3 h-3 shrink-0 text-[#B8B8B2]/70" />
                    <span>Reaches college by <strong className="text-[#EEEEEA]">8:30 AM</strong></span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#EEEEEA]">Bus No. 3 &amp; B12</span>
                    <span className="text-[#0FA9C6] font-bold shrink-0">Every 5 min</span>
                  </div>
                  <p className="text-[11px] text-[#B8B8B2] leading-relaxed">
                    From Lakshmi Nagar or Bhavani Bypass. Get down at the
                    <strong className="text-[#EEEEEA]"> Government College of Engineering</strong> stop, then a short walk to the campus.
                  </p>
                </div>

                <div className="p-3.5 bg-[#17181C] border border-[#B8B8B2]/20 rounded-lg font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#EEEEEA]">Bus No. 3</span>
                    <span className="text-[#0FA9C6] font-bold shrink-0">Every 10 min</span>
                  </div>
                  <p className="text-[11px] text-[#B8B8B2] leading-relaxed">
                    From Erode Bus Stand. Get down at the
                    <strong className="text-[#EEEEEA]"> Government College of Engineering (IRTT)</strong> stop, then a short walk to the campus.
                  </p>
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
