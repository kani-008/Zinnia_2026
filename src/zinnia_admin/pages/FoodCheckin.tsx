import React, { useState } from 'react';
import { store } from '../../services/store';
import { Utensils, CheckCircle2, AlertTriangle } from 'lucide-react';

export const FoodCheckinPage: React.FC = () => {
  const [agentInput, setAgentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  const participants = store.getParticipants();
  const totalRegistered = participants.length;
  const claimedCount = participants.filter(p => p.food_collected).length;

  const handleFoodCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleaned = agentInput.trim();
    if (!cleaned) return;

    const participant = store.getParticipantByIdOrEmail(cleaned);
    if (!participant) {
      setFeedback({ type: 'error', message: `Participant "${cleaned}" not found.` });
      return;
    }

    const res = store.recordFoodCheckin(participant.agent_id, 'Dining Counter A');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
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
            <Utensils className="w-5 h-5 text-amber-400" />
            Food & Refreshment Token Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">Verify and claim attendee food tokens.</p>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
          <span className="text-slate-400">MEALS CLAIMED: </span>
          <strong className="text-amber-400 font-bold">{claimedCount}</strong>
          <span className="text-slate-500"> / {totalRegistered}</span>
        </div>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
        <form onSubmit={handleFoodCheckin} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">Scan QR or Enter Participant ID / Email</label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-amber-400 focus:outline-none uppercase"
            />
            <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded">
              CLAIM FOOD TOKEN
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
    </div>
  );
};
