import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Shield, ArrowRight } from 'lucide-react';

export interface RegistrationSuccessProps {
  agentId: string;
  name: string;
}

export const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  agentId,
  name
}) => {
  return (
    <div className="glass-panel p-8 tech-bracket border-emerald-500/50 text-center space-y-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-2 font-mono">
        <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase">
          COMMISSION GRANTED // ACTIVE
        </div>
        <h2 className="text-2xl font-heading font-black text-white">
          WELCOME, AGENT
        </h2>
        <p className="text-xs text-slate-300">
          Your Temporal Agent profile for <strong>{name}</strong> has been initialized.
        </p>
      </div>

      <div className="p-4 rounded bg-slate-950 border border-slate-800 font-mono">
        <div className="text-[10px] text-slate-500 uppercase">ASSIGNED AGENT ID</div>
        <div className="text-2xl font-bold text-cyan-300 tracking-wider mt-1">{agentId}</div>
      </div>

      <Link to={`/passport?id=${agentId}`} className="btn-temporal w-full py-3">
        <span>VIEW DIGITAL PASSPORT</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
