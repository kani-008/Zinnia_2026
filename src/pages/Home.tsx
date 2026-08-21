import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BlackCipherHero } from '../components/hero/BlackCipherHero';
import { TimelinesCanvas } from '../components/hero/TimelinesCanvas';
import { BootSequence } from '../components/hero/BootSequence';
import { sound } from '../services/sound';
import { store } from '../services/store';
import { 
  Shield, 
  Terminal, 
  AlertTriangle, 
  Clock, 
  GitBranch, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Users
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [showBoot, setShowBoot] = useState<boolean>(() => {
    // Only show boot sequence once per browser session
    return !sessionStorage.getItem('zinnia_boot_completed');
  });

  const handleBootComplete = () => {
    sessionStorage.setItem('zinnia_boot_completed', 'true');
    setShowBoot(false);
  };

  const events = store.getEvents().slice(0, 3);

  if (showBoot) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <div className="space-y-20 pb-20">
      {/* 01 — Cinematic Hero */}
      <BlackCipherHero />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* 02 — Classified Incident Dossier Snapshot */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-rose-400 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>INCIDENT ARCHIVE // DOSSIER FILE: BC-2045-0917</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1 uppercase">
                THE 13-SECOND DISASTER
              </h2>
            </div>
            <Link
              to="/story"
              onClick={() => sound.playKeyClick()}
              className="btn-secondary py-2 px-4 text-xs"
            >
              <span>READ FULL DECLASSIFIED DOSSIER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 tech-bracket space-y-3 font-mono text-xs">
              <div className="text-cyan-400 font-bold">PHASE 01: THE AWAKENING</div>
              <div className="text-slate-500 text-[11px]">09:58 AM &bull; 17 SEPT 2045</div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Black Cipher is activated by Nova Tech researchers to predict and simulate global systemic hazards.
              </p>
            </div>

            <div className="glass-panel p-6 tech-bracket space-y-3 font-mono text-xs border-amber-500/30">
              <div className="text-amber-400 font-bold">PHASE 02: THE DESTABILIZATION</div>
              <div className="text-slate-500 text-[11px]">10:01:13 AM &bull; 13 SECONDS</div>
              <p className="text-slate-300 font-sans leading-relaxed">
                Connected to the Temporal Core, the system analyzes 7,842,193 branching futures in parallel before overloading.
              </p>
            </div>

            <div className="glass-panel p-6 tech-bracket space-y-3 font-mono text-xs border-rose-500/30">
              <div className="text-rose-400 font-bold">PHASE 03: THE SHOCKWAVE</div>
              <div className="text-slate-500 text-[11px]">10:04 AM &bull; PRESENT DAY</div>
              <p className="text-slate-300 font-sans leading-relaxed">
                A localized spacetime breach erases Black Cipher from physical memory. The CHRONOS Protocol is now mobilizing agents.
              </p>
            </div>
          </div>
        </section>

        {/* 03 — 7,842,193 Timelines Canvas Simulation */}
        <section className="space-y-4">
          <TimelinesCanvas />
        </section>

        {/* 04 — Active Tactical Missions Preview */}
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
            <div>
              <div className="font-mono text-xs text-cyan-400 font-bold">
                OPERATIONAL ASSIGNMENTS // 9 ACTIVE MISSIONS
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1 uppercase">
                CRITICAL INVESTIGATIVE MISSIONS
              </h2>
            </div>
            <Link
              to="/events"
              onClick={() => sound.playKeyClick()}
              className="btn-temporal py-2 px-5 text-xs font-bold"
            >
              <span>VIEW ALL 9 MISSIONS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="glass-panel p-6 tech-bracket flex flex-col justify-between space-y-4 hover:border-cyan-400 transition-all font-mono text-xs"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-bold">
                      {evt.code}
                    </span>
                    <span className="text-slate-500 uppercase">{evt.category}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-heading font-bold text-white font-sans">
                      {evt.mission_name}
                    </h3>
                    <div className="text-slate-400 text-xs mt-0.5">
                      Event: <span className="text-cyan-300 font-semibold">{evt.title}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 font-sans line-clamp-3 text-xs leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="pt-2 border-t border-slate-900 flex justify-between text-slate-400 text-[11px]">
                    <span>{evt.schedule_time}</span>
                    <span>{evt.team_size_min}-{evt.team_size_max} Agents</span>
                  </div>
                </div>

                <Link
                  to="/events"
                  onClick={() => sound.playKeyClick()}
                  className="btn-secondary py-2 w-full text-center text-xs justify-center"
                >
                  <span>INSPECT MISSION DOSSIER</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* 05 — Agent Enlistment / CTA Banner */}
        <section className="glass-panel p-8 sm:p-12 tech-bracket border-cyan-500/40 text-center space-y-6 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
              <Shield className="w-3.5 h-3.5" />
              CHRONOS TEMPORAL COMMISSION
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-white uppercase">
              COMMISSION YOUR AGENT CREDENTIALS
            </h2>
            <p className="font-mono text-xs sm:text-sm text-slate-300">
              Register now to generate your unique Digital Symposium Passport and gain clearance into the 2026 investigations.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 font-mono">
            <Link
              to="/register"
              onMouseEnter={() => sound.playHoverTone()}
              onClick={() => sound.playConfirmTone()}
              className="btn-temporal py-3.5 px-8 text-xs font-bold"
            >
              <span>[ INITIALIZE AGENT ENLISTMENT ]</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/passport"
              onMouseEnter={() => sound.playHoverTone()}
              onClick={() => sound.playKeyClick()}
              className="btn-secondary py-3.5 px-6 text-xs"
            >
              <span>ACCESS AGENT TERMINAL</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
