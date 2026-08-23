import React, { useState } from 'react';
import { store } from '../../services/store';
import { QrCode, Search, CheckCircle2, AlertTriangle, Tag, Utensils, Zap } from 'lucide-react';

export const QRScannerPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;

    const participant = store.getParticipantByIdOrEmail(token);
    if (participant) {
      const attendance = store.getAttendanceByParticipant(participant.agent_id);
      const isCheckedIn = attendance.some(a => a.checkin_type === 'ENTRY');
      setResult({
        found: true,
        participant,
        isCheckedIn,
        attendance
      });
    } else {
      setResult({
        found: false,
        message: `No participant matching Hand Band QR / Agent ID "${token}" found in registry.`
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white font-sans flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          Universal QR & Hand Band Scanner
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Scan physical Hand Band QR, Digital Ticket QR, or enter Agent ID / Email.
        </p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg space-y-4 shadow-lg">
        <form onSubmit={handleLookup} className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">
            Scan Hand Band QR or Enter Token / ID / Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                placeholder="Scan Hand Band QR (e.g. WB-1001) or ID..."
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 text-white rounded text-xs focus:border-indigo-400 focus:outline-none uppercase font-mono"
              />
            </div>
            <button 
              type="submit" 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded cursor-pointer transition-colors"
            >
              VERIFY
            </button>
          </div>
        </form>

        {result && (
          <div className="pt-4 border-t border-slate-800">
            {result.found ? (
              <div className="p-5 bg-slate-950 border border-emerald-500/50 rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CREDENTIAL VALIDATED</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-400">{result.participant.agent_id}</span>
                </div>

                <div>
                  <div className="text-white font-bold text-base font-sans">{result.participant.name}</div>
                  <div className="text-slate-300">{result.participant.college}</div>
                  <div className="text-slate-400 text-[11px]">{result.participant.department} (Year {result.participant.year})</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">HAND BAND ID</span>
                    <span className={`font-bold ${result.participant.band_id ? 'text-indigo-300' : 'text-slate-500'}`}>
                      {result.participant.band_id ? `🏷️ ${result.participant.band_id}` : 'UNASSIGNED'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">GATE STATUS</span>
                    <span className={`font-bold ${result.isCheckedIn ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.isCheckedIn ? '✓ CHECKED IN' : 'NOT CHECKED IN'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">FOOD TOKEN</span>
                    <span className={`font-bold ${result.participant.food_collected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {result.participant.food_collected ? 'CLAIMED' : 'READY'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase">REGISTERED TRACKS</span>
                    <span className="font-bold text-indigo-300">
                      {result.participant.registered_events.length} Tracks
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-lg text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{result.message}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
