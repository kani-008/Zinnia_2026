import React from 'react';
import { TornPaperDivider } from './TornPaperDivider';
import zinniaSvg from '../../assets/zinnia.svg';

export const WebsiteFooter: React.FC = () => {
  // const developers = ['TAMILVANI', 'KANISHKAR', 'JEO JUSTIN'];

  return (
    <footer
      id="contact"
      className="relative z-30 bg-[#060608] w-full overflow-hidden"
    >
      {/* ── Torn Paper Divider ── */}
      <div className="w-full -translate-y-1/2 overflow-visible">
        <TornPaperDivider />
      </div>

      <div className="mx-auto w-full px-4 sm:px-10 lg:px-16" style={{ maxWidth: '1180px' }}>
        {/* ── Brand block: stacked and centred on mobile, split row on desktop ── */}
        <div className="flex flex-col items-center text-center gap-5 pt-2 pb-8 sm:flex-row sm:items-start sm:justify-between sm:text-left sm:gap-8">

          {/* Brand + address */}
          <div className="flex flex-col items-center sm:items-start min-w-0">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="cursor-pointer -rotate-2 hover:rotate-0 transition-transform mb-3 active:translate-x-0.5 active:translate-y-0.5"
              aria-label="Back to top"
              title="Back to top"
            >
              <img
                src={zinniaSvg}
                alt="ZINNIA '26 Logo"
                className="h-12 sm:h-14 w-auto object-contain select-none pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              />
            </button>

            <div className="space-y-0.5 text-[11px] sm:text-xs font-mono font-medium text-[#B8B8B2] tracking-wide uppercase leading-relaxed">
              <p className="font-bold text-[#EEEEEA]">DEPARTMENT OF CSE</p>
              <p>GOVERNMENT COLLEGE OF ENGINEERING</p>
              <p>ERODE – 638316, TAMIL NADU</p>
            </div>
          </div>

          {/* Social & email */}
          <div className="flex items-center gap-2.5 text-[#B8B8B2] shrink-0">
            <a
              href="https://www.instagram.com/gce._.zinnia?igsh=ZTZpcGVudjh5YTdm"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram: @gce._.zinnia"
              title="Instagram: @gce._.zinnia"
              className="w-9 h-9 rounded-full border border-[#B8B8B2]/30 flex items-center justify-center hover:text-[#D51F55] hover:border-[#D51F55] transition-colors shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            <a
              href="mailto:zinnia2026@gcee.ac.in"
              aria-label="Email: zinnia2026@gcee.ac.in"
              title="Email: zinnia2026@gcee.ac.in"
              className="w-9 h-9 rounded-full border border-[#B8B8B2]/30 flex items-center justify-center hover:text-[#0FA9C6] hover:border-[#0FA9C6] transition-colors shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>

          {/* ─── DEVELOPERS (commented out) ───
          <div className="flex flex-col items-center sm:items-start shrink-0 space-y-2 sm:space-y-3">
            <div>
              <h4 className="font-sans font-black text-sm sm:text-base text-[#EEEEEA] uppercase tracking-wider">
                DEVELOPERS
              </h4>
              <svg className="w-16 sm:w-20 h-2 sm:h-2.5 mt-1" viewBox="0 0 80 6" fill="none">
                <path d="M2 3C16 1 28 5 42 3C56 1 68 5 78 3" stroke="#0FA9C6" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm font-mono font-medium">
              {developers.map((name) => (
                <li key={name}>
                  <span className="text-[#B8B8B2] flex items-center gap-2 tracking-wider">
                    <span className="text-[#0FA9C6] font-bold">&rarr;</span>
                    <span>{name}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          ─── end DEVELOPERS ─── */}
        </div>

        {/* ── Bottom strip ── */}
        <div className="border-t border-[#1C1C22]/60 py-5">
          <div className="flex items-center justify-center sm:justify-start gap-2 font-mono text-[10px] sm:text-xs tracking-wider uppercase text-[#9CA3AF]">
            <span className="text-[#F5D90A] text-sm">⚡</span>
            <span>© 2026 ZINNIA &rsquo;26. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
