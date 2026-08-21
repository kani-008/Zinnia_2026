import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { store } from '../../services/store';
import { sound } from '../../services/sound';
import { Button } from '../../components/ui/Button';
import { Zap, Key, ArrowRight, AlertTriangle, UserCheck } from 'lucide-react';

export const ParticipantLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const participant = store.getParticipantByIdOrEmail(identifier.trim());
    if (participant) {
      sound.playConfirmTone();
      store.setCurrentParticipant(participant);
      navigate(`/passport?id=${participant.agent_id}`);
    } else {
      sound.playAnomalyWarning();
      setError('Participant record not found. Please verify your Agent ID / Email or register.');
    }
  };

  return (
    <div className="page-container min-h-[75vh] flex items-center justify-center py-12 font-mono text-xs">
      <div className="cyber-card p-8 cyber-bracket border-cyan-400 max-w-md w-full space-y-6 bg-[#070c1b]/95 shadow-[0_0_35px_rgba(0,240,255,0.2)]">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-cyan-950/80 border border-cyan-400 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <Zap className="w-6 h-6 fill-cyan-400" />
          </div>
          <h2 className="text-2xl font-heading font-black text-white uppercase font-sans">
            CYBER PASS LOGIN
          </h2>
          <p className="text-slate-400 text-xs font-sans">
            Participant Authentication & QR Badge Terminal
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-rose-950/80 border border-rose-500 text-rose-300 flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-slate-300 font-bold">AGENT ID OR EMAIL ADDRESS</label>
            <input
              type="text"
              placeholder="e.g. ZIN26-A8F41C or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#040711] border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none uppercase"
              required
            />
          </div>

          <Button type="submit" variant="PRIMARY" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
            <span>ACCESS DIGITAL PASS</span>
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-800 text-center text-slate-400 text-[11px] space-y-2">
          <div>Not yet registered for ZINNIA 2026?</div>
          <Link
            to="/register"
            onClick={() => sound.playKeyClick()}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline inline-block"
          >
            Register as a new Participant &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ParticipantLoginPage;
