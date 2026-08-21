import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { store } from '../../services/store';
import { Participant, EventMission } from '@packages/types/src';
import { parseQRPayload } from '@packages/utils/src/qr';
import { 
  QrCode, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  DoorOpen, 
  Utensils, 
  Zap, 
  X, 
  Shield, 
  User, 
  Calendar 
} from 'lucide-react';

export const QRScannerPage: React.FC = () => {
  const [manualId, setManualId] = useState('');
  const [scannedParticipant, setScannedParticipant] = useState<Participant | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [activeEventId, setActiveEventId] = useState<string>('msn-sys-recovery');
  const [isCameraActive, setIsCameraActive] = useState(true);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const allEvents = store.getEvents();

  // Play auditory feedback beep
  const playTone = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 330, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + (isSuccess ? 0.15 : 0.3));
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  useEffect(() => {
    if (!isCameraActive) return;

    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          handleScannedData(decodedText);
        },
        (error) => {
          // Ignore frequent scan frame misses
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(console.warn);
      };
    } catch (err) {
      console.warn('QR camera initialization failed:', err);
    }
  }, [isCameraActive]);

  const handleScannedData = (rawText: string) => {
    const { agent_id, isValid } = parseQRPayload(rawText);
    if (!isValid || !agent_id) {
      setFeedback({ type: 'error', message: 'Invalid or unrecognizable QR code payload.' });
      playTone(false);
      return;
    }

    const p = store.getParticipantByAgentId(agent_id);
    if (!p) {
      setFeedback({ type: 'error', message: `Temporal Agent ID "${agent_id}" not found in database.` });
      playTone(false);
      return;
    }

    setScannedParticipant(p);
    setFeedback({ type: 'success', message: `Verified Agent: ${p.name} (${p.agent_id})` });
    playTone(true);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const query = manualId.trim();
    if (!query) return;

    const p = store.getParticipantByIdOrEmail(query);
    if (!p) {
      setFeedback({ type: 'error', message: `No participant matching "${query}".` });
      playTone(false);
      return;
    }

    setScannedParticipant(p);
    setFeedback({ type: 'success', message: `Participant verified: ${p.name}` });
    playTone(true);
  };

  const handleCheckinEntry = () => {
    if (!scannedParticipant) return;
    const res = store.recordEntryCheckin(scannedParticipant.agent_id, 'QR Scanner Terminal');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      playTone(true);
    } else {
      setFeedback({ type: 'warning', message: res.message });
      playTone(false);
    }
  };

  const handleFoodRedemption = () => {
    if (!scannedParticipant) return;
    const res = store.recordFoodDistribution(scannedParticipant.agent_id, 'LUNCH', 'Food Terminal');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      playTone(true);
    } else {
      setFeedback({ type: 'warning', message: res.message });
      playTone(false);
    }
  };

  const handleEventCheckin = () => {
    if (!scannedParticipant) return;
    const res = store.recordEventCheckin(scannedParticipant.agent_id, activeEventId, 'Mission Desk');
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      playTone(true);
    } else {
      setFeedback({ type: 'error', message: res.message });
      playTone(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-cyan-400" />
            CHRONOS UNIFIED QR SCANNER
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time camera feed & manual participant search station.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
          >
            {isCameraActive ? 'PAUSE CAMERA' : 'ENABLE CAMERA'}
          </button>
        </div>
      </div>

      {/* Main Scanner & Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Camera Scanner + Manual ID Fallback */}
        <div className="lg:col-span-6 space-y-6">
          {/* Camera Viewport */}
          <div className="glass-panel p-4 tech-bracket border-cyan-500/40 text-center space-y-3">
            <div className="text-xs font-mono text-cyan-400 font-bold flex items-center justify-between px-2">
              <span>CAMERA FEED // ACTIVE</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div
              id="qr-reader-container"
              className="w-full bg-black rounded-lg overflow-hidden border border-slate-800 min-h-[260px] flex items-center justify-center text-slate-500 font-mono text-xs"
            >
              {!isCameraActive && <div>Camera currently paused.</div>}
            </div>
          </div>

          {/* Manual ID Fallback (Crucial requirement from prompt) */}
          <div className="glass-panel p-5 tech-bracket border-slate-800 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              MANUAL PARTICIPANT ID FALLBACK
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              If camera scanning fails, enter the 6-character Agent ID or participant email.
            </p>

            <form onSubmit={handleManualSearch} className="flex gap-2 font-mono text-xs">
              <input
                type="text"
                placeholder="e.g. ZIN26-A8F41C"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-slate-950 border border-slate-700 text-white font-sans text-xs focus:border-cyan-400 focus:outline-none uppercase"
              />
              <button type="submit" className="btn-temporal py-2 px-4 text-xs">
                <span>LOOKUP</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Verified Participant Card & Fast Action Triggers */}
        <div className="lg:col-span-6 space-y-6">
          {feedback && (
            <div className={`p-4 rounded-xl border font-mono text-xs flex items-start gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : feedback.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div className="leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {scannedParticipant ? (
            <div className="glass-panel p-6 tech-bracket border-cyan-400 space-y-6 shadow-2xl">
              {/* Participant Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                    PARTICIPANT VERIFIED // {scannedParticipant.clearance_level}
                  </div>
                  <h3 className="text-xl font-heading font-black text-white">
                    {scannedParticipant.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-300 mt-0.5">
                    {scannedParticipant.college}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/40">
                  {scannedParticipant.status}
                </span>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">AGENT ID</div>
                  <div className="text-cyan-300 font-bold text-sm">{scannedParticipant.agent_id}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">CONTACT</div>
                  <div className="text-slate-300">{scannedParticipant.phone}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-slate-500 uppercase">REGISTERED MISSIONS</div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {scannedParticipant.registered_events.map((eId) => {
                      const evt = allEvents.find(e => e.id === eId);
                      return (
                        <span key={eId} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                          {evt ? evt.mission_name : eId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Station Action Triggers */}
              <div className="space-y-3 pt-4 border-t border-slate-800 font-mono text-xs">
                <div className="text-slate-400 uppercase text-[10px] font-bold">
                  ONE-TAP STATION ACTIONS:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Action 1: Gate Entry */}
                  <button
                    onClick={handleCheckinEntry}
                    className="py-2.5 px-3 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 font-bold flex items-center justify-center gap-2"
                  >
                    <DoorOpen className="w-4 h-4" />
                    <span>MARK GATE ENTRY</span>
                  </button>

                  {/* Action 2: Food Token */}
                  <button
                    onClick={handleFoodRedemption}
                    className="py-2.5 px-3 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 hover:bg-amber-900 font-bold flex items-center justify-center gap-2"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>MARK LUNCH TOKEN</span>
                  </button>
                </div>

                {/* Action 3: Event Check-in with selector */}
                <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[10px] text-violet-400 font-bold uppercase">
                    MISSION CHECK-IN DESK:
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={activeEventId}
                      onChange={(e) => setActiveEventId(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-2 py-1.5 rounded"
                    >
                      {allEvents.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.code} - {evt.mission_name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleEventCheckin}
                      className="px-3 py-1.5 rounded bg-violet-600 text-white font-bold hover:bg-violet-500"
                    >
                      VERIFY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 text-center font-mono text-xs text-slate-500 space-y-3 border-slate-800">
              <QrCode className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <div className="text-slate-400 font-bold">READY FOR SCANNING</div>
              <p>Point participant QR code at the camera above or use Manual ID lookup on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
