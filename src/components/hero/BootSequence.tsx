import React, { useState, useEffect } from 'react';
import { sound } from '../../services/sound';
import { Shield, AlertTriangle, Terminal, ArrowRight } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const logs = [
    'ESTABLISHING SECURE CONNECTION TO NOVA TECH ARCHIVE...',
    'NEURAL MATRIX: ONLINE',
    'TEMPORAL CORE: SYNCHRONIZED',
    'PROCESSING QUANTUM DEVIATIONS: 7,842,193 TIMELINES DETECTED',
    'CRITICAL ANOMALY: PREDICTIVE HORIZON BREACH',
    'TEMPORAL CORE OVERLOAD // 10:00:13 AM',
    'CHRONOS PROTOCOL ACTIVATED — RECRUITING TEMPORAL AGENTS'
  ];

  useEffect(() => {
    // Stage 0: Institute Header
    const t0 = setTimeout(() => {
      setStage(1);
      sound.playKeyClick();
    }, 600);

    // Stage 1: Reveal Date
    const t1 = setTimeout(() => {
      setStage(2);
      sound.playKeyClick();
    }, 1400);

    // Stage 2: Black Cipher Title
    const t2 = setTimeout(() => {
      setStage(3);
      sound.playBootTone();
    }, 2200);

    // Stage 3: Logs Sequence
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        const next = logs[logIndex];
        setTerminalLogs(prev => [...prev, next]);
        sound.playKeyClick();
        logIndex++;
      } else {
        clearInterval(logInterval);
        setStage(4);
      }
    }, 550);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(logInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[#030508] flex flex-col justify-between p-6 sm:p-12 font-mono text-xs text-slate-400 select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex justify-between items-start border-b border-slate-900 pb-4">
        <div className="space-y-1">
          <div className="text-[11px] text-slate-500 tracking-widest uppercase">
            ARCHIVAL RECONSTRUCTION TERMINAL // FILE: NVT-2045-BCX
          </div>
          <div className="text-slate-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            CHRONOS RESTORATION GRID
          </div>
        </div>

        <button
          onClick={() => {
            sound.playConfirmTone();
            onComplete();
          }}
          className="px-3 py-1.5 rounded border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-colors flex items-center gap-1.5 text-[11px]"
        >
          <span>SKIP BOOT // ESC</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Central Incident Revelation */}
      <div className="max-w-3xl mx-auto w-full my-auto space-y-6">
        {stage >= 1 && (
          <div className="space-y-1 text-slate-500 text-xs tracking-[0.25em] uppercase animate-fadeIn">
            <div>NOVA TECH RESEARCH INSTITUTE</div>
            <div className="text-rose-500/80 font-bold">CLASSIFIED INCIDENT REPORT</div>
          </div>
        )}

        {stage >= 2 && (
          <div className="text-sm font-bold text-slate-300 tracking-wider">
            17 SEPTEMBER 2045 // 09:58 AM
          </div>
        )}

        {stage >= 3 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <h1 className="text-4xl sm:text-6xl font-heading font-black text-white tracking-widest uppercase">
              BLACK CIPHER
            </h1>
            <p className="text-xs sm:text-sm text-cyan-400/90 font-mono tracking-widest uppercase">
              THE FUTURE WAS NEVER MEANT TO BE SEEN.
            </p>
          </div>
        )}

        {/* Terminal Telemetry Log */}
        {stage >= 3 && (
          <div className="p-4 rounded bg-black/60 border border-slate-900 space-y-1.5 min-h-[140px] text-[11px] text-slate-400">
            {terminalLogs.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-cyan-500">&gt;</span>
                <span className={i === terminalLogs.length - 1 ? 'text-cyan-300 font-semibold' : ''}>
                  {l}
                </span>
              </div>
            ))}
            <div className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse ml-3" />
          </div>
        )}

        {stage >= 4 && (
          <div className="pt-4 flex justify-center animate-fadeIn">
            <button
              onClick={() => {
                sound.playConfirmTone();
                onComplete();
              }}
              className="btn-temporal py-3 px-8 text-sm font-bold"
            >
              <span>ACCESS CLASSIFIED ARCHIVE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="border-t border-slate-900 pt-3 flex flex-wrap justify-between items-center text-[10px] text-slate-600">
        <div>SECURITY CLASSIFICATION: TOP SECRET // CHRONOS OMEGA</div>
        <div className="flex items-center gap-3">
          <span>LATENCY: 0.12ms</span>
          <span>QUANTUM DEVIATION: +00:00:13</span>
        </div>
      </div>
    </div>
  );
};
