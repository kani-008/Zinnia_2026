import React, { useState } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord } from '@packages/types/src';

export const EntryCheckinPage: React.FC = () => {
  const [agentInput, setAgentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'ENTRY')
  );

  const participants = store.getParticipants();
  const totalRegistered = participants.length;
  const checkedInCount = attendance.length;

  const handleEntryCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleaned = agentInput.trim();
    if (!cleaned) return;

    // Search by ID or email
    const participant = store.getParticipantByIdOrEmail(cleaned);
    if (!participant) {
      setFeedback({ type: 'error', message: `Participant "${cleaned}" not found in database.` });
      return;
    }

    const res = store.recordEntryCheckin(participant.agent_id, 'Main Gate Terminal');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      setAgentInput('');
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <DoorOpen className="w-6 h-6 text-cyan-400" />
            CAMPUS GATE ENTRY STATION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Check-in arriving temporal agents and prevent accidental duplicate access.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2 rounded bg-slate-900 border border-slate-700 text-center">
            <span className="text-slate-400">CHECKED IN: </span>
            <strong className="text-emerald-400 text-sm">{checkedInCount}</strong>
            <span className="text-slate-500"> / {totalRegistered}</span>
          </div>
        </div>
      </div>

      {/* Main Entry Checkin Box */}
      <div className="glass-panel p-6 sm:p-8 tech-bracket border-cyan-500/40 space-y-6">
        <form onSubmit={handleEntryCheckin} className="space-y-4 font-mono text-xs">
          <label className="block text-slate-300 font-bold uppercase tracking-wider text-sm">
            Scan or Enter Participant ID / Email
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C or student@gce.ac.in"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans text-sm focus:border-cyan-400 focus:outline-none uppercase"
            />
            <button type="submit" className="btn-temporal py-3 px-8 text-sm">
              <span>RECORD GATE ENTRY</span>
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`p-4 rounded-xl border font-mono text-xs flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : feedback.type === 'warning'
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              : 'bg-red-950/80 border-red-500/50 text-red-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div className="leading-relaxed">{feedback.message}</div>
          </div>
        )}
      </div>

      {/* Arrived Attendees Table */}
      <div className="glass-panel p-6 tech-bracket border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            RECENT GATE ARRIVALS ({attendance.length})
          </h3>
          <span className="font-mono text-[10px] text-slate-400">ORDER: LATEST FIRST</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 px-2">AGENT ID</th>
                <th className="pb-2 px-2">NAME</th>
                <th className="pb-2 px-2">COLLEGE</th>
                <th className="pb-2 px-2">CHECKIN TIME</th>
                <th className="pb-2 px-2">TERMINAL</th>
                <th className="pb-2 px-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {attendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-2 text-cyan-400 font-bold">{rec.agent_id}</td>
                  <td className="py-2.5 px-2 text-white font-sans">{rec.participant_name}</td>
                  <td className="py-2.5 px-2 text-slate-300 font-sans">{rec.college}</td>
                  <td className="py-2.5 px-2 text-slate-400">
                    {new Date(rec.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-2 text-slate-500">{rec.scanned_by}</td>
                  <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">
                    ✓ CHECKED IN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
