import React, { useState, useEffect } from 'react';
import { store } from '../../services/store';
import { TeamMember, Team } from '@/types';
import { CameraQRScannerModal } from '../../components/CameraQRScannerModal';
import { 
  Utensils, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Camera, 
  Search, 
  RotateCcw,
  Users
} from 'lucide-react';

export const FoodCheckinPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    member?: TeamMember;
    team?: Team;
    time?: string;
  } | null>(null);

  const [members, setMembers] = useState<TeamMember[]>(store.getTeamMembers());
  const [filterQuery, setFilterQuery] = useState('');

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
  const claimedMembers = members.filter(m => m.food_collected);
  const claimedCount = claimedMembers.length;

  const handleFoodCheckin = async (customToken?: string) => {
    const raw = (customToken || tokenInput).trim();
    if (!raw) return;

    setIsProcessing(true);
    setFeedback(null);

    const res = await store.checkinFoodApi({
      passport_token: raw,
      id: raw,
      scanned_by: 'Dining Hall Coordinator',
      location: 'Dining Counter A'
    });

    setIsProcessing(false);
    setTokenInput('');

    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.reason,
        member: res.member,
        team: res.team,
        time: new Date().toLocaleTimeString()
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.reason,
        member: res.member,
        team: res.team,
        time: new Date().toLocaleTimeString()
      });
    }
  };

  const filteredClaimed = claimedMembers.filter(m => {
    const q = filterQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) ||
           m.email.toLowerCase().includes(q) ||
           m.id.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-sans">
            <Utensils className="w-5 h-5 text-amber-400" />
            Food & Refreshment Token Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan attendee Digital Passport QR for 1-time lunch token distribution lock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono">
            <span className="text-slate-400">MEALS CLAIMED: </span>
            <strong className="text-amber-400 font-bold">{claimedCount}</strong>
            <span className="text-slate-500"> / {totalMembers}</span>
          </div>
          <button
            onClick={() => store.syncFromSupabase()}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:text-white text-slate-400 cursor-pointer"
            title="Sync Database"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scanner Box */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
        <form onSubmit={(e) => { e.preventDefault(); handleFoodCheckin(); }} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase font-mono">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>SCAN ATTENDEE PASSPORT QR OR ENTER ID</span>
            </label>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
              1-Time Food Lock
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                disabled={isProcessing}
                placeholder="Scan QR token hex code or type Member ID (e.g. ZIN26-XXXXXX-M1)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:border-amber-400 focus:outline-none font-mono font-bold"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
              title="Scan with Camera"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Camera</span>
            </button>

            <button 
              type="submit" 
              disabled={isProcessing || !tokenInput.trim()}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md font-mono"
            >
              {isProcessing ? 'VALIDATING...' : 'CLAIM FOOD TOKEN'}
            </button>
          </div>
        </form>

        {/* Big PASS / FAIL Banner */}
        {feedback && (
          <div className="pt-2 animate-fadeIn">
            {feedback.type === 'success' ? (
              <div className="p-5 bg-emerald-950/80 border-2 border-emerald-500 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-black font-mono text-base">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>✓ PASS — MEAL TOKEN CLAIMED</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300">{feedback.time}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-emerald-800/50">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PARTICIPANT</span>
                    <strong className="text-white text-sm">{feedback.member?.name}</strong>
                    <span className="block text-[11px] text-cyan-300">{feedback.member?.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">STATUS</span>
                    <strong className="text-emerald-200">1 Meal Issued &bull; Food Lock Active</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-rose-950/90 border-2 border-rose-500 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 font-black font-mono text-base">
                    <AlertTriangle className="w-6 h-6" />
                    <span>✗ FAIL — FOOD TOKEN REJECTED</span>
                  </div>
                  <span className="text-xs font-mono text-rose-300">{feedback.time}</span>
                </div>
                
                <p className="text-rose-200 text-xs font-mono font-bold">
                  {feedback.message}
                </p>

                {feedback.member && (
                  <div className="text-[11px] font-mono text-slate-400 pt-1">
                    Participant: <strong className="text-white">{feedback.member.name}</strong> ({feedback.member.id})
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Claimed Attendees Feed */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Utensils className="w-4 h-4 text-amber-400" />
            Claimed Meals ({filteredClaimed.length})
          </h2>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search meal claim..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">CLAIM TIME</th>
                <th className="pb-2">PARTICIPANT</th>
                <th className="pb-2">MEMBER ID</th>
                <th className="pb-2">PHONE</th>
                <th className="pb-2">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClaimed.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-mono">
                    No food tokens claimed yet.
                  </td>
                </tr>
              ) : (
                filteredClaimed.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 text-slate-400">
                      {m.food_collected_at 
                        ? new Date(m.food_collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Claimed'}
                    </td>
                    <td className="py-2.5 font-bold text-white">
                      {m.name} {m.is_leader && '👑'}
                    </td>
                    <td className="py-2.5 text-cyan-400">{m.id}</td>
                    <td className="py-2.5 text-slate-400">{m.phone}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px]">
                        ✓ CLAIMED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Modal */}
      <CameraQRScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={(scannedToken) => {
          setIsCameraOpen(false);
          handleFoodCheckin(scannedToken);
        }}
        title="Scan Participant Passport for Lunch Token"
        subtitle="Hold attendee Digital Passport QR within camera view"
      />
    </div>
  );
};

export default FoodCheckinPage;
