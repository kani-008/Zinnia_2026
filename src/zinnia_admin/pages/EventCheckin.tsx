import React, { useState } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord } from '@packages/types/src';
import { Zap, CheckCircle2, AlertTriangle, Users } from 'lucide-react';

export const EventCheckinPage: React.FC = () => {
  const allEvents = store.getEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(allEvents[0]?.id || '');
  const [agentInput, setAgentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'EVENT')
  );

  const selectedEvent = allEvents.find(e => e.id === selectedEventId);
  const currentEventAttendance = attendance.filter(a => a.event_id === selectedEventId);

  const handleEventCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleaned = agentInput.trim();
    if (!cleaned) return;

    const participant = store.getParticipantByIdOrEmail(cleaned);
    if (!participant) {
      setFeedback({ type: 'error', message: `Participant "${cleaned}" not found.` });
      return;
    }

    const res = store.recordEventCheckin(participant.agent_id, selectedEventId, `Desk: ${selectedEvent?.mission_name || 'Event'}`);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'EVENT'));
      setAgentInput('');
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Zap className="w-5 h-5 text-indigo-400" />
            Event Room Attendance Verification
          </h1>
          <p className="text-xs text-slate-400 mt-1">Verify attendee registration for individual competitions.</p>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
          <span className="text-slate-400">VERIFIED ATTENDEES: </span>
          <strong className="text-indigo-400 font-bold">{currentEventAttendance.length}</strong>
        </div>
      </div>

      {/* Select Event */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
        <label className="block text-xs font-bold text-slate-300">Select Competition Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none"
        >
          {allEvents.map((evt) => (
            <option key={evt.id} value={evt.id}>
              [{evt.event_type}] {evt.code} - {evt.mission_name} ({evt.venue})
            </option>
          ))}
        </select>
      </div>

      {/* Check-in Form */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
        <form onSubmit={handleEventCheckin} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">Scan QR or Enter Participant ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none uppercase"
            />
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded">
              VERIFY ATTENDANCE
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`p-3 rounded border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/80 border-red-500/50 text-red-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Verified Attendees */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
        <h3 className="font-bold text-white text-xs flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Confirmed Attendees for {selectedEvent?.mission_name} ({currentEventAttendance.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">ID</th>
                <th className="pb-2">NAME</th>
                <th className="pb-2">COLLEGE</th>
                <th className="pb-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentEventAttendance.map((rec) => (
                <tr key={rec.id}>
                  <td className="py-2 text-indigo-400 font-bold">{rec.agent_id}</td>
                  <td className="py-2 text-white">{rec.participant_name}</td>
                  <td className="py-2 text-slate-300">{rec.college}</td>
                  <td className="py-2 text-right text-emerald-400 font-bold">✓ PRESENT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
