import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { extractScanToken } from '@packages/utils/src/qr';
import { CameraQRScannerModal } from '../components/CameraQRScannerModal';
import { TeamMember } from '@packages/types/src';
import { Utensils, CheckCircle2, AlertTriangle, Tag, QrCode, Camera } from 'lucide-react';

export const FoodCheckinPage: React.FC = () => {
  const [agentInput, setAgentInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string; member?: TeamMember } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [members, setMembers] = useState(store.getTeamMembers());

  useEffect(() => {
    const update = () => {
      setMembers(store.getTeamMembers());
    };
    update();
    const unsub = store.subscribe(update);
    store.syncFromSupabase();
    return unsub;
  }, []);

  const totalMembers = members.length;
  const claimedCount = members.filter(m => m.food_collected).length;

  const handleFoodCheckin = (customInput?: string) => {
    setFeedback(null);
    const cleaned = (customInput || agentInput).trim();
    if (!cleaned) return;

    const res = store.recordFoodDistribution(cleaned, 'Dining Counter A');
    if (res.success) {
      setFeedback({ 
        type: 'success', 
        message: res.message,
        member: res.member
      });
      setAgentInput('');
    } else {
      setFeedback({ type: 'warning', message: res.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Utensils className="w-5 h-5 text-amber-400" />
            Food & Refreshment Token Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan attendee Hand Band QR to verify registration and claim lunch tokens (1 meal per wristband).
          </p>
        </div>

        <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xs">
          <span className="text-slate-400">MEALS CLAIMED: </span>
          <strong className="text-amber-400 font-bold">{claimedCount}</strong>
          <span className="text-slate-500"> / {totalMembers}</span>
        </div>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFoodCheckin(); }} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase font-mono">
              <Tag className="w-4 h-4 text-amber-400" />
              <span>SCAN ATTENDEE HAND BAND QR (BAND ID)</span>
            </label>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
              Individual Meal Token
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                placeholder="Scan Hand Band QR (e.g. WB-1001) or Member ID..."
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:border-amber-400 focus:outline-none uppercase font-mono font-bold"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Scan with Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-md"
            >
              CLAIM FOOD TOKEN
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/90 border-amber-500/50 text-amber-300'
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1 font-mono">
              <div className="font-bold text-white text-sm">{feedback.message}</div>
              {feedback.member && (
                <div className="text-emerald-300 text-xs flex items-center gap-2">
                  <span>Attendee: <strong>{feedback.member.name}</strong></span>
                  {feedback.member.band_id && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      🏷️ {feedback.member.band_id}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CameraQRScannerModal
        isOpen={isCameraOpen}
        title="Scan Hand Band for Food Claim"
        subtitle="Point camera at attendee wristband QR code"
        onScan={(text) => {
          const cleanToken = extractScanToken(text);
          setAgentInput(cleanToken);
          handleFoodCheckin(cleanToken);
        }}
        onClose={() => setIsCameraOpen(false)}
      />
    </div>
  );
};
