import React, { useState } from 'react';
import { store } from '../../services/store';
import { AttendanceRecord, Participant } from '@packages/types/src';
import { DoorOpen, Clock, CheckCircle2, AlertTriangle, Tag, QrCode, UserCheck, Link as LinkIcon, Search } from 'lucide-react';

export const EntryCheckinPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [bandInput, setBandInput] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(
    store.getAttendance().filter(a => a.checkin_type === 'ENTRY')
  );

  const participants = store.getParticipants();
  const totalRegistered = participants.length;
  const checkedInCount = attendance.length;
  const bandsIssuedCount = participants.filter(p => !!p.band_id).length;

  const handleLookupOrDirectCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const query = searchInput.trim();
    if (!query) return;

    const participant = store.getParticipantByIdOrEmail(query) || store.getParticipantByAgentId(query);
    if (!participant) {
      setFeedback({ 
        type: 'error', 
        message: `No participant or Hand Band matching "${query}" was found in the database.` 
      });
      setSelectedParticipant(null);
      return;
    }

    setSelectedParticipant(participant);

    // If scanned string is their band_id, directly record gate entry
    if (participant.band_id && query.toUpperCase() === participant.band_id.toUpperCase()) {
      const res = store.recordEntryCheckin(participant.agent_id, 'Main Gate Terminal');
      if (res.success) {
        setFeedback({ type: 'success', message: `✓ ${res.message}` });
        setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
        setSearchInput('');
      } else {
        setFeedback({ type: 'warning', message: res.message });
      }
    } else {
      setBandInput(participant.band_id || '');
    }
  };

  const handleAssignBandAndCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipant) return;
    setFeedback(null);

    const cleanBandId = bandInput.trim().toUpperCase();
    if (!cleanBandId) {
      setFeedback({ type: 'error', message: 'Please enter or scan a valid Hand Band QR ID.' });
      return;
    }

    const res = store.recordEntryCheckin(
      selectedParticipant.agent_id,
      'Gate Band Station',
      cleanBandId
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      if (res.participant) {
        setSelectedParticipant(res.participant);
      }
      setSearchInput('');
      setBandInput('');
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  const handleDirectCheckinWithoutNewBand = () => {
    if (!selectedParticipant) return;
    setFeedback(null);

    const res = store.recordEntryCheckin(selectedParticipant.agent_id, 'Main Gate Terminal');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setAttendance(store.getAttendance().filter(a => a.checkin_type === 'ENTRY'));
      setSearchInput('');
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  const filteredAttendance = attendance.filter(rec => {
    const q = filterQuery.toLowerCase();
    return (
      rec.agent_id.toLowerCase().includes(q) ||
      rec.participant_name.toLowerCase().includes(q) ||
      (rec.band_id && rec.band_id.toLowerCase().includes(q)) ||
      rec.college.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-mono text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2 font-sans">
            <DoorOpen className="w-6 h-6 text-cyan-400" />
            CAMPUS GATE ENTRY & HAND BAND STATION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Check-in arriving participants, issue physical Hand Bands with QR, and prevent duplicate access.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2 rounded bg-[#070c1b] border border-cyan-500/30 text-center">
            <span className="text-slate-400">HAND BANDS: </span>
            <strong className="text-cyan-400 text-sm">{bandsIssuedCount}</strong>
            <span className="text-slate-500"> / {totalRegistered}</span>
          </div>
          <div className="p-2 rounded bg-[#070c1b] border border-slate-700 text-center">
            <span className="text-slate-400">CHECKED IN: </span>
            <strong className="text-emerald-400 text-sm">{checkedInCount}</strong>
          </div>
        </div>
      </div>

      {/* Main Entry Checkin Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="cyber-card p-6 sm:p-8 cyber-bracket border-cyan-500/40 space-y-6 bg-[#070c1b]/95">
            <form onSubmit={handleLookupOrDirectCheckin} className="space-y-4 font-mono text-xs">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-sm font-sans flex items-center justify-between">
                <span>1. Scan Ticket QR / Hand Band QR or Enter ID / Email</span>
                <span className="text-[10px] text-cyan-400 uppercase font-mono">FAST SCAN</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. ZIN26-A8F41C, WB-1001, or student@gce.ac.in"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#040711] border border-slate-700 text-white font-sans text-sm focus:border-cyan-400 focus:outline-none uppercase"
                />
                <button type="submit" className="btn-cyber-primary py-3 px-8 text-xs font-bold">
                  <span>VERIFY</span>
                </button>
              </div>
            </form>

            {/* Hand Band Assignment Box */}
            {selectedParticipant && (
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    2. Hand Band QR Assignment
                  </h3>
                  {selectedParticipant.band_id ? (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[11px] font-mono font-bold">
                      BAND: {selectedParticipant.band_id}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-300 text-[11px] font-mono">
                      NO BAND LINKED
                    </span>
                  )}
                </div>

                <form onSubmit={handleAssignBandAndCheckin} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Scan Physical Band QR ID (e.g. WB-1001)..."
                      value={bandInput}
                      onChange={(e) => setBandInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-[#040711] border border-cyan-500/50 text-cyan-300 font-mono text-xs focus:border-cyan-400 focus:outline-none uppercase font-bold"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors"
                    >
                      {selectedParticipant.band_id ? 'UPDATE BAND & CHECK IN' : 'ISSUE BAND & CHECK IN'}
                    </button>
                  </div>
                </form>

                {selectedParticipant.band_id && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleDirectCheckinWithoutNewBand}
                      className="text-xs text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Confirm Gate Entry with existing Band ({selectedParticipant.band_id})
                    </button>
                  </div>
                )}
              </div>
            )}

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
        </div>

        {/* Selected Participant Profile */}
        <div className="lg:col-span-5">
          {selectedParticipant ? (
            <div className="cyber-card p-6 cyber-bracket border-cyan-500/30 space-y-4 bg-[#070c1b]/95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300 font-sans">PARTICIPANT PROFILE</span>
                </div>
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedParticipant.agent_id}</span>
              </div>

              <div>
                <h2 className="text-base font-bold text-white font-sans">{selectedParticipant.name}</h2>
                <p className="text-xs text-slate-400">{selectedParticipant.college}</p>
                <p className="text-[11px] text-slate-500">{selectedParticipant.department} &bull; Year {selectedParticipant.year}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#040711] border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">HAND BAND ID</span>
                  <span className={`font-bold ${selectedParticipant.band_id ? 'text-cyan-300' : 'text-slate-500'}`}>
                    {selectedParticipant.band_id || 'NOT ISSUED'}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[#040711] border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">FOOD STATUS</span>
                  <span className={`font-bold ${selectedParticipant.food_collected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedParticipant.food_collected ? 'CLAIMED' : 'READY'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase mb-1">
                  Registered Tracks ({selectedParticipant.registered_events.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedParticipant.registered_events.map(ev => (
                    <span key={ev} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-mono">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="cyber-card p-8 cyber-bracket border-slate-800 text-center text-slate-500 space-y-2 bg-[#070c1b]/60">
              <Tag className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Scan a participant pass or Hand Band QR to view verified details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Arrived Attendees Table */}
      <div className="cyber-card p-6 cyber-bracket border-slate-800 space-y-4 bg-[#070c1b]/95">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2 font-sans">
            <Clock className="w-4 h-4 text-cyan-400" />
            RECENT GATE ARRIVALS ({filteredAttendance.length})
          </h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by Band ID, Name..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-3 py-1 bg-[#040711] border border-slate-700 text-white rounded text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 px-2">AGENT ID</th>
                <th className="pb-2 px-2">HAND BAND ID</th>
                <th className="pb-2 px-2">NAME</th>
                <th className="pb-2 px-2">COLLEGE</th>
                <th className="pb-2 px-2">CHECKIN TIME</th>
                <th className="pb-2 px-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-sans">
              {filteredAttendance.map((rec) => (
                <tr key={rec.id || `${rec.agent_id}-${rec.scanned_at}`} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-2 text-cyan-400 font-bold font-mono">{rec.agent_id}</td>
                  <td className="py-2.5 px-2">
                    {rec.band_id ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[11px]">
                        {rec.band_id}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-white font-bold">{rec.participant_name}</td>
                  <td className="py-2.5 px-2 text-slate-300">{rec.college}</td>
                  <td className="py-2.5 px-2 text-slate-400 font-mono">
                    {new Date(rec.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-2 text-right text-emerald-400 font-bold font-mono">
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

export default EntryCheckinPage;
