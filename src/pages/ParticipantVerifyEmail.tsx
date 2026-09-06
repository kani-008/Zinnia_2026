// Zinnia 2026 — registration step 2: prove the email works before paying.
//
// The details form created the registration record and handed back only an
// internal registration_id. We email a 6-digit code to the address the
// participant typed; entering it proves the inbox is theirs. Only then does the
// payment screen open. Nothing on this screen — before or after success — shows
// the participant code: that is released when the treasurer verifies payment.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { REGISTRATION_STEPS } from '../config/site';
import { requestOtp, saveSession, verifyRegistrationEmail } from '../lib/participant/api';
import {
  ComicAlert,
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


export const ParticipantVerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const registrationId = (searchParams.get('rid') ?? '').trim();

  const [otp, setOtp] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);

  const otpRef = useRef<HTMLInputElement | null>(null);
  const requestedOnce = useRef(false);

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
    setEmailHint(result.email_hint);
    setCooldown(60);
    otpRef.current?.focus();
  }, [sending, registrationId]);

  // The participant typed their email one screen ago; asking them to click
  // "send" again is a wasted step, so the first code goes out automatically.
  useEffect(() => {
    if (requestedOnce.current) return;
    requestedOnce.current = true;
    void sendCode();
  }, [sendCode]);

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
    setVerified(true);
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

  if (verified) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 text-center overflow-hidden">
          <div className="mb-5 flex justify-center">
            <ComicChip tone="cyan" rotate={-2}>
              <CheckCircle2 size={12} /> Email verified
            </ComicChip>
          </div>

          <ComicHeading>Address confirmed</ComicHeading>

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#B8B8B2] sm:text-sm">
            We can reach you{emailHint ? <> at <span className="font-bold text-[#0FA9C6]">{emailHint}</span></> : null}.
            Next: the registration fee. Your registration code and master QR are issued once the
            treasurer confirms the payment.
          </p>

          <ComicStepper steps={REGISTRATION_STEPS} current={3} className="mt-6 justify-center" />

          <ComicPanel tone="cyan" className="my-8 text-left">
            <ul className="space-y-2 font-mono text-xs">
              <li className="flex items-center gap-2 text-[#0FA9C6]">
                <CheckCircle2 size={14} /> Email verified
              </li>
              <li className="flex items-center gap-2 text-[#71767B]">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#71767B]" />{' '}
                Payment — next
              </li>
              <li className="flex items-center gap-2 text-[#71767B]">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#71767B]" />{' '}
                Registration confirmed — after the treasurer verifies your payment
              </li>
            </ul>
          </ComicPanel>

          <div className="flex justify-center">
            <ComicCTA
              tone="cyan"
              fullWidth={false}
              onClick={() =>
                navigate(`/participant/payment?rid=${encodeURIComponent(registrationId)}`, {
                  replace: true,
                })
              }
            >
              Continue to payment
            </ComicCTA>
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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ComicChip tone="cyan" rotate={-2}>
              <MailCheck size={12} /> Step 2 of 4
            </ComicChip>
            <ComicChip tone="yellow" rotate={1.5}>
              Code expires in 10 min
            </ComicChip>
          </div>

          <ComicHeading>Check your email</ComicHeading>

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#B8B8B2] sm:text-sm">
            {emailHint ? (
              <>
                We sent a 6-digit code to{' '}
                <span className="font-bold text-[#0FA9C6]">{emailHint}</span>. Enter it below to
                confirm the address is yours. Payment opens only after this step.
              </>
            ) : sending ? (
              <>Sending your code…</>
            ) : (
              <>We will send a 6-digit code to the address you registered with.</>
            )}
          </p>

          <ComicStepper steps={REGISTRATION_STEPS} current={2} className="mt-6" />
        </header>

        {error && <ComicAlert tone="pink" className="mb-6">{error}</ComicAlert>}

        <form onSubmit={onVerify}>
          <ComicPanel tone="cyan">
            <ComicField
              label="6-digit code"
              htmlFor="otp"
              hint={
                <>
                  Wrong address?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/participant/register')}
                    className="font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
                  >
                    Register again with the correct email
                  </button>
                </>
              }
            >
              <ComicInput
                id="otp"
                ref={otpRef}
                inputMode="numeric"
                maxLength={6}
                className="text-center text-2xl tracking-[0.4em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
            </ComicField>
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
