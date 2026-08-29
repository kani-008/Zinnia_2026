import React from 'react';
import { Building2, Cpu, ShieldCheck, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { registerNav } from '../services/registerNavigation';

export const WebsiteStoryPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl space-y-2 shadow-xl">
        <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
          // ABOUT INSTITUTION & DEPARTMENT
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">
          GOVERNMENT COLLEGE OF ENGINEERING, ERODE
        </h1>
        <p className="text-xs text-slate-400 font-mono">
          DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING &bull; ZINNIA 2026
        </p>
      </div>

      {/* Narrative Section 1 */}
      <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Building2 className="w-4 h-4" />
          <span>INSTITUTIONAL HERITAGE</span>
        </div>
        <p>
          Established in 1984 as the Institute of Road and Transport Technology (IRTT), <strong className="text-white">Government College of Engineering, Erode</strong> is an autonomous premier government engineering institution under Anna University.
        </p>
        <p>
          Spanning a lush 350-acre campus, GCE Erode has produced generations of industry leaders, researchers, and technical visionaries over four decades of engineering education.
        </p>
      </div>

      {/* Narrative Section 2 */}
      <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Cpu className="w-4 h-4" />
          <span>DEPARTMENT OF CSE & SYMPOSIUM EXCELLENCE</span>
        </div>
        <p>
          The Department of Computer Science & Engineering is committed to excellence in computational systems, AI and data science research, algorithmic design, and cyber architecture.
        </p>
        <p>
          <strong className="text-white">ZINNIA 2026</strong> is the department's flagship National Level Technical Symposium, bringing together the nation's brightest engineering students to compete across 9 specialized events for cash prizes, verified certificates, and national recognition.
        </p>

        <div className="pt-4">
          <button
            onClick={() => registerNav.trigger('/register')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            REGISTER FOR ZINNIA 2026 ↗
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebsiteStoryPage;
