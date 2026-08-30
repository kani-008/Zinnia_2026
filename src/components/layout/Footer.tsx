import React from 'react';
import { TornPaperDivider } from './TornPaperDivider';

export const WebsiteFooter: React.FC = () => {
  const developers = ['TAMILVANI', 'KANISHKAR', 'JEO JUSTIN'];

  return (
    <footer
      id="about"
      className="relative z-30 bg-[#060608] overflow-visible"
      style={{
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginBottom: '-1rem',
      }}
    >
      <div id="contact" className="absolute top-0 pointer-events-none" />
      {/* ── Torn Paper Divider (untouched) ── */}
      <div className="w-full -translate-y-1/2 overflow-visible">
        <TornPaperDivider />
      </div>

      {/* ── Main 2-Column Content ── */}
      <div className="mx-auto px-6 sm:px-10 lg:px-16" style={{ maxWidth: '1180px' }}>
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12 pt-2 pb-8">

          {/* ─── LEFT · BRAND ─── */}
          <div className="flex flex-col items-center md:items-start">
            {/* Yellow comic speech-bubble logo */}
            <div className="relative inline-block select-none cursor-pointer group mb-2">
              <div className="bg-[#F5D90A] text-black font-sans font-black text-xl sm:text-2xl px-4 py-1.5 rounded-sm border-[2.5px] border-black shadow-[3px_3px_0px_#000] -rotate-1 tracking-wider flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>ZINNIA</span>
                <span className="text-[#FF2E63] ml-1.5">'26</span>
              </div>
              <div className="w-0 h-0 border-t-[8px] border-t-[#F5D90A] border-l-[8px] border-l-transparent border-r-[4px] border-r-transparent ml-3 -mt-0.5" />
            </div>

            <div className="space-y-0.5 text-xs sm:text-sm font-mono font-medium text-[#9CA3AF] tracking-wide uppercase leading-relaxed text-center md:text-left">
              <p className="font-bold text-white">DEPARTMENT OF CSE</p>
              <p>GOVERNMENT COLLEGE OF ENGINEERING</p>
              <p>ERODE – 638011, TAMIL NADU</p>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-3 text-[#9CA3AF]">
              {/* Instagram */}
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"
                className="w-8 h-8 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#FF2E63] hover:border-[#FF2E63] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"
                className="w-8 h-8 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#00E5FF] hover:border-[#00E5FF] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"
                className="w-8 h-8 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#FF2E63] hover:border-[#FF2E63] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn"
                className="w-8 h-8 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#00E5FF] hover:border-[#00E5FF] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              {/* YouTube Channel */}
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube Channel"
                className="w-8 h-8 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#F5D90A] hover:border-[#F5D90A] transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>

          {/* ─── RIGHT · DEVELOPERS ─── */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div>
              <h4 className="font-sans font-black text-sm sm:text-base text-white uppercase tracking-wider">
                DEVELOPERS
              </h4>
              {/* Cyan Hand-Drawn Wavy Underline */}
              <svg className="w-20 h-2.5 mt-1" viewBox="0 0 80 6" fill="none">
                <path d="M2 3C16 1 28 5 42 3C56 1 68 5 78 3" stroke="#00E5FF" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>

            <ul className="space-y-3 text-sm font-mono font-medium">
              {developers.map((name) => (
                <li key={name}>
                  <span className="text-[#9CA3AF] hover:text-white flex items-center gap-2.5 transition-colors cursor-default">
                    <span className="text-[#00E5FF] font-bold">→</span>
                    <span className="tracking-wider">{name}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom Sub-Footer Bar ── */}
        <div className="border-t border-[#1C1C22] pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#71717A] tracking-wider uppercase">
          <div className="flex items-center gap-2">
            <span className="text-[#F5D90A] text-sm">⚡</span>
            <span>© 2026 ZINNIA '26. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>DESIGNED WITH</span>
            <span className="text-[#F5D90A] text-sm">⚡</span>
            <span>BY CSE CODE</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
