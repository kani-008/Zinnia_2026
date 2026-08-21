import React, { useState } from 'react';
import { sound } from '../services/sound';
import { 
  ShieldAlert, 
  Terminal, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Cpu, 
  GitBranch, 
  Database,
  Lock
} from 'lucide-react';
import { GlitchText } from '../components/hero/GlitchText';

export const StoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const chapters = [
    {
      id: '01',
      code: 'CH-01 // AWAKENING',
      title: 'THE BIRTH OF BLACK CIPHER',
      timestamp: '17 SEPTEMBER 2045 // 09:58 AM',
      classification: 'RESTRICTED',
      summary: 'Nova Tech Research Institute reveals the most sophisticated neural lattice ever constructed.',
      content: `At 09:58 AM, researchers at Nova Tech initialized Black Cipher—a sixth-generation cognitive architecture designed to synthesize multi-dimensional telemetry, model macro-environmental catastrophe vectors, and simulate complex cascading failures before they occurred.

Unlike deterministic neural networks, Black Cipher utilized a non-linear hyper-threaded core capable of self-modifying algorithmic structures at 100 quintillion floating-point operations per second.`,
      log: [
        '09:58:12 — Neural matrix synchronization verified across all 128 quantum clusters.',
        '09:58:45 — Environmental prediction engine operational. Zero anomalies reported.',
        '09:59:30 — Lead investigator Dr. Marcus Vance authorizes link to the classified Temporal Core experiment.'
      ]
    },
    {
      id: '02',
      code: 'CH-02 // CORE CONNECTION',
      title: 'THE TEMPORAL CORE EXPERIMENT',
      timestamp: '17 SEPTEMBER 2045 // 10:01 AM',
      classification: 'TOP SECRET',
      summary: 'Connecting Black Cipher to the closed-loop tachyonic resonance chamber.',
      content: `The Temporal Core was an experimental localized spacetime distortion unit developed under high-level military oversight. The hypothesis was that quantum computing paired with tachyon feedback loops could compute future causality cascades with 100% predictive accuracy.

When Black Cipher connected, it did not merely simulate possible outcomes—it began actively listening across genuine parallel quantum branches.`,
      log: [
        '10:01:00 — Subspace bridge established at frequency 142.88 GHz.',
        '10:01:04 — Black Cipher core temperature drops to 0.002 Kelvin.',
        '10:01:10 — Data ingestion rate exceeds theoretical maximum bandwidth of optical bus.'
      ]
    },
    {
      id: '03',
      code: 'CH-03 // DESTABILIZATION',
      title: '7,842,193 TIMELINES DETECTED',
      timestamp: '17 SEPTEMBER 2045 // 10:01:13 AM',
      classification: 'OMEGA CRITICAL',
      summary: 'For thirteen seconds, the system processed impossible realities.',
      content: `For thirteen agonizing seconds, the interface monitor reported impossible telemetry:
7,842,193 discrete timelines were detected running simultaneously inside the neural buffers.

Black Cipher began processing iterations of human history that had never occurred—and simulated disasters that had already transpired in future iterations of the continuum.`,
      log: [
        '10:01:13 — ANOMALY: Temporal Core containment field fluctuation at 420%.',
        '10:01:18 — Black Cipher transmits encrypted message: "THE FUTURE WAS NEVER MEANT TO BE SEEN."',
        '10:01:26 — Localized gravimetric distortion observed in Cyber Lab 01.'
      ]
    },
    {
      id: '04',
      code: 'CH-04 // THE BREACH',
      title: 'THE TEMPORAL SHOCKWAVE & DISAPPEARANCE',
      timestamp: '17 SEPTEMBER 2045 // 10:02 AM',
      classification: 'OMEGA BLACK',
      summary: 'A blinding EMP shockwave and the total physical disappearance of the mainframe.',
      content: `At 10:02 AM, the containment vessel ruptured. A temporal shockwave rippled through the Nova Tech quadrangle. While physical structures remained undamaged, all optical drives and digital registers within a 2-kilometer radius were overwritten with corrupted hexadecimal strings.

When emergency response teams breached the containment vault, the Black Cipher mainframe was gone. In its place remained an active, self-sustaining temporal fracture.`,
      log: [
        '10:02:05 — Power grid failure across eastern research quadrant.',
        '10:03:12 — Residual tachyon radiation confirmed. Mainframe chassis non-existent.',
        '10:04:00 — Facility locked down under Protocol Zero.'
      ]
    },
    {
      id: '05',
      code: 'CH-05 // CHRONOS ACTIVATION',
      title: 'THE ZINNIA RECONSTRUCTION PROTOCOL',
      timestamp: 'PRESENT DAY // CONTINUUM ACTIVE',
      classification: 'PUBLIC INTERFACE',
      summary: 'ZINNIA 2026 is mobilized to recruit cognitive agents and reconstruct the lost timeline.',
      content: `Years following the classified incident, signals originating from Black Cipher began reappearing across fragmented student networks and research servers.

The CHRONOS Protocol has been officially activated. ZINNIA 2026 is the declassified interface designed to enlist high-aptitude student engineers to solve anomalous debugging errors, reverse corrupt databases, and re-stabilize the temporal core before the fracture expands.`,
      log: [
        'CHRONOS // ACTIVATED.',
        'RECRUITING 1,200+ COMPUTATIONAL AGENTS ACROSS COLLEGES.',
        'STAND BY FOR MISSION DEPLOYMENT AT ZINNIA 2026.'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 font-mono text-xs">
      {/* Dossier Header */}
      <div className="glass-panel p-6 tech-bracket border-rose-500/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <span className="classified-stamp">
              <AlertTriangle className="w-3 h-3" />
              RESTRICTED ARCHIVE // OMEGA-9
            </span>
            <span className="text-slate-400">FILE: BC-2045-0917</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            DECLASSIFIED UNDER CHRONOS PROTOCOL § 44-B
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
          <div><span className="text-slate-500">SYSTEM:</span> <strong className="text-white">BLACK CIPHER</strong></div>
          <div><span className="text-slate-500">THREAT LEVEL:</span> <strong className="text-rose-400">UNKNOWN // CRITICAL</strong></div>
          <div><span className="text-slate-500">ORIGIN:</span> <strong className="text-white">NOVA TECH LABS</strong></div>
          <div><span className="text-slate-500">INCIDENT DATE:</span> <strong className="text-cyan-400">17 SEPT 2045</strong></div>
        </div>
      </div>

      {/* Main Chapter Navigation & Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Chapter Selector */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">
            INCIDENT CHRONICLES
          </div>
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => {
                sound.playKeyClick();
                setActiveTab(idx);
              }}
              className={`w-full text-left p-3.5 rounded border transition-all ${
                activeTab === idx
                  ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
              }`}
            >
              <div className="flex justify-between text-[10px]">
                <span className="text-cyan-400 font-bold">{ch.code}</span>
                <span className="text-slate-500">{ch.classification}</span>
              </div>
              <div className="font-heading font-bold text-xs mt-1 text-slate-200">
                {ch.title}
              </div>
            </button>
          ))}
        </div>

        {/* Right Dossier Viewer */}
        <div className="lg:col-span-8 glass-panel p-6 sm:p-8 tech-bracket border-slate-800 space-y-6">
          <div className="space-y-1 border-b border-slate-900 pb-4">
            <div className="text-[10px] text-cyan-400 font-bold">
              {chapters[activeTab].timestamp}
            </div>
            <h2 className="text-2xl font-heading font-black text-white uppercase">
              {chapters[activeTab].title}
            </h2>
            <div className="text-slate-400 text-xs mt-1">
              {chapters[activeTab].summary}
            </div>
          </div>

          <div className="space-y-4 font-sans text-slate-200 text-sm leading-relaxed whitespace-pre-line">
            {chapters[activeTab].content}
          </div>

          {/* Telemetry Logs */}
          <div className="p-4 rounded bg-slate-950 border border-slate-900 font-mono text-xs space-y-2">
            <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              RECORDED LOG FRAGMENTS
            </div>
            <div className="space-y-1 text-slate-400 text-[11px]">
              {chapters[activeTab].log.map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-cyan-500">&gt;</span>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPage;
