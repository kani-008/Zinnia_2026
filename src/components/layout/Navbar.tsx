import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../../core/AudioManager';

export const WebsiteNavbar: React.FC = () => {
  const location = useLocation();
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    setMuted(audioManager.getMuted());
  }, []);

  const toggleSound = () => {
    const next = !muted;
    audioManager.setMuted(next);
    setMuted(next);
    if (!next) {
      audioManager.playNodeEngage();
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'AI Core', path: '/assistant' },
    { name: 'About', path: '/story' },
    { name: 'Pass', path: '/passport' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-4 sm:px-6 py-4 bg-black/50 backdrop-blur-md border-b border-[#3A3A3E]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-2.5 h-2.5 rounded-full bg-[#3CE7FF] animate-pulse" />
          <span className="font-mono font-black text-base tracking-wider text-white group-hover:text-[#3CE7FF] transition-colors">
            ZINNIA <span className="text-[#3CE7FF]">2026</span>
          </span>
          <span className="text-[11px] font-mono text-[#A8A8AC] uppercase tracking-widest hidden md:inline">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all ${
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

        {/* Right CTA: Sound Toggle & Amber Register Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSound}
            title={muted ? 'Enable Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-[#1A1A1D] border border-[#3A3A3E] text-[#A8A8AC] hover:text-[#3CE7FF] hover:border-[#3CE7FF] transition-all cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#3CE7FF]" />}
          </button>

          <Link
            to="/register"
            className="px-4 py-2 bg-[#F5D90A] hover:bg-[#FFE633] text-[#0D0D0F] font-comic font-black text-xs uppercase tracking-wider transition-all duration-200 border-[2px] border-[#F5D90A] shadow-[2.5px_2.5px_0px_#8A7400] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
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

