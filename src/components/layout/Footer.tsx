import React from 'react';
import { Link } from 'react-router-dom';

export const WebsiteFooter: React.FC = () => {
  const developers = ['JEO JUSTIN', 'TAMILVANI', 'KANISHKAR'];

  const quickLinks = [
    { name: 'HOME', path: '/' },
    { name: 'EVENTS', path: '/events' },
    { name: 'SCHEDULE', path: '/schedule' },
    { name: 'CONTACT', path: '/contact' },
    { name: 'REGISTER', path: '/register' },
  ];

  return (
    <footer id="contact" className="relative z-30 w-full bg-[#060608] border-t border-[#1C1C22] pt-12 pb-6 px-4 sm:px-6 lg:px-12 mt-16 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start text-center md:text-left">
          
          {/* COLUMN 1: ZINNIA Information */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            {/* Yellow Comic Speech Bubble Sticker */}
            <Link to="/" className="relative inline-block select-none cursor-pointer group">
              <div className="bg-[#F5D90A] text-black font-sans font-black text-xl sm:text-2xl px-4 py-1.5 rounded-sm border-[2.5px] border-black shadow-[3px_3px_0px_#000000] -rotate-1 tracking-wider flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>ZINNIA</span>
                <span className="text-[#FF2E63] ml-1.5">'26</span>
              </div>
              {/* Speech bubble pointer notch */}
              <div className="w-0 h-0 border-t-[8px] border-t-[#F5D90A] border-l-[8px] border-l-transparent border-r-[4px] border-r-transparent ml-3 -mt-0.5" />
            </Link>

            {/* Department & College Address */}
            <div className="space-y-0.5 text-xs font-mono font-medium text-[#9CA3AF] tracking-wide uppercase leading-relaxed">
              <p className="font-bold text-white">DEPARTMENT OF CSE</p>
              <p>GOVERNMENT COLLEGE OF ENGINEERING</p>
              <p>ERODE – 638316, TAMIL NADU</p>
            </div>

            {/* Social Icons: Instagram & Email */}
            <div className="flex items-center gap-2 pt-1 text-[#9CA3AF]">
              <a 
                href="https://www.instagram.com/gce._.zinnia?igsi=ZTZpcGVudjh5YTdm" 
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
                href="mailto:zinnia2026@gcee.ac.in" 
                className="w-7 h-7 rounded-full border border-[#3F3F46] flex items-center justify-center hover:text-[#F5D90A] hover:border-[#F5D90A] transition-colors"
                aria-label="Email"
                title="zinnia2026@gcee.ac.in"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div>
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">
                QUICK LINKS
              </h4>
              {/* Neon Yellow Wavy Underline */}
              <svg className="w-16 h-2 mt-1" viewBox="0 0 64 6" fill="none">
                <path d="M2 3C14 1 22 5 34 3C46 1 54 5 62 3" stroke="#F5D90A" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>

            <ul className="space-y-2 text-xs font-mono font-medium">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#9CA3AF] hover:text-[#3CE7FF] flex items-center justify-center md:justify-start gap-2 transition-all duration-200 hover:translate-x-1"
                  >
                    <span className="text-[#F5D90A] font-bold">•</span>
                    <span className="tracking-wider">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3: Developers */}
          <div className="flex flex-col items-center md:items-start space-y-3">
            <div>
              <h4 className="font-sans font-black text-sm text-white uppercase tracking-wider">
                DEVELOPERS
              </h4>
              {/* Cyan Wavy Underline */}
              <svg className="w-16 h-2 mt-1" viewBox="0 0 64 6" fill="none">
                <path d="M2 3C14 1 22 5 34 3C46 1 54 5 62 3" stroke="#3CE7FF" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>

            <ul className="space-y-2.5 text-xs font-mono font-medium">
              {developers.map((name) => (
                <li key={name}>
                  <span className="text-[#9CA3AF] hover:text-white flex items-center justify-center md:justify-start gap-2 transition-colors cursor-default">
                    <span className="text-[#3CE7FF] font-bold">→</span>
                    <span className="tracking-wider">{name}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Banner Strip matching upper 3-Column Grid */}
        <div className="py-4 border-t border-[#1C1C22]/60 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center text-center md:text-left font-mono text-xs tracking-wider uppercase">
            
            {/* Column 1: Copyright (Aligned under ZINNIA Info) */}
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#9CA3AF]">
              <span className="text-[#F5D90A] text-sm">⚡</span>
              <span>© 2026 ZINNIA ’26. ALL RIGHTS RESERVED.</span>
            </div>

            {/* Column 2: Questions (Aligned under QUICK LINKS) */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-[#F5D90A] font-bold tracking-widest">
                QUESTIONS? WE’RE HERE.
              </span>
              <span className="text-[#71717A] text-[11px] normal-case mt-0.5">
                For event-related queries, contact the coordinators.
              </span>
            </div>

            {/* Column 3: Credits (Aligned under DEVELOPERS) */}
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#9CA3AF]">
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
