import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { store } from '../services/store';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  ExternalLink,
  Users,
  QrCode,
  Mail
} from 'lucide-react';

export const WebsitePaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawTeamId = searchParams.get('id') || searchParams.get('team_id') || '';
  const initialTeamId = (rawTeamId && rawTeamId !== 'undefined' && rawTeamId !== 'null') ? rawTeamId.trim() : '';

  const [teamId, setTeamId] = useState(initialTeamId);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittedAmount, setSubmittedAmount] = useState<number | string>('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [soundFX, setSoundFX] = useState<string | null>(null);

  const triggerComicSound = (txt: string) => {
    setSoundFX(txt);
    setTimeout(() => setSoundFX(null), 900);
  };

  const UPI_ID = '9361817740@axl';
  const PAYEE_NAME = 'ZINNIA 2026 GCE ERODE';

  const loadStatus = async (targetId: string) => {
    if (!targetId || !targetId.trim() || targetId === 'undefined' || targetId === 'null') return;
    setLoading(true);
    setError(null);
    try {
      let data = await store.getPaymentStatus(targetId.trim());
      if (!data) {
        await store.syncFromSupabase();
        data = await store.getPaymentStatus(targetId.trim());
      }
      if (data) {
        // If already pending or verified, redirect to dedicated confirmation page unless editing
        const isEditMode = searchParams.get('edit') === 'true';
        if ((data.payment_status === 'PENDING_VERIFICATION' || data.payment_status === 'VERIFIED') && !isEditMode) {
          navigate(`/confirmation?id=${targetId.trim()}`, { replace: true });
          return;
        }

        const localTeam = store.getTeamById(targetId.trim());
        const count = Math.max(
          1,
          localTeam?.members?.length || 0,
          data.member_count || 0,
          Array.isArray((data as any).members) ? (data as any).members.length : 0
        );
        const totalAmount = count * 250;
        
        setPaymentInfo({
          ...data,
          member_count: count,
          expected_amount: data.expected_amount && data.expected_amount >= totalAmount ? data.expected_amount : totalAmount
        });
        setSubmittedAmount(data.expected_amount && data.expected_amount >= totalAmount ? data.expected_amount : totalAmount);
        if (data.utr_number) setUtrNumber(data.utr_number);
      } else {
        setError(`No squad registration found with Team ID: ${targetId}. Please verify your ID.`);
        setPaymentInfo(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve payment information.');
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
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    triggerComicSound('COPIED!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const localTeam = store.getTeamById(paymentInfo?.team_id || teamId);
  const memberCount = Math.max(
    1,
    localTeam?.members?.length || 0,
    paymentInfo?.member_count || 0,
    Array.isArray((paymentInfo as any)?.members) ? (paymentInfo as any).members.length : 0
  );
  const expectedAmount = Math.max(
    memberCount * 250,
    paymentInfo?.expected_amount || 0
  );
  const membersList = (localTeam?.members && localTeam.members.length > 0)
    ? localTeam.members
    : (Array.isArray(paymentInfo?.members) && paymentInfo.members.length > 0 ? paymentInfo.members : []);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalUtr = utrNumber.trim() || `TXN-${paymentInfo?.team_id || teamId}-${Date.now().toString().slice(-4)}`;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    triggerComicSound('SUBMIT!');

    try {
      await store.submitPaymentProof(paymentInfo.team_id, {
        utr_number: finalUtr,
        amount_paid: Number(submittedAmount) || expectedAmount,
      });

      setSuccessMsg(`Payment proof recorded (Ref: ${finalUtr})! Forwarded to treasurer for verification.`);
      navigate(`/confirmation?id=${paymentInfo.team_id || teamId}`);
    } catch (err: any) {
      setError(err.message || 'Error recording payment proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${expectedAmount}&cu=INR&tn=${encodeURIComponent(`ZINNIA26-${paymentInfo?.team_id || teamId}`)}`;

  const paymentStatus = paymentInfo?.payment_status || 'AWAITING_PAYMENT';
  const isVerified = paymentStatus === 'VERIFIED';
  const isPending = paymentStatus === 'PENDING_VERIFICATION';
  const isRejected = paymentStatus === 'REJECTED';

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between font-sans relative">
      {/* Floating Sound FX Popup */}
      {soundFX && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none animate-bounce">
          <div className="px-6 py-2 bg-[#E5BD00] border-2 border-[#090A0B] shadow-[5px_5px_0px_#090A0B] rotate-6 sticker-pop">
            <span className="font-display text-3xl sm:text-5xl text-[#D51F55] tracking-wider uppercase">
              {soundFX}
            </span>
          </div>
        </div>
      )}

      {/* Comic Halftone Decorator Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <div className="comic-halftone -top-12 -left-12 opacity-25 scale-75" />
        <div className="comic-halftone top-1/2 -right-16 opacity-25 scale-75" />
      </div>

      {/* Top Navbar */}
      <WebsiteNavbar />

      {/* Main Content Area */}
      <main className="relative z-10 pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6 w-full flex-1">
        
        {/* Back Navigation Button (Desktop & Mobile) */}
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
            <span>BACK TO REGISTRATION DETAILS</span>
          </button>
        </div>

        {/* Header Panel */}
        <div className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl relative overflow-visible">
          <div className="inline-block bg-[#E5BD00] text-[#090A0B] font-mono font-black text-xs uppercase tracking-wider px-3.5 py-1 border border-[#090A0B] shadow-[3px_3px_0px_#090A0B] -rotate-1 mb-3">
            ⚡ OFFICIAL PAYMENT PORTAL // ZINNIA '26
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-[#EEEEEA] tracking-tight uppercase leading-none drop-shadow-[3px_3px_0px_#090A0B]">
            REGISTRATION FEE &amp; VERIFICATION
          </h1>
          <p className="font-mono text-xs sm:text-sm text-[#0FA9C6] font-semibold tracking-wide uppercase mt-2">
            Scan via any UPI App, submit your 12-digit UTR reference, and unlock your official gate passes.
          </p>
        </div>

        {/* Team ID Search Form */}
        {!teamId && (
          <div className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[5px_5px_0px_#090A0B] rounded-2xl space-y-4 text-center">
            <div className="font-mono font-bold text-sm sm:text-base text-[#EEEEEA] uppercase tracking-wider">
              ENTER YOUR SQUAD TEAM ID TO VIEW INVOICE:
            </div>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2.5">
              <input
                type="text"
                placeholder="E.G. ZIN26-1045"
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
          <div className="p-12 text-center text-[#E5BD00] font-mono font-bold text-sm uppercase tracking-wider animate-pulse">
            ⚡ RETRIEVING PAYMENT TELEMETRY &amp; RECORDS...
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#111214] border border-[#D51F55] text-[#D51F55] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center gap-2.5 shadow-[4px_4px_0px_#090A0B]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-[#111214] border border-[#0FA9C6] text-[#0FA9C6] font-mono font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl flex items-center gap-2.5 shadow-[4px_4px_0px_#090A0B]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {teamId && paymentInfo && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Payment Card & QR */}
            <div className="lg:col-span-5 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl p-6 space-y-5 flex flex-col items-center text-center">
              <div className="w-full flex justify-between items-center pb-3 border-b border-[#EEEEEA]/20">
                <span className="font-mono text-xs font-bold text-[#B8B8B2] uppercase tracking-wider">TEAM ID</span>
                <span className="font-mono text-xs font-bold text-[#0FA9C6]">{paymentInfo.team_id}</span>
              </div>

              <div className="space-y-1">
                <div className="font-mono font-bold text-sm text-[#EEEEEA] uppercase">{paymentInfo.team_name}</div>
                <div className="font-display text-4xl sm:text-5xl text-[#E5BD00] uppercase tracking-wide drop-shadow-[3px_3px_0px_#090A0B]">
                  ₹{expectedAmount}
                </div>
                <div className="font-mono text-xs text-[#0FA9C6] font-bold uppercase tracking-wider">
                  ₹250 × {memberCount} {memberCount === 1 ? 'MEMBER' : 'MEMBERS'} (₹250 PER HEAD)
                </div>
              </div>

              {/* Official Payment QR Box */}
              <div className="w-full flex flex-col items-center space-y-2 pt-1">
                <div className="p-4 bg-[#EEEEEA] rounded-2xl border-2 border-[#090A0B] shadow-[6px_6px_0px_#090A0B] flex items-center justify-center">
                  <QRCodeSVG
                    value={upiUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    fgColor="#090A0B"
                    bgColor="#EEEEEA"
                  />
                </div>
                <span className="font-mono text-[11px] text-[#B8B8B2] font-semibold uppercase tracking-wider">
                  SCAN VIA GPAY / PHONEPE / PAYTM / ANY UPI
                </span>
              </div>

              {/* UPI ID Box */}
              <div className="w-full p-3 bg-[#08090A] border border-[#EEEEEA]/30 shadow-[3px_3px_0px_#090A0B] rounded-xl flex items-center justify-between">
                <div className="text-left font-mono">
                  <div className="text-[10px] text-[#B8B8B2] font-bold uppercase">PAY TO UPI ID</div>
                  <div className="text-xs text-[#EEEEEA] font-bold">{UPI_ID}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-mono font-bold rounded-lg text-xs uppercase border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center gap-1 cursor-pointer transition-colors active:translate-x-0.5 active:translate-y-0.5"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{copiedUpi ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="w-full text-left space-y-1.5 font-mono text-xs text-[#B8B8B2] border-t border-[#EEEEEA]/20 pt-4 uppercase font-medium tracking-wide">
                <div className="text-[#0FA9C6] font-bold">HOW TO COMPLETE PAYMENT:</div>
                <p>1. Scan the QR code above with any UPI app.</p>
                <p>2. Pay the total: <strong className="text-[#E5BD00]">₹{expectedAmount}</strong> (₹250 per squad member)</p>
                <p>3. Copy any <strong className="text-[#EEEEEA]">Transaction / UTR Number</strong> from your receipt.</p>
                <p>4. Submit the transaction number below for treasurer verification.</p>
              </div>
            </div>

            {/* Right Column: UTR Submission Form */}
            <div className="lg:col-span-7 space-y-6">
              
              <form onSubmit={handleSubmitProof} className="p-6 sm:p-8 bg-[#111214] border border-[#EEEEEA]/30 shadow-[6px_6px_0px_#090A0B] rounded-2xl space-y-5">
                
                {isRejected && paymentInfo?.rejection_reason && (
                  <div className="p-4 rounded-xl bg-[#D51F55]/15 border border-[#D51F55] text-[#D51F55] text-xs font-mono space-y-1">
                    <span className="font-bold uppercase tracking-wider block">✕ TRANSACTION REJECTED BY TREASURER:</span>
                    <p className="text-[#EEEEEA]">{paymentInfo.rejection_reason}</p>
                    <span className="text-[10px] text-[#B8B8B2] block">Please enter a valid transaction reference below.</span>
                  </div>
                )}

                <div className="border-b border-[#EEEEEA]/20 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide">
                      SUBMIT PAYMENT PROOF
                    </h3>
                    <p className="font-mono text-xs text-[#0FA9C6] uppercase font-semibold tracking-wide mt-0.5">
                      Enter any transaction reference for treasurer reconciliation
                    </p>
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs uppercase">
                  <div>
                    <label className="block text-[#B8B8B2] mb-1 font-bold tracking-wider">
                      TRANSACTION NUMBER / REFERENCE ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ENTER ANY TRANSACTION NUMBER (E.G. UPI REF, BANK ID)"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-[#08090A] border border-[#EEEEEA]/40 text-[#EEEEEA] font-mono text-sm uppercase rounded-xl shadow-[3px_3px_0px_#090A0B] focus:outline-none focus:border-[#E5BD00]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[#B8B8B2] font-bold tracking-wider">
                        TOTAL AMOUNT DUE (INR ₹)
                      </label>
                      <span className="text-[10px] text-[#E5BD00] font-mono font-bold flex items-center gap-1">
                        🔒 FIXED SQUAD FEE
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={`₹${expectedAmount}`}
                        className="w-full px-4 py-3 bg-[#17181C] border border-[#EEEEEA]/20 text-[#E5BD00] font-mono text-base font-bold rounded-xl shadow-[2px_2px_0px_#090A0B] cursor-not-allowed select-none focus:outline-none"
                      />
                    </div>
                    <span className="block text-[10px] text-[#B8B8B2] mt-1 font-mono">
                      (₹250 per member × {memberCount} registered member{memberCount > 1 ? 's' : ''})
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] font-mono font-black text-sm uppercase tracking-wider border border-[#090A0B] shadow-[4px_4px_0px_#090A0B] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>RECORDING PROOF...</span>
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

      {/* Website Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsitePaymentPage;
