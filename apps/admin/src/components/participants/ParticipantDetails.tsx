import React from 'react';
import { Participant } from '@packages/types/src';

export interface ParticipantDetailsProps {
  participant: Participant | null;
  onClose: () => void;
}

export const ParticipantDetails: React.FC<ParticipantDetailsProps> = ({
  participant,
  onClose
}) => {
  if (!participant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel max-w-lg w-full p-6 tech-bracket border-cyan-400 shadow-2xl space-y-4 font-mono text-xs">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <div className="text-[10px] text-cyan-400 font-bold">AGENT DOSSIER</div>
            <h3 className="text-xl font-heading font-black text-white font-sans">
              {participant.name}
            </h3>
          </div>
          <button onClick={onClose} className="px-2 py-1 rounded bg-slate-900 text-slate-400 hover:text-white">
            CLOSE
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500">AGENT ID</span>
              <div className="text-cyan-300 font-bold">{participant.agent_id}</div>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500">PHONE</span>
              <div className="text-slate-300">{participant.phone}</div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500">COLLEGE</span>
            <div className="text-white font-sans font-bold">{participant.college}</div>
            <div className="text-slate-400 font-sans text-[11px]">{participant.department} &bull; Year {participant.year}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
