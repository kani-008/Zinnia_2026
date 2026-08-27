import React from 'react';
import { Participant } from '@packages/types/src';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, User, Building2, Calendar, Lock } from 'lucide-react';

export interface VerificationResult {
  status: 'VERIFIED' | 'ALREADY_CHECKED_IN' | 'CANCELLED' | 'INVALID';
  message: string;
  participant?: Participant | {
    id: string;
    agent_id?: string;
    name: string;
    college: string;
    department?: string;
    registered_events?: string[];
    registration_status?: string;
    checked_in?: boolean;
    checkin_time?: string;
  };
}

interface QRVerificationCardProps {
  result: VerificationResult;
  onCheckIn: () => void;
  isLoading?: boolean;
  onReset?: () => void;
}

export const QRVerificationCard: React.FC<QRVerificationCardProps> = ({
  result,
  onCheckIn,
  isLoading = false,
  onReset
}) => {
  const { status, message, participant } = result;

  if (status === 'INVALID' || !participant) {
    return (
      <div className="p-6 rounded-xl border border-rose-500/50 bg-[#12070c]/90 space-y-4 font-mono text-xs shadow-xl text-rose-200">
        <div className="flex items-center gap-3 text-rose-400">
          <ShieldAlert className="w-8 h-8 flex-shrink-0 text-rose-500 animate-pulse" />
          <div>
            <h3 className="font-heading font-black text-white text-lg font-sans">INVALID QR CODE</h3>
            <p className="text-xs text-rose-300 font-mono mt-0.5">{message}</p>
          </div>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-mono font-bold transition-all text-xs"
          >
            SCAN ANOTHER QR CODE
          </button>
        )}
      </div>
    );
  }

  if (status === 'CANCELLED') {
    return (
      <div className="p-6 rounded-xl border border-rose-500/50 bg-[#12070c]/90 space-y-4 font-mono text-xs shadow-xl text-rose-200">
        <div className="flex items-center gap-3 text-rose-400">
          <XCircle className="w-8 h-8 flex-shrink-0 text-rose-500" />
          <div>
            <h3 className="font-heading font-black text-white text-lg font-sans">REGISTRATION CANCELLED</h3>
            <p className="text-xs text-rose-300 font-mono mt-0.5">{message}</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2 font-sans text-slate-300">
          <div className="text-sm font-bold text-white">{participant.name}</div>
          <div className="text-xs text-slate-400 font-mono">ID: {participant.agent_id || participant.id}</div>
          <div className="text-xs">{participant.college}</div>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="w-full py-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold transition-all text-xs"
          >
            SCAN ANOTHER QR CODE
          </button>
        )}
      </div>
    );
  }

  if (status === 'ALREADY_CHECKED_IN') {
    return (
      <div className="p-6 rounded-xl border border-amber-500/50 bg-[#140e06]/90 space-y-4 font-mono text-xs shadow-xl text-amber-200">
        <div className="flex items-center gap-3 text-amber-400">
          <AlertTriangle className="w-8 h-8 flex-shrink-0 text-amber-400" />
          <div>
            <h3 className="font-heading font-black text-white text-lg font-sans">ALREADY CHECKED IN</h3>
            <p className="text-xs text-amber-300 font-mono mt-0.5">{message}</p>
          </div>
        </div>

        {/* Participant Details */}
        <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3 font-sans text-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-base font-bold text-white">{participant.name}</div>
              <div className="text-xs text-amber-400 font-mono">ID: {participant.agent_id || participant.id}</div>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/50">
              CHECKED-IN
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-400">College: <span className="text-white font-medium">{participant.college}</span></div>
            <div className="text-slate-400">Status: <span className="text-amber-400 font-mono">ALREADY VERIFIED</span></div>
          </div>
        </div>

        <button
          disabled
          className="w-full py-3 rounded bg-slate-900 border border-slate-800 text-slate-500 font-mono font-bold cursor-not-allowed text-xs flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4 text-slate-500" />
          CHECK IN PREVENTED (ALREADY COMPLETED)
        </button>

        {onReset && (
          <button
            onClick={onReset}
            className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs font-bold"
          >
            SCAN NEXT PARTICIPANT
          </button>
        )}
      </div>
    );
  }

  // Status is VERIFIED (Ready for Check-In)
  return (
    <div className="p-6 rounded-xl border border-emerald-500/50 bg-[#06140d]/90 space-y-5 font-mono text-xs shadow-2xl text-emerald-200">
      <div className="flex items-center gap-3 text-emerald-400">
        <ShieldCheck className="w-8 h-8 flex-shrink-0 text-emerald-400" />
        <div>
          <h3 className="font-heading font-black text-white text-xl font-sans">PARTICIPANT VERIFIED</h3>
          <p className="text-xs text-emerald-300 font-mono mt-0.5">Official Zinnia 2026 Pass Authorized</p>
        </div>
      </div>

      {/* Participant Telemetry Card */}
      <div className="p-4 rounded-lg bg-[#040906] border border-emerald-900/60 space-y-3 font-sans text-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-lg font-bold text-white">{participant.name}</div>
            <div className="text-xs text-cyan-400 font-mono font-bold">ID: {participant.agent_id || participant.id}</div>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500">
            CONFIRMED
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{participant.college} {participant.department ? `(${participant.department})` : ''}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Events: {participant.registered_events && participant.registered_events.length > 0 ? participant.registered_events.join(', ') : 'All Symposium Tracks'}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onCheckIn}
        disabled={isLoading}
        className={`w-full py-3.5 rounded-lg font-heading font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 font-sans ${
          isLoading
            ? 'bg-slate-800 text-slate-400 cursor-wait'
            : 'bg-emerald-500 hover:bg-emerald-400 text-black active:scale-[0.99]'
        }`}
      >
        <CheckCircle2 className="w-5 h-5" />
        {isLoading ? 'PROCESSING SERVER CHECK-IN...' : 'CHECK IN'}
      </button>

      {onReset && (
        <button
          onClick={onReset}
          className="w-full py-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-mono text-xs"
        >
          CLEAR / SCAN AGAIN
        </button>
      )}
    </div>
  );
};
