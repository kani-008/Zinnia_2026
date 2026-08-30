import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { registerNav } from '../../services/registerNavigation';

export const WebsiteNavbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'Contact', path: '/contact' },
    { name: 'Pass', path: '/passport' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-2 sm:px-6 py-2.5 sm:py-4 bg-black/70 backdrop-blur-md border-b border-[#3A3A3E]">
      <div className="max-w-7xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="cursor-pointer group relative px-2.5 sm:px-3 py-1 bg-[#F5D90A] border-[2px] sm:border-[2.5px] border-[#F5D90A] shadow-[2.5px_2.5px_0px_#8A7400] sm:shadow-[3px_3px_0px_#8A7400] -rotate-1 hover:rotate-0 transition-transform active:translate-x-0.5 active:translate-y-0.5 inline-flex items-center gap-1 sm:gap-1.5 shrink-0"
        >
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="font-display text-base sm:text-xl text-[#0D0D0F] tracking-wide font-black">
              ZINNIA
            </span>
            <span className="font-comic text-sm sm:text-lg text-[#FF3366] font-black">
              '26
            </span>
          </div>
          {/* Speech Tail */}
          <div className="absolute -bottom-1.5 left-3 w-2 h-2 bg-[#F5D90A] border-r-[2px] border-b-[2px] border-[#F5D90A] rotate-45" />
        </Link>

        {/* Clean Flat Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-mono tracking-wider transition-all ${
                  isActive
                    ? 'text-[#3CE7FF] bg-[#123B3E] border border-[#3CE7FF]/40 font-bold'
                    : 'text-[#A8A8AC] hover:text-white hover:bg-[#1A1A1D]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA: Register Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/register"
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] font-comic font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-200 border-[2px] border-[#F5D90A] shadow-[2px_2px_0px_#8A7400] sm:shadow-[2.5px_2.5px_0px_#8A7400] flex items-center gap-1 sm:gap-1.5 active:translate-x-0.5 active:translate-y-0.5 shrink-0 cursor-pointer"
          >
            <span>REGISTER</span>
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default WebsiteNavbar;
