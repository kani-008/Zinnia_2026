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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Hourglass,
  Info,
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
import { EventDetailModal } from '../components/events/EventDetailModal';
import { EVENTS } from '../lib/rules/catalog';
import { OFFICIAL_MISSIONS } from '../config/events';
import type { EventMission } from '../types';
import {
  cancelRegistration,
  clearSession,
  confirmLineup,
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
import { toast, useToastOn } from '../components/ui/toast';
import { GENERAL_NOTES, notesFor } from '../config/eventRegistrationNotes';

interface DashboardData {
  participant: RegistrationView;
  registrations: DashboardRegistration[];
  counted_used: number;
  counted_max: number;
  catalog: DashboardCatalogCard[];
  pending_invites: PendingInvite[];
}

/** Same technical/non-technical split the homepage event cards colour by. */
const cardVariant = (code: EventCode): 'tech' | 'non-tech' | 'mega' => {
  // is_mega lives in the marketing catalog, not the rule engine - the Events
  // page already draws Gadget Codes as the mega tier, and reading the same flag
  // here is what keeps the two pages from disagreeing about it.
  if (missionFor(code)?.is_mega) return 'mega';
  return EVENTS[code]?.category === 'NON_TECH' ? 'non-tech' : 'tech';
};

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

/** Mega first: it is the headline event, and burying it mid-list undersells it. */
const GROUPS = [
  { key: 'MEGA', title: 'Mega event', tone: 'yellow' as const },
  { key: 'TECH', title: 'Technical events', tone: 'cyan' as const },
  { key: 'NON_TECH', title: 'Non-technical events', tone: 'pink' as const },
];

const groupOf = (card: DashboardCatalogCard): string => {
  if (missionFor(card.event_code)?.is_mega) return 'MEGA';
  return card.category === 'TECH' ? 'TECH' : 'NON_TECH';
};

/**
 * Has this participant opened the registration description yet?
 *
 * Per participant, not per browser: a shared machine in the lab would
 * otherwise silence the prompt for whoever logs in next, and they are exactly
 * the person who has not read it.
 */
const RULES_READ_KEY = (userId: string) => `zin26_rules_read_${userId}`;

const hasReadRules = (userId: string): boolean => {
  try {
    return window.localStorage.getItem(RULES_READ_KEY(userId)) === '1';
  } catch {
    // Storage blocked — better to prompt again than to assume it was read.
    return false;
  }
};

/**
 * Has this participant pressed "Confirm my events"?
 *
 * Per participant, like the rules flag. Note this is a UI state only: the
 * server still accepts a cancellation, because confirming emails the list
 * rather than locking it. Hiding the buttons is what "done" means here.
 */
const LINEUP_KEY = (userId: string) => `zin26_lineup_confirmed_${userId}`;

const hasConfirmedLineup = (userId: string): boolean => {
  try {
    return window.localStorage.getItem(LINEUP_KEY(userId)) === '1';
  } catch {
    return false;
  }
};

const markLineupConfirmed = (userId: string): void => {
  try {
    window.localStorage.setItem(LINEUP_KEY(userId), '1');
  } catch {
    /* the confirm button simply stays visible */
  }
};

const markRulesRead = (userId: string): void => {
  try {
    window.localStorage.setItem(RULES_READ_KEY(userId), '1');
  } catch {
    /* the prompt simply returns next visit */
  }
};

/**
 * Was this document reached by reloading it, rather than by arriving at it?
 *
 * Pressing F5 is not the participant coming to the dashboard again - they were
 * already on it - so re-raising the prompt there reads as nagging. Coming back
 * from another page is a real arrival and does raise it.
 */
const isPageReload = (): boolean => {
  try {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return nav?.type === 'reload';
  } catch {
    return false;
  }
};

/**
 * Module scope, so a full page load resets it and an in-app navigation does
 * not. That is what separates "refreshed the dashboard" - suppressed - from
 * "went to Events and came back" - shown - after a refresh has happened: only
 * the first mount of a document can be the reload itself.
 */
let reloadMountConsumed = false;

export const ParticipantDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [openCard, setOpenCard] = useState<string | null>(null);
  /** Full event detail, shown in the same popup the Events page uses. */
  const [detailMission, setDetailMission] = useState<EventMission | null>(null);
  /** Just the coordinators, in a small popup of their own. */
  const [coordMission, setCoordMission] = useState<EventMission | null>(null);
  // Whether the registration description is open. While it is, the dashboard
  // is replaced by it so it reads as its own page with a way back.
  const [showRules, setShowRules] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [lineupConfirmed, setLineupConfirmed] = useState(false);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);
  const [busyEvent, setBusyEvent] = useState<EventCode | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  /**
   * Who these per-participant flags belong to.
   *
   * NOT data.participant.user_id: the dashboard masks that until the pass is
   * released, so for anyone still awaiting verification it is null and every
   * flag keyed on it silently wrote nothing. The session always carries an
   * identity, which is the whole point of being logged in.
   */
  const flagKey = (): string => {
    const session = loadSession();
    return session?.user.user_id || session?.user.registration_id || '';
  };

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

      // The session names a participant the server cannot find — the row was
      // removed, or this session predates a reset. Retrying cannot fix that,
      // so the stale session is dropped and they go to the home page rather
      // than being stranded on a dashboard error with nothing but "Try again".
      if (result.error_code === 'NOT_FOUND') {
        clearSession();
        toast.error('That registration no longer exists. Please register again.');
        navigate('/', { replace: true });
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

  // Restore the confirmed state for whoever is logged in.
  useEffect(() => {
    const uid = flagKey();
    if (uid) setLineupConfirmed(hasConfirmedLineup(uid));
  }, [data]);

  /** Open the description, and remember that it has now been read. */
  const openRules = useCallback(() => {
    const uid = flagKey();
    if (uid) markRulesRead(uid);
    setShowRules(true);
  }, [data]);

  /**
   * Arriving at the dashboard: point them at the registration description.
   *
   * The rules decide what combines with what, and the expensive mistake -
   * taking Gadget Codes and losing every other on-campus event - is made
   * before any of them is reachable through a rejection message. So the prompt
   * is raised until the description has actually been opened rather than once
   * and gone: a notification that slid past unread has not done its job.
   *
   * A refresh is not an arrival, though. Reloading the page they are already
   * on gets nothing, so the prompt cannot turn into something that fires every
   * time they press F5.
   */
  const promptedRef = useRef(false);
  useEffect(() => {
    const uid = flagKey();
    // Nothing to prompt once the picking is over: the notice says "before you
    // pick", and the description it points at is no longer on the dashboard.
    if (!uid || promptedRef.current || hasReadRules(uid) || hasConfirmedLineup(uid)) return;
    promptedRef.current = true;

    // Only the first mount in a document can be the reload itself; a later one
    // is an in-app navigation back to the dashboard, which does count.
    const wasReload = !reloadMountConsumed && isPageReload();
    reloadMountConsumed = true;
    if (wasReload) return;

    toast.info(
      'Read the registration description before you pick events..!',
      { label: 'Read it now', onClick: () => openRules() },
    );
  }, [data, openRules]);

  /**
   * Emails the participant their event list.
   *
   * Registering an event no longer mails anything on its own - picking is
   * iterative, and a mail per tap described a selection that was still moving.
   * This is the participant saying they are done, so the list they receive is
   * one they actually finished making.
   */
  const onConfirmLineup = async () => {
    setConfirming(true);
    const result = await confirmLineup();
    setConfirming(false);

    if (!result.success) {
      setError(result.message);
      return;
    }
    const uid = flagKey();
    if (uid) markLineupConfirmed(uid);
    setLineupConfirmed(true);
    toast.success(result.message ?? 'Your events are confirmed - check your email.');
  };

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

    if (!result.success) {
      setBusyEvent(null);
      setError(result.message);
      return;
    }

    // Held until the refetch finishes, so the only thing that looks busy is the
    // button that was pressed. Clearing it first left the rest of the dashboard
    // silently swapping itself out for a second with nothing to explain why.
    //
    // The refetch is not optional: registering one event changes what is
    // available on OTHER cards - an afternoon event closes Lost in SQL - so the
    // catalog has to be re-read. `data` is never cleared while that runs, so
    // the page updates in place instead of falling back to a loading screen.
    await load();
    setBusyEvent(null);
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
        <main className="mx-auto max-w-xl px-5 pt-8 sm:pt-12 text-center">
          <ComicAlert tone="pink" className="text-left">
            {error ?? 'Could not load your dashboard.'}
          </ComicAlert>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
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

  const { participant, registrations, counted_used, counted_max, catalog, pending_invites } = data;

  /**
   * When to stop offering events.
   *
   * At the ceiling there is nothing left to pick, and once the line-up is
   * confirmed the picking is over — in both cases a wall of cards that can
   * only refuse is noise. The section header and the rules button stay, so
   * the description is still reachable.
   */
  const atEventLimit = counted_used >= counted_max;
  const catalogClosed = atEventLimit;

  /**
   * The registration description: one page, every rule that decides what can
   * be held alongside what.
   *
   * The engine refuses an illegal combination server-side, but a rejection
   * after the fact is a poor way to learn that Gadget Codes costs you every
   * other event. This says so first. Nothing here is enforced - rules_engine.py
   * remains the authority - so the copy lives in config, not in logic.
   */
  const renderRules = () => {
    const TONE_ICON = { warn: AlertTriangle, info: Info, good: CheckCircle2 } as const;
    const TONE_COLOR = { warn: '#E5BD00', info: '#8E939D', good: '#1DB954' } as const;

    // Mega event first, the way the catalog above groups it — its note is the
    // one that changes what you can pick, so it should not be read fourth.
    // sort() is stable, so everything else keeps its catalog order.
    const ordered = [...catalog].sort(
      (a, b) => Number(groupOf(a) !== 'MEGA') - Number(groupOf(b) !== 'MEGA'),
    );

    return (
      <ComicPageShell>
        <WebsiteNavbar />

        <main className="mx-auto max-w-2xl w-full px-5 sm:px-8 pb-24 pt-6 sm:pt-10 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRules(false)}
            className="mb-6 inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-[#8E939D] transition-colors hover:text-[#EEEEEA]"
          >
            <ArrowLeft size={14} />
            Event registration description
          </button>

          <h1 className="font-sans font-black uppercase leading-tight tracking-wider text-[clamp(1.4rem,5.5vw,2.25rem)] text-[#EEEEEA]">
            Before you pick
          </h1>

          <ul className="mt-5 space-y-3 border-2 border-[#23262D] bg-[#111214] px-4 py-4">
            {GENERAL_NOTES.map((n, idx) => {
              const Icon = TONE_ICON[n.tone];
              return (
                <li key={idx} className="flex items-start gap-2.5">
                  <Icon size={15} className="mt-0.5 shrink-0" style={{ color: TONE_COLOR[n.tone] }} />
                  <span className="font-mono text-xs leading-relaxed text-[#C2C6CE]">{n.text}</span>
                </li>
              );
            })}
          </ul>

          {ordered.map((card) => {
            const info = notesFor(card.event_code);
            if (!info) return null;
            const variant = cardVariant(card.event_code);
            const accent =
              variant === 'mega' ? '#C084FC' : variant === 'tech' ? '#0FA9C6' : '#D51F55';

            return (
              <section key={card.event_code} className="mt-7">
                <h2
                  className="font-sans font-black uppercase tracking-wider text-base sm:text-lg"
                  style={{ color: accent }}
                >
                  {card.name}
                </h2>

                <p className="mt-1 font-mono text-[11px] text-[#8E939D]">
                  {info.when} &middot; {info.team}
                </p>

                <ul className="mt-2.5 space-y-2">
                  {info.notes.map((n, idx) => {
                    const Icon = TONE_ICON[n.tone];
                    return (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Icon size={14} className="mt-0.5 shrink-0" style={{ color: TONE_COLOR[n.tone] }} />
                        <span className="font-mono text-xs leading-relaxed text-[#C2C6CE]">{n.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          <div className="mt-9">
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="w-full sm:w-auto px-6 py-3 font-sans font-bold text-xs uppercase tracking-wider text-[#090A0B] bg-[#0FA9C6] border-2 border-[#090A0B] shadow-[3px_3px_0px_#090A0B] transition-transform hover:-translate-y-0.5"
            >
              Back to events
            </button>
          </div>
        </main>
      </ComicPageShell>
    );
  };

  if (showRules) return renderRules();


  /**
   * The original card, unchanged in shape - desktop keeps the grid it had.
   * Only the redundant TECH/NON-TECH badge is gone (the list is grouped by it
   * now) and the type is the Events page's, a weight lighter than before.
   */
  const renderEventCard = (card: DashboardCatalogCard, i: number) => {
              const registered = card.state === 'REGISTERED';
              const blocked = card.state === 'BLOCKED';
              const full = card.state === 'FULL';
              const locked = blocked || full;
              const number = String(card.display_order ?? i + 1).padStart(2, '0');
              const variant = cardVariant(card.event_code);
              const tier =
                variant === 'mega'
                            ? { main: '#C084FC', shadow: '#9333EA' }
                            : variant === 'tech'
                              ? { main: '#0FA9C6', shadow: '#08758A' }
                              : { main: '#D51F55', shadow: '#A81443' };

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
                  innerClassName={`w-full flex-1 flex flex-col justify-between px-6 sm:px-7 ${
                    open ? 'pt-7 sm:pt-8 pb-14 sm:pb-16' : 'pt-11 sm:pt-12 pb-8 sm:pb-9'
                  } text-center select-text`}
                >
                  <div className="flex w-full flex-1 flex-col justify-between">
                    {/* TOP SECTION: META & TITLE & DETAILS */}
                    <div className="w-full flex flex-col items-center">
                      {/* Top Bar: Spacing clearance from the top-left number tag + category & lock badge */}
                      <div
                        className={`w-full flex items-center justify-end gap-1.5 ${
                          open
                            ? locked
                              ? 'min-h-[16px] mb-1'
                              : 'h-0 mb-0'
                            : locked
                              ? 'min-h-[22px] mb-1.5'
                              : 'min-h-[16px] mb-1'
                        }`}
                      >
                        {locked && (
                          <span title="Unavailable" className="p-0.5 text-[#71767B]">
                            <Lock size={12} />
                          </span>
                        )}
                      </div>

                      {/* Event Title: Consistent min-height when closed, compact when expanded */}
                      <div
                        className={`w-full flex items-center justify-center px-1 ${
                          open ? 'min-h-0 py-1' : 'min-h-[50px] sm:min-h-[54px]'
                        }`}
                      >
                        <h3 className="font-sans font-black text-base xs:text-lg sm:text-xl uppercase tracking-wider leading-tight text-[#EEEEEA] text-center">
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
                            // my-4 so the panel is not welded to the button
                            // above or the card edge below; px-4/py-3.5 and
                            // break-words keep long rules inside the border.
                            <div className="my-4 w-full overflow-hidden bg-[#0B0D10]/95 border-2 border-dashed border-[#23262D] px-4 py-3.5 text-left space-y-2.5 break-words">
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
                              {(mission.card_rules ?? mission.rules)?.length > 0 && (
                                <div className="border-t border-[#1C1E23] pt-2">
                                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#71767B] mb-1">
                                    Rules:
                                  </p>
                                  <ul className="space-y-1 font-mono text-[10.5px] leading-relaxed text-[#9DA2AC]">
                                    {(mission.card_rules ?? mission.rules).map((r) => (
                                      <li key={r} className="flex items-start gap-1.5">
                                        <span className="text-[#E5BD00] font-bold select-none">•</span>
                                        <span>{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Opens the SAME popup the Events page uses -
                                  prize, every rule, and the coordinators' phone
                                  numbers, which is what "contact the event
                                  coordinator" needs. It opens over the
                                  dashboard; it does not navigate away. */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#1C1E23] pt-2">
                                <button
                                  type="button"
                                  onClick={() => setDetailMission(mission)}
                                  className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
                                >
                                  More about this event
                                </button>
                              {mission.coordinators?.length ? (
                                <button
                                  type="button"
                                  onClick={() => setCoordMission(mission)}
                                  className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#E5BD00] underline underline-offset-2 hover:text-[#0FA9C6]"
                                >
                                  Event coordinator
                                </button>
                              ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Team requirement indicator */}
                      {card.is_team_event && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#141619] border border-[#23262D] font-mono text-[11px] text-[#8E939D]">
                          <Users size={12} className={variant === 'mega' ? 'text-[#C084FC]' : variant === 'tech' ? 'text-[#0FA9C6]' : 'text-[#D51F55]'} />
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
                    <div
                      className={`w-full mt-auto ${
                        open ? 'pt-3 pb-3 sm:pb-4' : 'pt-4 pb-0.5'
                      } border-t border-[#1C1F24] flex justify-center`}
                    >
                      {registered ? (
                        <div
                          className="w-auto inline-flex py-2 px-5 border-2 items-center justify-center gap-2"
                          style={{ backgroundColor: `${tier.main}26`, borderColor: tier.main, boxShadow: `2px 2px 0px ${tier.shadow}` }}
                        >
                          <Check size={16} className="stroke-[3.5] shrink-0" style={{ color: tier.main }} />
                          <span className="font-sans font-bold text-xs sm:text-sm tracking-wider uppercase" style={{ color: tier.main }}>
                            YOU&apos;RE REGISTERED
                          </span>
                        </div>
                      ) : locked ? (
                        <div className="w-auto inline-flex py-2 px-5 bg-[#131518] border-2 border-[#23262D] items-center justify-center gap-2 text-[#71767B]">
                          <Lock size={13} className="shrink-0 text-[#71767B]" />
                          <span className="font-sans font-bold text-xs sm:text-sm tracking-wider uppercase text-[#71767B]">
                            {full ? 'REGISTRATIONS CLOSED' : 'UNAVAILABLE'}
                          </span>
                        </div>
                      ) : card.is_team_event ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/participant/teams/new?event=${card.event_code}`)}
                          disabled={busyEvent === card.event_code}
                          className={`w-auto inline-flex py-2.5 px-6 sm:px-7 font-sans font-bold text-xs sm:text-sm uppercase tracking-wider items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            variant === 'mega'
                              ? 'bg-[#C084FC] text-[#090A0B] border-2 border-[#C084FC] shadow-[3px_3px_0px_#9333EA] hover:bg-[#D2A6FF] hover:shadow-[4px_4px_0px_#9333EA] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#9333EA]'
                              : variant === 'tech'
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
                          className={`w-auto inline-flex py-2.5 px-6 sm:px-7 font-sans font-bold text-xs sm:text-sm uppercase tracking-wider items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            variant === 'mega'
                              ? 'bg-[#C084FC] text-[#090A0B] border-2 border-[#C084FC] shadow-[3px_3px_0px_#9333EA] hover:bg-[#D2A6FF] hover:shadow-[4px_4px_0px_#9333EA] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#9333EA]'
                              : variant === 'tech'
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
  };


  /**
   * One catalog row: identity on the left, the single action on the right.
   *
   * Replaces the tall card that stood in a 2-3 column grid. The action button
   * is the only thing on this screen a participant actually presses, and in the
   * grid it sat at the bottom of a 350px card - so on a phone the button for
   * the event being read was usually off the bottom of the viewport.
   */
  const renderEventRow = (card: DashboardCatalogCard, i: number) => {
    const registered = card.state === 'REGISTERED';
    const blocked = card.state === 'BLOCKED';
    const full = card.state === 'FULL';
    const locked = blocked || full;
    const number = String(card.display_order ?? i + 1).padStart(2, '0');
    const variant = cardVariant(card.event_code);
    const mission = missionFor(card.event_code);
    const open = openCard === card.event_code;
    const busy = busyEvent === card.event_code;

    const tier =
      variant === 'mega'
        ? { main: '#C084FC', shadow: '#9333EA' }
        : variant === 'tech'
          ? { main: '#0FA9C6', shadow: '#08758A' }
          : { main: '#D51F55', shadow: '#A81443' };

    const actionClass =
      variant === 'mega'
        ? 'bg-[#C084FC] text-[#090A0B] border-2 border-[#C084FC] shadow-[3px_3px_0px_#9333EA] hover:bg-[#D2A6FF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#9333EA]'
        : variant === 'tech'
          ? 'bg-[#0FA9C6] text-[#090A0B] border-2 border-[#0FA9C6] shadow-[3px_3px_0px_#08758A] hover:bg-[#15C3E5] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#08758A]'
          : 'bg-[#D51F55] text-white border-2 border-[#D51F55] shadow-[3px_3px_0px_#A81443] hover:bg-[#E82C64] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#A81443]';

    // The hand-drawn frame is an SVG with preserveAspectRatio="none", so its
    // border sits a PROPORTION of the card in, not a fixed number of pixels:
    // the path bulges inward to x=18 of a 260-wide viewBox, i.e. 6.9% of the
    // width. px-5 (20px) fell inside that on any card wider than ~290px, which
    // is why the expanded details crossed the border on a phone. A percentage
    // tracks the frame at every width the row is used at.
    //
    // The number tag is the opposite case - a fixed 46px sticker - so the extra
    // indent that clears IT stays in pixels.
    return (
      <ComicHandDrawnCard
        key={card.event_code}
        code={number}
        variant={variant}
        className={`row-card transition-all duration-200 ${locked ? 'opacity-70 hover:opacity-85 !cursor-default' : '!cursor-default'}`}
        innerClassName={
          open
            // Expanded, the frame is taller and its top ink drops further in
            // (~16px at this height against ~4px at the bottom), which left the
            // first line 8px from the border and 28px of dead space under the
            // last. Weighted to the top to cancel that.
            ? 'w-full px-[12%] pt-[38px] pb-[18px] text-left select-text'
            // The hand-drawn frame is not vertically symmetric: its ink sits
            // ~3px below the content box at the top and ~5px above it at the
            // bottom, so equal padding rendered as 13px of clearance above and
            // 25px below. These two cancel that out at ~19px each.
            : 'w-full px-5 sm:px-6 pt-[22px] pb-[14px] text-left select-text'
        }
      >
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          {/* Only the identity clears the number tag; the action below spans
              the card, so it sits centred instead of shunted right. */}
          <div className={`min-w-0 flex-1 ${open ? 'pl-6 sm:pl-5' : 'pl-12 sm:pl-5'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-sans font-black text-base sm:text-lg uppercase tracking-wider leading-tight text-[#EEEEEA]">
                {card.name}
              </h3>
              {locked && (
                <span title="Unavailable" className="text-[#71767B]">
                  <Lock size={12} />
                </span>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-[#8E939D]">
              {card.is_team_event && (
                <span className="inline-flex items-center gap-1">
                  <Users size={12} className={variant === 'mega' ? 'text-[#C084FC]' : variant === 'tech' ? 'text-[#0FA9C6]' : 'text-[#D51F55]'} />
                  Team of{' '}
                  {card.min_team === card.max_team ? card.min_team : `${card.min_team}-${card.max_team}`}
                </span>
              )}
              {mission && (
                <button
                  type="button"
                  onClick={() => setOpenCard(open ? null : card.event_code)}
                  aria-expanded={open}
                  className={`font-bold uppercase tracking-[0.12em] underline underline-offset-2 transition-colors cursor-pointer hover:text-[#E5BD00] ${
                    open
                      ? 'text-[#E5BD00]'
                      : variant === 'mega'
                        ? 'text-[#C084FC]'
                        : variant === 'tech'
                          ? 'text-[#0FA9C6]'
                          : 'text-[#D51F55]'
                  }`}
                >
                  {open ? 'Hide details' : 'What is this?'}
                </button>
              )}
            </div>

            {locked && card.reason && (
              <p className="mt-2 flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-[#E08A9D]">
                <CalendarClock size={12} className="mt-0.5 shrink-0 text-[#D51F55]" />
                <span>{card.reason}</span>
              </p>
            )}
          </div>

          <div className="w-full sm:w-[184px] sm:shrink-0 flex justify-center sm:justify-end">
            {registered ? (
              <div
                className="w-auto inline-flex py-2 px-5 border-2 items-center justify-center gap-2"
                style={{ backgroundColor: `${tier.main}26`, borderColor: tier.main, boxShadow: `2px 2px 0px ${tier.shadow}` }}
              >
                <Check size={15} className="stroke-[3.5] shrink-0" style={{ color: tier.main }} />
                <span className="font-sans font-bold text-xs tracking-wider uppercase" style={{ color: tier.main }}>
                  REGISTERED
                </span>
              </div>
            ) : locked ? (
              <div className="w-auto inline-flex py-2 px-5 bg-[#131518] border-2 border-[#23262D] items-center justify-center gap-2 text-[#71767B]">
                <Lock size={13} className="shrink-0" />
                <span className="font-sans font-bold text-xs tracking-wider uppercase">
                  {full ? 'FULL' : 'UNAVAILABLE'}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (card.is_team_event) {
                    navigate(`/participant/teams/new?event=${card.event_code}`);
                  } else {
                    void onRegister(card);
                  }
                }}
                disabled={busy}
                className={`w-auto inline-flex py-2 px-6 font-sans font-bold text-xs uppercase tracking-wider items-center justify-center gap-2 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${actionClass}`}
              >
                {busy ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>WORKING...</span>
                  </>
                ) : (
                  <>
                    <span>{card.is_team_event ? 'CREATE TEAM' : 'REGISTER'}</span>
                    <span className="text-base leading-none">-&gt;</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {open && mission && (
          <div className="my-4 w-full overflow-hidden border-t-2 border-dashed border-[#23262D] pt-3.5 pb-1 space-y-2.5 break-words">
            <p className="font-mono text-xs leading-relaxed text-[#C2C6CE]">{mission.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-[#8E939D]">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-[#E5BD00]" />
                {mission.schedule_time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={11} className="text-[#0FA9C6]" />
                {mission.venue}
              </span>
            </div>
            {(mission.card_rules ?? mission.rules)?.length > 0 && (
              <ul className="space-y-1 font-mono text-[10.5px] leading-relaxed text-[#9DA2AC]">
                {(mission.card_rules ?? mission.rules).map((r) => (
                  <li key={r} className="flex items-start gap-1.5">
                    <span className="text-[#E5BD00] font-bold select-none">*</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Same popups as the row layout above. */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#1C1E23] pt-2">
              <button
                type="button"
                onClick={() => setDetailMission(mission)}
                className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
              >
                More about this event
              </button>
              {mission.coordinators?.length ? (
                <button
                  type="button"
                  onClick={() => setCoordMission(mission)}
                  className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#E5BD00] underline underline-offset-2 hover:text-[#0FA9C6]"
                >
                  Event coordinator
                </button>
              ) : null}
            </div>
          </div>
        )}
      </ComicHandDrawnCard>
    );
  };

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

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24 pt-4 sm:pt-6">
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
                    {/* Event name and team ID on ONE row: the ID is what a
                        coordinator asks for at the desk, so it belongs beside
                        the event it identifies rather than on a line below. */}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <p className="font-comic text-base uppercase tracking-wide text-[#EEEEEA]">
                        {reg.event_name}
                      </p>
                      {reg.team_id && (
                        <p className="font-mono text-[11px] tracking-wide text-[#0FA9C6]">
                          Team ID : {reg.team_id}
                        </p>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-[#71767B]">
                      {reg.team_name ? `Team ${reg.team_name} · ` : ''}
                      {reg.status === 'PENDING_ACCEPTANCE' ? 'Waiting on teammates' : 'Confirmed'}
                    </p>
                  </div>

                  {/* Cancel disappears once they have confirmed the line-up:
                      the point of confirming is that the picking is over. */}
                  {!lineupConfirmed && (
                    <button
                      onClick={() => void onCancel(reg.event_code, reg.event_name)}
                      disabled={busyEvent === reg.event_code}
                      title="Cancel"
                      className="border-2 border-[#23262D] p-2 text-[#71767B] transition-colors hover:border-[#D51F55] hover:text-[#D51F55] disabled:opacity-40"
                    >
                      {busyEvent === reg.event_code ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {/* The only Confirm on the page, and the only thing that sends
                mail: it sits with the list it confirms rather than at the foot
                of the catalog. */}
            {registrationComplete && !lineupConfirmed && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => void onConfirmLineup()}
                  disabled={confirming}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#1DB954] bg-transparent px-5 py-2 font-sans text-[11px] font-bold uppercase tracking-wider text-[#1DB954] shadow-[3px_3px_0px_#0E7A38] -rotate-1 transition-all hover:rotate-0 hover:-translate-y-0.5 hover:bg-[#1DB954] hover:text-[#090A0B] hover:shadow-[4px_4px_0px_#0E7A38] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#0E7A38] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {confirming ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Confirm my events
                    </>
                  )}
                </button>
                <p className="text-center font-mono text-[11px] leading-relaxed text-[#71767B]">
                  Confirm to get the list emailed to you. You can still change
                  them until registrations close.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Once the line-up is confirmed the whole catalog goes — heading,
            rules button and all. The dashboard ends at "My events", because
            there is nothing left to do here. */}
        {!lineupConfirmed && (
        <section>
          <div className="mb-5 flex items-center justify-between gap-2 sm:gap-4">
            <ComicSectionTitle tone="cyan" className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-xl shrink-0">
              <ComicBolt tone="yellow" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Event catalog
            </ComicSectionTitle>

            {/* The rules that decide what combines with what. Reading them
                before picking beats finding out from a rejection. */}
            <button
              type="button"
              onClick={openRules}
              className="shrink-0 inline-flex items-center justify-center border-2 border-[#0FA9C6] bg-transparent px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-sans text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#0FA9C6] shadow-[2.5px_2.5px_0px_#08758A] -rotate-1 transition-all hover:rotate-0 hover:bg-[#0FA9C6] hover:text-[#090A0B] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_#08758A] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#08758A] cursor-pointer"
            >
              Registration description
            </button>
          </div>

          {/*
              Two layouts, one list. Mobile gets a full-width row per event:
              nine tall cards two or three abreast meant scrolling past most of
              them to reach the one being looked for, and the action button sat
              below the fold. Desktop keeps the grid, where that was never a
              problem and the cards have room to breathe.

              Grouped mega -> technical -> non-technical. The per-card
              TECH/NON-TECH badge is gone with the grouping: the heading above
              the list already says it.
          */}
          {catalogClosed ? (
            <p className="border-2 border-[#23262D] bg-[#111214] pad-box-sm font-mono text-[11px] leading-relaxed text-[#8E939D]">
              {`That is all ${counted_max} of your events. Cancel one above if you want to swap it for something else.`}
            </p>
          ) : (
          GROUPS.map((group) => {
            const cards = catalog.filter((c) => groupOf(c) === group.key);
            if (!cards.length) return null;

            return (
              <div key={group.key} className="mb-9 last:mb-0">
                <div className="mb-4 flex items-center gap-3">
                  <ComicSectionTitle tone={group.tone}>{group.title}</ComicSectionTitle>
                  <span className="font-mono text-[11px] text-[#71767B]">{cards.length}</span>
                  <span className="h-px flex-1 bg-[#23262D]" />
                </div>

                {/* mobile: one long row each */}
                <div className="grid grid-cols-1 gap-4 items-start sm:hidden">
                  {cards.map((card, i) => renderEventRow(card, i))}
                </div>

                {/* desktop and up: the original card grid */}
                <div className="hidden gap-6 items-start sm:grid sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map((card, i) => renderEventCard(card, i))}
                </div>
              </div>
            );
          }))}

        </section>
        )}

        {/* Outside the catalog on purpose: an unpaid or unverified
            registration still needs its way forward even once the events are
            confirmed. */}
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
      </main>

      {/* Full event detail, opened from "More about this event" on a card. */}
      <EventDetailModal event={detailMission} onClose={() => setDetailMission(null)} />

      {/* Coordinators on their own, deliberately small: a participant opening
          this wants a name and a number to ring, not the whole event brief. */}
      {coordMission && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setCoordMission(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-xs border-2 border-[#E5BD00] bg-[#111214] p-4 shadow-[5px_5px_0px_#090A0B]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Coordinators for ${coordMission.title}`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="font-comic text-sm uppercase tracking-wider text-[#E5BD00]">
                Event coordinator
              </p>
              <button
                type="button"
                onClick={() => setCoordMission(null)}
                aria-label="Close"
                className="shrink-0 text-[#71767B] transition-colors hover:text-[#EEEEEA]"
              >
                <X size={15} />
              </button>
            </div>

            <p className="mb-3 font-mono text-[11px] text-[#8E939D]">{coordMission.title}</p>

            <ul className="space-y-2">
              {coordMission.coordinators?.map((c) => (
                <li key={c.phone} className="border-2 border-[#23262D] bg-[#0B0D10] px-3 py-2">
                  <p className="font-mono text-xs font-bold text-[#EEEEEA]">{c.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#71767B]">
                    {c.role}
                  </p>
                  <a
                    href={`tel:${c.phone.replace(/\s/g, '')}`}
                    className="mt-1 inline-block font-mono text-xs font-bold text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
                  >
                    {c.phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ComicPageShell>
  );
};

export default ParticipantDashboardPage;
