import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { store } from '../../services/store';
import { sound } from '../../services/sound';
import { QRCodeSVG } from 'qrcode.react';
import { Participant } from '@packages/types/src';
import { 
  Shield, 
  CheckCircle2, 
  Circle, 
  QrCode, 
  Award, 
  Utensils, 
  DoorOpen, 
  Search, 
  Printer,
  Download,
  AlertCircle
} from 'lucide-react';
import { GlitchText } from '../../components/hero/GlitchText';

export const PassportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentIdParam = searchParams.get('id');

  const [searchId, setSearchId] = useState(agentIdParam || 'ZIN26-A8F41C');
  const [agent, setAgent] = useState<Participant | null>(null);

  useEffect(() => {
    const p = store.getParticipantByIdOrEmail(searchId);
    setAgent(p || null);
  }, [searchId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playKeyClick();
    const p = store.getParticipantByIdOrEmail(searchId);
    setAgent(p || null);
  };

  const handlePrint = () => {
    sound.playConfirmTone();
    window.print();
  };

  const attendance = agent ? store.getAttendanceByParticipant(agent.id) : [];
  const food = agent ? store.getFoodRecordsByParticipant(agent.id) : [];
  const certificates = agent ? store.getCertificatesByParticipant(agent.id) : [];
  const allMissions = store.getEvents();

  const isGateCheckedIn = attendance.some(a => a.checkin_type === 'ENTRY');
  const isFoodClaimed = food.some(f => f.collected);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-mono text-xs">
      {/* Search / Lookup Bar */}
      <div className="glass-panel p-4 tech-bracket border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-heading font-bold text-xs">AGENT TERMINAL // PASSPORT LOOKUP</span>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Agent ID or Email..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white text-xs uppercase"
          />
          <button type="submit" className="btn-temporal py-1.5 px-4 text-xs font-bold">
            <Search className="w-3.5 h-3.5" />
            <span>LOOKUP</span>
          </button>
        </form>
      </div>

      {!agent ? (
        <div className="glass-panel p-8 tech-bracket border-rose-500/40 text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="text-white font-heading font-bold text-sm">NO AGENT PROFILE FOUND</div>
          <p className="text-slate-400 max-w-sm mx-auto text-xs font-sans">
            Could not find an active agent record for <strong>{searchId}</strong>. Please verify your ID or complete registration.
          </p>
          <Link to="/register" className="btn-temporal py-2.5 px-6 text-xs inline-flex">
            <span>REGISTER AS NEW AGENT</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Printable Holographic Passport Card */}
          <div className="glass-panel p-6 sm:p-8 tech-bracket border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.15)] space-y-6 relative overflow-hidden bg-slate-950/90">
            {/* Top Passport Header */}
            <div className="flex flex-wrap justify-between items-start border-b border-slate-800 pb-4 gap-4">
              <div className="space-y-1">
                <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
                  CHRONOS TEMPORAL COMMISSION &bull; DECLASSIFIED PASS
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase font-sans">
                  {agent.name}
                </h1>
                <div className="text-slate-400 text-xs font-sans">
                  {agent.college} &bull; {agent.department} (Year {agent.year})
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/40 text-[10px]">
                  &bull; {agent.status}
                </span>
                <div className="text-violet-400 font-bold text-[11px] mt-1">
                  CLEARANCE: {agent.clearance_level}
                </div>
              </div>
            </div>

            {/* Middle Grid: QR + Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* QR Code */}
              <div className="sm:col-span-4 flex flex-col items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <div className="bg-white p-3 rounded-md shadow-inner">
                  <QRCodeSVG value={agent.qr_token} size={150} level="H" includeMargin={false} />
                </div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider">
                  CRYPTOGRAPHIC ID TOKEN
                </div>
              </div>

              {/* Agent Identifiers */}
              <div className="sm:col-span-8 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase">OFFICIAL AGENT ID</span>
                    <div className="text-cyan-300 font-bold text-base mt-0.5">{agent.agent_id}</div>
                  </div>
                  <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase">REGISTERED PHONE</span>
                    <div className="text-slate-300 font-bold text-base mt-0.5">{agent.phone}</div>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">COMMISSIONED MISSIONS</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {agent.registered_events.map(evId => {
                      const m = allMissions.find(x => x.id === evId);
                      return (
                        <span key={evId} className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                          {m ? m.mission_name : evId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Checkpoint Station Verification Matrix */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                SYMPOSIUM CHECKPOINTS & STAMP VERIFICATION
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-white font-bold">ENLISTED</div>
                    <div className="text-slate-500 text-[9px]">CONFIRMED</div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  {isGateCheckedIn ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <div className={isGateCheckedIn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      GATE ENTRY
                    </div>
                    <div className="text-slate-500 text-[9px]">
                      {isGateCheckedIn ? 'CHECKED IN' : 'PENDING'}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  {isFoodClaimed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <div className={isFoodClaimed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      FOOD TOKEN
                    </div>
                    <div className="text-slate-500 text-[9px]">
                      {isFoodClaimed ? 'CLAIMED' : 'UNCLAIMED'}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                  {certificates.length > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                  <div>
                    <div className={certificates.length > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      CERTIFICATE
                    </div>
                    <div className="text-slate-500 text-[9px]">
                      {certificates.length > 0 ? `${certificates.length} ISSUED` : 'PENDING'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Download Action Controls */}
            <div className="border-t border-slate-800 pt-4 flex flex-wrap justify-between items-center gap-4">
              <div className="text-[10px] text-slate-500">
                PRESENT THIS PASSPORT QR CODE AT THE REGISTRATION & FOOD DESKS
              </div>
              <button
                onClick={handlePrint}
                className="btn-temporal py-2 px-4 text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>PRINT / SAVE PASSPORT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassportPage;
