// Zinnia 2026 — registration step 2: prove the email works before paying.
//
// The details form created the registration record and handed back only an
// internal registration_id. We email a 6-digit code to the address the
// participant typed; entering it proves the inbox is theirs. Only then does the
// payment screen open. Nothing on this screen — before or after success — shows
// the participant code: that is released when the treasurer verifies payment.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { REGISTRATION_STEPS } from '../config/site';
import { requestOtp, saveSession, verifyRegistrationEmail } from '../lib/participant/api';
import { clearRegistrationDraft } from '../lib/participant/draft';
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

    saveSession({ token: result.token, user: result.user, expires_at: result.expires_at });

    // The address is confirmed, so there is nothing left to go back and fix.
    // Dropping the draft here stops the next registration on a shared laptop
    // from opening with this person's details already in the form.
    clearRegistrationDraft();

    // Straight to payment. The "Address confirmed" screen that used to sit here
    // only restated what the participant had just done and asked them to press
    // one more button to continue — a step that could be skipped, so it is.
    // replace: true so Back does not return to a code screen whose token has
    // already been spent.
    const paidRid = result.user?.registration_id ?? registrationId;
    navigate(`/participant/payment?rid=${encodeURIComponent(paidRid)}`, { replace: true });
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
        <header className="mb-8">
          <ComicHeading fluid>Email confirmation</ComicHeading>

          <ComicStepper steps={REGISTRATION_STEPS} current={2} className="mt-6" />
        </header>

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

            <p className="mt-3 font-mono text-[11px] leading-relaxed text-[#71767B]">
              Wrong address?{' '}
              <button
                type="button"
                onClick={() => navigate('/participant/register')}
                className="font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
              >
                Change email address
              </button>
            </p>
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
