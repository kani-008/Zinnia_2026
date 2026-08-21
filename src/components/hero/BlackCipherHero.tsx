import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Trophy, Calendar, MapPin, Users, Award, Zap } from 'lucide-react';
import { sound } from '../../services/sound';

export const BlackCipherHero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-12 text-center">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="page-container relative z-10 max-w-4xl mx-auto space-y-6">
        
        {/* Floating pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-xl shadow-lg hover:border-indigo-500/40 transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-semibold">GCE Salem &bull; Dept of CSE</span>
          <span className="text-slate-500">|</span>
          <span className="text-indigo-400 font-semibold">17 September 2026</span>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-heading font-black text-white tracking-tight leading-[1.05]">
            ZINNIA <span className="gradient-indigo-violet">2026</span>
          </h1>

          <p className="text-lg sm:text-xl font-heading font-semibold text-slate-300">
            National Level Technical Symposium &bull; Innovate &bull; Compete &bull; Conquer
          </p>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed pt-1">
            Compete across <strong className="text-white font-semibold">9 intense battlegrounds</strong> spanning competitive coding, Generative AI, SQL recovery, UI/UX sprints, and campus strategy battles for <strong className="text-amber-400 font-semibold">₹25,000+ in grand cash prizes</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            onMouseEnter={() => sound.playHoverTone()}
            onClick={() => sound.playConfirmTone()}
            className="btn-gradient py-3.5 px-8 text-sm font-semibold shadow-xl"
          >
            <span>Register Now — Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/events"
            onMouseEnter={() => sound.playHoverTone()}
            onClick={() => sound.playKeyClick()}
            className="btn-surface py-3.5 px-7 text-sm font-semibold"
          >
            <span>Explore 9 Events</span>
          </Link>
        </div>

        {/* 3 Key Stats Chips */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-slate-200">₹25,000+ Prize Pool</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-200">9 Battleground Tracks</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-200">Verified E-Certificates</span>
          </div>
        </div>

      </div>
    </section>
  );
};
