import React from 'react';
import { Participant } from '@packages/types/src';
import { Eye, Trash2 } from 'lucide-react';

export interface ParticipantTableProps {
  participants: Participant[];
  onSelect: (p: Participant) => void;
  onDelete: (id: string, name: string) => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  onSelect,
  onDelete
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-xs">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className="pb-3 px-2">AGENT ID</th>
            <th className="pb-3 px-2">NAME</th>
            <th className="pb-3 px-2">COLLEGE</th>
            <th className="pb-3 px-2">CLEARANCE</th>
            <th className="pb-3 px-2">STATUS</th>
            <th className="pb-3 px-2 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900">
          {participants.map((p) => (
            <tr key={p.id} className="hover:bg-slate-900/40">
              <td className="py-3 px-2 text-cyan-400 font-bold">{p.agent_id}</td>
              <td className="py-3 px-2 text-white font-sans">{p.name}</td>
              <td className="py-3 px-2 text-slate-300 font-sans">{p.college}</td>
              <td className="py-3 px-2 text-violet-400">{p.clearance_level}</td>
              <td className="py-3 px-2 text-emerald-400 font-bold">{p.status}</td>
              <td className="py-3 px-2 text-right space-x-2">
                <button
                  onClick={() => onSelect(p)}
                  className="p-1.5 rounded bg-slate-900 text-cyan-400 hover:bg-slate-800"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(p.id, p.name)}
                  className="p-1.5 rounded bg-slate-900 text-red-400 hover:bg-red-950"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
