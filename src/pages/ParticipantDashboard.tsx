// Zinnia 2026 — participant dashboard (§4.3) and registration status hub.
//
// Three card states, and a BLOCKED card always says WHY — "Clashes with Plot
// Twist (2:00-3:00)", not "unavailable". That specificity is the whole point:
// it is what keeps the help desk from drowning in "why can't I register".
//
// The server is the authority. This page renders the catalog the server
// evaluated, so the reason shown is the reason the write would fail.
//
// Payment verification gates the PASS, not the catalog. Submitting the payment
// reference ends registration, so every card is live from that moment and a
// card is only ever locked for a reason of its own — full, closed, clashing or
// over the count. What waits on the treasurer is exactly the pass panel below:
// the registration code, the master QR and the WhatsApp group link, all three
// released together when the server says REGISTRATION_CONFIRMED. That panel is
// informational and never blocks anything.

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  Hourglass,
  KeyRound,
  Loader2,
  LogOut,
  Lock,
  MessageCircle,
  Users,
  X,
} from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { ComicHandDrawnCard } from '../components/events/ComicHandDrawnCard';
import { EVENTS } from '../lib/rules/catalog';
import {
  cancelRegistration,
  clearSession,
  getDashboard,
  loadSession,
  registerForEvent,
} from '../lib/participant/api';
import type {
  DashboardCatalogCard,
  DashboardRegistration,
  EventCode,
  PendingInvite,
  RegistrationView,
} from '../lib/participant/types';
import {
  ComicAlert,
  ComicBolt,
  ComicCTA,
  ComicChip,
  ComicGhostButton,
  ComicHeading,
  ComicPageShell,
  ComicPanel,
  ComicSectionTitle,
} from '../components/ui/comic';

interface DashboardData {
  participant: RegistrationView;
  registrations: DashboardRegistration[];
  counted_used: number;
  counted_max: number;
  catalog: DashboardCatalogCard[];
  pending_invites: PendingInvite[];
}

/** Same technical/non-technical split the homepage event cards colour by. */
const cardVariant = (code: EventCode): 'tech' | 'non-tech' =>
  EVENTS[code]?.category === 'NON_TECH' ? 'non-tech' : 'tech';

