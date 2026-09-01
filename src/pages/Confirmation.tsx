import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { store } from '../services/store';
import { REGISTRATION_FEE_PER_HEAD } from '../config/site';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowLeft,
  Mail, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  AlertCircle,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { FoodMark } from '../components/ui/FoodMark';

export const WebsiteConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTeamId = searchParams.get('id') || searchParams.get('team_id') || '';
  const teamId = (rawTeamId && rawTeamId !== 'undefined' && rawTeamId !== 'null') ? rawTeamId.trim() : '';

  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling with backoff: 8s -> 15s -> 30s, up to 10 minutes (~600s)
  const [pollCount, setPollCount] = useState(0);
  const [hasPollingStopped, setHasPollingStopped] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const loadDetails = useCallback(async (targetId: string, isManual: boolean = false) => {
    if (!targetId) return;
    if (isManual) setIsRefreshing(true);

    try {
      let data = await store.getPaymentStatus(targetId);
      if (!data || !data.success) {
        await store.syncFromSupabase();
        data = await store.getPaymentStatus(targetId);
      }

      if (data && data.success) {
        setPaymentInfo(data);
        setError(null);
      } else {
        const local = store.getTeamById(targetId);
        if (local) {
          setPaymentInfo({
            success: true,
            team_id: local.team_id,
            team_name: local.team_name,
            payment: local.payment || false,
            payment_status: local.payment_status || 'PENDING_VERIFICATION',
            member_count: local.members?.length || 1,
            expected_amount: (local.members?.length || 1) * REGISTRATION_FEE_PER_HEAD,
            submitted_amount: (local.members?.length || 1) * REGISTRATION_FEE_PER_HEAD,
            utr_number: local.utr_number || 'RECORDED',
            members: local.members || []
          });
        } else {
          setError(`No registration found with Team ID: ${targetId}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Unable to fetch status.');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Backoff scheduler
  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    loadDetails(teamId);

    const isVerified = paymentInfo?.payment_status === 'VERIFIED';
    const isRejected = paymentInfo?.payment_status === 'REJECTED';

    if (isVerified || isRejected) {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed > 600000) { // 10 minutes timeout
      setHasPollingStopped(true);
      return;
    }

    let delay = 8000;
    if (pollCount > 10) delay = 30000;
    else if (pollCount > 4) delay = 15000;

    pollTimerRef.current = setTimeout(() => {
      loadDetails(teamId);
      setPollCount(c => c + 1);
    }, delay);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [teamId, pollCount, paymentInfo?.payment_status, loadDetails]);

  const localTeam = store.getTeamById(paymentInfo?.team_id || teamId);
  const membersList = (localTeam?.members && localTeam.members.length > 0)
    ? localTeam.members
    : (Array.isArray(paymentInfo?.members) && paymentInfo.members.length > 0 ? paymentInfo.members : []);

  const paymentStatus = paymentInfo?.payment_status || 'PENDING_VERIFICATION';
  const isVerified = paymentStatus === 'VERIFIED' || paymentInfo?.payment;
  const isRejected = paymentStatus === 'REJECTED';
  const isPending = !isVerified && !isRejected;

  const handleCopy = (text: string, type: 'id' | 'utr') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedUtr(true);
      setTimeout(() => setCopiedUtr(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between font-sans relative">
      <WebsiteNavbar />

      <main className="relative z-10 pt-4 sm:pt-8 pb-20 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 w-full flex-1">
        
        {/* Navigation & Header Badges (desktop - mobile shows the team id in the inboxes card) */}
        <div className="hidden sm:flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/register?id=${teamId}`)}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#111214] hover:bg-[#1A1C20] border border-[#EEEEEA]/40 text-xs font-mono font-bold uppercase tracking-wider text-[#EEEEEA] hover:text-[#E5BD00] hover:border-[#E5BD00] transition-all shadow-[3px_3px_0px_#090A0B] rounded-xl cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5BD00] group-hover:-translate-x-1 transition-transform" />
            <span>BACK TO REGISTRATION</span>
          </button>

          {teamId && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111214] border border-[#EEEEEA]/20 text-xs font-mono">
              <span className="text-[#B8B8B2]">TEAM ID:</span>
              <strong className="text-[#E5BD00] font-bold">{teamId}</strong>
              <button
                type="button"
                onClick={() => handleCopy(teamId, 'id')}
                className="p-1 hover:text-[#E5BD00] transition-colors cursor-pointer"
                title="Tap to copy Team ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Header Title */}
        <div className="px-1 py-1 relative">
          <h1 className="text-[clamp(0.8rem,4vw,1.5rem)] sm:text-4xl whitespace-nowrap sm:whitespace-normal tracking-[0.08em] sm:tracking-[0.12em] md:text-5xl font-display text-[#EEEEEA] uppercase leading-tight drop-shadow-[3px_3px_0px_#090A0B]">
            {isVerified
              ? 'PAYMENT VERIFIED'
              : isRejected
                ? 'PAYMENT REJECTED'
                : 'PAYMENT UNDER VERIFICATION'}
          </h1>
        </div>

        {/* Loading / Error States */}
        {loading ? null : error ? (
          <div className="p-6 bg-[#D51F55]/15 border border-[#D51F55] rounded-2xl font-mono text-xs text-[#D51F55] space-y-2">
            <p className="font-bold uppercase tracking-wider">Registration Not Found</p>
            <p className="text-[#EEEEEA]">{error}</p>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="mt-3 px-4 py-2.5 bg-[#E5BD00] text-[#090A0B] font-bold rounded-xl cursor-pointer"
            >
              Start New Registration
            </button>
          </div>
        ) : (
          <div className="space-y-6">

            {/* REJECTION RESUBMIT CALLOUT (PHASE 4 FIX #4) */}
            {isRejected && (
              <div className="p-6 bg-[#D51F55]/15 border-2 border-[#D51F55] rounded-2xl font-mono text-xs space-y-3 shadow-[5px_5px_0px_#090A0B]">
                <div className="flex items-center gap-2 text-[#D51F55] font-black text-sm uppercase">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>TRANSACTION PROOF REJECTED BY TREASURER</span>
                </div>
                <div className="p-3.5 bg-[#08090A] border border-[#D51F55]/40 rounded-xl text-[#EEEEEA] space-y-2">
                  <span className="text-[#B8B8B2] block text-[11px] font-bold uppercase">REASON PROVIDED:</span>
                  <p className="text-sm font-semibold text-[#D51F55]">{paymentInfo?.rejection_reason || 'Unverified or mismatched transaction reference number.'}</p>
                  <p className="text-xs text-[#B8B8B2] pt-1">
                    This usually means the transaction ID was incorrect or the payment was not received. You can submit a corrected transaction ID below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/payment?id=${teamId}&edit=true`)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] flex items-center justify-center gap-2"
                >
                  <span>SUBMIT CORRECTED TRANSACTION ID</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}

            {/* SUCCESS / VERIFIED PASSPORT LINK (PHASE 4 FIX #3) */}
            {isVerified && (
              <div className="p-6 bg-[#10B981]/15 border-2 border-[#10B981] rounded-2xl font-mono space-y-3 shadow-[5px_5px_0px_#090A0B]">
                <div className="flex items-center gap-2.5 text-[#10B981] font-black text-sm uppercase">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>PAYMENT VERIFIED</span>
                </div>
                <p className="text-xs text-[#EEEEEA] leading-relaxed">
                  Payment verified. Your QR passes have been emailed to all members.
                </p>
                <div className="pt-1 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/passport?id=${teamId}`)}
                    className="px-6 py-3 bg-[#10B981] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>VIEW DIGITAL ENTRY PASSPORTS</span>
                  </button>
                </div>
              </div>
            )}

            {/* Recipient Member Inboxes & Pass Status (PHASE 4 FIX #2) */}
            {membersList.length > 0 && (
              <div className="p-6 sm:p-7 bg-[#111214] border border-[#EEEEEA]/20 shadow-[5px_5px_0px_#090A0B] rounded-2xl space-y-4 font-mono">
                <div className="border-b border-[#EEEEEA]/15 pb-3 space-y-2">

                  {/* Row 1 (mobile): team id */}
                  {teamId && (
                    <div className="sm:hidden flex justify-end">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#08090A] border border-[#EEEEEA]/20 text-[10px] font-mono">
                        <span className="text-[#B8B8B2]">TEAM ID:</span>
                        <strong className="text-[#E5BD00] font-bold">{teamId}</strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(teamId, 'id')}
                          className="p-0.5 hover:text-[#E5BD00] transition-colors cursor-pointer"
                          title="Tap to copy Team ID"
                        >
                          {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Row 2: heading */}
                  <div>
                    <h3 className="font-display text-lg sm:text-xl text-[#EEEEEA] uppercase tracking-wide">
                      REGISTERED PASS ({membersList.length})
                    </h3>
                    <p className="text-[11px] text-[#B8B8B2] leading-relaxed">
                      Each member receives their QR pass at their registered email once the payment is verified.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {membersList.map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-[#08090A] border border-[#EEEEEA]/15 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#E5BD00]/20 border border-[#E5BD00] text-[#E5BD00] text-xs font-bold flex items-center justify-center shrink-0 font-mono">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-[#EEEEEA]">{m.name}</span>
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border border-[#B8B8B2]/30 text-[#B8B8B2] inline-flex items-center gap-1 align-middle">
                            <FoodMark type={m.food_preference === 'NON_VEG' ? 'NON_VEG' : 'VEG'} className="w-3 h-3" />
                            <span>{m.food_preference === 'NON_VEG' ? 'NON-VEG' : 'VEG'}</span>
                          </span>
                          {m.is_leader && (
                            <span className="ml-1 text-[10px] px-2 py-0.5 rounded bg-[#0FA9C6]/20 text-[#0FA9C6] font-bold border border-[#0FA9C6]/40">
                              LEADER
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[#0FA9C6] sm:text-right font-mono text-xs pl-8 sm:pl-0">
                        <Mail className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="break-all font-semibold">{m.email || 'Email registered'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#B8B8B2] leading-relaxed border-t border-[#EEEEEA]/15 pt-3 mt-1">
                  Keep the pass email you receive, and your Team ID (<strong className="text-[#E5BD00]">{teamId}</strong>), safe for entrance clearance.
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5"
              >
                <span>RETURN TO HOME</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        )}

      </main>

      <WebsiteFooter />
    </div>
  );
};

export default WebsiteConfirmationPage;
