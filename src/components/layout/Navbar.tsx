import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Volume2, VolumeX, Terminal, Menu, X, ExternalLink } from 'lucide-react';
import { sound } from '../../services/sound';

export const Navbar: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const location = useLocation();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const enabled = sound.toggleSound();
    setSoundEnabled(enabled);
  };

  const navLinks = [
    { name: 'INCIDENT', path: '/story' },
    { name: 'TIMELINE', path: '/timeline' },
    { name: 'MISSIONS', path: '/events' },
    { name: 'SCHEDULE', path: '/schedule' },
    { name: 'REGISTER', path: '/register' },
    { name: 'AGENT PASSPORT', path: '/passport' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#030508]/90 backdrop-blur-md border-b border-slate-900 px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Status */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            onClick={() => sound.playKeyClick()}
            className="flex items-center gap-2.5 text-white font-heading font-black text-lg tracking-wider hover:text-cyan-400 transition-colors"
          >
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>ZINNIA <span className="text-slate-500 text-xs font-mono font-normal">// CHRONOS</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 rounded bg-slate-950 border border-slate-900 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>STATUS: <strong className="text-slate-200">ONLINE</strong></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">{currentTime}</span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-6 font-mono text-xs tracking-wider">
          {navLinks.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onMouseEnter={() => sound.playHoverTone()}
                onClick={() => sound.playKeyClick()}
                className={`py-1 relative transition-colors ${
                  active ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title="Toggle Synthesizer Feedback Audio"
            className={`p-2 rounded border transition-colors ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Admin Command Portal */}
          <Link
            to="/admin"
            onMouseEnter={() => sound.playHoverTone()}
            onClick={() => sound.playKeyClick()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>COMMAND</span>
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 border-t border-slate-900 mt-3 space-y-2 font-mono text-xs">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => {
                sound.playKeyClick();
                setMobileMenuOpen(false);
              }}
              className="block px-3 py-2 rounded text-slate-300 hover:bg-slate-900 hover:text-cyan-400"
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/admin"
            onClick={() => {
              sound.playKeyClick();
              setMobileMenuOpen(false);
            }}
            className="block px-3 py-2 rounded text-cyan-400 font-bold bg-slate-950 border border-slate-800"
          >
            COMMAND CENTER (ADMIN)
          </Link>
        </div>
      )}
    </header>
  );
};