export const ParticipantDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyEvent, setBusyEvent] = useState<EventCode | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const load = useCallback(async () => {
    if (!loadSession()) {
      navigate('/participant/login', { replace: true });
      return;
    }

    const result = await getDashboard();
    setLoading(false);

    if (!result.success) {
      if (result.error_code === 'UNAUTHENTICATED') {
        navigate('/participant/login', { replace: true });
        return;
      }
      setError(result.message);
      return;
    }
    setData(result);
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRegister = async (card: DashboardCatalogCard) => {
    setBusyEvent(card.event_code);
    setError(null);

    let result = await registerForEvent(card.event_code);

    // R15: the server refuses to write a tight-but-legal combination until the
    // participant has actually seen the warning and said yes.
    if (!result.success && result.error_code === 'CONFIRMATION_REQUIRED') {
      const proceed = window.confirm(result.message);
      if (!proceed) {
        setBusyEvent(null);
        return;
      }
      result = await registerForEvent(card.event_code, true);
    }

    setBusyEvent(null);

    if (!result.success) {
      setError(result.message);
      return;
    }
    await load();
  };

  const onCancel = async (eventCode: EventCode, eventName: string) => {
    if (!window.confirm(`Cancel your registration for ${eventName}?`)) return;

    setBusyEvent(eventCode);
    setError(null);

    const result = await cancelRegistration(eventCode);
    setBusyEvent(null);

    if (!result.success) {
      setError(result.message);
      return;
    }
    await load();
  };

  // The login ID is the only way back in, so make it one tap to keep.
  const copyUserId = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1800);
    } catch {
      // Clipboard is blocked in some mobile browsers; the ID is on screen anyway.
    }
  };

  const logout = () => {
    clearSession();
    navigate('/participant/login', { replace: true });
  };

  if (loading) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#0FA9C6]" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#71767B]">
            Loading your dashboard
          </p>
        </div>
      </ComicPageShell>
    );
  }

  if (!data) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl px-5 pt-32 text-center">
          <ComicAlert tone="pink" className="text-left">
            {error ?? 'Could not load your dashboard.'}
          </ComicAlert>
          <div className="mt-6 flex justify-center">
            <ComicGhostButton tone="cyan" onClick={() => void load()}>
              Try again
            </ComicGhostButton>
          </div>
        </main>
      </ComicPageShell>
    );
  }

  const { participant, registrations, counted_used, counted_max, catalog, pending_invites } = data;
  const status = participant.registration_status;
  const confirmed = status === 'REGISTRATION_CONFIRMED';
  // Registration is COMPLETE the moment the payment reference is submitted.
  // Everything below keys off this rather than off the treasurer's verdict.
  const registrationComplete = confirmed || status === 'PAYMENT_RECEIVED';
  // The only states where the participant still owes us something.
  const actionNeeded = !registrationComplete;
  const paymentUrl = `/participant/payment?rid=${encodeURIComponent(participant.registration_id)}`;
  const verifyUrl = `/participant/verify?rid=${encodeURIComponent(participant.registration_id)}`;

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-28">
        {/* Identity strip — §4.2: who you are and n/3, on every screen.
            The login ID is the headline fact here, not a footnote: it is the
            ONLY way back into this dashboard, so it is labelled, legible and
            copyable rather than tucked inside a status badge. It appears from
            the moment the server releases it, which is when the email is
            verified — well before the treasurer gets to the payment. */}
        <ComicPanel tone={confirmed ? 'cyan' : 'yellow'} className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <ComicChip tone={confirmed ? 'cyan' : 'yellow'} rotate={-2}>
                {confirmed ? (
                  <>
                    <CheckCircle2 size={12} /> Registration confirmed
                  </>
                ) : registrationComplete ? (
                  <>
                    <Hourglass size={12} /> Registered · pass pending
                  </>
                ) : (
                  <>
                    <Hourglass size={12} /> Registration pending
                  </>
                )}
              </ComicChip>

              <ComicHeading className="mt-3 text-2xl sm:text-3xl md:text-4xl">
                {participant.name}
              </ComicHeading>

              {participant.user_id && (
                <>
                  <div className="mt-4 inline-flex items-center gap-3 border-2 border-[#0FA9C6] bg-[#111214] py-2 pl-4 pr-2 shadow-[3px_3px_0px_#090A0B]">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">
                        Your login ID
                      </p>
                      <p className="select-all font-comic text-xl font-black tracking-wider text-[#0FA9C6] sm:text-2xl">
                        {participant.user_id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyUserId(participant.user_id as string)}
                      title={copiedId ? 'Copied' : 'Copy your login ID'}
                      aria-label={copiedId ? 'Login ID copied' : 'Copy your login ID'}
                      className="grid h-10 w-10 shrink-0 place-items-center border-2 border-[#23262D] text-[#71767B] transition-colors hover:border-[#0FA9C6] hover:text-[#0FA9C6]"
                    >
                      {copiedId ? <Check size={16} className="text-[#0FA9C6]" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[#71767B]">
                    <KeyRound size={12} className="shrink-0" />
                    This is how you log in. Keep it somewhere you can find it.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              {confirmed && participant.whatsapp_url && (
                <a
                  href={participant.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Participants WhatsApp group"
                  className="hidden items-center gap-1.5 border-2 border-[#25D366] bg-[#111214] px-3 py-2 font-comic text-xs uppercase tracking-wider text-[#25D366] shadow-[3px_3px_0px_#090A0B] transition-colors hover:bg-[#25D366] hover:text-[#08090A] sm:inline-flex"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>
              )}
              <div className="text-right">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#B8B8B2]">
                  Events used
                </p>
                <p className="font-comic text-3xl font-black text-[#E5BD00]">
                  {counted_used}
                  <span className="text-[#71767B]">/{counted_max}</span>
                </p>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="border-2 border-[#23262D] bg-[#111214] p-2.5 text-[#B8B8B2] shadow-[3px_3px_0px_#090A0B] transition-colors hover:border-[#D51F55] hover:text-[#D51F55]"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </ComicPanel>

        {/* Lifecycle banner — the frontend reacts to the server's state, never guesses it. */}
        {status === 'DETAILS_SUBMITTED' && (
          <ComicAlert tone="yellow" className="mb-6">
            <p className="font-bold uppercase tracking-wide">Please verify your email before proceeding to payment.</p>
            <button onClick={() => navigate(verifyUrl)} className="mt-2 font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]">
              Verify email
            </button>
          </ComicAlert>
        )}
        {status === 'OTP_VERIFIED' && (
          <ComicAlert tone="yellow" className="mb-6">
            <p className="font-bold uppercase tracking-wide">Email verified. Complete the registration fee to confirm your place.</p>
            <button onClick={() => navigate(paymentUrl)} className="mt-2 font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]">
              Go to payment
            </button>
          </ComicAlert>
        )}
        {/* PAYMENT_RECEIVED gets no banner: it is not a problem to solve and
            nothing is blocked by it. The pass panel below reports it instead. */}
        {status === 'PAYMENT_FAILED' && (
          <ComicAlert tone="pink" className="mb-6">
            <p className="font-bold uppercase tracking-wide">Payment was not completed. Please try again.</p>
            <p className="mt-1 text-[#B8B8B2]">Your registration is held, not cancelled.</p>
            <button onClick={() => navigate(paymentUrl)} className="mt-2 font-bold uppercase tracking-wide text-[#EEEEEA] underline underline-offset-2 hover:text-[#E5BD00]">
              Resubmit payment
            </button>
          </ComicAlert>
        )}

        {error && <ComicAlert tone="pink" className="mb-6">{error}</ComicAlert>}

        {/* THE PASS PANEL — the only thing payment verification gates.
            Confirmed: the code, the master QR and the group link, in the page
            rather than only in the email. Pending: a visible but entirely
            non-blocking notice. Neither state touches the catalog below. */}
        {confirmed && (
          <ComicPanel tone="cyan" className="mb-8">
            <ul className="mb-5 flex flex-wrap gap-4 font-mono text-xs text-[#0FA9C6]">
              <li className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Email verified</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Payment verified</li>
              <li className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Registration confirmed</li>
            </ul>

            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {participant.user_id && (
                <div className="w-full max-w-[220px] shrink-0 border-[3px] border-[#090A0B] bg-white p-3 shadow-[5px_5px_0px_#090A0B] -rotate-1 sm:w-[190px]">
                  <QRCodeSVG value={participant.user_id} size={256} className="block h-auto w-full" />
                  <p className="mt-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#08090A]">
                    Master QR
                  </p>
                </div>
              )}

              {/* The ID itself is not repeated here: it already headlines the
                  identity strip above, and labelling one value twice invites the
                  question of whether they are two different things. */}
              <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
                <p className="font-mono text-[11px] leading-relaxed text-[#B8B8B2]">
                  Show this QR at the gate, at every event desk and at the food counter. It encodes
                  the login ID above, it is your pass for the whole day, and it does not change as
                  you add events. The same QR is attached to your confirmation email — save that
                  copy to your phone.
                </p>

                {participant.whatsapp_url && (
                  <a
                    href={participant.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border-2 border-[#25D366] bg-[#25D366] px-5 py-2.5 font-comic text-sm uppercase tracking-wider text-[#08090A] shadow-[4px_4px_0px_#090A0B] btn-comic transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle size={16} /> Join WhatsApp group
                  </a>
                )}
              </div>
            </div>
          </ComicPanel>
        )}

        {status === 'PAYMENT_RECEIVED' && (
          <ComicPanel tone="yellow" className="mb-8">
            <div className="flex flex-wrap items-start gap-4">
              <Hourglass size={20} className="mt-0.5 shrink-0 text-[#E5BD00]" />
              <div className="min-w-0 flex-1">
                <p className="font-comic text-lg uppercase tracking-wide text-[#E5BD00] sm:text-xl">
                  Payment verification in progress
                </p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-[#B8B8B2]">
                  Your master QR and group link will appear here once the treasurer confirms your
                  payment. You can continue registering for events in the meantime.
                </p>
                <button
                  onClick={() => navigate(paymentUrl)}
                  className="mt-3 font-mono text-[11px] font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
                >
                  View payment details
                </button>
              </div>
            </div>
          </ComicPanel>
        )}

        {pending_invites.length > 0 && (
          <ComicPanel tone="yellow" className="mb-8">
            <ComicSectionTitle tone="yellow" className="mb-3 flex items-center gap-2">
              <Users size={15} /> Team invitations
            </ComicSectionTitle>
            <ul className="space-y-2">
              {pending_invites.map((invite) => (
                <li key={invite.team_id} className="font-mono text-xs text-[#B8B8B2]">
                  <span className="font-bold text-[#EEEEEA]">{invite.captain_name}</span> added you
                  to <span className="font-bold text-[#EEEEEA]">{invite.team_name}</span> for{' '}
                  {invite.event_name}.{' '}
                  <button
                    onClick={() => navigate('/participant/teams')}
                    className="font-bold uppercase tracking-wide text-[#E5BD00] underline underline-offset-2 hover:text-[#0FA9C6]"
                  >
                    Respond
                  </button>
                </li>
              ))}
            </ul>
          </ComicPanel>
        )}

        {registrations.length > 0 && (
          <section className="mb-10">
            <ComicSectionTitle tone="cyan" className="mb-3 flex items-center gap-2">
              <ComicBolt tone="cyan" className="w-4 h-4" /> My events
            </ComicSectionTitle>
            <ul className="space-y-2">
              {registrations.map((reg) => (
                <li
                  key={reg.reg_id}
                  className="flex items-center justify-between gap-4 border-2 border-[#23262D] bg-[#111214] pad-box-sm shadow-[4px_4px_0px_#090A0B] transition-colors hover:border-[#0FA9C6]"
                >
                  <div>
                    <p className="font-comic text-base uppercase tracking-wide text-[#EEEEEA]">{reg.event_name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#71767B]">
                      {reg.team_name ? `Team ${reg.team_name} · ` : ''}
                      {reg.status === 'PENDING_ACCEPTANCE' ? 'Waiting on teammates' : 'Confirmed'}
                    </p>
                  </div>
                  <button
                    onClick={() => void onCancel(reg.event_code, reg.event_name)}
                    disabled={busyEvent === reg.event_code}
                    title="Cancel"
                    className="border-2 border-[#23262D] p-2 text-[#71767B] transition-colors hover:border-[#D51F55] hover:text-[#D51F55] disabled:opacity-40"
                  >
                    {busyEvent === reg.event_code ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <ComicSectionTitle tone="cyan" className="flex items-center gap-2">
              <ComicBolt tone="yellow" className="w-4 h-4" /> Event catalog
            </ComicSectionTitle>
            <ComicChip tone="yellow" rotate={1.5}>
              {catalog.length} active events
            </ComicChip>
            {registrationComplete && (
              <ComicChip tone="cyan" rotate={-1}>
                <CheckCircle2 size={11} /> All events open to you
              </ComicChip>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((card, i) => {
              const registered = card.state === 'REGISTERED';
              const blocked = card.state === 'BLOCKED';
              const full = card.state === 'FULL';
              const locked = blocked || full;
              const number = String(card.display_order ?? i + 1).padStart(2, '0');

              return (
                <ComicHandDrawnCard
                  key={card.event_code}
                  code={number}
                  variant={cardVariant(card.event_code)}
                  className={locked ? 'opacity-55 !cursor-default' : '!cursor-default'}
                >
                  <div className="flex w-full flex-1 flex-col items-center justify-between gap-4">
                    <div className="w-full">
                      <div className="mb-2 flex items-center justify-center gap-2">
                        {registered && (
                          <ComicChip tone="cyan" rotate={-3}>
                            Registered
                          </ComicChip>
                        )}
                        {locked && <Lock size={14} className="shrink-0 text-[#71767B]" />}
                      </div>

                      <h3 className="font-display text-lg uppercase leading-tight text-[#EEEEEA] sm:text-xl">
                        {card.name}
                      </h3>

                      {/* The reason is the feature. Never collapse this to "unavailable". */}
                      {locked && card.reason && (
                        <p className="mt-2 flex items-start justify-center gap-1.5 font-mono text-[11px] leading-relaxed text-[#B8B8B2]">
                          <CalendarClock size={12} className="mt-0.5 shrink-0" />
                          {card.reason}
                        </p>
                      )}

                      {!locked && !registered && card.is_team_event && (
                        <p className="mt-2 flex items-center justify-center gap-1.5 font-mono text-[11px] text-[#71767B]">
                          <Users size={12} />
                          Team of {card.min_team === card.max_team ? card.min_team : `${card.min_team}-${card.max_team}`}
                        </p>
                      )}
                    </div>

                    <div className="w-full">
                      {registered ? (
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[#0FA9C6]">
                          You&apos;re registered
                        </p>
                      ) : locked ? (
                        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[#71767B]">
                          {full ? 'Registrations closed' : 'Unavailable'}
                        </p>
                      ) : (
                        <ComicGhostButton
                          tone={cardVariant(card.event_code) === 'tech' ? 'cyan' : 'pink'}
                          className="w-full"
                          onClick={() =>
                            card.is_team_event
                              ? navigate(`/participant/teams/new?event=${card.event_code}`)
                              : void onRegister(card)
                          }
                          disabled={busyEvent === card.event_code}
                        >
                          {busyEvent === card.event_code ? 'Working…' : card.is_team_event ? 'Create team' : 'Register'}
                        </ComicGhostButton>
                      )}
                    </div>
                  </div>
                </ComicHandDrawnCard>
              );
            })}
          </div>

          {actionNeeded && (
            <div className="mt-8 flex justify-center">
              <ComicCTA
                tone="cyan"
                fullWidth={false}
                onClick={() => navigate(status === 'DETAILS_SUBMITTED' ? verifyUrl : paymentUrl)}
              >
                {status === 'DETAILS_SUBMITTED' ? 'Verify your email' : status === 'PAYMENT_FAILED' ? 'Resubmit payment' : 'Complete payment'}
              </ComicCTA>
            </div>
          )}
        </section>
      </main>
    </ComicPageShell>
  );
};

export default ParticipantDashboardPage;
