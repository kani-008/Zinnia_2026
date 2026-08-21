import React from 'react';
import { Settings as SettingsIcon, Shield, Database, RefreshCw } from 'lucide-react';
import { store } from '../../../../src/services/store';

export const Settings: React.FC = () => {
  const handleResetData = () => {
    if (window.confirm('Reset all demo attendance and participant records to defaults?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono text-xs">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          SYSTEM CONFIGURATION
        </h1>
      </div>

      <div className="glass-panel p-6 tech-bracket border-slate-800 space-y-4">
        <div className="text-white font-bold text-sm">ENVIRONMENT TELEMETRY</div>
        <div className="grid grid-cols-2 gap-4 text-slate-400">
          <div>DATABASE STATUS: <span className="text-emerald-400 font-bold">ONLINE (MOCK/LIVE SYNC)</span></div>
          <div>SYMPOSIUM YEAR: <span className="text-cyan-400 font-bold">2026</span></div>
          <div>CHRONOS VERSION: <span className="text-violet-400 font-bold">v2.6.45</span></div>
          <div>STATION ENCRYPTION: <span className="text-amber-400 font-bold">AES-512</span></div>
        </div>
      </div>

      <div className="glass-panel p-6 tech-bracket border-red-500/30 space-y-3">
        <div className="text-red-400 font-bold text-sm">DANGER ZONE // RESET LOCAL TEST DATA</div>
        <p className="text-slate-400">
          Clear local storage participant check-ins and reset back to preloaded official test agents.
        </p>
        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded bg-red-950/80 border border-red-500 text-red-300 hover:bg-red-900 font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET LOCAL STORAGE DATA</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;
