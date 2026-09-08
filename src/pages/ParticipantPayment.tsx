// Zinnia 2026 — registration steps 6-9: payment and the status hub.
//
// Keyed by the internal registration_id (?rid=). Submitting a UTR + screenshot
// COMPLETES the registration: the dashboard and all nine events open at that
// moment, and the participant is sent on to pick events rather than left
// waiting. The treasurer's later verdict releases only the pass — the
// registration code, the master QR and the WhatsApp group link — which the
// server hands over solely in the REGISTRATION_CONFIRMED state. Refreshing,
// revisiting or resubmitting creates no duplicate record: the server updates
// the one payment row.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Copy,
  Hourglass,
  ImagePlus,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';

import { QRCodeSVG } from 'qrcode.react';
import { WebsiteNavbar } from '../components/layout/Navbar';
import {
  REGISTRATION_FEE_PER_HEAD,
  REGISTRATION_STEPS,
  TREASURER_PAYMENT_CONFIG,
} from '../config/site';
import { getPaymentStatus, submitPayment } from '../lib/participant/api';
import type { PaymentStatusData } from '../lib/participant/types';
import {
  ComicAlert,
  ComicBolt,
  ComicCTA,
  ComicChip,
  ComicField,
  ComicGhostButton,
  ComicHeading,
  ComicInput,
  ComicPageShell,
  ComicPanel,
  ComicStepper,
} from '../components/ui/comic';
import { useToastOn } from '../components/ui/toast';

// A UPI UTR is exactly 12 digits — no letters, no spaces.
const UTR_REGEX = /^\d{12}$/;
const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

