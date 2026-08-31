import React from 'react';
import { TornPaperDivider } from './TornPaperDivider';
export const WebsiteFooter: React.FC = () => {
  const developers = ['TAMILVANI', 'KANISHKAR', 'JEO JUSTIN'];

  const quickLinks = [
    { name: 'HOME', path: '/' },
    { name: 'EVENTS', path: '/events' },
    { name: 'SCHEDULE', path: '/schedule' },
    { name: 'CONTACT', path: '/contact' },
    { name: 'REGISTER', path: '/register' },
  ];

  return (
    <footer
      id="contact"
      className="relative z-30 bg-[#060608] w-full overflow-hidden"
    >
      {/* ── Torn Paper Divider (untouched) ── */}
      <div className="w-full -translate-y-1/2 overflow-visible">
        <TornPaperDivider />
      </div>

      {/* ── Main 2-Column Content ── */}
      <div className="mx-auto px-4 sm:px-10 lg:px-16" style={{ maxWidth: '1180px' }}>
        <div className="flex flex-row items-start justify-between gap-4 xs:gap-6 md:gap-12 pt-2 pb-8">

          {/* ─── LEFT · BRAND ─── */}
          <div className="flex flex-col items-start text-left flex-1 min-w-0 pr-2">
            {/* Yellow comic speech-bubble logo */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="relative inline-block select-none cursor-pointer group mb-2"
              title="Back to top"
            >
              <div className="bg-[#F5D90A] text-black font-sans font-black text-lg sm:text-2xl px-3 sm:px-4 py-1 sm:py-1.5 rounded-sm border-[2px] sm:border-[2.5px] border-black shadow-[2.5px_2.5px_0px_#000] sm:shadow-[3px_3px_0px_#000] -rotate-1 tracking-wider flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>ZINNIA</span>
                <span className="text-[#D51F55] ml-1.5">'26</span>
              </div>
              <div className="w-0 h-0 border-t-[7px] sm:border-t-[8px] border-t-[#F5D90A] border-l-[7px] sm:border-l-[8px] border-l-transparent border-r-[4px] border-r-transparent ml-3 -mt-0.5" />
            </div>

            <div className="space-y-0.5 text-[10px] xs:text-xs sm:text-sm font-mono font-medium text-[#B8B8B2] tracking-wide uppercase leading-relaxed text-left">
              <p className="font-bold text-[#EEEEEA]">DEPARTMENT OF CSE</p>
              <p>GOVERNMENT COLLEGE OF ENGINEERING</p>
              <p>ERODE – 638316, TAMIL NADU</p>
            </div>

            {/* Social & Email Contact icons */}
            <div className="flex items-center justify-start gap-2.5 pt-3 text-[#B8B8B2]">
              {/* Instagram Icon */}
              <a
                href="https://www.instagram.com/gce._.zinnia?igsh=ZTZpcGVudjh5YTdm"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram: @gce._.zinnia"
                title="Instagram: @gce._.zinnia"
                className="w-8 h-8 rounded-full border border-[#B8B8B2]/30 flex items-center justify-center hover:text-[#D51F55] hover:border-[#D51F55] transition-colors shrink-0 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* Mail Icon */}
              <a
                href="mailto:zinnia2026@gcee.ac.in"
                aria-label="Email: zinnia2026@gcee.ac.in"
                title="Email: zinnia2026@gcee.ac.in"
                className="w-8 h-8 rounded-full border border-[#B8B8B2]/30 flex items-center justify-center hover:text-[#0FA9C6] hover:border-[#0FA9C6] transition-colors shrink-0 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>

          {/* ─── RIGHT · DEVELOPERS ─── */}
          <div className="flex flex-col items-end sm:items-start text-right sm:text-left shrink-0 space-y-2 sm:space-y-3">
            <div>
              <h4 className="font-sans font-black text-xs xs:text-sm sm:text-base text-[#EEEEEA] uppercase tracking-wider">
                DEVELOPERS
              </h4>
              {/* Cyan Hand-Drawn Wavy Underline */}
              <svg className="w-16 sm:w-20 h-2 sm:h-2.5 mt-1 ml-auto sm:ml-0" viewBox="0 0 80 6" fill="none">
                <path d="M2 3C16 1 28 5 42 3C56 1 68 5 78 3" stroke="#0FA9C6" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>

            <ul className="space-y-2 sm:space-y-3 text-xs xs:text-sm font-mono font-medium text-right sm:text-left">
              {developers.map((name) => (
                <li key={name}>
                  <span className="text-[#B8B8B2] hover:text-[#EEEEEA] flex items-center justify-end sm:justify-start gap-1.5 sm:gap-2.5 transition-colors cursor-default">
                    <span className="text-[#0FA9C6] font-bold">→</span>
                    <span className="tracking-wider">{name}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Banner Strip matching upper 3-Column Grid */}
        <div className="py-4 border-t border-[#1C1C22]/60 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-12 items-start text-left font-mono text-[10px] xs:text-xs tracking-wider uppercase">
            
            {/* Column 1: Copyright (Aligned under ZINNIA Info) */}
            <div className="flex items-center justify-start gap-2 text-[#9CA3AF]">
              <span className="text-[#F5D90A] text-sm">⚡</span>
              <span>© 2026 ZINNIA ’26. ALL RIGHTS RESERVED.</span>
            </div>

            {/* Column 2: Questions (Aligned under QUICK LINKS) */}
            <div className="flex flex-col items-start text-left">
              <span className="text-[#F5D90A] font-bold tracking-widest">
                QUESTIONS? WE’RE HERE.
              </span>
              <span className="text-[#71717A] text-[10px] sm:text-[11px] normal-case mt-0.5">
                For event-related queries, contact the coordinators.
              </span>
            </div>

            {/* Column 3: Credits (Aligned under DEVELOPERS) */}
            <div className="flex items-center justify-start md:justify-start gap-1.5 text-[#9CA3AF]">
              <span>DESIGNED WITH</span>
              <span className="text-[#F5D90A] text-sm">⚡</span>
              <span>BY CSE CODE</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
