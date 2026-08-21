import React from 'react';
import { Participant } from '@packages/types/src';
import { DoorOpen, Utensils } from 'lucide-react';

export interface ScanResultProps {
  participant: Participant;
  onEntry: () => void;
  onFood: () => void;
}

export const ScanResult: React.FC<ScanResultProps> = ({
  participant,
  onEntry,
  onFood
}) => {
  return (
    <div className="glass-panel p-6 tech-bracket border-cyan-400 space-y-4 shadow-2xl font-mono text-xs">
      <div className="flex justify-between items-start border-b border-slate-800 pb-3">
        <div>
          <div className="text-[10px] text-cyan-400 font-bold uppercase">
            AGENT VERIFIED // {participant.clearance_level}
          </div>
          <h3 className="text-xl font-heading font-black text-white font-sans">
            {participant.name}
          </h3>
          <div className="text-slate-400 text-xs mt-0.5 font-sans">{participant.college}</div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px] border border-emerald-500/40">
          {participant.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">AGENT ID</span>
          <div className="text-cyan-300 font-bold text-sm">{participant.agent_id}</div>
        </div>
        <div className="p-2 rounded bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase">PHONE</span>
          <div className="text-slate-300">{participant.phone}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={onEntry}
          className="py-2.5 px-3 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 font-bold flex items-center justify-center gap-2"
        >
          <DoorOpen className="w-4 h-4" />
          <span>MARK ENTRY</span>
        </button>
        <button
          onClick={onFood}
          className="py-2.5 px-3 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900 font-bold flex items-center justify-center gap-2"
        >
          <Utensils className="w-4 h-4" />
          <span>MARK LUNCH</span>
        </button>
      </div>
    </div>
  );
};
