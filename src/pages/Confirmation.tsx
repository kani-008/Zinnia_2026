import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { store } from '../services/store';
import { REGISTRATION_FEE_PER_HEAD } from '../config/site';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ArrowLeft,
  Mail, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  QrCode
} from 'lucide-react';

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
  const memberCount = Math.max(
    1,
    localTeam?.members?.length || 0,
    paymentInfo?.member_count || 0,
    Array.isArray(paymentInfo?.members) ? paymentInfo.members.length : 0
  );

  const membersList = (localTeam?.members && localTeam.members.length > 0)
    ? localTeam.members
    : (Array.isArray(paymentInfo?.members) && paymentInfo.members.length > 0 ? paymentInfo.members : []);

  const paymentStatus = paymentInfo?.payment_status || 'PENDING_VERIFICATION';
  const isVerified = paymentStatus === 'VERIFIED' || paymentInfo?.payment;
  const isRejected = paymentStatus === 'REJECTED';
  const isPending = !isVerified && !isRejected;

  // Active step in 3-stage visual state machine
  // Stage 1: SUBMITTED (Done)
  // Stage 2: TREASURER REVIEW (Active if pending, Done if verified)
  // Stage 3: PASS EMAILED (Active/Done if verified)
  const currentStage = isVerified ? 3 : isRejected ? 2 : 2;

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

  const handleManualRefresh = () => {
    startTimeRef.current = Date.now();
    setHasPollingStopped(false);
    setPollCount(0);
    loadDetails(teamId, true);
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between font-sans relative">
      <WebsiteNavbar />

      <main className="relative z-10 pt-4 sm:pt-8 pb-20 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6 w-full flex-1">
        
        {/* Navigation & Header Badges */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/register?id=${teamId}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111214] hover:bg-[#1A1C20] border border-[#EEEEEA]/40 text-xs font-mono font-bold uppercase tracking-wider text-[#EEEEEA] hover:text-[#E5BD00] hover:border-[#E5BD00] transition-all shadow-[3px_3px_0px_#090A0B] rounded-xl cursor-pointer group"
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
        <div className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl relative">
          <div className="inline-block bg-[#E5BD00] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider px-3.5 py-1 border border-[#090A0B] shadow-[3px_3px_0px_#090A0B] -rotate-1 mb-3">
            ⚡ CONFIRMATION &amp; TELEMETRY // ZINNIA '26
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display text-[#EEEEEA] tracking-tight uppercase leading-none drop-shadow-[3px_3px_0px_#090A0B]">
            {isVerified 
              ? 'PASSES APPROVED & DISPATCHED' 
              : isRejected 
                ? 'TRANSACTION REJECTED' 
                : 'PAYMENT UNDER VERIFICATION'}
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#0FA9C6] uppercase font-bold tracking-wide mt-2">
            {isVerified 
              ? '✓ Your individual digital QR passes have been approved and emailed to all members.' 
              : isRejected
                ? '✕ Your transaction proof was rejected. Please review the reason and resubmit below.'
                : '⏳ Your transaction ID is awaiting confirmation from the symposium treasurer.'}
          </p>
        </div>

        {/* =========================================================================
            EXPLICIT 3-STAGE STATE MACHINE (PHASE 4 FIX #1)
            Submitted -> Treasurer Review -> Pass Emailed
            ========================================================================= */}
        <div className="p-5 sm:p-6 bg-[#111214] border border-[#EEEEEA]/20 rounded-2xl shadow-[4px_4px_0px_#090A0B] space-y-4">
          <span className="text-xs font-mono font-bold text-[#B8B8B2] uppercase tracking-wider block">
            VERIFICATION PIPELINE PROGRESS:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            
            {/* Stage 1: Submitted */}
            <div className="p-3.5 rounded-xl border flex items-center gap-3 bg-[#17181C] border-[#10B981]/60 text-[#10B981]">
              <div className="w-6 h-6 rounded-full bg-[#10B981] text-[#090A0B] font-bold flex items-center justify-center text-xs shrink-0">
                ✓
              </div>
              <div className="truncate">
                <span className="block font-bold text-xs">1. PROOF SUBMITTED</span>
                <span className="text-[11px] text-[#B8B8B2] truncate">UTR recorded</span>
              </div>
            </div>

            {/* Stage 2: Treasurer Review */}
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isVerified 
                ? 'bg-[#17181C] border-[#10B981]/60 text-[#10B981]' 
                : isRejected 
                  ? 'bg-[#D51F55]/10 border-[#D51F55] text-[#D51F55]' 
                  : 'bg-[#E5BD00]/10 border-[#E5BD00] text-[#E5BD00] ring-1 ring-[#E5BD00]'
            }`}>
              <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                isVerified 
                  ? 'bg-[#10B981] text-[#090A0B]' 
                  : isRejected 
                    ? 'bg-[#D51F55] text-white' 
                    : 'bg-[#E5BD00] text-[#090A0B] animate-pulse'
              }`}>
                {isVerified ? '✓' : isRejected ? '✕' : '2'}
              </div>
              <div className="truncate">
                <span className="block font-bold text-xs">2. TREASURER REVIEW</span>
                <span className="text-[11px] text-[#B8B8B2] truncate">
                  {isVerified ? 'Reconciled & approved' : isRejected ? 'Action required' : 'In review...'}
                </span>
              </div>
            </div>

            {/* Stage 3: Pass Emailed */}
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
              isVerified 
                ? 'bg-[#17181C] border-[#10B981] text-[#10B981] ring-1 ring-[#10B981]' 
                : 'bg-[#08090A] border-[#B8B8B2]/20 text-[#B8B8B2]'
            }`}>
              <div className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                isVerified ? 'bg-[#10B981] text-[#090A0B]' : 'bg-[#111214] text-[#B8B8B2] border border-[#B8B8B2]/40'
              }`}>
                {isVerified ? '✓' : '3'}
              </div>
              <div className="truncate">
                <span className="block font-bold text-xs">3. PASS EMAILED</span>
                <span className="text-[11px] text-[#B8B8B2] truncate">
                  {isVerified ? 'QR passes in inboxes' : 'Awaiting approval'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 text-center bg-[#111214] border border-[#EEEEEA]/20 rounded-2xl font-mono text-sm">
            <Clock className="w-8 h-8 text-[#E5BD00] animate-spin mx-auto mb-3" />
            <p className="text-[#B8B8B2]">Loading confirmation details from server...</p>
          </div>
        ) : error ? (
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
                <div className="p-3 bg-[#08090A] border border-[#D51F55]/40 rounded-xl text-[#EEEEEA]">
                  <span className="text-[#B8B8B2] block text-[11px] mb-0.5 font-bold uppercase">REASON PROVIDED:</span>
                  <p className="text-sm font-semibold">{paymentInfo?.rejection_reason || 'Unverified or mismatched transaction reference number.'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/payment?id=${teamId}&edit=true`)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] flex items-center justify-center gap-2"
                >
                  <span>RESUBMIT TRANSACTION REFERENCE</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}

            {/* SUCCESS / VERIFIED PASSPORT LINK (PHASE 4 FIX #3) */}
            {isVerified && (
              <div className="p-6 bg-[#10B981]/15 border-2 border-[#10B981] rounded-2xl font-mono space-y-3 shadow-[5px_5px_0px_#090A0B]">
                <div className="flex items-center gap-2.5 text-[#10B981] font-black text-sm uppercase">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>PAYMENT VERIFIED &bull; PASSES ACTIVE</span>
                </div>
                <p className="text-xs text-[#EEEEEA] leading-relaxed">
                  The treasurer has confirmed your payment. Digital QR credentials have been dispatched to all member emails. You can also view and present digital passes directly here.
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

            {/* Polling Notice & Manual Refresh (PHASE 4 FIX #5) */}
            {isPending && (
              <div className="p-4 bg-[#111214] border border-[#EEEEEA]/20 rounded-xl font-mono text-xs text-[#B8B8B2] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 text-[#E5BD00] ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>
                    {hasPollingStopped 
                      ? 'Status polling paused. Tap refresh to check latest treasurer verification status.' 
                      : 'Auto-refreshing status in background...'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-lg bg-[#17181C] hover:bg-[#EEEEEA] hover:text-[#090A0B] text-[#EEEEEA] border border-[#EEEEEA]/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'CHECKING...' : 'REFRESH STATUS'}</span>
                </button>
              </div>
            )}

            {/* =========================================================================
                OFFICIAL PASS DELIVERY NOTICE
                ========================================================================= */}
            <div className="p-6 sm:p-8 bg-[#111214] border-2 border-[#0FA9C6] shadow-[6px_6px_0px_#090A0B] rounded-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-[#0FA9C6]/30 pb-3">
                <div className="p-2.5 rounded-xl bg-[#0FA9C6]/20 border border-[#0FA9C6] text-[#0FA9C6]">
                  <Mail className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#0FA9C6] uppercase font-bold tracking-widest block">
                    IMPORTANT ATTENDEE NOTICE
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide">
                    OFFICIAL PASS DELIVERY NOTICE
                  </h2>
                </div>
              </div>

              <div className="space-y-3 font-sans text-sm leading-relaxed text-[#EEEEEA]">
                <p>
                  The official symposium entry pass and personal QR code will be received to each registered member's email address separately from the official Zinnia email (<strong className="text-[#0FA9C6] font-mono">zinnia2026@gcee.ac.in</strong>) upon treasurer approval.
                </p>
                <div className="p-3 bg-[#08090A] border border-[#E5BD00]/30 rounded-xl text-xs font-mono text-[#E5BD00] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E5BD00]" />
                  <span>
                    <strong>Spam Folder Alert:</strong> Please inspect both your primary Inbox and Spam / Junk / Promotions folders after verification.
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Information Cards (PHASE 4 FIX #6) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Card 1: Status */}
              <div className="p-5 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl space-y-1 font-mono">
                <span className="text-[10px] text-[#B8B8B2] uppercase font-bold tracking-wider block">
                  PAYMENT STATUS
                </span>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    isVerified ? 'bg-emerald-400' : isRejected ? 'bg-[#D51F55]' : 'bg-[#E5BD00] animate-ping'
                  }`} />
                  <span className="text-sm font-black text-[#EEEEEA] uppercase">
                    {isVerified ? 'VERIFIED' : isRejected ? 'REJECTED' : 'PENDING REVIEW'}
                  </span>
                </div>
                <span className="text-[11px] text-[#B8B8B2] block pt-1">
                  {isVerified ? 'Approved by treasurer' : isRejected ? 'Please resubmit UTR' : 'Reconciliation in progress'}
                </span>
              </div>

              {/* Card 2: Transaction Reference with Tap-to-Copy */}
              <div className="p-5 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl space-y-1 font-mono">
                <span className="text-[10px] text-[#B8B8B2] uppercase font-bold tracking-wider block">
                  TRANSACTION REF (UTR)
                </span>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-black text-[#0FA9C6] break-all">
                    {paymentInfo?.utr_number || 'RECORDED'}
                  </span>
                  {paymentInfo?.utr_number && (
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentInfo.utr_number, 'utr')}
                      className="p-1 hover:text-[#0FA9C6] transition-colors cursor-pointer shrink-0"
                      title="Tap to copy reference"
                    >
                      {copiedUtr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-[#B8B8B2] block pt-1">
                  {copiedUtr ? 'Copied to clipboard!' : 'Tap icon to copy'}
                </span>
              </div>

              {/* Card 3: Total Fee */}
              <div className="p-5 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl space-y-1 font-mono">
                <span className="text-[10px] text-[#B8B8B2] uppercase font-bold tracking-wider block">
                  TOTAL AMOUNT DUE
                </span>
                <div className="text-xl font-black text-[#E5BD00]">
                  ₹{paymentInfo?.expected_amount || memberCount * REGISTRATION_FEE_PER_HEAD}
                </div>
                <span className="text-[11px] text-[#B8B8B2] block pt-1">
                  ₹{REGISTRATION_FEE_PER_HEAD} × {memberCount} member{memberCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Recipient Member Inboxes & Pass Status (PHASE 4 FIX #2) */}
            {membersList.length > 0 && (
              <div className="p-6 sm:p-7 bg-[#111214] border border-[#EEEEEA]/20 shadow-[5px_5px_0px_#090A0B] rounded-2xl space-y-4 font-mono">
                <div className="flex items-center justify-between gap-3 border-b border-[#EEEEEA]/15 pb-3">
                  <div>
                    <h3 className="font-display text-lg sm:text-xl text-[#EEEEEA] uppercase tracking-wide">
                      REGISTERED PASS INBOXES ({membersList.length})
                    </h3>
                    <p className="text-xs text-[#B8B8B2]">
                      Each attendee receives a personal QR pass with their registered events and food tag:
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
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
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border border-[#B8B8B2]/30 text-[#B8B8B2]">
                            {m.food_preference === 'NON_VEG' ? '🍗 NON-VEG' : '🌱 VEG'}
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
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-6 bg-[#111214] border border-[#EEEEEA]/20 shadow-[4px_4px_0px_#090A0B] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#B8B8B2] text-center sm:text-left">
                Keep your Team ID (<strong className="text-[#E5BD00]">{teamId}</strong>) safe for entrance clearance.
              </div>
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
