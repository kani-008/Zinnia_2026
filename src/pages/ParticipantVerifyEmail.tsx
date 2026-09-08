// Zinnia 2026 — registration step 2: prove the email works before paying.
//
// The details form created the registration record and handed back only an
// internal registration_id. We email a 6-digit code to the address the
// participant typed; entering it proves the inbox is theirs. Only then does the
// payment screen open. Nothing on this screen — before or after success — shows
// the participant code: that is released when the treasurer verifies payment.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { REGISTRATION_STEPS, REGISTRATION_USER_MANUAL_URL } from '../config/site';
import { requestOtp, verifyRegistrationEmail } from '../lib/participant/api';
import {
  ComicAlert,
  ComicCTA,
  ComicGhostButton,
  ComicHeading,
  ComicInput,
  ComicPageShell,
  ComicPanel,
  ComicStepper,
} from '../components/ui/comic';
import { useToastOn } from '../components/ui/toast';


export const ParticipantVerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Stateful, not a plain read of ?rid=: while the registration is still
  // pending, a resend mints a NEW token carrying the new code's hash, and the
  // old one stops verifying. Verification then swaps in the real registration
  // id of the row it just created.
  const [registrationId, setRegistrationId] = useState(
    () => (searchParams.get('rid') ?? '').trim(),
  );

  const [otp, setOtp] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);
  const [cooldown, setCooldown] = useState(0);

  const otpRef = useRef<HTMLInputElement | null>(null);
  const requestedOnce = useRef(false);

  // Set only when the details form navigated here, so a refresh or a pasted
  // link still gets a code sent automatically.
  const handoff = useLocation().state as { codeSent?: boolean; emailHint?: string } | null;
  const codeAlreadySent = Boolean(handoff?.codeSent);

  const sendCode = useCallback(async () => {
    if (sending || !registrationId) return;
    setSending(true);
    setError(null);

    const result = await requestOtp({ registration_id: registrationId });
    setSending(false);

    if (!result.success) {
      setError(result.message);
      return;
    }
    // Carry the refreshed pending token forward, or the code that just went out
    // will not match the one this page still holds.
    if (result.registration_id) setRegistrationId(result.registration_id);
    setEmailHint(result.email_hint);
    setCooldown(60);
    otpRef.current?.focus();
  }, [sending, registrationId]);

  // The participant typed their email one screen ago; asking them to click
  // "send" again is a wasted step, so the first code goes out automatically —
  // UNLESS the details form already sent one on its way here, which it flags
  // through navigation state. Requesting again there mailed a second code and
  // invalidated the first, so whichever arrived first no longer worked.
  useEffect(() => {
    if (requestedOnce.current) return;
    requestedOnce.current = true;

    if (codeAlreadySent) {
      if (handoff?.emailHint) setEmailHint(handoff.emailHint);
      setCooldown(60);
      otpRef.current?.focus();
      return;
    }

    void sendCode();
  }, [sendCode, codeAlreadySent, handoff]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying || otp.length !== 6) return;

    setVerifying(true);
    setError(null);

    const result = await verifyRegistrationEmail(registrationId, otp.trim());
    setVerifying(false);

    if (!result.success) {
      // Wrong / expired / locked code: the flow does not move. Payment stays closed.
      setError(result.message);
      setOtp('');
      return;
    }

    // No session yet: the registration does not exist until the payment is
    // submitted, so there is no UserID to bind one to. Payment issues it.

    // The draft is deliberately NOT dropped here. Verifying the address no
    // longer finishes the registration — payment does — so the details still
    // have to survive a trip back to the form until then. Payment clears it.

    // Straight to payment. The "Address confirmed" screen that used to sit here
    // only restated what the participant had just done and asked them to press
    // one more button to continue — a step that could be skipped, so it is.
    //
    // The details ride along in navigation state so the payment screen can
    // paint immediately: with no row in the database there is nothing for it to
    // fetch, and it should not sit on a loading state waiting to find that out.
    // replace: true so Back does not return to a spent code screen.
    const paidRid = result.registration_id ?? registrationId;
    navigate(`/participant/payment?rid=${encodeURIComponent(paidRid)}`, {
      replace: true,
      state: { details: result.details },
    });
  };

  if (!registrationId) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl px-5 pt-32 text-center">
          <ComicAlert tone="pink" className="text-left">
            This link is missing its registration reference. Start again from the registration form.
          </ComicAlert>
          <div className="mt-6 flex justify-center">
            <ComicGhostButton tone="cyan" onClick={() => navigate('/participant/register')}>
              Back to registration
            </ComicGhostButton>
          </div>
        </main>
      </ComicPageShell>
    );
  }

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-md w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 overflow-hidden">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <ComicHeading fluid>Email confirmation</ComicHeading>
            <a
              href={REGISTRATION_USER_MANUAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-lg border border-[#E5BD00]/50 bg-[#E5BD00]/10 hover:bg-[#E5BD00]/20 text-[#E5BD00] font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:scale-[1.02] shadow-[2px_2px_0px_#090A0B]"
            >
              <BookOpen size={14} className="shrink-0" />
              <span>User Manual</span>
              <ExternalLink size={12} className="shrink-0 opacity-80" />
            </a>
          </div>

          <ComicStepper steps={REGISTRATION_STEPS} current={2} className="mt-6" />
        </header>

        {/* User Manual Guidance Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#111214] border border-[#0FA9C6]/30 shadow-[3px_3px_0px_#090A0B]">
          <div className="flex items-center gap-2.5 text-xs font-mono text-[#B8B8B2]">
            <BookOpen size={15} className="text-[#0FA9C6] shrink-0" />
            <span>Need help verifying email? Check the user manual.</span>
          </div>
          <a
            href={REGISTRATION_USER_MANUAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#0FA9C6] hover:text-[#EEEEEA] transition-colors uppercase tracking-wider"
          >
            <span>Open Guide</span>
            <ExternalLink size={12} />
          </a>
        </div>

        <form onSubmit={onVerify}>
          <ComicPanel tone="cyan">
            {/* The instruction moved inside the panel, next to the field it is
                about. The visible "6-digit code" label went with it — the copy
                below and the 000000 placeholder already say what goes here — so
                the input carries its name for assistive tech instead. */}
            <p id="otp-help" className="mb-4 font-mono text-xs leading-relaxed text-[#B8B8B2]">
              {emailHint ? (
                <>
                  We have sent the code to{' '}
                  <span className="font-bold text-[#0FA9C6]">{emailHint}</span> — enter the code to
                  confirm the address.
                </>
              ) : sending ? (
                <>Sending your code…</>
              ) : (
                <>
                  We have sent the code to the address you registered with — enter the code to
                  confirm the address.
                </>
              )}
            </p>

            <ComicInput
              id="otp"
              ref={otpRef}
              aria-label="6-digit code"
              aria-describedby="otp-help"
              inputMode="numeric"
              maxLength={6}
              className="text-center text-2xl tracking-[0.4em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoComplete="one-time-code"
              required
            />

            {/* Right-aligned on its own row: the link is an escape hatch, not
                part of the instruction above the field. */}
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/participant/register')}
                className="font-mono text-[11px] font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
              >
                Change email?
              </button>
            </div>
          </ComicPanel>

          <div className="mt-7">
            <ComicCTA
              type="submit"
              tone="cyan"
              disabled={verifying || otp.length !== 6}
              arrow={!verifying}
            >
              {verifying ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Verifying…
                </span>
              ) : (
                'Verify email'
              )}
            </ComicCTA>
          </div>

          <div className="mt-5 flex items-center justify-center font-mono text-[11px]">
            <button
              type="button"
              disabled={cooldown > 0 || sending}
              onClick={() => void sendCode()}
              className="uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00] disabled:no-underline disabled:text-[#71767B] disabled:opacity-40"
            >
              {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      </main>
    </ComicPageShell>
  );
};

export default ParticipantVerifyEmailPage;
