import React, { useState } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord } from '@packages/types/src';
import { DoorOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <DoorOpen className="w-5 h-5 text-indigo-400" />
            Gate Entry Verification
          </h1>
          <p className="text-xs text-slate-400 mt-1">Check-in arriving participants and prevent duplicate entry.</p>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
          <span className="text-slate-400">CHECKED IN: </span>
          <strong className="text-emerald-400 font-bold">{checkedInCount}</strong>
          <span className="text-slate-500"> / {totalRegistered}</span>
        </div>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
        <form onSubmit={handleEntryCheckin} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">Scan QR or Enter Participant ID / Email</label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C or email"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none uppercase"
            />
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded">
              RECORD GATE ENTRY
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`p-3 rounded border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Recent Arrivals Table */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
        <h3 className="font-bold text-white text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Recent Gate Arrivals ({attendance.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">AGENT ID</th>
                <th className="pb-2">NAME</th>
                <th className="pb-2">COLLEGE</th>
                <th className="pb-2">TIME</th>
                <th className="pb-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-950/40">
                  <td className="py-2 text-indigo-400 font-bold">{rec.agent_id}</td>
                  <td className="py-2 text-white">{rec.participant_name}</td>
                  <td className="py-2 text-slate-300">{rec.college}</td>
                  <td className="py-2 text-slate-400">
                    {new Date(rec.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2 text-right text-emerald-400 font-bold">✓ CHECKED IN</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