export const ParticipantPaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const registrationId = (searchParams.get('rid') ?? '').trim();
  // Legacy links carried ?user_id=; the status endpoint still accepts it.
  const legacyUserId = (searchParams.get('user_id') ?? '').trim().toUpperCase();

  const [status, setStatus] = useState<PaymentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [utr, setUtr] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);
  // Which field a validation complaint belongs to. The page-level alert sits
  // above a long form, so on a phone it scrolls out of sight and pressing
  // Submit looks like it did nothing at all.
  const [fieldError, setFieldError] = useState<'utr' | 'screenshot' | null>(null);

  /** Put the message on the field and bring that field into view. */
  const failField = (field: 'utr' | 'screenshot', message: string) => {
    setError(message);
    setFieldError(field);
    const target =
      field === 'utr'
        ? document.getElementById('utr')
        : document.querySelector('label[for="screenshot"]');
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (field === 'utr') (target as HTMLInputElement | null)?.focus({ preventScroll: true });
  };
  const [showForm, setShowForm] = useState(false);

  const rid = status?.registration_id ?? registrationId;

  const load = useCallback(async () => {
    if (!registrationId && !legacyUserId) {
      setError('This link is missing its registration reference. Start again from the registration form.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getPaymentStatus(
      registrationId ? { registration_id: registrationId } : { user_id: legacyUserId },
    );
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Payment is refused server-side for an unverified address; route them to
    // the code step instead of letting them hit that wall on submit.
    if (!result.email_verified) {
      navigate(`/participant/verify?rid=${encodeURIComponent(result.registration_id)}`, {
        replace: true,
      });
      return;
    }

    setStatus(result);
    if (result.payment?.txn_ref) setUtr(result.payment.txn_ref);
  }, [registrationId, legacyUserId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(TREASURER_PAYMENT_CONFIG.upiId ?? '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is blocked in some mobile browsers; the ID is on screen anyway.
    }
  };

  const pickProof = (file: File | null) => {
    setError(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    if (!file) {
      setProof(null);
      setProofPreview(null);
      return;
    }
    if (!PROOF_TYPES.includes(file.type)) {
      setProof(null);
      setProofPreview(null);
      setError('Upload the payment screenshot as a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      setProof(null);
      setProofPreview(null);
      setError('The screenshot is larger than 5 MB - crop it or export it smaller.');
      return;
    }
    setProof(file);
    setProofPreview(URL.createObjectURL(file));
    setFieldError((f) => (f === 'screenshot' ? null : f));
    setError(null);
  };

  // upi://pay is the standard intent every Indian UPI app understands.
  // Amount and note are prefilled so the participant cannot mistype either.
  // pa is NOT percent-encoded: a VPA is already URL-safe, and turning its "@"
  // into %40 makes some UPI apps fail to parse the intent. Matches the legacy
  // payment page, which has been scanned in production.
  const upiLink = `upi://pay?pa=${TREASURER_PAYMENT_CONFIG.upiId ?? ''}`
    + `&pn=${encodeURIComponent(TREASURER_PAYMENT_CONFIG.payeeName ?? '')}`
    + `&am=${status?.expected_amount || REGISTRATION_FEE_PER_HEAD}`
    + `&cu=INR`
    + `&tn=${encodeURIComponent('ZINNIA26 ' + (status?.user_id || ''))}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !rid) return;

    setFieldError(null);

    const cleaned = utr.trim();
    if (!UTR_REGEX.test(cleaned)) {
      failField('utr', 'The transaction number is 12 digits, numbers only.');
      return;
    }

    const proofOnFile = Boolean(status?.payment?.screenshot_url);
    if (!proof && !proofOnFile) {
      failField('screenshot', 'Attach a screenshot of the payment — the treasurer verifies against it.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await submitPayment({
      registration_id: rid,
      utr_number: cleaned,
      submitted_amount: REGISTRATION_FEE_PER_HEAD,
      screenshot: proof,
    });

    setSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Do not assume success. Re-read the server's view of the registration; it
    // will say PAYMENT_RECEIVED until the treasurer has actually verified it.
    setShowForm(false);
    pickProof(null);
    await load();
  };

  /* ---------------------------------------------------------------- states */

  if (loading) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#0FA9C6]" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#71767B]">
            Loading registration status
          </p>
        </div>
      </ComicPageShell>
    );
  }

  if (!status) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl px-5 pt-32 text-center">
          <ComicAlert tone="pink" className="text-left">
            {error ?? 'Could not load your registration.'}
          </ComicAlert>
          <div className="mt-6 flex justify-center gap-3">
            <ComicGhostButton tone="cyan" onClick={() => void load()}>
              Try again
            </ComicGhostButton>
            <ComicGhostButton tone="pink" onClick={() => navigate('/participant/register')}>
              Register
            </ComicGhostButton>
          </div>
        </main>
      </ComicPageShell>
    );
  }

  const confirmed = status.registration_status === 'REGISTRATION_CONFIRMED';
  const received = status.registration_status === 'PAYMENT_RECEIVED';
  const failed = status.registration_status === 'PAYMENT_FAILED';

  // ---- 9. Confirmed: the only screen that shows the code -------------------
  if (confirmed) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 text-center overflow-hidden">
          <div className="mb-5 flex justify-center">
            <ComicChip tone="cyan" rotate={-2}>
              <ComicBolt tone="cyan" className="w-3 h-3" /> Registration confirmed
            </ComicChip>
          </div>

          <ComicHeading>You&apos;re in</ComicHeading>

          <ComicStepper steps={REGISTRATION_STEPS} current={5} className="mt-6 justify-center" />

          <ComicPanel tone="cyan" className="mt-8 text-left">
            <ul className="space-y-2 font-mono text-xs text-[#0FA9C6]">
              <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Email verified</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Payment verified</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Registration confirmed</li>
            </ul>
          </ComicPanel>

          <ComicPanel tone="yellow" className="my-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">
              Your registration code
            </p>
            <p className="mt-2 select-all font-comic text-3xl font-black tracking-wider text-[#E5BD00] sm:text-4xl">
              {status.user_id}
            </p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#71767B]">
              This is how you log in and how teammates add you to their team. It is also in your
              confirmation email together with your master QR.
            </p>
          </ComicPanel>

          {status.whatsapp_url && (
            <ComicPanel tone="cyan" className="mb-8">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">
                WhatsApp group
              </p>
              <p className="mt-2 font-mono text-xs leading-relaxed text-[#B8B8B2]">
                Schedule changes and day-of announcements land here first.
              </p>
              <div className="mt-4 flex justify-center">
                <a
                  href={status.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-[#25D366] bg-[#25D366] px-5 py-2.5 font-comic text-sm uppercase tracking-wider text-[#08090A] shadow-[4px_4px_0px_#090A0B] btn-comic transition-transform hover:-translate-y-0.5"
                >
                  <MessageCircle size={16} /> Join WhatsApp group
                </a>
              </div>
            </ComicPanel>
          )}

          <div className="flex justify-center">
            <ComicCTA tone="cyan" fullWidth={false} onClick={() => navigate('/participant/dashboard')}>
              Go to dashboard
            </ComicCTA>
          </div>
        </main>
      </ComicPageShell>
    );
  }

  // ---- 8. Received, awaiting the treasurer: no code ------------------------
  if (received && !showForm) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 text-center overflow-hidden">
          <div className="mb-5 flex justify-center">
            <ComicChip tone="cyan" rotate={-2}>
              <CheckCircle2 size={12} /> Registration complete
            </ComicChip>
          </div>

          <ComicHeading>You&apos;re registered</ComicHeading>

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#B8B8B2] sm:text-sm">
            That is everything we need from you. All nine events are open — head to your dashboard
            and pick yours now. Your master QR and the WhatsApp group link arrive once the treasurer
            confirms the payment; nothing is waiting on that in the meantime.
          </p>

          <ComicStepper steps={REGISTRATION_STEPS} current={4} className="mt-6 justify-center" />

          {/* The UserID is how they get back in — email login no longer exists —
              so it is shown here the moment registration completes, and emailed. */}
          {status.user_id && (
            <ComicPanel tone="cyan" className="mt-8">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">
                Your UserID
              </p>
              <p className="mt-2 select-all font-comic text-3xl font-black tracking-wider text-[#0FA9C6] sm:text-4xl">
                {status.user_id}
              </p>
              <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#71767B]">
                This is how you log in, and how teammates add you to their team. It is in your
                confirmation email too — keep that email.
              </p>
            </ComicPanel>
          )}

          <ComicPanel tone="yellow" className="my-8 text-left">
            <ul className="space-y-2 font-mono text-xs">
              <li className="flex items-center gap-2 text-[#0FA9C6]"><CheckCircle2 size={14} /> Email verified</li>
              <li className="flex items-center gap-2 text-[#0FA9C6]"><CheckCircle2 size={14} /> Registration complete — event selection open</li>
              <li className="flex items-center gap-2 text-[#E5BD00]"><Hourglass size={14} /> Master QR &amp; group link — treasurer verification pending</li>
            </ul>
            <div className="mt-4 border-t-2 border-[#23262D] pt-4 font-mono text-[11px] text-[#B8B8B2]">
              Reference <span className="font-bold text-[#EEEEEA]">{status.payment?.txn_ref}</span>
              {status.payment?.screenshot_url ? ' · proof uploaded' : ''}
            </div>
          </ComicPanel>

          <div className="flex justify-center">
            <ComicCTA tone="cyan" fullWidth={false} onClick={() => navigate('/participant/dashboard')}>
              Pick your events
            </ComicCTA>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <ComicGhostButton tone="cyan" onClick={() => void load()} className="inline-flex items-center gap-1.5">
              <RefreshCw size={14} /> Check status
            </ComicGhostButton>
            <ComicGhostButton tone="yellow" onClick={() => setShowForm(true)}>
              Submit a different reference
            </ComicGhostButton>
          </div>
        </main>
      </ComicPageShell>
    );
  }

  // ---- 6-7. The payment form (first time, retry after failure, or resubmit) --
  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-2xl w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 overflow-hidden">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ComicChip tone="cyan" rotate={1.5}>
              <CheckCircle2 size={12} /> Email verified
            </ComicChip>
          </div>

          <ComicHeading>Pay the registration fee</ComicHeading>

          <p className="mt-4 font-mono text-xs text-[#B8B8B2] sm:text-sm">
            {status.name} · submitting the reference below completes your registration and opens
            event selection straight away.
          </p>

          <ComicStepper steps={REGISTRATION_STEPS} current={3} className="mt-6" />
        </header>

        {failed && (
          <ComicAlert tone="pink" className="mb-6">
            <p className="font-bold uppercase tracking-wide">Payment was not completed. Please try again.</p>
            {status.payment?.reject_reason && (
              <p className="mt-1 text-[#B8B8B2]">{status.payment.reject_reason}</p>
            )}
            <p className="mt-2 text-[#B8B8B2]">
              Your registration is held, not cancelled — resubmit the correct reference below.
            </p>
          </ComicAlert>
        )}


        <ComicPanel tone="yellow" className="mb-6">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">
              Amount payable
            </span>
            <span className="font-comic text-3xl font-black text-[#E5BD00] sm:text-4xl">
              ₹{status.expected_amount || REGISTRATION_FEE_PER_HEAD}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-[#71767B]">
            Flat fee per participant — it does not change with how many events you enter.
          </p>

          <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="w-full max-w-[280px] shrink-0 bg-white p-3 border-[3px] border-[#090A0B] shadow-[5px_5px_0px_#090A0B] -rotate-1 sticker-pop sm:w-[240px]">
              {/* Built from TREASURER_PAYMENT_CONFIG, the same source as the UPI
                  id printed beside it. A static image could not follow that
                  config, so scanning and copying could pay different accounts. */}
              <QRCodeSVG
                value={upiLink}
                level="M"
                className="block h-auto w-full"
                aria-label={`UPI payment QR for ${TREASURER_PAYMENT_CONFIG.payeeName}`}
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">UPI ID</p>
                <button
                  onClick={copyUpi}
                  className="mt-1 flex items-center gap-2 font-mono text-sm font-bold text-[#EEEEEA] transition-colors hover:text-[#0FA9C6]"
                >
                  {TREASURER_PAYMENT_CONFIG.upiId || '—'}
                  {copied ? <Check size={14} className="text-[#0FA9C6]" /> : <Copy size={14} className="text-[#71767B]" />}
                </button>
              </div>
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">Payee</p>
                <p className="mt-1 font-mono text-sm text-[#EEEEEA]">{TREASURER_PAYMENT_CONFIG.payeeName || '—'}</p>
              </div>
              <p className="font-mono text-[11px] leading-relaxed text-[#71767B]">
                Scan with any UPI app, or pay to the ID above. Then enter the transaction reference
                and attach the success screenshot below.
              </p>
            </div>
          </div>
        </ComicPanel>

        <form onSubmit={onSubmit}>
          <ComicPanel tone="cyan" bodyClassName="space-y-6">
            <ComicField
              error={fieldError === 'utr' ? error : null}
              label="UTR / transaction reference"
              htmlFor="utr"
              hint="12 digits. Your payment app calls this the UTR, RRN, or transaction ID."
            >
              <ComicInput
                id="utr"
                value={utr}
                inputMode="numeric"
                maxLength={12}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="12-digit transaction number"
                required
              />
            </ComicField>

            <ComicField
              label="Payment screenshot"
              htmlFor="screenshot"
              error={fieldError === 'screenshot' ? error : null}
              hint={
                status.payment?.screenshot_url && !proof
                  ? 'A screenshot is already on file. Choose a new one only if you want to replace it.'
                  : 'The success screen from your UPI app showing the amount and reference. JPG, PNG or WEBP, up to 5 MB.'
              }
            >
              <input
                id="screenshot"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => pickProof(e.target.files?.[0] ?? null)}
              />

              {proof && proofPreview ? (
                <div className="flex items-center gap-4 rounded-2xl border border-[#0FA9C6] bg-[#111214] p-3">
                  <img src={proofPreview} alt="Payment screenshot preview" className="h-20 w-20 shrink-0 rounded-xl border border-[#23262D] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-bold text-[#EEEEEA]">{proof.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#71767B]">{(proof.size / 1024).toFixed(0)} KB · ready to upload</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => pickProof(null)}
                    title="Remove"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#0FA9C6]/20 text-[#71767B] transition-colors hover:border-[#D51F55] hover:text-[#D51F55]"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="screenshot"
                  className="flex cursor-pointer items-center justify-center gap-3 rounded-full border border-dashed border-[#0FA9C6]/40 bg-[#111214] px-5 py-4 font-mono text-xs text-[#B8B8B2] transition-colors hover:border-[#0FA9C6] hover:text-[#EEEEEA]"
                >
                  <ImagePlus size={16} className="text-[#0FA9C6]" />
                  {status.payment?.screenshot_url ? 'Replace the screenshot on file' : 'Tap to choose the payment screenshot'}
                </label>
              )}
            </ComicField>
          </ComicPanel>

          <div className="mt-7">
            <ComicCTA type="submit" tone="cyan" disabled={submitting} arrow={!submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Submitting…
                </span>
              ) : status.payment_submitted ? (
                'Resubmit payment reference'
              ) : (
                'Submit payment'
              )}
            </ComicCTA>
          </div>

          {showForm && (
            <div className="mt-4 text-center">
              <ComicGhostButton tone="cyan" onClick={() => setShowForm(false)}>
                Back to status
              </ComicGhostButton>
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 font-mono text-[11px] leading-relaxed text-[#71767B]">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#0FA9C6]" />
            Submitting completes your registration — event selection opens immediately. The
            treasurer then verifies the payment against the screenshot, which is what releases
            your registration code, master QR and the WhatsApp group link.
          </p>
        </form>
      </main>
    </ComicPageShell>
  );
};

export default ParticipantPaymentPage;
