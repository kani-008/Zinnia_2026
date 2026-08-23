import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { AudioToggle } from './AudioToggle';

export const WebsiteNavbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'AI Core', path: '/assistant' },
    { name: 'About', path: '/story' },
    { name: 'Pass', path: '/passport' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-6 py-4 bg-black/40 backdrop-blur-md border-b border-slate-850">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-black text-base tracking-wider text-white group-hover:text-cyan-300 transition-colors">
            ZINNIA <span className="text-cyan-400">2026</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest hidden md:inline">
            // GCE ERODE CSE
          </span>
        </Link>

        {/* Clean Flat Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all ${isActive
                    ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA: Sound Toggle & Amber Register Button */}
        <div className="flex items-center gap-3">
          <AudioToggle />

          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 active:scale-95"
          >
            <span>REGISTER</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default WebsiteNavbar;
