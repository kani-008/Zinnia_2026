import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  Terminal, 
  Mail, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ComicPanel, ComicChip } from '../components/ui/comic';
import zinniaSvg from '../assets/zinnia.svg';
import missMinutes from '../assets/miss_minutes.gif';

export const MaintenancePage: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('Just now');
  const [countdown, setCountdown] = useState<number>(60);

  // Simulated auto-countdown to refresh status
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleCheckStatus();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckStatus = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastChecked(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      // If maintenance mode is turned off in Vercel, reloading will show the live app
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between overflow-x-hidden select-none">
      {/* Dynamic Background Glows & Grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(15, 169, 198, 0.25) 1px, transparent 0)`,
          backgroundSize: '28px 28px'
        }}
      />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#0FA9C6]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#E5BD00]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Branding Bar */}
      <header className="relative z-20 border-b-2 border-[#181A1D] bg-[#090A0B]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={zinniaSvg} 
            alt="Zinnia 2026" 
            className="h-8 sm:h-9 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(229,189,0,0.3)]" 
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-comic text-xs tracking-widest text-[#E5BD00] uppercase">
              National Level Symposium
            </span>
            <span className="font-mono text-[10px] text-[#71767B] tracking-wider">
              PROTOCOL // 503-MAINTENANCE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Pulse Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-[#111214] border border-[#0FA9C6]/30 rounded-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0FA9C6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0FA9C6]"></span>
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#0FA9C6] font-bold">
              Systems Updating
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-2xl">

          {/* Central Comic Panel */}
          <ComicPanel tone="cyan" bodyClassName="p-5 sm:p-8">
            
            {/* Mascot Banner & Badge */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-sm bg-[#111214] border-2 border-[#0FA9C6]/50 p-2 flex items-center justify-center shadow-[4px_4px_0px_#090A0B] relative overflow-hidden">
                  <img
                    src={missMinutes}
                    alt="Miss Minutes - Temporal Maintenance"
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(245,217,10,0.4)] animate-bounce duration-1000"
                    style={{ animationDuration: '3s' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090A0B]/80 via-transparent to-transparent pointer-events-none" />
                </div>
                {/* Micro badge */}
                <div className="absolute -bottom-2 -right-2">
                  <ComicChip tone="yellow" rotate={3} className="text-[9px] px-1.5 py-0.5">
                    OVERLOAD!
                  </ComicChip>
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <ComicChip tone="yellow" rotate={-1.5} className="mb-3">
                  TEMPORAL RECALIBRATION IN PROGRESS
                </ComicChip>
                
                <h1 className="font-display text-2xl sm:text-4xl text-[#EEEEEA] text-stroke-comic-sm leading-none uppercase tracking-wide">
                  SYSTEM UNDER MAINTENANCE
                </h1>

                <p className="mt-3 font-mono text-xs sm:text-sm text-[#B8B8B2] leading-relaxed">
                  We are currently polishing the battlefield, tuning database performance, and deploying final event updates for <span className="text-[#E5BD00] font-bold">ZINNIA 2026</span>.
                </p>
              </div>
            </div>

            {/* Simulated Live System Diagnostic Feed */}
            <div className="mb-6 rounded-sm border-2 border-[#181A1D] bg-[#090A0B] p-4 font-mono text-xs shadow-[3px_3px_0px_#090A0B]">
              <div className="flex items-center justify-between border-b border-[#181A1D] pb-2 mb-3 text-[10px] text-[#71767B] uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-[#0FA9C6]">
                  <Terminal size={12} />
                  ZINNIA-TELEMETRY-STREAM // V2.6
                </span>
                <span>Auto-refresh: {countdown}s</span>
              </div>
              
              <ul className="space-y-2 text-[11px] sm:text-xs">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#0FA9C6]" /> Core Database & Security
                  </span>
                  <span className="text-[#0FA9C6] font-bold">[ONLINE]</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <RotateCw size={13} className="text-[#E5BD00] animate-spin" /> Payment & Registration Gateway
                  </span>
                  <span className="text-[#E5BD00] font-bold">[CALIBRATING 96%]</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#D51F55]" /> Digital Passport QR Service
                  </span>
                  <span className="text-zinc-400">[STANDBY]</span>
                </li>
              </ul>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleCheckStatus}
                disabled={isRefreshing}
                className="w-full sm:flex-1 py-3 px-5 bg-[#0FA9C6] hover:bg-[#20bddc] text-black font-comic font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm shadow-[3px_3px_0px_#090A0B] active:translate-y-0.5 transition-all disabled:opacity-60 cursor-pointer"
              >
                <RotateCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Checking Status...' : 'Check If We Are Back'}
              </button>

              <a
                href="mailto:zinnia2026@gcee.ac.in"
                className="w-full sm:w-auto py-3 px-4 border-2 border-zinc-800 hover:border-[#0FA9C6]/60 bg-[#111214] text-zinc-300 hover:text-white font-comic text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-colors"
              >
                <Mail size={14} />
                Contact Support
              </a>
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] font-mono text-[#71767B]">
              <span>Last checked: {lastChecked}</span>
              <span>Need urgent help? Reach coordinator</span>
            </div>

          </ComicPanel>

          {/* Social & Contact Footer (Without any admin references) */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-mono text-[#71767B]">
            <div className="flex items-center gap-4">
              <span className="text-zinc-500">Government College of Engineering, Erode</span>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="https://www.instagram.com/gce._.zinnia?igsh=ZTZpcGVudjh5YTdm" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[#B8B8B2] hover:text-[#D51F55] transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span>@gce._.zinnia</span>
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* Subtle Bottom Status Bar */}
      <footer className="relative z-10 py-3 text-center border-t border-[#181A1D] bg-[#090A0B] text-[11px] font-mono text-zinc-500">
        ZINNIA 2026 // BLACK CIPHER INVESTIGATION • ALL RIGHTS RESERVED
      </footer>
    </div>
  );
};

export default MaintenancePage;
