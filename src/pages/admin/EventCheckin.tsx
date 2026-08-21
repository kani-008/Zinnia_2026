import React, { useState } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord, EventMission } from '@packages/types/src';
import { Zap, CheckCircle2, AlertTriangle, Search, Clock, Users, Shield, MapPin } from 'lucide-react';

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
  const allParticipants = store.getParticipants();
  const registeredCountForEvent = allParticipants.filter(p => p.registered_events.includes(selectedEventId)).length;

  const handleEventCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleaned = agentInput.trim();
    if (!cleaned) return;

    const participant = store.getParticipantByIdOrEmail(cleaned);
    if (!participant) {
      setFeedback({ type: 'error', message: `Participant "${cleaned}" not found in database.` });
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
    <div className="max-w-5xl mx-auto space-y-8 font-mono text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2 font-sans">
            <Zap className="w-6 h-6 text-fuchsia-400" />
            MISSION CHECK-IN & ATTENDANCE VERIFICATION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Verify participant registration and attendance status before results finalization and dynamic certificate issuance.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2 rounded bg-[#070c1b] border border-slate-700 text-center">
            <span className="text-slate-400">MISSION VERIFIED: </span>
            <strong className="text-fuchsia-400 text-sm">{currentEventAttendance.length}</strong>
            <span className="text-slate-500"> / {registeredCountForEvent} registered</span>
          </div>
        </div>
      </div>

      {/* Select Active Event Mission */}
      <div className="cyber-card p-6 cyber-bracket border-fuchsia-500/40 space-y-4 bg-[#070c1b]/95">
        <label className="block text-xs font-mono text-fuchsia-400 font-bold uppercase tracking-wider font-sans">
          SELECT ACTIVE OPERATIONAL MISSION
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setFeedback(null);
          }}
          className="w-full px-4 py-3 rounded-lg bg-[#040711] border border-slate-700 text-white font-mono text-xs focus:border-fuchsia-400 focus:outline-none"
        >
          {allEvents.map((evt) => (
            <option key={evt.id} value={evt.id}>
              [{evt.event_type}] {evt.code} &bull; {evt.mission_name} ({evt.title}) &bull; {evt.schedule_time} &bull; {evt.venue}
            </option>
          ))}
        </select>

        {selectedEvent && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
            <div className="p-2.5 rounded bg-[#040711] border border-slate-800">
              <span className="text-slate-400 text-[10px]">TRACK TYPE</span>
              <div className="text-cyan-300 font-bold">{selectedEvent.event_type}</div>
            </div>
            <div className="p-2.5 rounded bg-[#040711] border border-slate-800">
              <span className="text-slate-400 text-[10px]">SCHEDULE</span>
              <div className="text-white font-bold">{selectedEvent.schedule_time}</div>
            </div>
            <div className="p-2.5 rounded bg-[#040711] border border-slate-800">
              <span className="text-slate-400 text-[10px]">VENUE</span>
              <div className="text-slate-200 truncate">{selectedEvent.venue}</div>
            </div>
            <div className="p-2.5 rounded bg-[#040711] border border-slate-800">
              <span className="text-slate-400 text-[10px]">TOTAL REGISTERED</span>
              <div className="text-fuchsia-400 font-bold">{registeredCountForEvent} Agents</div>
            </div>
          </div>
        )}
      </div>

      {/* Verify & Check-in Participant Form */}
      <div className="cyber-card p-6 sm:p-8 cyber-bracket border-slate-800 space-y-6 bg-[#070c1b]/95">
        <form onSubmit={handleEventCheckin} className="space-y-4 font-mono text-xs">
          <label className="block text-slate-300 font-bold uppercase tracking-wider text-sm font-sans">
            Scan or Enter Agent ID to Confirm Attendance
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-[#040711] border border-slate-700 text-white font-sans text-sm focus:border-fuchsia-400 focus:outline-none uppercase"
            />
            <button type="submit" className="py-3 px-8 rounded bg-fuchsia-600 text-white font-heading font-bold text-xs hover:bg-fuchsia-500 shadow-[0_0_15px_rgba(240,0,255,0.4)] transition-all font-sans">
              <span>VERIFY ATTENDANCE</span>
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
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <div className="leading-relaxed font-bold">{feedback.message}</div>
          </div>
        )}
      </div>

      {/* Verified Attendees for this event */}
      <div className="cyber-card p-6 cyber-bracket border-slate-800 space-y-4 bg-[#070c1b]/95">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2 font-sans">
            <Users className="w-4 h-4 text-fuchsia-400" />
            ATTENDANCE CONFIRMED FOR {selectedEvent?.mission_name.toUpperCase()} ({currentEventAttendance.length})
          </h3>
          <span className="font-mono text-[10px] text-slate-400">CONFIRMED ATTENDEES</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 px-2">AGENT ID</th>
                <th className="pb-2 px-2">NAME</th>
                <th className="pb-2 px-2">COLLEGE</th>
                <th className="pb-2 px-2">CHECKIN TIME</th>
                <th className="pb-2 px-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-sans">
              {currentEventAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No participants checked into this mission yet.
                  </td>
                </tr>
              ) : (
                currentEventAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2 text-cyan-400 font-bold font-mono">{rec.agent_id}</td>
                    <td className="py-2.5 px-2 text-white font-bold">{rec.participant_name}</td>
                    <td className="py-2.5 px-2 text-slate-300">{rec.college}</td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">
                      {new Date(rec.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 font-bold font-mono">
                      ✓ ATTENDANCE CONFIRMED
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EventCheckinPage;
