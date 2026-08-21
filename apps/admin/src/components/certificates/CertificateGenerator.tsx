import React, { useState } from 'react';
import { store } from '../../../../src/services/store';
import { CertificateType } from '@packages/types/src';

export const CertificateGenerator: React.FC = () => {
  const [participantId, setParticipantId] = useState('');
  const [type, setType] = useState<CertificateType>('PARTICIPATION');
  const participants = store.getParticipants();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId) return;
    store.issueCertificate(participantId, undefined, type);
    alert('Certificate generated successfully.');
  };

  return (
    <form onSubmit={handleGenerate} className="glass-panel p-4 tech-bracket border-emerald-500/30 font-mono text-xs space-y-3">
      <div className="text-emerald-400 font-bold">GENERATE E-CERTIFICATE</div>
      <select
        value={participantId}
        onChange={(e) => setParticipantId(e.target.value)}
        className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
        required
      >
        <option value="">-- Select Participant --</option>
        {participants.map(p => (
          <option key={p.id} value={p.id}>{p.agent_id} - {p.name}</option>
        ))}
      </select>
      <button type="submit" className="btn-temporal py-2 px-4 text-xs">
        Generate Certificate
      </button>
    </form>
  );
};
