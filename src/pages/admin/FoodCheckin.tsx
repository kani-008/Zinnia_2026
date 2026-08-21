import React, { useState } from 'react';
import { store } from '../../services/store';
import { FoodRecord } from '@packages/types/src';
import { Utensils, CheckCircle2, AlertTriangle, Search, Clock, Shield } from 'lucide-react';

export const FoodCheckinPage: React.FC = () => {
  const [agentInput, setAgentInput] = useState('');
  const [session, setSession] = useState<'LUNCH' | 'SNACKS'>('LUNCH');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [foodRecords, setFoodRecords] = useState<FoodRecord[]>(store.getFoodRecords());

  const participants = store.getParticipants();
  const collectedCount = foodRecords.filter(f => f.collected && f.meal_session === session).length;

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

    const res = store.recordFoodDistribution(participant.agent_id, session, `Food Counter 01 (${session})`);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setFoodRecords(store.getFoodRecords());
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
            <Utensils className="w-6 h-6 text-amber-400" />
            FOOD & REFRESHMENT DISTRIBUTION
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Redeem participant meal tokens with strict duplicate prevention.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-2 rounded bg-slate-900 border border-slate-700 text-center">
            <span className="text-slate-400">MEALS SERVED ({session}): </span>
            <strong className="text-amber-400 text-sm">{collectedCount}</strong>
            <span className="text-slate-500"> / {participants.length}</span>
          </div>
        </div>
      </div>

      {/* Main Food Redemption Box */}
      <div className="glass-panel p-6 sm:p-8 tech-bracket border-amber-500/40 space-y-6">
        <div className="flex gap-2 font-mono text-xs">
          {(['LUNCH', 'SNACKS'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSession(s)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                session === s
                  ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {s} SESSION
            </button>
          ))}
        </div>

        <form onSubmit={handleRedeemFood} className="space-y-4 font-mono text-xs">
          <label className="block text-slate-300 font-bold uppercase tracking-wider text-sm">
            Scan or Enter Agent ID for {session} Token
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C"
              value={agentInput}
              onChange={(e) => setAgentInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-sans text-sm focus:border-amber-400 focus:outline-none uppercase"
            />
            <button type="submit" className="py-3 px-8 rounded bg-amber-500 text-black font-heading font-bold text-sm hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all">
              <span>REDEEM TOKEN</span>
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
      <div className="glass-panel p-6 tech-bracket border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            REDEMPTION HISTORY ({foodRecords.length})
          </h3>
          <span className="font-mono text-[10px] text-slate-400">MEAL TOKENS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 px-2">AGENT ID</th>
                <th className="pb-2 px-2">NAME</th>
                <th className="pb-2 px-2">SESSION</th>
                <th className="pb-2 px-2">TIME</th>
                <th className="pb-2 px-2">COUNTER</th>
                <th className="pb-2 px-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {foodRecords.map((f) => (
                <tr key={f.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-2 text-cyan-400 font-bold">{f.agent_id}</td>
                  <td className="py-2.5 px-2 text-white font-sans">{f.participant_name}</td>
                  <td className="py-2.5 px-2 text-amber-400 font-bold">{f.meal_session}</td>
                  <td className="py-2.5 px-2 text-slate-400">
                    {f.collected_at ? new Date(f.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </td>
                  <td className="py-2.5 px-2 text-slate-500">{f.scanned_by}</td>
                  <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">
                    ✓ REDEEMED
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
