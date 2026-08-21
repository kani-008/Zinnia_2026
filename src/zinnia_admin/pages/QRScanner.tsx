import React, { useState } from 'react';
import { store } from '../../services/store';
import { QrCode, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

export const QRScannerPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;

    const participant = store.getParticipantByIdOrEmail(token);
    if (participant) {
      setResult({
        found: true,
        participant
      });
    } else {
      setResult({
        found: false,
        message: `No participant matching token "${token}"`
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white font-sans flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          QR & Participant Token Scanner
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manual lookup or QR token verification</p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4">
        <form onSubmit={handleLookup} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">Enter QR Token, Agent ID, or Email</label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              placeholder="e.g. ZIN26-A8F41C or QR token"
              value={tokenInput}
              onChange={e => setTokenInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none uppercase"
            />
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded">
              VERIFY
            </button>
          </div>
        </form>

        {result && (
          <div className="pt-4 border-t border-slate-800">
            {result.found ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Participant Verified</span>
                </div>
                <div className="text-white font-bold text-sm">{result.participant.name}</div>
                <div className="text-slate-300">ID: {result.participant.agent_id} &bull; {result.participant.college}</div>
                <div className="text-slate-400">{result.participant.department} (Year {result.participant.year})</div>
              </div>
            ) : (
              <div className="p-4 bg-red-950/80 border border-red-500/50 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{result.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
