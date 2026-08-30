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
  ShieldCheck, 
  ExternalLink,
  Users,
  QrCode
} from 'lucide-react';

export const WebsitePaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTeamId = searchParams.get('id') || searchParams.get('team_id') || '';

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
    if (!targetId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let data = await store.getPaymentStatus(targetId.trim());
      if (!data) {
        await store.syncFromSupabase();
        data = await store.getPaymentStatus(targetId.trim());
      }
      if (data) {
        setPaymentInfo(data);
        setSubmittedAmount(data.expected_amount || data.amount_paid || 250);
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

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setError('Please provide a valid 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    triggerComicSound('SUBMIT!');

    try {
      await store.submitPaymentProof(paymentInfo.team_id, {
        utr_number: utrNumber.trim(),
        amount_paid: Number(submittedAmount) || paymentInfo.expected_amount || 250,
      });

      setSuccessMsg('Payment proof recorded successfully! Admin review in progress.');
      await loadStatus(paymentInfo.team_id);
    } catch (err: any) {
      setError(err.message || 'Error recording payment proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const expectedAmount = paymentInfo?.expected_amount || 250;
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${expectedAmount}&cu=INR&tn=${encodeURIComponent(`ZINNIA26-${paymentInfo?.team_id || teamId}`)}`;

  const paymentStatus = paymentInfo?.payment_status || 'AWAITING_PAYMENT';
  const isVerified = paymentStatus === 'VERIFIED';
  const isPending = paymentStatus === 'PENDING_VERIFICATION';
  const isRejected = paymentStatus === 'REJECTED';

  return (
    <div className="min-h-screen bg-[#08090A] text-[#EEEEEA] flex flex-col justify-between select-none relative overflow-x-hidden">
      {/* Floating Sound FX Popup */}
      {soundFX && (
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none animate-bounce">
          <div className="px-6 py-2 bg-[#E5BD00] border-2 border-[#090A0B] shadow-[5px_5px_0px_#090A0B] rotate-6 sticker-pop">
            <span className="font-comic font-black text-3xl sm:text-5xl text-[#D51F55] tracking-wider uppercase">
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
        
        {/* Header Panel (2D Comic Panel) */}
        <div className="p-6 sm:p-8 bg-[#111214] border-2 border-[#EEEEEA] shadow-[6px_6px_0px_#090A0B] rounded-2xl relative overflow-visible">
          <div className="inline-block bg-[#E5BD00] text-[#090A0B] font-comic font-black text-xs sm:text-sm uppercase tracking-wider px-3.5 py-1 border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] -rotate-1 mb-3">
            ⚡ OFFICIAL PAYMENT PORTAL // ZINNIA '26
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-[#EEEEEA] tracking-tight uppercase leading-none drop-shadow-[3px_3px_0px_#090A0B]">
            REGISTRATION FEE &amp; VERIFICATION
          </h1>
          <p className="font-comic text-xs sm:text-sm text-[#0FA9C6] font-bold tracking-wide uppercase mt-2">
            Scan via any UPI App, submit your 12-digit UTR reference, and unlock your official gate passes.
          </p>
        </div>

        {/* Team ID Search Form */}
        {!teamId && (
          <div className="p-6 sm:p-8 bg-[#111214] border-2 border-[#EEEEEA] shadow-[5px_5px_0px_#090A0B] rounded-2xl space-y-4 text-center">
            <div className="font-comic font-black text-lg text-[#EEEEEA] uppercase tracking-wider">
              ENTER YOUR SQUAD TEAM ID TO VIEW INVOICE:
            </div>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-2.5">
              <input
                type="text"
                placeholder="E.G. ZIN26-1045"
                className="flex-1 px-4 py-3 bg-[#08090A] border-2 border-[#EEEEEA] text-[#EEEEEA] font-mono text-sm font-bold uppercase rounded-xl shadow-[3px_3px_0px_#090A0B] focus:outline-none focus:border-[#E5BD00]"
                onChange={(e) => setTeamId(e.target.value.trim().toUpperCase())}
              />
              <button
                type="button"
                onClick={() => loadStatus(teamId)}
                className="px-6 py-3 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] font-comic font-black text-sm uppercase tracking-wider border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer rounded-xl shrink-0"
              >
                FETCH INVOICE
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center text-[#E5BD00] font-comic font-black text-lg uppercase tracking-wider animate-pulse">
            ⚡ RETRIEVING PAYMENT TELEMETRY &amp; RECORDS...
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#111214] border-[2.5px] border-[#D51F55] text-[#D51F55] font-comic font-bold text-sm uppercase tracking-wider rounded-xl flex items-center gap-2.5 shadow-[4px_4px_0px_#090A0B]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-[#111214] border-[2.5px] border-[#0FA9C6] text-[#0FA9C6] font-comic font-bold text-sm uppercase tracking-wider rounded-xl flex items-center gap-2.5 shadow-[4px_4px_0px_#090A0B]">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {teamId && paymentInfo && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: 2D Comic Payment Card & QR */}
            <div className="lg:col-span-5 bg-[#111214] border-2 border-[#EEEEEA] shadow-[6px_6px_0px_#090A0B] rounded-2xl p-6 space-y-5 flex flex-col items-center text-center">
              <div className="w-full flex justify-between items-center pb-3 border-b-2 border-[#EEEEEA]/20">
                <span className="font-comic text-xs font-black text-[#B8B8B2] uppercase tracking-wider">TEAM ID</span>
                <span className="font-mono text-xs font-black text-[#0FA9C6]">{paymentInfo.team_id}</span>
              </div>

              <div className="space-y-1">
                <div className="font-comic font-black text-base text-[#B8B8B2] uppercase">{paymentInfo.team_name}</div>
                <div className="font-display text-4xl sm:text-5xl text-[#E5BD00] uppercase tracking-wide drop-shadow-[3px_3px_0px_#090A0B]">
                  ₹{expectedAmount}
                </div>
                <div className="font-comic text-xs text-[#0FA9C6] font-black uppercase tracking-wider">
                  ₹250 PER HEAD {paymentInfo.members?.length ? `(${paymentInfo.members.length} × ₹250)` : ''}
                </div>
              </div>

              {/* Official Payment QR Box */}
              <div className="w-full flex flex-col items-center space-y-2 pt-1">
                <div className="p-4 bg-[#EEEEEA] rounded-2xl border-4 border-[#090A0B] shadow-[6px_6px_0px_#090A0B] flex items-center justify-center">
                  <QRCodeSVG
                    value={upiUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    fgColor="#090A0B"
                    bgColor="#EEEEEA"
                  />
                </div>
                <span className="font-comic text-[11px] text-[#B8B8B2] font-bold uppercase tracking-wider">
                  SCAN VIA GPAY / PHONEPE / PAYTM / ANY UPI
                </span>
              </div>

              {/* UPI ID Box */}
              <div className="w-full p-3 bg-[#08090A] border-2 border-[#EEEEEA] shadow-[3px_3px_0px_#090A0B] rounded-xl flex items-center justify-between">
                <div className="text-left font-mono">
                  <div className="font-comic text-[10px] text-[#B8B8B2] font-bold uppercase">PAY TO UPI ID</div>
                  <div className="text-xs text-[#EEEEEA] font-black">{UPI_ID}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 bg-[#E5BD00] hover:bg-[#EEEEEA] text-[#090A0B] font-comic font-black rounded-lg text-xs uppercase border border-[#090A0B] shadow-[2px_2px_0px_#090A0B] flex items-center gap-1 cursor-pointer transition-colors active:translate-x-0.5 active:translate-y-0.5"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>{copiedUpi ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="w-full text-left space-y-1.5 font-comic text-xs text-[#B8B8B2] border-t-2 border-[#EEEEEA]/20 pt-4 uppercase font-bold tracking-wide">
                <div className="text-[#0FA9C6] font-black">HOW TO COMPLETE PAYMENT:</div>
                <p>1. Scan the QR code above with any UPI app.</p>
                <p>2. Pay the exact total: <strong className="text-[#E5BD00]">₹{expectedAmount}</strong></p>
                <p>3. Copy the 12-digit <strong className="text-[#EEEEEA]">UTR / Ref No</strong> from your transaction receipt.</p>
                <p>4. Enter the UTR in the verification form and submit.</p>
              </div>
            </div>

            {/* Right Column: UTR Submission & Status Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Payment Status Card */}
              <div className={`p-6 rounded-2xl border-2 shadow-[6px_6px_0px_#090A0B] ${
                isVerified 
                  ? 'bg-[#111214] border-[#0FA9C6]' 
                  : isPending 
                  ? 'bg-[#111214] border-[#E5BD00]' 
                  : isRejected 
                  ? 'bg-[#111214] border-[#D51F55]' 
                  : 'bg-[#111214] border-[#EEEEEA]'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border-2 border-[#090A0B] shadow-[2.5px_2.5px_0px_#090A0B] ${
                      isVerified ? 'bg-[#0FA9C6] text-[#090A0B]' : isPending ? 'bg-[#E5BD00] text-[#090A0B]' : isRejected ? 'bg-[#D51F55] text-[#EEEEEA]' : 'bg-[#EEEEEA] text-[#090A0B]'
                    }`}>
                      {isVerified ? <CheckCircle2 className="w-6 h-6 stroke-[2.5]" /> : isPending ? <Clock className="w-6 h-6 stroke-[2.5]" /> : <CreditCard className="w-6 h-6 stroke-[2.5]" />}
                    </div>
                    <div>
                      <span className="font-comic text-[10px] text-[#B8B8B2] uppercase font-black tracking-widest block">TELEMETRY VERIFICATION STATUS</span>
                      <h2 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide">
                        {isVerified ? '✓ PAYMENT VERIFIED' : isPending ? '⏳ AWAITING ADMIN VERIFICATION' : isRejected ? '✕ TRANSACTION REJECTED' : 'UNPAID / AWAITING PROOF'}
                      </h2>
                    </div>
                  </div>
                  <span className={`font-comic font-black text-xs uppercase px-3 py-1 border-2 border-[#090A0B] shadow-[2px_2px_0px_#090A0B] rounded-lg ${
                    isVerified ? 'bg-[#0FA9C6] text-[#090A0B]' : isPending ? 'bg-[#E5BD00] text-[#090A0B]' : isRejected ? 'bg-[#D51F55] text-[#EEEEEA]' : 'bg-[#111214] text-[#EEEEEA]'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>

                {isVerified && (
                  <div className="mt-4 pt-4 border-t-2 border-[#EEEEEA]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="font-comic text-xs text-[#0FA9C6] font-bold uppercase">
                      Official credentials authorized. Download or share your squad's gate passes.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/passport?id=${paymentInfo.team_id}`)}
                      className="px-5 py-2.5 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] font-comic font-black text-xs uppercase tracking-wider border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] flex items-center gap-1.5 cursor-pointer rounded-xl shrink-0 active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <span>OPEN PASSES</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Submit / Update Proof Form */}
              {!isVerified && (
                <form onSubmit={handleSubmitProof} className="p-6 sm:p-8 bg-[#111214] border-2 border-[#EEEEEA] shadow-[6px_6px_0px_#090A0B] rounded-2xl space-y-5">
                  <div className="border-b-2 border-[#EEEEEA]/20 pb-3">
                    <h3 className="font-display text-xl sm:text-2xl text-[#EEEEEA] uppercase tracking-wide">
                      SUBMIT UPI UTR REFERENCE
                    </h3>
                    <p className="font-comic text-xs text-[#0FA9C6] uppercase font-bold tracking-wide mt-0.5">
                      Provide transaction proof for treasurer reconciliation
                    </p>
                  </div>

                  <div className="space-y-3 font-comic font-bold text-xs uppercase">
                    <div>
                      <label className="block text-[#B8B8B2] mb-1 tracking-wider">
                        12-DIGIT UTR / TRANSACTION ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.G. 4239XXXXXXXX"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-[#08090A] border-2 border-[#EEEEEA] text-[#EEEEEA] font-mono text-sm uppercase rounded-xl shadow-[3px_3px_0px_#090A0B] focus:outline-none focus:border-[#E5BD00]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#B8B8B2] mb-1 tracking-wider">
                        AMOUNT PAID (INR ₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={submittedAmount}
                        onChange={(e) => setSubmittedAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-[#08090A] border-2 border-[#EEEEEA] text-[#EEEEEA] font-mono text-sm rounded-xl shadow-[3px_3px_0px_#090A0B] focus:outline-none focus:border-[#E5BD00]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#0FA9C6] hover:bg-[#E5BD00] text-[#090A0B] font-comic font-black text-base uppercase tracking-wider border-2 border-[#090A0B] shadow-[4px_4px_0px_#090A0B] rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>VERIFYING &amp; SUBMITTING...</span>
                    ) : (
                      <>
                        <span>{isRejected ? 'RESUBMIT PAYMENT PROOF' : isPending ? 'UPDATE UTR DETAILS' : 'SUBMIT PAYMENT PROOF'}</span>
                        <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>
              )}

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
