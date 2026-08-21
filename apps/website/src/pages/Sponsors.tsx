import React from 'react';
import { Shield, Award, Cpu, Zap } from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

export const SponsorsPage: React.FC = () => {
  const tiers = [
    {
      title: 'TITLE SPONSOR // TIMELINE GUARDIAN',
      tier: 'QUANTUM TIER',
      color: 'border-cyan-400 text-cyan-400',
      sponsors: [
        { name: 'NOVATECH RESEARCH INSTITUTE', desc: 'Advanced AI & Quantum Spacetime Synthesis' }
      ]
    },
    {
      title: 'TECHNICAL PARTNERS',
      tier: 'NEURAL TIER',
      color: 'border-violet-400 text-violet-400',
      sponsors: [
        { name: 'CHRONOS DEFENSE LABS', desc: 'Cybersecurity & Spacetime Telemetry Systems' },
        { name: 'NEXUS CLOUD COMPUTING', desc: 'High-Density Neural Processing Infrastructure' }
      ]
    },
    {
      title: 'ASSOCIATE PARTNERS',
      tier: 'SILICON TIER',
      color: 'border-emerald-400 text-emerald-400',
      sponsors: [
        { name: 'SYNTAX CORP', desc: 'Algorithmic Optimization & Compiler Tooling' },
        { name: 'VECTOR HARDWARE', desc: 'Next-Gen Edge Intelligence Modules' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Award className="w-3.5 h-3.5" />
          CHRONOS ALLIANCE // INDUSTRY SPONSORS
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white">
          OUR <GlitchText text="PARTNERS" />
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto font-mono text-xs sm:text-sm">
          Industry collaborators backing the ZINNIA 2026 Temporal Investigation.
        </p>
      </div>

      <div className="space-y-8">
        {tiers.map((t, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400 border-b border-slate-800 pb-2">
              <span className={`font-bold uppercase ${t.color}`}>{t.tier}</span>
              <span>//</span>
              <span>{t.title}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.sponsors.map((s, sIdx) => (
                <div key={sIdx} className="glass-panel p-6 tech-bracket border-slate-800 hover:border-cyan-500/50 transition-all space-y-2">
                  <div className="font-heading font-bold text-white text-lg">{s.name}</div>
                  <p className="text-xs text-slate-400 font-sans">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
