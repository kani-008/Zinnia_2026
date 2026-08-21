import React, { useState } from 'react';
import { store } from '../../services/store';
import { certificateService } from '../../services/certificateService';
import { Award, CheckCircle2, Trophy } from 'lucide-react';

export const CertificateAdminPage: React.FC = () => {
  const events = store.getEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [winner1, setWinner1] = useState('');
  const [winner2, setWinner2] = useState('');
  const [winner3, setWinner3] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    const winners: { position: 1 | 2 | 3; participantId: string }[] = [];
    if (winner1) winners.push({ position: 1, participantId: winner1 });
    if (winner2) winners.push({ position: 2, participantId: winner2 });
    if (winner3) winners.push({ position: 3, participantId: winner3 });

    const res = certificateService.finalizeEventResults(selectedEventId, winners);
    if (res.success) {
      setFeedback(`Results finalized for ${selectedEvent?.mission_name}!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
          <Award className="w-5 h-5 text-amber-400" />
          Prize Allocation & E-Certificate Generator
        </h1>
        <p className="text-xs text-slate-400 mt-1">Allocate 1st, 2nd, and 3rd place winners and generate verified certificates.</p>
      </div>

      <form onSubmit={handleFinalize} className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Select Event</label>
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                [{ev.event_type}] {ev.code} - {ev.mission_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1">1st Place (Winner ID)</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-A8F41C"
              value={winner1}
              onChange={e => setWinner1(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-amber-400 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">2nd Place (Runner-up ID)</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-B9G52D"
              value={winner2}
              onChange={e => setWinner2(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-600 mb-1">3rd Place (ID)</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-C1H63E"
              value={winner3}
              onChange={e => setWinner3(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-amber-600 uppercase"
            />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded">
            FINALIZE RESULTS & ISSUE CERTIFICATES
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}
      </form>
    </div>
  );
};
