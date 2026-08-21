import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Activity, Terminal, AlertTriangle, ChevronRight } from 'lucide-react';
import { sound } from '../../services/sound';
import { TemporalCoreCanvas } from './TemporalCore';

export const BlackCipherHero: React.FC = () => {
  return (
    <div className="relative min-h-[90vh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 overflow-hidden border-b border-slate-900">
      {/* Background Interactive Particle Grid */}
      <TemporalCoreCanvas />

      <div className="max-w-6xl mx-auto w-full relative z-10 space-y-8">
        {/* Top Classified Stamp & Institute Header */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="classified-stamp">
            <AlertTriangle className="w-3 h-3" />
            CLASSIFIED // OMEGA CLEARANCE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 tracking-wider">
            NOVA TECH RESEARCH INSTITUTE &bull; FILE: BC-2045-0917
          </span>
        </div>

        {/* Hero Title & Core Narrative */}
        <div className="space-y-4 max-w-4xl">
          <div className="font-mono text-xs text-cyan-400 tracking-[0.25em] uppercase">
            TEMPORAL ANOMALY INVESTIGATION // 17 SEPTEMBER 2045
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-black text-white tracking-tight leading-[1.08] uppercase">
            BLACK CIPHER
          </h1>

          <p className="text-lg sm:text-xl font-mono text-slate-300 max-w-2xl leading-relaxed">
            The future was never meant to be seen. Over <span className="text-cyan-400 font-bold">7,842,193 timelines</span> were detected before the containment breach.
          </p>
        </div>

        {/* Telemetry Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl font-mono text-xs">
          <div className="p-3 rounded bg-slate-950/70 border border-slate-900 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">ANOMALY DURATION</div>
            <div className="text-white font-bold">13 SECONDS</div>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-900 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">TIMELINES DETECTED</div>
            <div className="text-cyan-400 font-bold">7,842,193</div>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-900 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">CORE STABILITY</div>
            <div className="text-rose-400 font-bold">BREACHED</div>
          </div>
          <div className="p-3 rounded bg-slate-950/70 border border-slate-900 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">PROTOCOL STATUS</div>
            <div className="text-emerald-400 font-bold">ACTIVE</div>
          </div>
        </div>

        {/* Primary Interactive CTAs */}
        <div className="flex flex-wrap items-center gap-4 pt-4 font-mono">
          <Link
            to="/register"
            onMouseEnter={() => sound.playHoverTone()}
            onClick={() => sound.playConfirmTone()}
            className="btn-temporal py-3.5 px-8 text-xs font-bold"
          >
            <span>[ ENTER THE TIMELINE ]</span>
            <ChevronRight className="w-4 h-4" />
          </Link>

          <Link
            to="/story"
            onMouseEnter={() => sound.playHoverTone()}
            onClick={() => sound.playKeyClick()}
            className="btn-secondary py-3.5 px-6 text-xs"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>[ ACCESS INCIDENT REPORT ]</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
