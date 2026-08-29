import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { store } from '../../services/store';
import { Participant, EventMission } from '@/types';
import { parseQRPayload } from '@/utils/qr';
import { QRVerificationCard, VerificationResult } from '../../components/admin/QRVerificationCard';
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
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [scannedToken, setScannedToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string>('GATE_ENTRY');
  const [isCameraActive, setIsCameraActive] = useState(true);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const allEvents = store.getEvents();

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
      // Audio context warning ignored
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
        false
      );

      scanner.render(
        (decodedText) => {
          handleScannedData(decodedText);
        },
        (error) => {
          // Frame errors ignored
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

  const verifyTokenServerOrStore = async (token: string) => {
    setScannedToken(token);
    setIsLoading(true);

    try {
      // Try Flask backend server-side verification
      const res = await fetch('/api/admin/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: token })
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationResult({
          status: data.status || 'VERIFIED',
          message: data.message || 'Participant verified',
          participant: data.participant
        });
        playTone(data.status === 'VERIFIED');
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Server verification endpoint unavailable, using local store fallback:', e);
    }

    // Fallback local store verification
    const { agent_id, isValid } = parseQRPayload(token);
    const lookupKey = isValid && agent_id ? agent_id : token;
    const p = store.getParticipantByAgentId(lookupKey) || store.getParticipantByIdOrEmail(lookupKey);

    if (!p) {
      setVerificationResult({
        status: 'INVALID',
        message: `No participant matching token '${token}' found in registry.`
      });
      playTone(false);
    } else {
      const isCheckedIn = (p as any).checked_in || store.getAttendance().some(a => a.member_id === p.id || a.member_id === p.agent_id);
      const regStatus = (p as any).registration_status || 'CONFIRMED';

      if (regStatus === 'CANCELLED') {
        setVerificationResult({
          status: 'CANCELLED',
          message: `Registration for ${p.name} has been CANCELLED.`,
          participant: p
        });
        playTone(false);
      } else if (isCheckedIn) {
        setVerificationResult({
          status: 'ALREADY_CHECKED_IN',
          message: `Participant ${p.name} is ALREADY checked in.`,
          participant: p
        });
        playTone(false);
      } else {
        setVerificationResult({
          status: 'VERIFIED',
          message: `Participant Verified: ${p.name}`,
          participant: p
        });
        playTone(true);
      }
    }
    setIsLoading(false);
  };

  const handleScannedData = (rawText: string) => {
    verifyTokenServerOrStore(rawText);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualId.trim();
    if (!query) return;
    verifyTokenServerOrStore(query);
  };

  const handleExecuteCheckIn = async () => {
    if (!scannedToken && !verificationResult?.participant) return;
    setIsLoading(true);

    const token = scannedToken || (verificationResult?.participant as any)?.agent_id || verificationResult?.participant?.id || '';
    const coordinatorId = store.getAdminRole() || 'Admin_Coordinator';

    try {
      const res = await fetch('/api/admin/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token: token,
          coordinator_id: coordinatorId,
          event_id: activeEventId,
          location: 'QR Terminal Desk'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setVerificationResult({
          status: 'ALREADY_CHECKED_IN',
          message: data.message || 'Check-In completed successfully.',
          participant: data.participant || verificationResult?.participant
        });
        playTone(true);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Backend checkin endpoint notice, updating local store:', e);
    }

    // Local Store update fallback
    const targetAgentId = (verificationResult?.participant as any)?.agent_id || verificationResult?.participant?.id || token;
    store.recordEntryCheckin(targetAgentId, coordinatorId);
    
    setVerificationResult({
      status: 'ALREADY_CHECKED_IN',
      message: `Check-In Recorded Successfully for ${verificationResult?.participant?.name}`,
      participant: {
        ...(verificationResult?.participant as any),
        checked_in: true
      }
    });
    playTone(true);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white font-sans flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-cyan-400" />
            OFFLINE QR SCANNER & CHECK-IN
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Scan participant QR digital pass or input token ID for instant server-side verification.
          </p>
        </div>

        <button
          onClick={() => setIsCameraActive(!isCameraActive)}
          className={`px-4 py-2 rounded text-xs font-mono font-bold border transition-colors ${
            isCameraActive
              ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
              : 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
          }`}
        >
          {isCameraActive ? 'STOP CAMERA' : 'START CAMERA'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: QR Camera & Manual Search */}
        <div className="space-y-4">
          {/* Scanner Container */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#070c1b]/95 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-mono text-xs text-slate-400 font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" /> CAMERA SCANNER TERMINAL
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                10 FPS HD
              </span>
            </div>

            {isCameraActive ? (
              <div id="qr-reader-container" className="overflow-hidden rounded-lg border border-cyan-500/30 bg-[#040711] min-h-[260px]" />
            ) : (
              <div className="h-[260px] rounded-lg border border-slate-800 bg-[#040711] flex flex-col items-center justify-center text-slate-500 space-y-2">
                <QrCode className="w-12 h-12 text-slate-700" />
                <span>Camera scanner is currently paused.</span>
              </div>
            )}
          </div>

          {/* Manual Token Search */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#070c1b]/95 space-y-3">
            <label className="block text-slate-400 font-mono text-xs font-bold">
              MANUAL PARTICIPANT TOKEN / ID SEARCH:
            </label>
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Enter Agent ID (e.g. AGENT-901) or Token..."
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded bg-[#040711] border border-slate-700 text-white text-xs font-sans focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-sans font-bold text-xs uppercase"
              >
                VERIFY
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Server Verification Result Card */}
        <div className="space-y-4">
          <div className="text-slate-400 font-mono text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SERVER VERIFICATION & CHECK-IN
          </div>

          {verificationResult ? (
            <QRVerificationCard
              result={verificationResult}
              onCheckIn={handleExecuteCheckIn}
              isLoading={isLoading}
              onReset={() => {
                setVerificationResult(null);
                setScannedToken('');
                setManualId('');
              }}
            />
          ) : (
            <div className="p-8 rounded-xl border border-slate-800 bg-[#070c1b]/90 text-center text-slate-500 space-y-3 font-mono">
              <QrCode className="w-12 h-12 text-slate-700 mx-auto animate-pulse" />
              <div className="text-slate-300 font-bold text-sm font-sans">AWAITING QR CODE SCAN</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Point camera scanner at participant QR code or enter participant ID manually to verify.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
