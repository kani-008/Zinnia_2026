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
  Clock,
  Copy,
  Hourglass,
  KeyRound,
  Loader2,
  LogOut,
  Lock,
  MapPin,
  MessageCircle,
  Users,
  X,
} from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { ComicHandDrawnCard } from '../components/events/ComicHandDrawnCard';
import { EVENTS } from '../lib/rules/catalog';
import { OFFICIAL_MISSIONS } from '../config/events';
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
import { useToastOn } from '../components/ui/toast';

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

/**
 * zin26 event code -> the id used by OFFICIAL_MISSIONS in src/config/events.ts.
 * The rule engine and the marketing catalog were written at different times and
 * never shared identifiers; this is the one place that bridges them.
 */
const MISSION_ID: Record<string, string> = {
  DEBUGGING: 'debugging',
  LAST_SIGNAL: 'the-last-signal',
  LOST_IN_SQL: 'lost-at-sql',
  GADGET_CODES: 'gadget-codes',
  PAPER_PRESENTATION: 'paper-presentation',
  BORDERLAND: 'borderland-at-gcee',
  THINK_STRIKE_WIN: 'think-strike-and-win',
  PLOT_TWIST: 'plot-twist',
  SHORT_FILM: 'short-flim',
};

const missionFor = (code: string) =>
  OFFICIAL_MISSIONS.find((m) => m.id === MISSION_ID[code]);

