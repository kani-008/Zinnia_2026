import React, { useState } from 'react';
import { store } from '../../services/store';
import { certificateService } from '../../services/certificateService';
import { GeneratedCertificate, CertificateType } from '@packages/types/src';
import { 
  Award, 
  CheckCircle2, 
  Search, 
  Printer, 
  Download, 
  Shield, 
  Trophy, 
  Users, 
  Zap, 
  Sliders, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const CertificateAdminPage: React.FC = () => {
  const allEvents = store.getEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(allEvents[0]?.id || '');
  const [previewCert, setPreviewCert] = useState<GeneratedCertificate | null>(null);
  const [activeTab, setActiveTab] = useState<'ISSUANCE' | 'TEMPLATES'>('ISSUANCE');

  const selectedEvent = allEvents.find(e => e.id === selectedEventId);
  const registrations = store.getRegistrationsForEvent(selectedEventId);
  const attendance = store.getAttendance().filter(a => a.event_id === selectedEventId && a.checkin_type === 'EVENT');
  const allParticipants = store.getParticipants();
  const templates = certificateService.getTemplates();

  // Generated certificates for this event (computed dynamically based on attendance and prize position)
  const generatedCerts = selectedEventId ? certificateService.generateCertificatesForEvent(selectedEventId) : [];

  const handleToggleFinalize = () => {
    if (!selectedEvent) return;
    const nextState = !selectedEvent.results_finalized;
    store.finalizeEventResults(selectedEvent.id, nextState);
  };

  const handleAssignPosition = (targetId: string, position: 1 | 2 | 3 | null, isTeam = false) => {
    store.assignPrizePosition(selectedEventId, targetId, position, isTeam);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-mono text-xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" />
            DYNAMIC CERTIFICATE & PRIZE COMMAND
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Certificates are synthesized dynamically based on confirmed event attendance and admin-awarded prize positions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ISSUANCE')}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              activeTab === 'ISSUANCE'
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            RESULTS & CERTIFICATES
          </button>
          <button
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-3 py-1.5 rounded font-bold transition-all ${
              activeTab === 'TEMPLATES'
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
          >
            CERTIFICATE TEMPLATES
          </button>
        </div>
      </div>

      {activeTab === 'ISSUANCE' ? (
        <div className="space-y-6">
          {/* Mission Selector & Finalization Banner */}
          <div className="classified-card p-6 tech-bracket border-slate-800 space-y-4 bg-[#070b14]/90">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-[260px]">
                <label className="block text-[10px] text-slate-400 font-bold uppercase">
                  SELECT OPERATIONAL MISSION
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded bg-[#030508] border border-slate-700 text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                >
                  {allEvents.map(evt => (
                    <option key={evt.id} value={evt.id}>
                      [{evt.event_type}] {evt.code}: {evt.mission_name} ({evt.title})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvent && (
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded bg-[#030508] border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 uppercase">ATTENDED / REGISTERED</span>
                    <div className="text-white font-bold">{attendance.length} / {registrations.length}</div>
                  </div>

                  <button
                    onClick={handleToggleFinalize}
                    className={`py-2.5 px-5 rounded font-bold flex items-center gap-2 transition-all ${
                      selectedEvent.results_finalized
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-900'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/50 hover:bg-amber-900'
                    }`}
                  >
                    {selectedEvent.results_finalized ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>RESULTS FINALIZED (CLICK TO UNLOCK)</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span>FINALIZE EVENT RESULTS</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {!selectedEvent?.results_finalized && (
              <div className="p-3 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Certificates will only become available to participants after you click <strong>Finalize Event Results</strong>. Assign 1st, 2nd, and 3rd prizes below before finalizing.
                </span>
              </div>
            )}
          </div>

          {/* Registrations & Prize Decision Table */}
          <div className="classified-card p-6 tech-bracket border-slate-800 space-y-4 bg-[#070b14]/90 overflow-x-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2 font-sans">
                <Trophy className="w-4 h-4 text-amber-400" />
                PARTICIPANT ROSTER & PRIZE ASSIGNMENT
              </h3>
              <span className="text-[10px] text-slate-500">ATTENDANCE VERIFIED ONLY</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 px-2">AGENT</th>
                  <th className="pb-2 px-2">COLLEGE</th>
                  <th className="pb-2 px-2">TEAM (IF APPLICABLE)</th>
                  <th className="pb-2 px-2">ATTENDANCE</th>
                  <th className="pb-2 px-2">PRIZE POSITION</th>
                  <th className="pb-2 px-2 text-right">CERTIFICATE PREVIEW</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-sans">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 font-mono">
                      No participants registered for this event yet.
                    </td>
                  </tr>
                ) : (
                  registrations.map(reg => {
                    const participant = allParticipants.find(p => p.id === reg.participant_id);
                    const hasAttended = attendance.some(a => a.participant_id === reg.participant_id);
                    if (!participant) return null;

                    return (
                      <tr key={reg.id} className="hover:bg-slate-900/40">
                        <td className="py-3 px-2">
                          <div className="text-white font-bold">{participant.name}</div>
                          <div className="text-cyan-400 font-mono text-[11px]">{participant.agent_id}</div>
                        </td>
                        <td className="py-3 px-2 text-slate-300 truncate max-w-xs">{participant.college}</td>
                        <td className="py-3 px-2 font-mono text-[11px] text-violet-400">
                          {reg.team_name || 'Individual'}
                        </td>
                        <td className="py-3 px-2">
                          {hasAttended ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                              ✓ ATTENDED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/30">
                              ABSENT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-mono">
                          <div className="flex gap-1.5">
                            {[
                              { pos: 1, label: '1ST PRIZE', color: 'bg-amber-500 text-black' },
                              { pos: 2, label: '2ND PRIZE', color: 'bg-slate-300 text-black' },
                              { pos: 3, label: '3RD PRIZE', color: 'bg-amber-700 text-white' }
                            ].map(btn => (
                              <button
                                key={btn.pos}
                                type="button"
                                onClick={() => handleAssignPosition(reg.team_name ? reg.team_name : reg.participant_id, reg.position === btn.pos ? null : btn.pos as any, Boolean(reg.team_name))}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                  reg.position === btn.pos
                                    ? btn.color
                                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                                }`}
                              >
                                {btn.pos}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {hasAttended && selectedEvent?.results_finalized ? (
                            <button
                              onClick={() => {
                                const certs = certificateService.getEligibleCertificatesForParticipant(participant.id);
                                const currentCert = certs.find(c => c.event_id === selectedEventId);
                                if (currentCert) setPreviewCert(currentCert);
                              }}
                              className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold font-mono hover:bg-cyan-900"
                            >
                              VIEW CERTIFICATE
                            </button>
                          ) : (
                            <span className="text-slate-600 font-mono text-[10px]">
                              {!hasAttended ? 'Ineligible (Absent)' : 'Pending Finalization'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Generated Certificates Gallery */}
          {selectedEvent?.results_finalized && generatedCerts.length > 0 && (
            <div className="classified-card p-6 tech-bracket border-emerald-500/40 space-y-4 bg-[#070b14]/90">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-heading font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  DYNAMICALLY GENERATED CERTIFICATES ({generatedCerts.length})
                </h3>
                <button
                  onClick={handlePrint}
                  className="btn-temporal py-1 px-3 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>BATCH PRINT CERTIFICATES</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedCerts.map((cert) => (
                  <div
                    key={cert.certificate_number}
                    onClick={() => setPreviewCert(cert)}
                    className="p-3.5 rounded bg-[#030508] border border-slate-800 hover:border-cyan-400 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex justify-between text-[10px]">
                      <span className="text-cyan-400 font-bold">{cert.certificate_number}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        cert.type === 'WINNER_1ST' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                        cert.type === 'WINNER_2ND' ? 'bg-slate-800 text-slate-300 border border-slate-600' :
                        cert.type === 'WINNER_3RD' ? 'bg-amber-950 text-amber-400 border border-amber-600' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {cert.type}
                      </span>
                    </div>
                    <div className="text-white font-bold text-sm font-sans">{cert.participant_name}</div>
                    <div className="text-slate-400 text-[11px] font-sans truncate">{cert.college}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Certificate Templates Configurator */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(Object.keys(templates) as CertificateType[]).map((key) => {
            const tmpl = templates[key];
            return (
              <div key={key} className="classified-card p-6 tech-bracket border-slate-800 space-y-4 bg-[#070b14]/90">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-cyan-400">{key}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ backgroundColor: `${tmpl.primary_color}20`, color: tmpl.primary_color, borderColor: tmpl.primary_color }}>
                    {tmpl.badge_label}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500">HEADING</div>
                  <div className="text-white font-heading font-bold text-sm font-sans">{tmpl.title}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500">DECLASSIFICATION SUBTEXT</div>
                  <p className="text-slate-300 text-xs font-sans leading-relaxed">{tmpl.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px]">
                  <div>
                    <div className="text-slate-500">SIGNATORY 1</div>
                    <div className="text-slate-300 font-bold">{tmpl.signatory_1.name}</div>
                    <div className="text-slate-500">{tmpl.signatory_1.title}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">SIGNATORY 2</div>
                    <div className="text-slate-300 font-bold">{tmpl.signatory_2.name}</div>
                    <div className="text-slate-500">{tmpl.signatory_2.title}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="classified-card max-w-2xl w-full p-8 tech-bracket border-cyan-400 shadow-2xl space-y-6 bg-[#070b14] relative">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold tracking-widest">
                  CHRONOS OFFICIAL SYMPOSIUM E-CERTIFICATE
                </span>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  SERIAL: {previewCert.certificate_number}
                </div>
              </div>
              <button
                onClick={() => setPreviewCert(null)}
                className="px-2.5 py-1 rounded bg-slate-900 text-slate-400 hover:text-white"
              >
                CLOSE
              </button>
            </div>

            {/* Certificate Canvas Mock */}
            <div className="p-8 rounded-lg border-2 border-cyan-500/50 bg-[#030508] text-center space-y-4 relative overflow-hidden shadow-inner">
              <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase">
                GOVERNMENT COLLEGE OF ENGINEERING, SALEM &bull; CSE SYMPOSIUM 2026
              </div>

              <h2 className="text-2xl font-heading font-black text-white uppercase font-sans">
                {templates[previewCert.type]?.title || 'CERTIFICATE OF EXCELLENCE'}
              </h2>

              <p className="text-slate-400 font-sans text-xs max-w-lg mx-auto">
                {templates[previewCert.type]?.subtitle}
              </p>

              <div className="py-2">
                <div className="text-2xl font-heading font-black text-cyan-300 uppercase font-sans">
                  {previewCert.participant_name}
                </div>
                <div className="text-slate-300 font-sans text-xs mt-1">
                  Agent ID: <strong className="text-white font-mono">{previewCert.agent_id}</strong> &bull; {previewCert.college}
                </div>
              </div>

              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 max-w-md mx-auto space-y-1">
                <div className="text-[10px] text-slate-500 uppercase">MISSION ACCOMPLISHED</div>
                <div className="text-white font-bold font-sans text-sm">{previewCert.event_name}</div>
                <div className="text-cyan-400 text-xs font-mono">
                  [{previewCert.event_type}] &bull; {previewCert.position ? `${previewCert.position === 1 ? '1ST PRIZE' : previewCert.position === 2 ? '2ND PRIZE' : '3RD PRIZE'}` : 'PARTICIPANT'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-900 items-center text-[10px]">
                <div className="text-left">
                  <div className="font-bold text-white">Dr. A. Rajesh</div>
                  <div className="text-slate-500">Convener & HOD</div>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-1 rounded">
                    <QRCodeSVG value={previewCert.qr_verification_token} size={48} />
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-white">Dr. V. Sundar</div>
                  <div className="text-slate-500">Principal</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="text-[10px] text-emerald-400 font-mono">✓ CRYPTOGRAPHICALLY VERIFIED</div>
              <button onClick={handlePrint} className="btn-temporal py-2 px-5 text-xs font-bold">
                <Printer className="w-3.5 h-3.5" />
                <span>PRINT / SAVE AS PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateAdminPage;
