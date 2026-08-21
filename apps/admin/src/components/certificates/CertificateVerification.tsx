import React, { useState } from 'react';
import { store } from '../../../../src/services/store';

export const CertificateVerification: React.FC = () => {
  const [certNum, setCertNum] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cert = store.getCertificates().find(c => c.certificate_number === certNum.trim());
    if (cert) {
      setResult(`VALID: Issued to ${cert.participant_name} for ${cert.event_title}`);
    } else {
      setResult('INVALID: No matching certificate found.');
    }
  };

  return (
    <div className="glass-panel p-4 tech-bracket border-slate-800 font-mono text-xs space-y-3">
      <div className="text-white font-bold">VERIFY CERTIFICATE AUTHENTICITY</div>
      <form onSubmit={handleVerify} className="flex gap-2">
        <input
          placeholder="e.g. ZIN26-CERT-1001"
          value={certNum}
          onChange={(e) => setCertNum(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs uppercase"
        />
        <button type="submit" className="btn-temporal py-2 px-4 text-xs">Verify</button>
      </form>
      {result && <div className="p-2 rounded bg-slate-900 text-cyan-300">{result}</div>}
    </div>
  );
};
