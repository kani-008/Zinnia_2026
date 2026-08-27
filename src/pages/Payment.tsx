import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { store } from '../services/store';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight,
  Sparkles,
  QrCode,
  RefreshCw
} from 'lucide-react';

export const WebsitePaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamIdParam = searchParams.get('id') || searchParams.get('team_id') || '';

  const [teamId, setTeamId] = useState(teamIdParam);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittedAmount, setSubmittedAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const UPI_ID = 'zinnia2026@okhdfcbank';
  const PAYEE_NAME = 'ZINNIA 2026 SYMPOSIUM';

  const loadStatus = async (tId: string) => {
    if (!tId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await store.getPaymentStatusApi(tId);
    if (data.success) {
      setPaymentInfo(data);
      if (data.expected_amount) {
        setSubmittedAmount(String(data.expected_amount));
      }
      if (data.utr_number) {
        setUtrNumber(data.utr_number);
      }
    } else {
      setError(data.message || 'Could not locate team registration.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (teamIdParam) {
      setTeamId(teamIdParam);
      loadStatus(teamIdParam);
    } else {
      const cur = store.getCurrentTeam();
      if (cur?.team_id) {
        setTeamId(cur.team_id);
        loadStatus(cur.team_id);
      } else {
        setLoading(false);
      }
    }
  }, [teamIdParam]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanUtr = utrNumber.trim().toUpperCase();
    const amountVal = parseFloat(submittedAmount);

    if (!cleanUtr || cleanUtr.length < 6) {
      setError('Please enter a valid UTR / Transaction Reference (minimum 6 characters).');
      return;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    const res = await store.submitPaymentApi(teamId, cleanUtr, amountVal);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg('Payment details submitted successfully! Awaiting symposium admin verification.');
      await loadStatus(teamId);
    } else {
      setError(res.message || 'Payment submission failed. Please verify UTR details.');
    }
  };

  // UPI payment deep link URL
  const expectedAmount = paymentInfo?.expected_amount || 0;
  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${expectedAmount}&cu=INR&tn=${encodeURIComponent(`Zinnia_${teamId}`)}`;

  const paymentStatus = paymentInfo?.payment_status || 'AWAITING_PAYMENT';
  const isVerified = paymentStatus === 'VERIFIED';
  const isPending = paymentStatus === 'PENDING_VERIFICATION';
  const isRejected = paymentStatus === 'REJECTED';

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl space-y-2 shadow-2xl">
        <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
          <CreditCard className="w-3.5 h-3.5" />
          <span>PAYMENT PORTAL // ZINNIA '26</span>
        </div>
        <h1 className="text-3xl font-black text-white font-mono">REGISTRATION FEE & VERIFICATION</h1>
        <p className="text-xs text-slate-400 font-light">
          Complete your UPI payment and submit the UTR transaction reference for symposium admin verification.
        </p>
      </div>

      {/* Team ID Search Fallback if missing */}
      {!teamId && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-center">
          <p className="text-xs text-slate-400">Enter your Team ID to view and submit payment details:</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="text"
              placeholder="e.g. ZIN-2026-1045"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
              onChange={(e) => setTeamId(e.target.value.trim().toUpperCase())}
            />
            <button
              onClick={() => loadStatus(teamId)}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs rounded-xl transition-colors cursor-pointer"
            >
              FETCH
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-cyan-400 font-mono text-xs animate-pulse">
          FETCHING PAYMENT TELEMETRY & RECORDS...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/90 border border-rose-500 text-rose-300 text-xs font-mono rounded-2xl flex items-center gap-2.5 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-mono rounded-2xl flex items-center gap-2.5 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {teamId && paymentInfo && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Payment Details & QR Code */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col items-center text-center shadow-xl">
            <div className="w-full flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">TEAM REGISTRATION</span>
              <span className="text-[11px] font-mono font-bold text-cyan-400">{paymentInfo.team_id}</span>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-sans">{paymentInfo.team_name}</div>
              <div className="text-3xl font-black text-white font-mono text-emerald-400">
                ₹{expectedAmount}
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase">OFFICIAL REGISTRATION TOTAL</div>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-slate-200">
              <QRCodeSVG
                value={upiUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* UPI ID Pill */}
            <div className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-500">PAY VIA UPI ID</div>
                <div className="text-xs text-white font-bold">{UPI_ID}</div>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Step Instructions */}
            <div className="w-full text-left space-y-2 text-[11px] text-slate-400 font-sans border-t border-slate-800 pt-3">
              <div className="font-mono text-[10px] text-cyan-400 font-bold">PAYMENT STEPS:</div>
              <p>1. Scan the QR with Google Pay, PhonePe, or Paytm.</p>
              <p>2. Pay exact amount: <strong className="text-white">₹{expectedAmount}</strong>.</p>
              <p>3. Note down the 12-digit <strong className="text-white">UTR / Ref No</strong>.</p>
              <p>4. Enter details in the form on the right and submit.</p>
            </div>
          </div>

          {/* Right Column: Status & UTR Submission Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Status Card */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md shadow-xl ${
              isVerified ? 'bg-emerald-950/40 border-emerald-500/60' :
              isPending ? 'bg-amber-950/40 border-amber-500/60' :
              isRejected ? 'bg-rose-950/40 border-rose-500/60' :
              'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isVerified && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                  {isPending && <Clock className="w-6 h-6 text-amber-400 animate-pulse" />}
                  {isRejected && <AlertCircle className="w-6 h-6 text-rose-400" />}
                  {!isVerified && !isPending && !isRejected && <CreditCard className="w-6 h-6 text-cyan-400" />}

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">PAYMENT STATUS</div>
                    <div className={`text-base font-black font-mono ${
                      isVerified ? 'text-emerald-300' :
                      isPending ? 'text-amber-300' :
                      isRejected ? 'text-rose-300' :
                      'text-cyan-300'
                    }`}>
                      {isVerified && 'PAYMENT VERIFIED & APPROVED'}
                      {isPending && 'PENDING ADMIN VERIFICATION'}
                      {isRejected && 'PAYMENT REJECTED'}
                      {!isVerified && !isPending && !isRejected && 'AWAITING PAYMENT SUBMISSION'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => loadStatus(teamId)}
                  className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Refresh Status"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Rejection Note */}
              {isRejected && paymentInfo.rejection_reason && (
                <div className="mt-4 p-3 bg-rose-950 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-sans">
                  <strong>Reason from Admin:</strong> {paymentInfo.rejection_reason}
                  <p className="text-[11px] text-rose-400/80 mt-1">Please verify your transaction statement and re-submit the correct UTR.</p>
                </div>
              )}

              {/* Verified Action Link */}
              {isVerified && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs text-emerald-200">
                    Your team payment has been verified by the symposium committee. Your digital QR passports have been issued!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/passport?id=${teamId}`)}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
                  >
                    <span>VIEW DIGITAL PASSPORT PASSES</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Submission Form (Shown when AWAITING_PAYMENT or REJECTED or PENDING edit) */}
            {!isVerified && (
              <form onSubmit={handleSubmitPayment} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-xl">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    SUBMIT TRANSACTION REFERENCE (UTR)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter the transaction reference from your UPI app receipt after making the transfer.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      UTR / TRANSACTION REFERENCE NUMBER *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 405612348901 (12 digits)"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      AMOUNT PAID (INR ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 500"
                      value={submittedAmount}
                      onChange={(e) => setSubmittedAmount(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold font-mono text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>VERIFYING & SUBMITTING...</span>
                  ) : (
                    <>
                      <span>{isRejected ? 'RESUBMIT PAYMENT PROOF' : isPending ? 'UPDATE UTR DETAILS' : 'SUBMIT PAYMENT PROOF'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsitePaymentPage;
