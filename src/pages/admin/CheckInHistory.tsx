import React, { useState } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord } from '@/types';
import { History, Search, Filter, Calendar, Clock, User, Shield, CheckCircle2, DoorOpen, Utensils, Zap } from 'lucide-react';

export const CheckInHistoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  
  const attendance = store.getAttendance();
  const participants = store.getParticipants();

  // Enhance attendance records with participant info
  const enrichedLogs = attendance.map(att => {
    const p = participants.find(part => part.id === att.member_id || part.agent_id === att.member_id);
    return {
      ...att,
      participant_name: p?.name || att.member_id || 'Unknown Participant',
      college: p?.college || 'Unknown Institution',
      agent_id: p?.agent_id || att.member_id
    };
  });

  const filteredLogs = enrichedLogs.filter(log => {
    const matchSearch =
      log.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.scanned_by && log.scanned_by.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.event_id && log.event_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchType = selectedType === 'ALL' || log.checkin_type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 font-mono text-xs max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white font-sans flex items-center gap-2.5">
            <History className="w-7 h-7 text-cyan-400" />
            CHECK-IN AUDIT HISTORY
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time audit log of all gate entries, event checkpoints, and food token redemptions.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold">
          TOTAL LOGS: {attendance.length}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-lg border border-slate-800 bg-[#070c1b]/90 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Participant, Agent ID, Coordinator, or Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#040711] border border-slate-700 text-slate-300 px-3 py-2 rounded text-xs focus:outline-none font-mono"
          >
            <option value="ALL">All Check-In Types</option>
            <option value="ENTRY">Gate Entry</option>
            <option value="EVENT">Event Checkpoint</option>
            <option value="FOOD">Food Counter</option>
          </select>
        </div>
      </div>

      {/* History Log Table */}
      <div className="rounded-lg border border-slate-800 bg-[#070c1b]/90 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-[#040711]">
              <th className="py-3 px-4">TIMESTAMP</th>
              <th className="py-3 px-4">PARTICIPANT</th>
              <th className="py-3 px-4">CHECK-IN TYPE</th>
              <th className="py-3 px-4">EVENT / LOCATION</th>
              <th className="py-3 px-4">COORDINATOR / ADMIN</th>
              <th className="py-3 px-4 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                  No check-in logs match your search and filter criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const formattedTime = log.scanned_at 
                  ? new Date(log.scanned_at).toLocaleString() 
                  : 'Recent';

                return (
                  <tr key={log.id || idx} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{formattedTime}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-white">{log.participant_name}</div>
                      <div className="text-[11px] text-cyan-400 font-mono">ID: {log.agent_id}</div>
                    </td>

                    <td className="py-3 px-4">
                      {log.checkin_type === 'ENTRY' ? (
                        <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold inline-flex items-center gap-1">
                          <DoorOpen className="w-3 h-3 text-emerald-400" /> GATE ENTRY
                        </span>
                      ) : log.checkin_type === 'FOOD' ? (
                        <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-bold inline-flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-amber-400" /> FOOD COUNTER
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold inline-flex items-center gap-1">
                          <Zap className="w-3 h-3 text-cyan-400" /> EVENT TRACK
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div>{log.event_id || log.location || 'General Checkpoint'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{log.location || 'Main Desk'}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      <div className="flex items-center gap-1 font-bold text-cyan-300">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span>{log.scanned_by || 'Admin Coordinator'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold">
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
