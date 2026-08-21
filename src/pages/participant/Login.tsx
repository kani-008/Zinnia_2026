import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { store } from '../../services/store';
import { Shield, Key, ArrowRight, AlertTriangle, Terminal } from 'lucide-react';
import { GlitchText } from '../../components/hero/GlitchText';

export const ParticipantLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      return setError('Please enter your Agent ID (e.g. ZIN26-A8F41C) or Registered Email.');
    }

    const participant = store.getParticipantByIdOrEmail(cleanInput);
    if (!participant) {
      return setError(`No Temporal Agent record found matching "${cleanInput}". Please register or check for typos.`);
    }

    store.setCurrentParticipant(participant);
    navigate('/passport');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Key className="w-3.5 h-3.5" />
          PASSPORT VERIFICATION PORTAL
        </div>
        <h1 className="text-3xl font-heading font-black text-white">
          AGENT <GlitchText text="LOGIN" />
        </h1>
        <p className="text-slate-400 font-mono text-xs">
          Enter your unique Agent ID or registered email to pull up your Digital Symposium Passport.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-950/80 border border-red-500/60 text-red-300 text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Card */}
      <div className="glass-panel p-8 tech-bracket border-cyan-500/40 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-5 font-mono text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-2 uppercase tracking-wider">
              Agent ID or Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ZIN26-A8F41C or name@gce.ac.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans text-sm"
            />
          </div>

          <button type="submit" className="btn-temporal w-full py-3">
            <span>RETRIEVE PASSPORT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center font-mono text-xs space-y-3">
          <div className="text-slate-400">
            Haven't registered for ZINNIA 2026 yet?
          </div>
          <Link to="/register" className="text-cyan-400 hover:underline font-bold block">
            Register for Symposium Clearance &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
