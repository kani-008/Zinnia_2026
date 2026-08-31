import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { store } from '../services/store';
import { TREASURER_PAYMENT_CONFIG, REGISTRATION_FEE_PER_HEAD } from '../config/site';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Smartphone,
  Loader2,
  RefreshCw,
  Receipt,
  ChevronUp
} from 'lucide-react';

const UTR_REGEX = /^[A-Z0-9]{10,30}$/;

export const WebsitePaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTeamId = searchParams.get('id') || searchParams.get('team_id') || '';
  const initialTeamId = (rawTeamId && rawTeamId !== 'undefined' && rawTeamId !== 'null') ? rawTeamId.trim() : '';

  const [teamId, setTeamId] = useState(initialTeamId);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadStatus = async (targetId: string) => {
    if (!targetId || !targetId.trim() || targetId === 'undefined' || targetId === 'null') return;
    setLoading(true);
    setError(null);
    try {
      let data = await store.getPaymentStatus(targetId.trim());
      if (!data || !data.success) {
        await store.syncFromSupabase();
        data = await store.getPaymentStatus(targetId.trim());
      }

      if (data && data.success) {
        const isEditMode = searchParams.get('edit') === 'true';
        if (data.payment_status === 'VERIFIED') {
          navigate(`/confirmation?id=${targetId.trim()}`, { replace: true });
          return;
        }

        if (data.payment_status === 'PENDING_VERIFICATION' && !isEditMode) {
          navigate(`/confirmation?id=${targetId.trim()}`, { replace: true });
          return;
        }

        setPaymentInfo(data);
        if (data.utr_number) {
          setUtrNumber(data.utr_number);
        }
      } else {
        setError(`Unable to find or confirm payment record for Team ID "${targetId}". Please retry.`);
        setPaymentInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to confirm payment amount from server — please retry.');
      setPaymentInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTeamId) {
      loadStatus(initialTeamId);
    }
  }, [initialTeamId]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(TREASURER_PAYMENT_CONFIG.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };


  // Authoritative server amount calculation
  const memberCount = useMemo(() => {
    if (paymentInfo?.member_count && paymentInfo.member_count > 0) {
      return paymentInfo.member_count;
    }
    const localTeam = store.getTeamById(teamId);
    return localTeam?.members?.length || 1;
  }, [paymentInfo, teamId]);

  const serverExpectedAmount = paymentInfo?.expected_amount;
  const isServerAmountLoaded = typeof serverExpectedAmount === 'number' && serverExpectedAmount > 0;
  const computedFallback = memberCount * REGISTRATION_FEE_PER_HEAD;
  
  // Server value is authoritative when available
  const authoritativeAmount = isServerAmountLoaded
    ? serverExpectedAmount 
    : computedFallback;

  // Breakdown details: events & food split
  const allEvents = useMemo(() => store.getEvents(), []);

  const teamMembers = useMemo(() => {
    const localTeam = store.getTeamById(teamId);
    if (localTeam?.members && localTeam.members.length > 0) {
      return localTeam.members;
    }
    const storeMembers = store.getTeamMembers(teamId);
    if (storeMembers && storeMembers.length > 0) {
      return storeMembers;
    }
    return paymentInfo?.members || [];
  }, [teamId, paymentInfo]);

  const vegCount = useMemo(() => {
    const list = teamMembers.filter((m: any) => (m.food_preference || 'VEG') === 'VEG');
    return list.length > 0 ? list.length : (memberCount > 0 ? memberCount : 1);
  }, [teamMembers, memberCount]);

  const nonVegCount = useMemo(() => {
    return teamMembers.filter((m: any) => m.food_preference === 'NON_VEG').length;
  }, [teamMembers]);

  const selectedEventObjects = useMemo(() => {
    const localTeam = store.getTeamById(teamId);
    const eventIds = localTeam?.registered_events || paymentInfo?.registered_events || [];
    return allEvents.filter(e => eventIds.includes(e.id));
  }, [teamId, paymentInfo, allEvents]);

  // Build UPI URI ONLY when authoritative server amount is positive
  const upiUri = useMemo(() => {
    if (!paymentInfo || !isServerAmountLoaded || serverExpectedAmount <= 0) {
      return '';
    }
    const targetTeamId = paymentInfo?.team_id || teamId;
    return `upi://pay?pa=${TREASURER_PAYMENT_CONFIG.upiId}&pn=${encodeURIComponent(TREASURER_PAYMENT_CONFIG.payeeName)}&am=${serverExpectedAmount}&cu=INR&tn=${encodeURIComponent('ZINNIA26-' + targetTeamId)}`;
  }, [paymentInfo, isServerAmountLoaded, serverExpectedAmount, teamId]);

  // Render SVG QR to canvas and trigger download as PNG for mobile gallery
  // UTR Validation
  const trimmedUtr = utrNumber.trim().toUpperCase();
  const isUtrValid = UTR_REGEX.test(trimmedUtr);
  const utrErrorMessage = useMemo(() => {
    if (!utrNumber) return null;
    if (trimmedUtr.length < 10) return 'Transaction ID must be at least 10 characters.';
    if (trimmedUtr.length > 30) return 'Transaction ID cannot exceed 30 characters.';
    if (!/^[A-Z0-9]+$/.test(trimmedUtr)) return 'Transaction ID must be alphanumeric (no spaces or special symbols).';
    return null;
  }, [utrNumber, trimmedUtr]);

  const canSubmit = isUtrValid && !submitting;

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUtrValid) {
      setError('Please provide a valid 10 to 30 character alphanumeric transaction ID / UTR.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const activeTeamId = paymentInfo?.team_id || teamId;

    try {
      const res = await store.submitPaymentProof(activeTeamId, {
        utr_number: trimmedUtr,
        amount_paid: authoritativeAmount,
      });

      if (res && res.success) {
        setSuccessMsg(`Payment proof recorded (Ref: ${trimmedUtr})! Forwarded to treasurer.`);
        navigate(`/confirmation?id=${activeTeamId}`);
      } else {
        throw new Error(res?.message || 'Payment submission was not accepted.');
      }
    } catch (err: any) {
      setError(err.message || 'Error recording payment proof. Please verify the transaction reference.');
    } finally {
      setSubmitting(false);
    }
  };

  const paymentStatus = paymentInfo?.payment_status || 'AWAITING_PAYMENT';
  const isRejected = paymentStatus === 'REJECTED';
  const isPending = paymentStatus === 'PENDING_VERIFICATION';

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between font-sans relative">
      {/* Top Navbar */}
      <WebsiteNavbar />

      {/* Main Content Area */}
      <main className="relative z-10 pt-4 sm:pt-6 pb-24 sm:pb-20 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 w-full flex-1">
        
        {/* Navigation back to registration details (desktop only) */}
        <div className="hidden sm:flex items-center justify-start">
          <button
            type="button"
            onClick={() => {
              const tId = paymentInfo?.team_id || teamId;
              if (tId) {
                navigate(`/register?id=${tId}`);
              } else {
                navigate('/register');
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111214] hover:bg-[#1A1C20] border border-[#EEEEEA]/40 text-xs font-mono font-bold uppercase tracking-wider text-[#EEEEEA] hover:text-[#E5BD00] hover:border-[#E5BD00] transition-all shadow-[3px_3px_0px_#090A0B] rounded-xl active:translate-x-0.5 active:translate-y-0.5 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#E5BD00] group-hover:-translate-x-1 transition-transform" />
            <span>EDIT SQUAD REGISTRATION</span>
          </button>
        </div>

        {/* Header Banner */}
        <div className="px-1 py-1 relative overflow-visible">
          <h1 className="text-[clamp(0.8rem,4vw,1.5rem)] sm:text-4xl whitespace-nowrap sm:whitespace-normal tracking-[0.08em] sm:tracking-[0.12em] font-display text-[#EEEEEA] uppercase leading-tight drop-shadow-[3px_3px_0px_#090A0B]">
            REGISTRATION FEE VERIFICATION
          </h1>
        </div>

        {/* Team ID Search if not provided */}
        {!teamId && (
          <div className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[5px_5px_0px_#090A0B] rounded-2xl space-y-4 text-center">
            <div className="font-mono font-bold text-sm sm:text-base text-[#EEEEEA] uppercase tracking-wider">
              ENTER YOUR SQUAD TEAM ID TO VIEW INVOICE:
            </div>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2.5">
              <input
                type="text"
                placeholder="E.G. ZIN-2026-1045"
                className="flex-1 px-4 py-3 bg-[#08090A] border border-[#EEEEEA]/40 text-[#EEEEEA] font-mono text-sm font-bold uppercase rounded-xl shadow-[3px_3px_0px_#090A0B] focus:outline-none focus:border-[#E5BD00]"
                onChange={(e) => setTeamId(e.target.value.trim().toUpperCase())}
              />
              <button
                type="button"
                onClick={() => loadStatus(teamId)}
                className="px-6 py-3 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] font-mono font-black text-sm uppercase tracking-wider border border-[#090A0B] shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer rounded-xl shrink-0"
              >
                FETCH INVOICE
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#111214] border border-[#D51F55] text-[#D51F55] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center justify-between gap-3 shadow-[4px_4px_0px_#090A0B]">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => loadStatus(teamId)}
              className="px-3 py-1 bg-[#D51F55]/20 hover:bg-[#D51F55]/40 text-[#EEEEEA] rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RETRY</span>
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-[#111214] border border-[#0FA9C6] text-[#0FA9C6] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center gap-2.5 shadow-[4px_4px_0px_#090A0B]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {teamId && paymentInfo && !loading && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
            
            {/* LEFT / FIRST COLUMN ON MOBILE: QR CODE & PAYMENT DETAILS (Decision #1, #2) */}
            <div className="lg:col-span-5 order-1 lg:order-1 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl p-5 sm:p-6 space-y-5 flex flex-col items-center text-center">
              
              {/* Header Info */}
              <div className="w-full flex justify-between items-center pb-3 border-b border-[#EEEEEA]/20 font-mono text-xs">
                <span className="font-bold text-[#B8B8B2] uppercase">TEAM ID</span>
                <span className="font-black text-[#0FA9C6]">{paymentInfo.team_id}</span>
              </div>

              {/* Amount Display (Server Authoritative) */}
              <div className="space-y-1">
                <div className="font-mono font-bold text-xs text-[#EEEEEA] uppercase truncate max-w-[260px]">
                  {paymentInfo.team_name}
                </div>
                <div className="font-display text-4xl sm:text-5xl text-[#E5BD00] uppercase tracking-wide drop-shadow-[3px_3px_0px_#090A0B]">
                  ₹{authoritativeAmount}
                </div>
                <div className="font-mono text-xs text-[#0FA9C6] font-bold uppercase tracking-wider">
                  ₹{REGISTRATION_FEE_PER_HEAD} × {memberCount} {memberCount === 1 ? 'MEMBER' : 'MEMBERS'}
                </div>
              </div>

              {/* Treasurer QR Code Slot */}
              <div className="w-full flex flex-col items-center space-y-3 pt-1">
                <div className="p-3 sm:p-4 bg-white rounded-2xl border-2 border-[#090A0B] shadow-[6px_6px_0px_#090A0B] flex items-center justify-center min-w-[240px] min-h-[240px]">
                  {paymentInfo && isServerAmountLoaded && upiUri ? (
                    <div className="flex items-center justify-center">
                      <QRCodeSVG
                        value={upiUri}
                        size={240}
                        level="M"
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                        className="rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-[240px] h-[240px] flex flex-col items-center justify-center gap-3 text-[#090A0B]">
                      <Loader2 className="w-8 h-8 animate-spin text-[#0FA9C6]" />
                      <span className="font-mono text-xs font-black uppercase tracking-wider">
                        Verifying Server Fee...
                      </span>
                    </div>
                  )}
                </div>

                {/* Mobile Pay in UPI App Button (Hidden on Desktop) */}
                {upiUri && (
                  <a
                    href={upiUri}
                    className="sm:hidden w-full py-3 px-4 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] border-2 border-[#090A0B] rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>PAY IN UPI APP (GPay / PhonePe)</span>
                  </a>
                )}

              </div>

              {/* UPI ID Fallback & Copy */}
              <div className="w-full p-3 bg-[#08090A] border border-[#EEEEEA]/30 shadow-[3px_3px_0px_#090A0B] rounded-xl flex items-center justify-between gap-2">
                <div className="text-left font-mono truncate">
                  <div className="text-[10px] text-[#B8B8B2] font-bold uppercase">PAYEE UPI ID</div>
                  <div className="text-xs text-[#EEEEEA] font-bold truncate">{TREASURER_PAYMENT_CONFIG.upiId}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="min-h-[36px] px-3 py-1.5 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-bold rounded-lg text-xs uppercase border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{copiedUpi ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN / SECOND ON MOBILE: SUBMISSION FORM */}
            <div className="lg:col-span-7 order-2 lg:order-2 space-y-6">

              <div className="hidden sm:block p-4 sm:p-5 rounded-2xl bg-[#111214] border border-[#E5BD00]/40 shadow-[4px_4px_0px_#090A0B] space-y-3">
                <div className="flex items-center justify-between border-b border-[#B8B8B2]/20 pb-2.5">
                  <span className="text-xs font-mono font-bold text-[#E5BD00] uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#E5BD00]" />
                    <span>Registration Summary</span>
                  </span>
                  <span className="text-xs font-mono text-[#B8B8B2]">
                    ₹{REGISTRATION_FEE_PER_HEAD} / Head
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="bg-[#08090A] p-2.5 rounded-xl border border-[#B8B8B2]/20">
                    <span className="block text-[11px] text-[#B8B8B2]">Events Selected:</span>
                    <span className="font-bold text-[#EEEEEA]">
                      {selectedEventObjects.length > 0 
                        ? `${selectedEventObjects.length} Event${selectedEventObjects.length === 1 ? '' : 's'}`
                        : 'Symposium Events'}
                    </span>
                  </div>

                  <div className="bg-[#08090A] p-2.5 rounded-xl border border-[#B8B8B2]/20">
                    <span className="block text-[11px] text-[#B8B8B2]">Participants:</span>
                    <span className="font-bold text-[#EEEEEA]">
                      {memberCount} Member{memberCount === 1 ? '' : 's'}
                      {vegCount + nonVegCount > 0 ? ` (${vegCount} Veg, ${nonVegCount} Non-Veg)` : ''}
                    </span>
                  </div>

                  <div className="bg-[#08090A] p-2.5 rounded-xl border border-[#E5BD00]/30 bg-[#E5BD00]/5">
                    <span className="block text-[11px] text-[#E5BD00] font-semibold">Total Registration Fee:</span>
                    <span className="text-sm font-black text-[#E5BD00]">
                      {isServerAmountLoaded ? (
                        `₹${authoritativeAmount}`
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin text-[#E5BD00]" />
                          <span>Calculating...</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {selectedEventObjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedEventObjects.map(ev => (
                      <span key={ev.id} className="px-2 py-0.5 rounded bg-[#17181C] border border-[#B8B8B2]/20 text-[11px] font-mono text-[#EEEEEA]">
                        {ev.mission_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              
              <form id="payment-proof-form" onSubmit={handleSubmitProof} className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl space-y-5">
                
                {/* Rejection Alert */}
                {isRejected && paymentInfo?.rejection_reason && (
                  <div className="p-4 rounded-xl bg-[#D51F55]/15 border border-[#D51F55] text-[#D51F55] text-xs font-mono space-y-1.5">
                    <span className="font-black uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>PAYMENT PROOF REJECTED BY TREASURER:</span>
                    </span>
                    <p className="text-[#EEEEEA] font-semibold">{paymentInfo.rejection_reason}</p>
                    <span className="text-[11px] text-[#B8B8B2] block">
                      Please double-check your bank receipt and submit your genuine 12-digit transaction ID.
                    </span>
                  </div>
                )}

                {/* Pending Verification Notice */}
                {isPending && (
                  <div className="p-4 rounded-xl bg-[#0FA9C6]/15 border border-[#0FA9C6] text-[#0FA9C6] text-xs font-mono space-y-1.5">
                    <span className="font-black uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>PENDING TREASURER VERIFICATION</span>
                    </span>
                    <p className="text-[#EEEEEA]">
                      Submitted Transaction Reference: <strong className="text-[#E5BD00] font-mono">{paymentInfo.utr_number}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/confirmation?id=${teamId}`)}
                      className="text-[#0FA9C6] underline font-bold mt-1 text-xs cursor-pointer block"
                    >
                      View Live Confirmation Status &rarr;
                    </button>
                  </div>
                )}

                <div className="border-b border-[#EEEEEA]/20 pb-3">
                  <h3 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide">
                    SUBMIT TRANSACTION REFERENCE
                  </h3>
                  <p className="hidden sm:block font-mono text-xs text-[#0FA9C6] uppercase font-semibold tracking-wide mt-0.5">
                    Enter your UPI reference number
                  </p>
                </div>

                <div className="space-y-4 font-mono text-xs uppercase">
                  
                  {/* UTR Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="utr-input" className="block text-[#B8B8B2] font-bold tracking-wider">
                        UTR / TRANSACTION ID <span className="text-[#D51F55]">*</span>
                      </label>
                      {isUtrValid && (
                        <span className="text-[11px] text-[#10B981] font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>VALID</span>
                        </span>
                      )}
                    </div>
                    
                    <input
                      id="utr-input"
                      type="text"
                      required
                      maxLength={30}
                      placeholder="E.G. 423456789012"
                      value={utrNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                        setUtrNumber(val);
                        setError(null);
                      }}
                      className={`w-full min-h-[48px] px-4 py-3 bg-[#08090A] border text-[#EEEEEA] font-mono text-sm uppercase rounded-xl shadow-[3px_3px_0px_#090A0B] focus:outline-none transition-all ${
                        isUtrValid 
                          ? 'border-[#10B981] ring-1 ring-[#10B981]' 
                          : utrErrorMessage 
                            ? 'border-[#D51F55] ring-1 ring-[#D51F55]' 
                            : 'border-[#EEEEEA]/40 focus:border-[#E5BD00]'
                      }`}
                    />
                    
                    {utrErrorMessage && (
                      <p className="text-[11px] font-mono text-[#D51F55] font-semibold">{utrErrorMessage}</p>
                    )}
                  </div>

                  {/* Fixed Amount Display */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#B8B8B2] font-bold tracking-wider">
                        PAYABLE AMOUNT
                      </label>
                      <span className="text-[10px] text-[#E5BD00] font-mono font-bold">
                        🔒 LOCKED
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={`₹${authoritativeAmount}`}
                      className="w-full min-h-[48px] px-4 py-3 bg-[#17181C] border border-[#EEEEEA]/20 text-[#E5BD00] font-mono text-base font-bold rounded-xl shadow-[2px_2px_0px_#090A0B] cursor-not-allowed select-none focus:outline-none"
                    />
                    <span className="block text-[11px] text-[#B8B8B2] font-mono">
                      ₹{REGISTRATION_FEE_PER_HEAD} × {memberCount} member{memberCount > 1 ? 's' : ''}
                    </span>
                  </div>

                </div>

                {/* Submit Button (Disabled until validated) */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`hidden sm:flex w-full min-h-[48px] py-3.5 px-6 rounded-xl font-mono font-black text-sm uppercase tracking-wider border border-[#090A0B] shadow-[4px_4px_0px_#090A0B] items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
                    canSubmit 
                      ? 'bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B]' 
                      : 'bg-[#17181C] text-[#B8B8B2]/50 border-[#B8B8B2]/20 cursor-not-allowed shadow-none'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>RECORDING TRANSACTION PROOF...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRejected ? 'RESUBMIT PAYMENT PROOF' : 'SUBMIT PAYMENT PROOF'}</span>
                      <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Bar + expandable Registration Summary drawer */}
      {teamId && paymentInfo && !loading && (
        <>
          {/* Tap-away backdrop while the drawer is open */}
          {summaryOpen && (
            <div
              className="sm:hidden fixed inset-0 bg-[#08090A]/60 z-30"
              onClick={() => setSummaryOpen(false)}
            />
          )}

          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#08090A]/95 backdrop-blur-md border-t border-[#B8B8B2]/20 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">

            {/* Slide-up Registration Summary */}
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                summaryOpen ? 'max-h-[65vh]' : 'max-h-0'
              }`}
            >
              <div className="px-3 pt-3 pb-1 space-y-2.5 max-h-[65vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#B8B8B2]/20 pb-2">
                  <span className="text-[11px] font-mono font-bold text-[#E5BD00] uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#E5BD00]" />
                    <span>Registration Summary</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#B8B8B2]">
                    ₹{REGISTRATION_FEE_PER_HEAD} / Head
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between bg-[#111214] px-2.5 py-2 rounded-lg border border-[#B8B8B2]/20">
                    <span className="text-[11px] text-[#B8B8B2]">Events Selected</span>
                    <span className="font-bold text-[#EEEEEA]">
                      {selectedEventObjects.length > 0
                        ? `${selectedEventObjects.length} Event${selectedEventObjects.length === 1 ? '' : 's'}`
                        : 'Symposium Events'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#111214] px-2.5 py-2 rounded-lg border border-[#B8B8B2]/20">
                    <span className="text-[11px] text-[#B8B8B2]">Participants</span>
                    <span className="font-bold text-[#EEEEEA]">
                      {memberCount} Member{memberCount === 1 ? '' : 's'}
                      {vegCount + nonVegCount > 0 ? ` (${vegCount}V, ${nonVegCount}NV)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#E5BD00]/5 px-2.5 py-2 rounded-lg border border-[#E5BD00]/30">
                    <span className="text-[11px] text-[#E5BD00] font-semibold">Total Fee</span>
                    <span className="text-sm font-black text-[#E5BD00]">
                      {isServerAmountLoaded ? (
                        `₹${authoritativeAmount}`
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Loader2 className="w-3 h-3 animate-spin text-[#E5BD00]" />
                          <span>Calculating...</span>
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {selectedEventObjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {selectedEventObjects.map(ev => (
                      <span key={ev.id} className="px-2 py-0.5 rounded bg-[#17181C] border border-[#B8B8B2]/20 text-[10px] font-mono text-[#EEEEEA]">
                        {ev.mission_name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* The bar itself */}
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <button
                type="button"
                onClick={() => setSummaryOpen(o => !o)}
                aria-expanded={summaryOpen}
                aria-label={summaryOpen ? 'Hide registration summary' : 'Show registration summary'}
                className="flex items-center gap-1.5 font-mono leading-tight text-left cursor-pointer"
              >
                <span className="block">
                  <span className="block text-[9px] font-bold text-[#B8B8B2] uppercase tracking-wide">Payable</span>
                  <span className="block text-[13px] font-black text-[#E5BD00]">₹{authoritativeAmount}</span>
                </span>
                <ChevronUp
                  className={`w-4 h-4 text-[#0FA9C6] shrink-0 transition-transform duration-300 ${
                    summaryOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <button
                type="submit"
                form="payment-proof-form"
                disabled={!canSubmit}
                className={`min-h-[clamp(2rem,9vw,2.25rem)] px-[clamp(0.875rem,4vw,1rem)] py-1.5 rounded-lg text-[clamp(10px,2.8vw,11px)] font-mono font-black uppercase tracking-wider border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center gap-1.5 transition-all ${
                  canSubmit
                    ? 'bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] cursor-pointer'
                    : 'bg-[#17181C] text-[#B8B8B2]/50 border-[#B8B8B2]/20 cursor-not-allowed shadow-none'
                }`}
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>{isRejected ? 'RESUBMIT' : 'SUBMIT'}</span>
                    <ArrowRight className="w-3 h-3 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default WebsitePaymentPage;
