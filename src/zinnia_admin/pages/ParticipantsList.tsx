import React, { useState } from 'react';
import { store } from '../../services/store';
import { Participant } from '@packages/types/src';
import { Users, Search, Trash2 } from 'lucide-react';
import { exportParticipantsExcel } from '../../services/exportService';

export const ParticipantsListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [participants, setParticipants] = useState<Participant[]>(store.getParticipants());

  const filtered = participants.filter(p => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.college.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove participant ${name}?`)) {
      store.deleteParticipant(id);
      setParticipants(store.getParticipants());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Users className="w-5 h-5 text-indigo-400" />
            Participant Master Registry ({participants.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">Full database of registered symposium attendees.</p>
        </div>

        <button
          onClick={exportParticipantsExcel}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded"
        >
          EXPORT EXCEL (.XLSX)
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by ID, Name, Email, or College..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
              <th className="p-3">AGENT ID</th>
              <th className="p-3">NAME</th>
              <th className="p-3">COLLEGE</th>
              <th className="p-3">FOOD</th>
              <th className="p-3">EVENTS</th>
              <th className="p-3 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-950/40">
                <td className="p-3 text-indigo-400 font-bold">{p.agent_id}</td>
                <td className="p-3">
                  <div className="text-white font-bold">{p.name}</div>
                  <div className="text-slate-400 text-[11px]">{p.email}</div>
                </td>
                <td className="p-3 text-slate-300">
                  <div>{p.college}</div>
                  <div className="text-slate-500 text-[11px]">{p.department} (Yr {p.year})</div>
                </td>
                <td className="p-3">
                  {p.food_collected ? (
                    <span className="text-emerald-400 font-bold">✓ CLAIMED</span>
                  ) : (
                    <span className="text-slate-500">PENDING</span>
                  )}
                </td>
                <td className="p-3 text-indigo-300 font-bold">{p.registered_events.length} Tracks</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="p-1 rounded bg-slate-800 text-red-400 hover:bg-red-950"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
