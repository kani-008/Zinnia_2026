import React, { useState } from 'react';
import { store } from '../../services/store';
import { Certificate, CertificateType } from '@packages/types/src';
import { Award, CheckCircle2, Search, Plus, Download, Shield } from 'lucide-react';

export const CertificateAdminPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>(store.getCertificates());
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [certType, setCertType] = useState<CertificateType>('PARTICIPATION');
  const [feedback, setFeedback] = useState<string | null>(null);

  const participants = store.getParticipants();
  const events = store.getEvents();

  const handleIssueCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!selectedParticipantId) return;

    try {
      const newCert = store.issueCertificate(
        selectedParticipantId,
        selectedEventId || undefined,
        certType
      );
      setCertificates(store.getCertificates());
      setFeedback(`Successfully issued Certificate #${newCert.certificate_number} to ${newCert.participant_name}`);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" />
            CERTIFICATE ISSUANCE & VERIFICATION HUB
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Generate and manage cryptographic E-Certificates for participants and prize winners.
          </p>
        </div>
      </div>

      {/* Issuance Form */}
      <div className="glass-panel p-6 sm:p-8 tech-bracket border-emerald-500/30 space-y-6">
        <h3 className="font-heading font-bold text-white text-base flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          ISSUE NEW E-CERTIFICATE
        </h3>

        <form onSubmit={handleIssueCertificate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">SELECT PARTICIPANT</label>
            <select
              value={selectedParticipantId}
              onChange={(e) => setSelectedParticipantId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
            >
              <option value="">-- Choose Agent --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.agent_id} - {p.name} ({p.college})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">ASSOCIATED MISSION (OPTIONAL)</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white"
            >
              <option value="">General Symposium Participation</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.code}: {evt.mission_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">CERTIFICATE TYPE</label>
            <select
              value={certType}
              onChange={(e) => setCertType(e.target.value as CertificateType)}
              className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 text-emerald-400 font-bold"
            >
              <option value="PARTICIPATION">Certificate of Participation</option>
              <option value="WINNER_1ST">1st Prize // Temporal Champion</option>
              <option value="WINNER_2ND">2nd Prize // Runner Up</option>
              <option value="WINNER_3RD">3rd Prize // Merit Award</option>
              <option value="SPECIAL_RECOGNITION">Special Recognition Award</option>
            </select>
          </div>

          <div className="sm:col-span-3 pt-2">
            <button type="submit" className="btn-temporal py-2.5 px-6 text-xs font-bold">
              <span>GENERATE & ISSUE E-CERTIFICATE</span>
            </button>
          </div>
        </form>

        {feedback && (
          <div className="p-3 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Issued Certificates Ledger */}
      <div className="glass-panel p-6 tech-bracket border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-heading font-bold text-white text-sm">
            ISSUED CERTIFICATES ARCHIVE ({certificates.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 px-2">SERIAL NUMBER</th>
                <th className="pb-2 px-2">RECIPIENT NAME</th>
                <th className="pb-2 px-2">COLLEGE</th>
                <th className="pb-2 px-2">EVENT / RECOGNITION</th>
                <th className="pb-2 px-2">TYPE</th>
                <th className="pb-2 px-2">DATE</th>
                <th className="pb-2 px-2 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-2 text-cyan-400 font-bold">{cert.certificate_number}</td>
                  <td className="py-2.5 px-2 text-white font-sans">{cert.participant_name}</td>
                  <td className="py-2.5 px-2 text-slate-300 font-sans">{cert.college}</td>
                  <td className="py-2.5 px-2 text-slate-300 font-sans">{cert.event_title}</td>
                  <td className="py-2.5 px-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      {cert.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-400">{cert.issue_date}</td>
                  <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">
                    ✓ VERIFIED
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
