import React, { useState } from 'react';
import { store } from '../../services/store';
import { Participant } from '@packages/types/src';
import { Users, Search, Filter, Trash2, Eye, Shield, Award, CheckCircle2 } from 'lucide-react';
import { exportParticipantsExcel } from '../../services/exportService';

export const ParticipantsListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('ALL');
  const [participants, setParticipants] = useState<Participant[]>(store.getParticipants());
  const [selectedAgent, setSelectedAgent] = useState<Participant | null>(null);

  const allEvents = store.getEvents();

  // Colleges list
  const colleges = ['ALL', ...Array.from(new Set(participants.map(p => p.college)))];

  const filtered = participants.filter(p => {
    const matchSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.college.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCollege = selectedCollege === 'ALL' || p.college === selectedCollege;
    return matchSearch && matchCollege;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove Agent ${name}?`)) {
      store.deleteParticipant(id);
      setParticipants(store.getParticipants());
      if (selectedAgent?.id === id) setSelectedAgent(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            PARTICIPANT REGISTRY
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Total {participants.length} registered temporal agents across institutions.
          </p>
        </div>

        <button
          onClick={exportParticipantsExcel}
          className="btn-temporal py-2 px-4 text-xs font-bold"
        >
          <span>EXPORT TO EXCEL (.XLSX)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 tech-bracket border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Agent ID, Name, Email, or College..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-300 px-3 py-2 rounded text-xs focus:outline-none"
          >
            {colleges.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Colleges' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Participants Master Table */}
      <div className="glass-panel p-6 tech-bracket border-slate-800 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="pb-3 px-2">AGENT ID</th>
              <th className="pb-3 px-2">NAME</th>
              <th className="pb-3 px-2">COLLEGE & DEPT</th>
              <th className="pb-3 px-2">CLEARANCE</th>
              <th className="pb-3 px-2">MISSIONS</th>
              <th className="pb-3 px-2">STATUS</th>
              <th className="pb-3 px-2 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No participants matched your search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-2 text-cyan-400 font-bold">{p.agent_id}</td>
                  <td className="py-3 px-2">
                    <div className="text-white font-sans font-bold">{p.name}</div>
                    <div className="text-[11px] text-slate-500 font-sans">{p.email}</div>
                  </td>
                  <td className="py-3 px-2 font-sans">
                    <div className="text-slate-300 truncate max-w-xs">{p.college}</div>
                    <div className="text-[11px] text-slate-500">{p.department} &bull; Yr {p.year}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded bg-violet-950 text-violet-400 text-[10px] font-bold border border-violet-500/30">
                      {p.clearance_level}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-amber-400 font-bold">
                    {p.registered_events.length} Assigned
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right space-x-2">
                    <button
                      onClick={() => setSelectedAgent(p)}
                      className="p-1.5 rounded bg-slate-900 text-cyan-400 hover:bg-slate-800"
                      title="View Dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 rounded bg-slate-900 text-red-400 hover:bg-red-950"
                      title="Remove Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Participant Dossier Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full p-6 tech-bracket border-cyan-400 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <div className="text-[10px] text-cyan-400 font-bold">AGENT DOSSIER</div>
                <h3 className="text-xl font-heading font-black text-white font-sans">
                  {selectedAgent.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-2 py-1 rounded bg-slate-900 text-slate-400 hover:text-white"
              >
                CLOSE
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500">AGENT ID</span>
                  <div className="text-cyan-300 font-bold text-sm">{selectedAgent.agent_id}</div>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500">PHONE</span>
                  <div className="text-slate-300">{selectedAgent.phone}</div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500">INSTITUTION</span>
                <div className="text-white font-sans font-bold">{selectedAgent.college}</div>
                <div className="text-slate-400 font-sans text-[11px]">{selectedAgent.department} &bull; Year {selectedAgent.year}</div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500">ASSIGNED MISSIONS</span>
                <div className="space-y-1">
                  {selectedAgent.registered_events.map((eId) => {
                    const evt = allEvents.find(e => e.id === eId);
                    return (
                      <div key={eId} className="text-slate-300 flex items-center gap-1.5">
                        <span className="text-cyan-400 font-bold">{evt?.code || 'MSN'}:</span>
                        <span>{evt?.mission_name || eId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
