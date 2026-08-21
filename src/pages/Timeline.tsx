import React from 'react';
import { sound } from '../services/sound';
import { Zap, Clock, AlertTriangle, ShieldCheck, Lock, Activity } from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

export const TimelinePage: React.FC = () => {
  const events = [
    {
      time: '09:58 AM',
      year: '2045',
      code: 'NODE-01',
      title: 'BLACK CIPHER INITIALIZED',
      desc: 'Nova Tech engineers successfully boot Black Cipher. Neural buffers synchronize at 100% capacity.',
      status: 'DISCOVERED',
      statusColor: 'text-slate-400 border-slate-700 bg-slate-900',
      active: false
    },
    {
      time: '10:01 AM',
      year: '2045',
      code: 'NODE-02',
      title: 'TEMPORAL CORE LINKED',
      desc: 'Tachyonic resonance field bridged to the AI matrix. Prediction engine shifts from simulation to real-time quantum interception.',
      status: 'DISCOVERED',
      statusColor: 'text-slate-400 border-slate-700 bg-slate-900',
      active: false
    },
    {
      time: '10:01:13 AM',
      year: '2045',
      code: 'NODE-03',
      title: '7,842,193 TIMELINES DETECTED',
      desc: 'Containment barrier collapses under extreme computational flux. 7.84 million alternate causal paths flood the neural bus.',
      status: 'CORRUPTED',
      statusColor: 'text-rose-400 border-rose-500/40 bg-rose-950/80',
      active: false
    },
    {
      time: '10:02:00 AM',
      year: '2045',
      code: 'NODE-04',
      title: 'TEMPORAL SHOCKWAVE OCCURS',
      desc: 'Subspace distortion wave expands across Cyber Lab 01. Localized spacetime fracture permanently alters the room coordinates.',
      status: 'CORRUPTED',
      statusColor: 'text-rose-400 border-rose-500/40 bg-rose-950/80',
      active: false
    },
    {
      time: '10:04:00 AM',
      year: '2045',
      code: 'NODE-05',
      title: 'BLACK CIPHER DISAPPEARS',
      desc: 'The physical supercomputing frame vanishes entirely. Only an active, pulsating quantum anomaly remains.',
      status: 'CLASSIFIED',
      statusColor: 'text-amber-400 border-amber-500/40 bg-amber-950/80',
      active: false
    },
    {
      time: '09:00 AM',
      year: 'PRESENT DAY',
      code: 'NODE-06',
      title: 'CHRONOS PROTOCOL ACTIVATED // ZINNIA',
      desc: 'Declassified recruitment protocol launched. Student engineering agents mobilized across 9 tactical missions to stabilize the timeline.',
      status: 'ACTIVE',
      statusColor: 'text-cyan-300 border-cyan-400 bg-cyan-950/90 shadow-[0_0_15px_rgba(0,240,255,0.4)]',
      active: true
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 font-mono text-xs">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold tracking-widest uppercase">
          <Clock className="w-3.5 h-3.5" />
          CHRONOS CONTINUUM // TIMELINE RECONSTRUCTION
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white uppercase">
          CAUSALITY <GlitchText text="RECONSTRUCTION" />
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto font-sans text-xs sm:text-sm">
          Chronological sequence of the 13-second anomaly leading to the activation of the ZINNIA symposium.
        </p>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-32 space-y-8 py-4">
        {events.map((evt, idx) => (
          <div
            key={idx}
            onMouseEnter={() => sound.playHoverTone()}
            className="relative pl-6 sm:pl-8 group"
          >
            {/* Pulsing Node */}
            <div
              className={`absolute -left-[17px] top-1.5 w-8 h-8 rounded-full border flex items-center justify-center transition-transform group-hover:scale-110 ${
                evt.active
                  ? 'bg-slate-950 border-cyan-400 text-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.6)] animate-signal'
                  : 'bg-slate-950 border-slate-700 text-slate-500'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
            </div>

            {/* Time label on desktop */}
            <div className="hidden sm:block absolute -left-36 top-2 text-right w-24">
              <div className="font-bold text-white text-xs">{evt.time}</div>
              <div className="text-[10px] text-slate-500">{evt.year}</div>
            </div>

            {/* Card Content */}
            <div
              className={`glass-panel p-5 tech-bracket space-y-2 border transition-all ${
                evt.active
                  ? 'border-cyan-400/80 bg-slate-950/90'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">{evt.code}</span>
                  <span className="sm:hidden text-slate-400">({evt.time} &bull; {evt.year})</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${evt.statusColor}`}>
                  {evt.status}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-heading font-bold text-white font-sans">
                {evt.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                {evt.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelinePage;
