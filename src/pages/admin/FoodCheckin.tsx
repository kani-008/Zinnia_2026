import React, { useState } from 'react';
import { store } from '../../services/store';
import { Participant } from '@packages/types/src';
import { Utensils, CheckCircle2, AlertTriangle, Search, Clock, Shield } from 'lucide-react';

export const FoodCheckinPage: React.FC = () => {
  const [agentInput, setAgentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(store.getParticipants());

  const collectedParticipants = participants.filter(p => p.food_collected);
  const totalRegistered = participants.length;

  const handleRedeemFood = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleaned = agentInput.trim();
    if (!cleaned) return;

    const participant = store.getParticipantByIdOrEmail(cleaned);
    if (!participant) {
      setFeedback({ type: 'error', message: `Participant "${cleaned}" not found in database.` });
      return;
    }

    const res = store.recordFoodDistribution(participant.agent_id, 'Food Counter 01');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setParticipants(store.getParticipants());
      setAgentInput('');
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-mono text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-amber-400" />
            FOOD & MEAL DISTRIBUTION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Redeem participant lunch tokens tracked directly on the participant record.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2 rounded bg-slate-900 border border-slate-700 text-center">
            <span className="text-slate-400">MEALS SERVED: </span>
            <strong className="text-amber-400 text-sm">{collectedParticipants.length}</strong>
            <span className="text-slate-500"> / {totalRegistered}</span>
          </div>
        </div>
      </div>

      {/* Main Food Redemption Box */}
      <div className="classified-card p-6 sm:p-8 tech-bracket border-amber-500/40 space-y-6 bg-[#070b14]/90">
        <form onSubmit={handleRedeemFood} className="space-y-4 font-mono text-xs">
          <label className="block text-slate-300 font-bold uppercase tracking-wider text-sm font-sans">
            Scan QR or Enter Agent ID / Email
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C or email"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-[#030508] border border-slate-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none uppercase"
            />
            <button type="submit" className="py-3 px-8 rounded bg-amber-500 text-black font-heading font-bold text-sm hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all font-sans">
              <span>REDEEM LUNCH</span>
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

      {/* Food Redemption Log */}
      <div className="classified-card p-6 tech-bracket border-slate-800 space-y-4 bg-[#070b14]/90">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2 font-sans">
            <Clock className="w-4 h-4 text-amber-400" />
            COLLECTED MEAL LOG ({collectedParticipants.length})
          </h3>
          <span className="font-mono text-[10px] text-slate-400">PARTICIPANT RECORDS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 px-2">AGENT ID</th>
                <th className="pb-2 px-2">NAME</th>
                <th className="pb-2 px-2">COLLEGE</th>
                <th className="pb-2 px-2">COLLECTED AT</th>
                <th className="pb-2 px-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-sans">
              {collectedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No meal tokens collected yet.
                  </td>
                </tr>
              ) : (
                collectedParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2 text-cyan-400 font-mono font-bold">{p.agent_id}</td>
                    <td className="py-2.5 px-2 text-white font-bold">{p.name}</td>
                    <td className="py-2.5 px-2 text-slate-300 truncate max-w-xs">{p.college}</td>
                    <td className="py-2.5 px-2 text-slate-400 font-mono">
                      {p.food_collected_at ? new Date(p.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 font-bold font-mono">
                      ✓ REDEEMED
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

export default FoodCheckinPage;