export const ParticipantDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [openCard, setOpenCard] = useState<string | null>(null);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);
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
                      <p className="select-all font-mono text-xl font-bold tracking-wider text-[#0FA9C6] sm:text-2xl">
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {catalog.map((card, i) => {
              const registered = card.state === 'REGISTERED';
              const blocked = card.state === 'BLOCKED';
              const full = card.state === 'FULL';
              const locked = blocked || full;
              const number = String(card.display_order ?? i + 1).padStart(2, '0');
              const variant = cardVariant(card.event_code);
              const mission = missionFor(card.event_code);
              const open = openCard === card.event_code;

              return (
                <ComicHandDrawnCard
                  key={card.event_code}
                  code={number}
                  variant={variant}
                  className={`min-h-[350px] sm:min-h-[360px] transition-all duration-200 ${
                    locked ? 'opacity-70 hover:opacity-85 !cursor-default' : '!cursor-default'
                  }`}
                  innerClassName="w-full flex-1 flex flex-col justify-between px-6 sm:px-7 pt-12 sm:pt-14 pb-8 sm:pb-9 text-center select-text"
                >
                  <div className="flex w-full flex-1 flex-col justify-between">
                    {/* TOP SECTION: META & TITLE & DETAILS */}
                    <div className="w-full flex flex-col items-center">
                      {/* Top Bar: Spacing clearance from the top-left number tag + category & lock badge */}
                      <div className="w-full flex items-center justify-end gap-1.5 min-h-[22px] mb-1.5">
                        <span className="font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase border border-[#23262D] bg-[#0E1012] text-[#8E939D]">
                          {variant === 'tech' ? 'TECH' : 'NON-TECH'}
                        </span>
                        {locked && (
                          <span title="Unavailable" className="p-0.5 text-[#71767B]">
                            <Lock size={12} />
                          </span>
                        )}
                      </div>

                      {/* Event Title: Consistent min-height so all cards align across rows */}
                      <div className="min-h-[50px] sm:min-h-[54px] w-full flex items-center justify-center px-1">
                        <h3 className="font-display text-lg sm:text-xl font-black uppercase leading-tight tracking-wide text-[#EEEEEA] text-center">
                          {card.name}
                        </h3>
                      </div>

                      {/* Expandable "WHAT IS THIS?" UI Control */}
                      {mission && (
                        <div className="mt-1.5 w-full flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => setOpenCard(open ? null : card.event_code)}
                            aria-expanded={open}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm border font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] transition-all cursor-pointer ${
                              open
                                ? 'border-[#E5BD00] bg-[#E5BD00]/15 text-[#E5BD00]'
                                : variant === 'tech'
                                  ? 'border-[#0FA9C6]/40 bg-[#0FA9C6]/10 text-[#0FA9C6] hover:bg-[#0FA9C6]/20 hover:border-[#0FA9C6]'
                                  : 'border-[#D51F55]/40 bg-[#D51F55]/10 text-[#D51F55] hover:bg-[#D51F55]/20 hover:border-[#D51F55]'
                            }`}
                          >
                            <span>{open ? 'HIDE DETAILS ↑' : 'WHAT IS THIS? ↓'}</span>
                          </button>

                          {/* Expanded Content Panel */}
                          {open && (
                            <div className="mt-3 w-full bg-[#0B0D10]/95 border-2 border-dashed border-[#23262D] p-3 text-left space-y-2.5">
                              <p className="font-mono text-xs leading-relaxed text-[#C2C6CE]">
                                {mission.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-[#8E939D] border-t border-[#1C1E23] pt-2">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-[#E5BD00]" />
                                  {mission.schedule_time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="text-[#0FA9C6]" />
                                  {mission.venue}
                                </span>
                              </div>
                              {mission.rules?.length > 0 && (
                                <div className="border-t border-[#1C1E23] pt-2">
                                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#71767B] mb-1">
                                    Rules:
                                  </p>
                                  <ul className="space-y-1 font-mono text-[10.5px] leading-relaxed text-[#9DA2AC]">
                                    {mission.rules.slice(0, 4).map((r) => (
                                      <li key={r} className="flex items-start gap-1.5">
                                        <span className="text-[#E5BD00] font-bold select-none">•</span>
                                        <span>{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Team requirement indicator */}
                      {card.is_team_event && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#141619] border border-[#23262D] font-mono text-[11px] text-[#8E939D]">
                          <Users size={12} className={variant === 'tech' ? 'text-[#0FA9C6]' : 'text-[#D51F55]'} />
                          <span>
                            Team of {card.min_team === card.max_team ? card.min_team : `${card.min_team}-${card.max_team}`}
                          </span>
                        </div>
                      )}

                      {/* Locked reason notice */}
                      {locked && card.reason && (
                        <div className="mt-2.5 w-full px-2.5 py-1.5 bg-[#171415] border border-[#3E232A] flex items-start justify-center gap-1.5 font-mono text-[11px] leading-relaxed text-[#E08A9D]">
                          <CalendarClock size={12} className="mt-0.5 shrink-0 text-[#D51F55]" />
                          <span className="text-center">{card.reason}</span>
                        </div>
                      )}
                    </div>

                    {/* BOTTOM ACTION SECTION */}
                    <div className="w-full mt-auto pt-4 pb-0.5 border-t border-[#1C1F24]">
                      {registered ? (
                        <div className="w-full py-2.5 px-3 bg-[#0FA9C6]/15 border-2 border-[#0FA9C6] flex items-center justify-center gap-2 shadow-[2px_2px_0px_#08758A]">
                          <Check size={16} className="text-[#0FA9C6] stroke-[3.5] shrink-0" />
                          <span className="font-comic font-black text-xs sm:text-sm tracking-wider uppercase italic text-[#0FA9C6]">
                            YOU&apos;RE REGISTERED
                          </span>
                        </div>
                      ) : locked ? (
                        <div className="w-full py-2.5 px-3 bg-[#131518] border-2 border-[#23262D] flex items-center justify-center gap-2 text-[#71767B]">
                          <Lock size={13} className="shrink-0 text-[#71767B]" />
                          <span className="font-comic font-bold text-xs sm:text-sm tracking-wider uppercase text-[#71767B]">
                            {full ? 'REGISTRATIONS CLOSED' : 'UNAVAILABLE'}
                          </span>
                        </div>
                      ) : card.is_team_event ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/participant/teams/new?event=${card.event_code}`)}
                          disabled={busyEvent === card.event_code}
                          className={`w-full py-2.5 px-4 font-comic font-black text-xs sm:text-sm uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            variant === 'tech'
                              ? 'bg-[#0FA9C6] text-[#090A0B] border-2 border-[#0FA9C6] shadow-[3px_3px_0px_#08758A] hover:bg-[#15C3E5] hover:shadow-[4px_4px_0px_#08758A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#08758A]'
                              : 'bg-[#D51F55] text-white border-2 border-[#D51F55] shadow-[3px_3px_0px_#A81443] hover:bg-[#E82C64] hover:shadow-[4px_4px_0px_#A81443] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#A81443]'
                          }`}
                        >
                          {busyEvent === card.event_code ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>WORKING…</span>
                            </>
                          ) : (
                            <>
                              <span>CREATE TEAM</span>
                              <span className="text-base leading-none">→</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void onRegister(card)}
                          disabled={busyEvent === card.event_code}
                          className={`w-full py-2.5 px-4 font-comic font-black text-xs sm:text-sm uppercase italic tracking-wider flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            variant === 'tech'
                              ? 'bg-[#0FA9C6] text-[#090A0B] border-2 border-[#0FA9C6] shadow-[3px_3px_0px_#08758A] hover:bg-[#15C3E5] hover:shadow-[4px_4px_0px_#08758A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#08758A]'
                              : 'bg-[#D51F55] text-white border-2 border-[#D51F55] shadow-[3px_3px_0px_#A81443] hover:bg-[#E82C64] hover:shadow-[4px_4px_0px_#A81443] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#A81443]'
                          }`}
                        >
                          {busyEvent === card.event_code ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              <span>WORKING…</span>
                            </>
                          ) : (
                            <>
                              <span>REGISTER NOW</span>
                              <span className="text-base leading-none">→</span>
                            </>
                          )}
                        </button>
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
