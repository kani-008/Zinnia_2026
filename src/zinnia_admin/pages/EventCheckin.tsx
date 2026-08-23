import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord } from '@packages/types/src';
import { extractScanToken } from '@packages/utils/src/qr';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import { Zap, CheckCircle2, AlertTriangle, Users, Tag, QrCode, Camera } from 'lucide-react';

export const EventCheckinPage: React.FC = () => {
  const [allEvents, setAllEvents] = useState(store.getEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>(allEvents[0]?.id || '');
  const [agentInput, setAgentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'EVENT')
  );

  useEffect(() => {
    const update = () => {
      const evs = store.getEvents();
      setAllEvents(evs);
      if (!selectedEventId && evs[0]) {
        setSelectedEventId(evs[0].id);
      }
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'EVENT'));
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const selectedEvent = allEvents.find(e => e.id === selectedEventId);
  const currentEventAttendance = attendance.filter(a => a.event_id === selectedEventId);

  const handleEventCheckin = (customInput?: string) => {
    setFeedback(null);
    const cleaned = (customInput || agentInput).trim();
    if (!cleaned) return;

    const res = store.recordEventCheckin(
      cleaned, 
      selectedEventId, 
      `Desk: ${selectedEvent?.mission_name || 'Event'}`
    );

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
            Event Track Attendance Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan attendee Hand Band QR to verify registration and admit to competition room.
          </p>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
          <span className="text-slate-400">VERIFIED ATTENDEES: </span>
          <strong className="text-indigo-400 font-bold">{currentEventAttendance.length}</strong>
        </div>
      </div>

      {/* Select Event Track */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 shadow-lg">
        <label className="block text-xs font-bold text-slate-300 uppercase font-mono">
          Select Competition Event Track
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:border-indigo-400 focus:outline-none font-mono"
        >
          {allEvents.map((evt) => (
            <option key={evt.id} value={evt.id}>
              [{evt.event_type}] {evt.code} - {evt.mission_name} ({evt.venue})
            </option>
          ))}
        </select>
      </div>

      {/* Check-in Form */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
        <form onSubmit={(e) => { e.preventDefault(); handleEventCheckin(); }} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase font-mono">
              <Tag className="w-4 h-4 text-indigo-400" />
              <span>SCAN ATTENDEE HAND BAND QR (BAND ID)</span>
            </label>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40">
              Track Clearance Check
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                placeholder="Scan Hand Band QR (e.g. WB-1001) or Agent ID..."
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:border-indigo-400 focus:outline-none uppercase font-mono font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Scan with Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-md"
            >
              VERIFY TRACK ENTRY
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 font-mono ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Verified Attendees */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg">
        <h3 className="font-bold text-white text-xs flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Confirmed Attendees for {selectedEvent?.mission_name} ({currentEventAttendance.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-mono">
                <th className="p-2.5">AGENT ID</th>
                <th className="p-2.5">HAND BAND</th>
                <th className="p-2.5">NAME</th>
                <th className="p-2.5">COLLEGE</th>
                <th className="p-2.5 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentEventAttendance.map((rec) => (
                <tr key={rec.id || `${rec.agent_id}-${rec.scanned_at}`} className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-indigo-400 font-mono font-bold">{rec.agent_id}</td>
                  <td className="p-2.5">
                    {rec.band_id ? (
                      <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-[11px]">
                        🏷️ {rec.band_id}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">N/A</span>
                    )}
                  </td>
                  <td className="p-2.5 text-white font-medium">{rec.participant_name}</td>
                  <td className="p-2.5 text-slate-300">{rec.college}</td>
                  <td className="p-2.5 text-right text-emerald-400 font-bold font-mono">✓ PRESENT</td>
                </tr>
              ))}
              {currentEventAttendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">
                    No verified attendees yet for this competition track.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CameraQRScannerModal
        isOpen={isCameraOpen}
        title={`Scan Hand Band for ${selectedEvent?.mission_name || 'Event'}`}
        subtitle="Point camera at attendee wristband QR code"
        onScan={(text) => {
          const cleanToken = extractScanToken(text);
          setAgentInput(cleanToken);
          handleEventCheckin(cleanToken);
        }}
        onClose={() => setIsCameraOpen(false)}
      />
    </div>
  );
};
