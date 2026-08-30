import React from 'react';

export const WebsiteFooter: React.FC = () => {
  const developers = ['TAMILVANI', 'KANISHKAR', 'JEO JUSTIN'];

  return (
    <footer id="contact" className="relative z-30 w-full bg-[#060608] border-t border-[#1C1C22] pt-8 sm:pt-10 pb-6 px-4 sm:px-6 lg:px-12 mt-0">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Section: Brand on Left, Developers on Right */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 pb-10">
          
          {/* COLUMN 1: Yellow Speech Bubble + College Details + 5 Social Circles */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            {/* Yellow Comic Speech Bubble Sticker */}
            <div className="relative inline-block select-none cursor-pointer group">
              <div className="bg-[#F5D90A] text-black font-sans font-black text-xl sm:text-2xl px-4 py-1.5 rounded-sm border-[2.5px] border-black shadow-[3px_3px_0px_#000000] -rotate-1 tracking-wider flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>ZINNIA</span>
                <span className="text-[#FF2E63] ml-1.5">'26</span>
              </div>
              {/* Speech bubble pointer notch */}
              <div className="w-0 h-0 border-t-[8px] border-t-[#F5D90A] border-l-[8px] border-l-transparent border-r-[4px] border-r-transparent ml-3 -mt-0.5" />
            </div>

            {/* Department & College Address */}
            <div className="space-y-0.5 text-xs font-mono font-medium text-[#9CA3AF] tracking-wide uppercase leading-relaxed">
              <p className="font-bold text-white">DEPARTMENT OF CSE</p>
              <p>GOVERNMENT COLLEGE OF ENGINEERING</p>
              <p>ERODE – 638011, TAMIL NADU</p>
            </div>

            {/* 5 Circular Outline Social Icons */}
            <div className="flex items-center gap-2 pt-1 text-[#9CA3AF]">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#FF2E63] hover:border-[#FF2E63] transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#00E5FF] hover:border-[#00E5FF] transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#FF2E63] hover:border-[#FF2E63] transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#00E5FF] hover:border-[#00E5FF] transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-7 h-7 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#F5D90A] hover:border-[#F5D90A] transition-colors"
                aria-label="YouTube Channel"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: DEVELOPERS (Matching the exact styling from the user's reference) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
            <div>
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">
                DEVELOPERS
              </h4>
              {/* Cyan Hand-Drawn Wavy Underline */}
              <svg className="w-16 h-2 mt-1" viewBox="0 0 64 6" fill="none">
                <path d="M2 3C14 1 22 5 34 3C46 1 54 5 62 3" stroke="#00E5FF" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>

            <ul className="space-y-2.5 text-xs font-mono font-medium">
              {developers.map((name) => (
                <li key={name}>
                  <span className="text-[#9CA3AF] hover:text-white flex items-center gap-2 transition-colors cursor-default">
                    <span className="text-[#00E5FF] font-bold">→</span>
                    <span className="tracking-wider">{name}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar (Exact match to reference) */}
        <div className="border-t border-[#1C1C22] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#71717A] tracking-wider uppercase">
          <div className="flex items-center gap-2">
            <span className="text-[#F5D90A] text-xs">⚡</span>
            <span>© 2026 ZINNIA '26. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>DESIGNED WITH</span>
            <span className="text-[#F5D90A] text-xs">⚡</span>
            <span>BY CSE CODE</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default WebsiteFooter;
