import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Radio, Terminal, ExternalLink } from 'lucide-react';
import { sound } from '../../services/sound';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-[#030508] py-12 px-4 sm:px-8 font-mono text-xs text-slate-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Upper Terminal Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded bg-slate-950/60 border border-slate-900">
          <div className="space-y-1">
            <div className="text-[10px] text-slate-600 uppercase">SYSTEM STATUS</div>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE // NOMINAL
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-600 uppercase">TEMPORAL CHANNEL</div>
            <div className="text-cyan-400 font-bold">STABLE (CH-7842)</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-600 uppercase">SECURITY LEVEL</div>
            <div className="text-slate-300 font-bold">PUBLIC CLEARANCE 01</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-slate-600 uppercase">PRIMARY ANOMALY</div>
            <div className="text-rose-400 font-bold">BLACK CIPHER BREACH</div>
          </div>
        </div>

        {/* Middle Navigation & Info */}
        <div className="flex flex-wrap justify-between items-center gap-6 pt-4 border-t border-slate-900/60">
          <div className="space-y-1">
            <div className="text-white font-heading font-black text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>ZINNIA // CHRONOS PROTOCOL</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Department of Computer Science & Engineering &bull; National Level Technical Symposium
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <Link to="/story" onClick={() => sound.playKeyClick()} className="hover:text-cyan-400 transition-colors">
              Incident File
            </Link>
            <Link to="/timeline" onClick={() => sound.playKeyClick()} className="hover:text-cyan-400 transition-colors">
              Reconstructed Timeline
            </Link>
            <Link to="/events" onClick={() => sound.playKeyClick()} className="hover:text-cyan-400 transition-colors">
              Active Missions
            </Link>
            <Link to="/register" onClick={() => sound.playKeyClick()} className="hover:text-cyan-400 transition-colors">
              Agent Enlistment
            </Link>
            <Link to="/passport" onClick={() => sound.playKeyClick()} className="hover:text-cyan-400 transition-colors">
              Agent Terminal
            </Link>
            <Link to="/admin" onClick={() => sound.playKeyClick()} className="text-cyan-400 hover:text-cyan-300 font-bold">
              Control Center
            </Link>
          </div>
        </div>

        {/* Bottom Archival Stamp */}
        <div className="flex flex-wrap justify-between items-center gap-4 text-[10px] text-slate-600 pt-4 border-t border-slate-900/60">
          <div>
            &copy; 2045 NOVA TECH RESEARCH INSTITUTE &bull; RESTRICTED DISTRIBUTION
          </div>
          <div>
            ALL TEMPORAL DATA ENCRYPTED UNDER CHRONOS OMEGA STANDARD
          </div>
        </div>
      </div>
    </footer>
  );
};
