// Zinnia 2026 — participant login (§4.2): UserID + emailed OTP.
//
// One way in. The UserID is the sole credential; logging in with the
// registered email address was removed, here and on the server. The UserID
// reaches the participant in their registration confirmation email, which is
// sent the moment they submit their payment reference, so every registered
// participant has one regardless of whether the treasurer has got to them yet.
//
// The emailed 6-digit code is the second factor, not an identifier: it proves
// the person holding the UserID also holds the inbox it was sent to.

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, Mail } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { requestOtp, saveSession, verifyOtp } from '../lib/participant/api';
import type { OtpIdentifier } from '../lib/participant/types';
import {
  ComicCTA,
  ComicChip,
  ComicField,
  ComicHeading,
  ComicInput,
  ComicPageShell,
  ComicPanel,
} from '../components/ui/comic';
import { useToastOn } from '../components/ui/toast';

type Step = 'identify' | 'otp';

export const ParticipantLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetId = (searchParams.get('user_id') ?? '').toUpperCase();
  const [step, setStep] = useState<Step>('identify');
  const [userId, setUserId] = useState(presetId);
  const [otp, setOtp] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);
  const [cooldown, setCooldown] = useState(0);

  const otpRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const identifier = (): OtpIdentifier => ({ user_id: userId.trim().toUpperCase() });

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await requestOtp(identifier());
    setBusy(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setEmailHint(result.email_hint);
    setStep('otp');
    setCooldown(60);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await verifyOtp(identifier(), otp.trim());
    setBusy(false);

    if (!result.success) {
      setError(result.message);
      setOtp('');
      return;
    }

    saveSession({ token: result.token, user: result.user, expires_at: result.expires_at });
    navigate('/participant/dashboard', { replace: true });
  };

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-md px-5 pb-24 pt-28">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ComicChip tone="cyan" rotate={-2}>
              <KeyRound size={12} /> Participant login
            </ComicChip>
          </div>

          <ComicHeading>{step === 'identify' ? 'Log in' : 'Enter your code'}</ComicHeading>

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#B8B8B2] sm:text-sm">
            {step === 'identify' ? (
              <>
                Log in with the UserID from your registration email. There is no password — we
                email a 6-digit code to the address you registered with to confirm it is you.
              </>
            ) : (
              <>
                We sent a 6-digit code to{' '}
                <span className="font-bold text-[#0FA9C6]">{emailHint}</span>. It expires in 10
                minutes.
              </>
            )}
          </p>
        </header>


        {step === 'identify' ? (
          <form onSubmit={sendCode}>
            <ComicPanel tone="cyan">
              <ComicField
                label="Your UserID"
                htmlFor="user_id"
                hint="It looks like ZIN26-0142. We emailed it to you when your registration completed."
              >
                <ComicInput
                  id="user_id"
                  className="text-center text-xl tracking-[0.2em]"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value.toUpperCase())}
                  placeholder="ZIN26-0142"
                  autoComplete="username"
                  required
                />
              </ComicField>
            </ComicPanel>

            <div className="mt-7">
              <ComicCTA type="submit" tone="cyan" disabled={busy} arrow={!busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Sending code…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Mail size={16} /> Send my login code
                  </span>
                )}
              </ComicCTA>
            </div>

            <p className="mt-5 text-center font-mono text-[11px] leading-relaxed text-[#71767B]">
              Lost your UserID? It is in the &ldquo;You&apos;re registered&rdquo; email we sent when
              you submitted your payment. Check your spam folder, or contact the coordinators.
            </p>

            <p className="mt-3 text-center font-mono text-[11px] text-[#71767B]">
              Not registered yet?{' '}
              <button
                type="button"
                onClick={() => navigate('/participant/register')}
                className="font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
              >
                Register here
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={submitCode}>
            <ComicPanel tone="cyan">
              <ComicField label="6-digit code" htmlFor="otp">
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
              <ComicCTA type="submit" tone="cyan" disabled={busy || otp.length !== 6} arrow={!busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Verifying…
                  </span>
                ) : (
                  'Log in'
                )}
              </ComicCTA>
            </div>

            <div className="mt-5 flex items-center justify-between font-mono text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setStep('identify');
                  setOtp('');
                  setError(null);
                }}
                className="uppercase tracking-wide text-[#71767B] underline underline-offset-2 hover:text-[#EEEEEA]"
              >
                Use a different UserID
              </button>

              <button
                type="button"
                disabled={cooldown > 0 || busy}
                onClick={() => void sendCode()}
                className="uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00] disabled:no-underline disabled:text-[#71767B] disabled:opacity-40"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </main>
    </ComicPageShell>
  );
};

export default ParticipantLoginPage;
