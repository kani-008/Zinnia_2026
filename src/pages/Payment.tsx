import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
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
  Download,
  Smartphone,
  Loader2,
  RefreshCw,
  Receipt
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
  const [hasConfirmedPaid, setHasConfirmedPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
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

  const qrContainerRef = useRef<HTMLDivElement>(null);

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
  const handleDownloadQr = () => {
    if (!qrContainerRef.current) return;
    const svgElement = qrContainerRef.current.querySelector('svg');
    if (!svgElement) return;

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 600;
      canvas.height = 600;

      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const pad = 40;
          ctx.drawImage(img, pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.download = `Zinnia_2026_Payment_${paymentInfo?.team_id || teamId}.png`;
          a.href = pngUrl;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.warn('QR download error:', err);
    }
  };

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

  const canSubmit = isUtrValid && hasConfirmedPaid && !submitting;

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUtrValid) {
      setError('Please provide a valid 10 to 30 character alphanumeric transaction ID / UTR.');
      return;
    }
    if (!hasConfirmedPaid) {
      setError('Please confirm that you have completed the UPI transfer before submitting.');
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
      <main className="relative z-10 pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 w-full flex-1">
        
        {/* Navigation back to registration details */}
        <div className="flex items-center justify-start">
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
        <div className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl relative overflow-visible">
          <div className="inline-block bg-[#E5BD00] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider px-3.5 py-1 border border-[#090A0B] shadow-[3px_3px_0px_#090A0B] -rotate-1 mb-3">
            ⚡ OFFICIAL PAYMENT GATEWAY // ZINNIA '26
          </div>
          <h1 className="text-2xl sm:text-4xl font-display text-[#EEEEEA] tracking-tight uppercase leading-none drop-shadow-[3px_3px_0px_#090A0B]">
            REGISTRATION FEE VERIFICATION
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#0FA9C6] font-semibold tracking-wide uppercase mt-2">
            Screenshot or save the Treasurer QR, complete transfer in your UPI app, and submit your UTR reference.
          </p>
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

        {loading && (
          <div className="p-12 text-center text-[#E5BD00] font-mono font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>RETRIEVING PAYMENT TELEMETRY &amp; SERVER RECORDS...</span>
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

        {/* REGISTRATION SUMMARY CARD */}
        {teamId && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#111214] border border-[#E5BD00]/40 shadow-[4px_4px_0px_#090A0B] space-y-3">
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
                    [{ev.code}] {ev.mission_name}
                  </span>
                ))}
              </div>
            )}
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
                    <div ref={qrContainerRef} className="flex items-center justify-center">
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

                {/* Mobile Pay in UPI App Button */}
                {upiUri && (
                  <a
                    href={upiUri}
                    className="w-full py-3 px-4 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] border-2 border-[#090A0B] rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>PAY IN UPI APP (GPay / PhonePe)</span>
                  </a>
                )}

                {/* Save QR Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={!upiUri}
                  className="w-full py-2.5 px-4 bg-[#17181C] hover:bg-[#EEEEEA] hover:text-[#090A0B] text-[#EEEEEA] border border-[#B8B8B2]/40 rounded-xl font-mono text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_#090A0B] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>SAVE QR IMAGE TO GALLERY</span>
                </button>
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

              {/* Screenshot-first Instructions (5.2) */}
              <div className="w-full text-left space-y-2 font-mono text-xs text-[#B8B8B2] border-t border-[#EEEEEA]/20 pt-4 uppercase">
                <div className="text-[#0FA9C6] font-black flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>STEP-BY-STEP PAYMENT STEPS:</span>
                </div>
                <ol className="space-y-1.5 pl-1 list-decimal list-inside text-[11px] font-medium leading-relaxed">
                  <li>
                    Tap <strong className="text-[#0FA9C6]">PAY IN UPI APP</strong> (if paying on this phone) or <strong className="text-[#EEEEEA]">Screenshot / Save this QR</strong>.
                  </li>
                  <li>
                    If scanning from gallery: Open <strong className="text-[#E5BD00]">GPay / PhonePe / Paytm</strong> &rarr; Scan &rarr; <strong className="text-[#EEEEEA]">Choose from Gallery</strong>.
                  </li>
                  <li>
                    The payment amount of <strong className="text-[#E5BD00]">₹{authoritativeAmount}</strong> is already filled in and <strong className="text-[#EEEEEA]">must not be changed</strong>.
                  </li>
                  <li>
                    Pay to <strong className="text-[#EEEEEA]">{TREASURER_PAYMENT_CONFIG.payeeName}</strong>, then return here and enter the <strong className="text-[#EEEEEA]">12-digit UTR / Ref Number</strong>.
                  </li>
                </ol>
              </div>
            </div>

            {/* RIGHT COLUMN / SECOND ON MOBILE: SUBMISSION FORM */}
            <div className="lg:col-span-7 order-2 lg:order-2 space-y-6">
              
              <form onSubmit={handleSubmitProof} className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl space-y-5">
                
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
                  <p className="font-mono text-xs text-[#0FA9C6] uppercase font-semibold tracking-wide mt-0.5">
                    Enter your genuine UPI transaction reference number
                  </p>
                </div>

                <div className="space-y-4 font-mono text-xs uppercase">
                  
                  {/* UTR Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="utr-input" className="block text-[#B8B8B2] font-bold tracking-wider">
                        TRANSACTION ID / UTR NUMBER <span className="text-[#D51F55]">*</span>
                      </label>
                      {isUtrValid && (
                        <span className="text-[11px] text-[#10B981] font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>VALID REFERENCE FORMAT</span>
                        </span>
                      )}
                    </div>
                    
                    <input
                      id="utr-input"
                      type="text"
                      required
                      maxLength={30}
                      placeholder="ENTER 10–30 CHAR TRANSACTION ID (E.G. 423456789012)"
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
                    <p className="text-[11px] text-[#B8B8B2]/80 lowercase font-normal">
                      Usually 12 digits found in your Google Pay, PhonePe, or Paytm payment details under "UPI transaction ID" or "UTR".
                    </p>
                  </div>

                  {/* Fixed Amount Display */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#B8B8B2] font-bold tracking-wider">
                        PAYABLE AMOUNT (AUTHORITATIVE SERVER VALUE)
                      </label>
                      <span className="text-[10px] text-[#E5BD00] font-mono font-bold">
                        🔒 VERIFIED INVOICE
                      </span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={`₹${authoritativeAmount}`}
                      className="w-full min-h-[48px] px-4 py-3 bg-[#17181C] border border-[#EEEEEA]/20 text-[#E5BD00] font-mono text-base font-bold rounded-xl shadow-[2px_2px_0px_#090A0B] cursor-not-allowed select-none focus:outline-none"
                    />
                    <span className="block text-[11px] text-[#B8B8B2] font-mono">
                      (₹{REGISTRATION_FEE_PER_HEAD} per attendee × {memberCount} member{memberCount > 1 ? 's' : ''})
                    </span>
                  </div>

                  {/* Confirmation Checkbox (5.3) */}
                  <div className="p-3.5 rounded-xl bg-[#08090A] border border-[#EEEEEA]/30">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasConfirmedPaid}
                        onChange={(e) => setHasConfirmedPaid(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded bg-[#111214] border-[#EEEEEA]/40 text-[#E5BD00] focus:ring-[#E5BD00] cursor-pointer"
                      />
                      <span className="text-xs text-[#EEEEEA] font-mono font-bold leading-tight">
                        I confirm that I have transferred ₹{authoritativeAmount} to the treasurer via UPI and this transaction reference is genuine.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit Button (Disabled until validated) */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full min-h-[48px] py-3.5 px-6 rounded-xl font-mono font-black text-sm uppercase tracking-wider border border-[#090A0B] shadow-[4px_4px_0px_#090A0B] flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer ${
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

              {/* Assurance Card */}
              <div className="p-4 rounded-xl bg-[#111214] border border-[#EEEEEA]/20 flex items-center gap-3 font-mono text-xs text-[#B8B8B2]">
                <ShieldCheck className="w-5 h-5 text-[#10B981] shrink-0" />
                <span>
                  Once verified by the treasurer, unique digital QR gate passes with registered event telemetry and lunch tags will be emailed to all squad members.
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Website Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsitePaymentPage;
