import React, { useState } from 'react';
import { Participant } from '@/types';
import { Search, Filter, Eye, CheckCircle2, Clock, XCircle, Building2, Mail, Phone, Calendar, User, Shield } from 'lucide-react';

interface ParticipantTableProps {
  participants: Participant[];
  eventsList?: { id: string; name: string }[];
  onDelete?: (id: string, name: string) => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  eventsList = [],
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('ALL');
  const [selectedRegStatus, setSelectedRegStatus] = useState('ALL');
  const [selectedCheckinStatus, setSelectedCheckinStatus] = useState('ALL');
  const [selectedAgent, setSelectedAgent] = useState<Participant | null>(null);

  // Extract unique events if not passed
  const availableEvents = eventsList.length > 0 
    ? eventsList 
    : Array.from(new Set(participants.flatMap(p => p.registered_events || []))).map(e => ({ id: e, name: e }));

  // Filtering logic
  const filtered = participants.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm));

    const matchEvent = selectedEvent === 'ALL' || (p.registered_events && p.registered_events.includes(selectedEvent));
    
    // Default registration status if not set is CONFIRMED
    const regStatus = (p as any).registration_status || 'CONFIRMED';
    const matchRegStatus = selectedRegStatus === 'ALL' || regStatus === selectedRegStatus;

    const isCheckedIn = (p as any).checked_in || (p.attendance_history && p.attendance_history.length > 0);
    const checkinStatusStr = isCheckedIn ? 'CHECKED_IN' : 'NOT_CHECKED_IN';
    const matchCheckinStatus = selectedCheckinStatus === 'ALL' || checkinStatusStr === selectedCheckinStatus;

    return matchSearch && matchEvent && matchRegStatus && matchCheckinStatus;
  });

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Search & Filters Bar */}
      <div className="p-4 rounded-lg border border-slate-800 bg-[#070c1b]/90 flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Name, Agent ID, Email, Phone, College..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Event Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="bg-[#040711] border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-xs focus:outline-none"
            >
              <option value="ALL">All Events/Games</option>
              {availableEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {/* Registration Status Filter */}
          <select
            value={selectedRegStatus}
            onChange={(e) => setSelectedRegStatus(e.target.value)}
            className="bg-[#040711] border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-xs focus:outline-none"
          >
            <option value="ALL">All Reg Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Check-In Status Filter */}
          <select
            value={selectedCheckinStatus}
            onChange={(e) => setSelectedCheckinStatus(e.target.value)}
            className="bg-[#040711] border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded text-xs focus:outline-none"
          >
            <option value="ALL">All Check-In Statuses</option>
            <option value="CHECKED_IN">Checked-In</option>
            <option value="NOT_CHECKED_IN">Not Checked-In</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-lg border border-slate-800 bg-[#070c1b]/90 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-[#040711]">
              <th className="py-3 px-4">PARTICIPANT ID</th>
              <th className="py-3 px-4">NAME</th>
              <th className="py-3 px-4">COLLEGE / ORG</th>
              <th className="py-3 px-4">EVENT / GAME</th>
              <th className="py-3 px-4">REG STATUS</th>
              <th className="py-3 px-4">CHECK-IN</th>
              <th className="py-3 px-4">REG DATE</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-mono">
                  No participant records match the filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((p, index) => {
                const regStatus = (p as any).registration_status || 'CONFIRMED';
                const isCheckedIn = (p as any).checked_in || (p.attendance_history && p.attendance_history.length > 0);
                const regDate = (p as any).created_at ? new Date((p as any).created_at).toLocaleDateString() : '2026-08-25';
                const rowKey = p.id || p.agent_id || p.email || `part-row-${index}`;

                return (
                  <tr key={rowKey} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400 font-mono">
                      {p.agent_id || p.id}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      <div>{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{p.college}</div>
                      <div className="text-[11px] text-slate-400">{p.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.registered_events && p.registered_events.length > 0 ? (
                          p.registered_events.map((ev, evIdx) => (
                            <span key={`${ev}-${evIdx}`} className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-cyan-800/40 text-[10px]">
                              {ev}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[10px]">General Pass</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {regStatus === 'CANCELLED' ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 text-[10px] flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> CANCELLED
                        </span>
                      ) : regStatus === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 text-[10px] flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> PENDING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isCheckedIn ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold">
                          CHECKED-IN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 text-[10px]">
                          NOT CHECKED-IN
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {regDate}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedAgent(p)}
                        className="p-1.5 rounded bg-slate-900 text-cyan-400 border border-cyan-800/50 hover:bg-cyan-950 hover:border-cyan-400 transition-colors"
                        title="View Full Participant Telemetry"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Participant Details Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#070c1b] border border-cyan-500/40 rounded-xl p-6 max-w-lg w-full space-y-4 font-mono text-xs shadow-2xl text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="font-heading font-black text-white text-lg font-sans">
                  PARTICIPANT DOSSIER
                </h3>
              </div>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans">
              <div className="p-3 rounded bg-[#040711] border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-sm font-bold text-white">{selectedAgent.name}</div>
                  <div className="text-xs text-cyan-400 font-mono">ID: {selectedAgent.agent_id}</div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                  {(selectedAgent as any).registration_status || 'CONFIRMED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                    <Mail className="w-3 h-3 text-cyan-400" /> EMAIL
                  </div>
                  <div className="font-semibold text-slate-200 mt-1">{selectedAgent.email}</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                    <Phone className="w-3 h-3 text-cyan-400" /> PHONE
                  </div>
                  <div className="font-semibold text-slate-200 mt-1">{selectedAgent.phone || 'N/A'}</div>
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                  <Building2 className="w-3 h-3 text-cyan-400" /> COLLEGE & DEPARTMENT
                </div>
                <div className="font-semibold text-slate-200 mt-1">{selectedAgent.college}</div>
                <div className="text-slate-400 text-xs">{selectedAgent.department}</div>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <div className="text-slate-400 font-mono text-[10px]">REGISTERED EVENTS / GAMES</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedAgent.registered_events && selectedAgent.registered_events.length > 0 ? (
                    selectedAgent.registered_events.map((ev, evIdx) => (
                      <span key={`${ev}-${evIdx}`} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-xs">
                        {ev}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs">No specific track</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold"
              >
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
