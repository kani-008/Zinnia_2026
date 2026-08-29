import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord, Team, TeamMember, EventMission } from '@/types';
import { CameraQRScannerModal } from '../../components/CameraQRScannerModal';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Tag, 
  QrCode, 
  Camera, 
  ShieldCheck,
  Search,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const EventCheckinPage: React.FC = () => {
  const [allEvents, setAllEvents] = useState<EventMission[]>(store.getEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>(allEvents[0]?.id || '');
  const [tokenInput, setTokenInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    member?: TeamMember;
    team?: Team;
    registered_events?: any[];
    time?: string;
  } | null>(null);

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'EVENT')
  );
  const [filterQuery, setFilterQuery] = useState('');

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
  }, [selectedEventId]);

  const selectedEvent = allEvents.find(e => e.id === selectedEventId);
  const currentEventAttendance = attendance.filter(a => a.event_id === selectedEventId);

  const handleEventCheckin = async (customToken?: string) => {
    const raw = (customToken || tokenInput).trim();
    if (!raw) return;

    if (!selectedEventId) {
      setFeedback({
        type: 'error',
        message: 'Please select an active Competition Event Track first.'
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    const res = await store.checkinEventApi({
      passport_token: raw,
      id: raw,
      event_id: selectedEventId,
      scanned_by: `Coordinator - ${selectedEvent?.code || 'Event Desk'}`,
      location: selectedEvent?.venue || 'Event Venue'
    });

    setIsProcessing(false);
    setTokenInput('');

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.reason,
        member: res.member,
        team: res.team,
        registered_events: res.registered_events,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.reason,
        member: res.member,
        team: res.team,
        registered_events: res.registered_events,
        time: new Date().toLocaleTimeString()
      });
    }
  };

  const filteredAttendance = currentEventAttendance.filter(a => {
    const q = filterQuery.toLowerCase();
    return a.participant_name.toLowerCase().includes(q) ||
           a.college.toLowerCase().includes(q) ||
           (a.member_id && a.member_id.toLowerCase().includes(q));
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Zap className="w-5 h-5 text-indigo-400" />
            Event Track Check-in Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan attendee Digital Passport QR to verify team event registration & record 1-time track entry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">TRACK ATTENDEES: </span>
            <strong className="text-indigo-400 font-bold">{currentEventAttendance.length}</strong>
          </div>
          <button
            onClick={() => store.syncFromSupabase()}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer"
            title="Sync Database"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. Active Event Selector (Set Once per Shift) */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 shadow-lg">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-indigo-300 uppercase font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>ACTIVE EVENT TRACK (SET ONCE PER ROOM/SHIFT)</span>
          </label>
          {selectedEvent && (
            <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/40 rounded">
              Venue: {selectedEvent.venue} &bull; {selectedEvent.schedule_time}
            </span>
          )}
        </div>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setFeedback(null);
          }}
          className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:border-indigo-400 focus:outline-none font-mono font-bold"
        >
          {allEvents.map((evt) => (
            <option key={evt.id} value={evt.id}>
              [{evt.event_type}] {evt.code} — {evt.mission_name} ({evt.venue})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Scanner Form */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
        <form onSubmit={(e) => { e.preventDefault(); handleEventCheckin(); }} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-300 flex items-center gap-1.5 uppercase font-mono">
              <QrCode className="w-4 h-4 text-indigo-400" />
              <span>SCAN ATTENDEE PASSPORT QR OR ENTER ID</span>
            </label>
            <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/40 font-mono">
              1 Scan per Event Lock
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                disabled={isProcessing}
                placeholder="Scan QR token or type Member ID (e.g. ZIN26-XXXXXX-M1)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:border-indigo-400 focus:outline-none font-mono font-bold"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
              title="Scan with Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>

            <button 
              type="submit" 
              disabled={isProcessing || !tokenInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md font-mono"
            >
              {isProcessing ? 'VALIDATING...' : 'ADMIT TO TRACK'}
            </button>
          </div>
        </form>

        {/* 3. Big PASS / FAIL Banner with Full Registered Events List */}
        {feedback && (
          <div className="pt-2 animate-fadeIn">
            {feedback.type === 'success' ? (
              <div className="p-5 bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black font-mono text-base">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>✓ PASS — ADMITTED TO {selectedEvent?.mission_name.toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300">{feedback.time}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-emerald-800/50">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ATTENDEE</span>
                    <strong className="text-white text-sm">{feedback.member?.name}</strong>
                    <span className="block text-[11px] text-cyan-300">{feedback.member?.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TEAM & COLLEGE</span>
                    <strong className="text-emerald-200">{feedback.team?.team_name} &bull; {feedback.team?.college}</strong>
                  </div>
                </div>

                {/* Coordinator Visual Confirmation: All Registered Events */}
                {feedback.team && (
                  <div className="pt-2 border-t border-emerald-800/40">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block mb-1">
                      TEAM'S FULL REGISTERED TRACKS (VISUAL CONFIRMATION):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {feedback.team.registered_events.map(evId => {
                        const isCurrent = evId === selectedEventId;
                        const ev = store.getEventById(evId);
                        return (
                          <span
                            key={evId}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                              isCurrent
                                ? 'bg-emerald-500 text-black shadow-md'
                                : 'bg-slate-900 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isCurrent && '🎯 '}{ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-rose-950/90 border-2 border-rose-500 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-black font-mono text-base">
                    <AlertTriangle className="w-6 h-6" />
                    <span>✗ FAIL — TRACK ENTRY REJECTED</span>
                  </div>
                  <span className="text-xs font-mono text-rose-300">{feedback.time}</span>
                </div>
                
                <p className="text-rose-200 text-xs font-mono font-bold">
                  {feedback.message}
                </p>

                {feedback.team && (
                  <div className="pt-2 border-t border-rose-800/40">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-1">
                      Team "{feedback.team.team_name}" is only registered for:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {feedback.team.registered_events.length === 0 ? (
                        <span className="text-xs font-mono text-rose-300">No events registered</span>
                      ) : (
                        feedback.team.registered_events.map(evId => {
                          const ev = store.getEventById(evId);
                          return (
                            <span key={evId} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-xs font-mono border border-slate-700">
                              {ev?.code ? `[${ev.code}] ` : ''}{ev?.mission_name || evId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Live Checked-in Attendees Table for this Event */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Admitted to {selectedEvent?.mission_name} ({filteredAttendance.length})
          </h2>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter admitted attendee..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">TIME</th>
                <th className="pb-2">PARTICIPANT</th>
                <th className="pb-2">COLLEGE</th>
                <th className="pb-2">LOCATION</th>
                <th className="pb-2">SCANNED BY</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No attendees verified for this event yet.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((a, idx) => (
                  <tr key={a.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-400">
                      {new Date(a.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 font-bold text-white">
                      {a.participant_name}
                      <span className="block text-[10px] text-slate-500 font-normal">{a.member_id}</span>
                    </td>
                    <td className="py-2.5 text-slate-300">{a.college}</td>
                    <td className="py-2.5 text-slate-400">{a.location}</td>
                    <td className="py-2.5 text-indigo-400">{a.scanned_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Modal */}
      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsCameraOpen(false);
          handleEventCheckin(scannedToken);
        }}
        title={`Scan for ${selectedEvent?.mission_name}`}
        subtitle="Hold attendee Digital Passport QR within camera view"
      />
    </div>
  );
};

export default EventCheckinPage;
