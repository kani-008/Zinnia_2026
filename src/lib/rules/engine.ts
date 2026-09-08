// Zinnia 2026 — the rule engine.
//
// Reconstructed from §2 (the R1-R15 table) and §2.1 (the validator pseudocode)
// of zinnia-2026-registration-flow.md. The check order below follows that
// pseudocode deliberately, because the order is load-bearing: R7 returns OK
// early for Short Film, so the duplicate check has to come before it.
//
// The engine never returns a bare boolean. A refusal names the rule and carries
// a message specific enough to render verbatim on a dashboard card — "Clashes
// with Plot Twist (2:00-3:00)", never "unavailable". That specificity is the
// whole point (§4.3), and it is what keeps the help desk from drowning in
// "why can't I register".
//
// The server re-checks everything. This module exists so the UI can predict the
// server's answer, not so the UI can be trusted.

import {
  BLOCKS,
  DEFAULT_CONFIG,
  EVENTS,
  FIXED_AFTERNOON,
  WINDOWS,
  timeSpanOf,
} from './catalog';
import type {
  RuleId,
  CanCancelInput,
  CanRegisterInput,
  CanRegisterTeamInput,
  CatalogEntry,
  Decision,
  EventCode,
  EventDef,
  Registration,
  RuleConfig,
  Warning,
  WindowCode,
} from './types';

const cfg = (partial?: Partial<RuleConfig>): RuleConfig => ({ ...DEFAULT_CONFIG, ...partial });

const reject = (rule: RuleId, message: string, userId?: string): Decision => ({
  ok: false,
  rule,
  message,
  ...(userId ? { userId } : {}),
});

const held = (existing: Registration[], code: EventCode): boolean =>
  existing.some((r) => r.eventCode === code);

const onCampus = (existing: Registration[]): Registration[] =>
  existing.filter((r) => EVENTS[r.eventCode].type !== 'ONLINE');

const countedCount = (existing: Registration[]): number =>
  existing.filter((r) => EVENTS[r.eventCode].countsTowardLimit).length;

const fixedAfternoonHeld = (existing: Registration[]): EventCode | null =>
  existing.find((r) => FIXED_AFTERNOON.includes(r.eventCode))?.eventCode ?? null;

const isClosed = (ev: EventDef, now: Date): boolean => now.getTime() >= new Date(ev.regClosesAt).getTime();

/* ==========================================================================
   R4 / R6 — per-window minute budgets
   ==========================================================================
   FIXED events swallow whole blocks, and R2/R3/R5 already govern those
   collisions. What the minute budget actually polices is the RUNNING events
   plus Paper Verse sharing a window.

   Paper Verse counts 15 minutes against MORNING. Its panel is not
   assigned until the shortlist (§4.4), so which half of the day it lands in is
   unknown at registration time; charging it to the morning is the conservative
   reading of R6's "PaperPres(if morning slot)". */

/** Minutes a single event consumes inside a given window. */
const minutesIn = (code: EventCode, window: WindowCode): number => {
  const ev = EVENTS[code];
  if (ev.type === 'RUNNING') return ev.window === window ? ev.durationMin : 0;
  if (code === 'PAPER_PRESENTATION') return window === 'MORNING' ? ev.durationMin : 0;
  // FIXED / ONLINE: block occupancy, not minute arithmetic.
  return 0;
};

const usedMinutes = (existing: Registration[], window: WindowCode): number =>
  existing.reduce((sum, r) => sum + minutesIn(r.eventCode, window), 0);

/**
 * How much of a window is actually usable. Borderland's round 1 takes B2, so a
 * Borderland holder has only B1's 60 minutes left in the morning — that is R4's
 * "the total B1 load must be <= 60 min".
 */
const availableMinutes = (
  existing: Registration[],
  window: WindowCode,
  incoming?: EventCode,
): number => {
  const codes = existing.map((r) => r.eventCode);
  if (incoming) codes.push(incoming);

  let avail = WINDOWS[window].totalMinutes;

  for (const code of codes) {
    const ev = EVENTS[code];
    if (ev.type !== 'FIXED') continue;
    for (const b of ev.blocks) {
      if (BLOCKS[b].window === window) avail -= BLOCKS[b].minutes;
    }
  }

  return Math.max(avail, 0);
};

/* ==========================================================================
   canRegister — one person, one event
   ========================================================================== */

export function canRegister(input: CanRegisterInput): Decision {
  const { participant, eventCode, existing, remainingCapacity, now } = input;
  const config = cfg(input.config);
  const ev = EVENTS[eventCode];
  const warnings: Warning[] = [];

  if (!ev.isActive) {
    return reject('R12', `${ev.name} is not open for registration.`, participant.userId);
  }

  // R11 — DECOUPLED, and mirrors the server (backend/services/rules_engine.py).
  // Payment status decides nothing about event access: submitting the payment
  // reference is the end of registration, so the catalog is open from that
  // moment. A rejected payment holds the registration rather than cancelling
  // it, so it does not close the catalog either. Payment status now gates only
  // the master QR and the WhatsApp group link, neither of which lives here.

  // R14 — each event carries its own close date; Short Film closes early.
  if (isClosed(ev, now)) {
    return reject('R14', `Registration for ${ev.name} has closed.`, participant.userId);
  }

  // R9 — checked before the Short Film branch, which returns OK early.
  if (held(existing, eventCode)) {
    return reject('R9', `You are already registered for ${ev.name}.`, participant.userId);
  }

  // R7 — Short Film is online: no block, no event count, but it needs at least
  // one on-campus event to hang off. This makes registration order-sensitive by
  // design: Short Film cannot go first.
  if (eventCode === 'SHORT_FILM') {
    if (onCampus(existing).length === 0) {
      return reject(
        'R7',
        'Register for at least one on-campus event before adding Short Film.',
        participant.userId,
      );
    }
    return { ok: true, warnings };
  }

  // R1 — Paper Verse and Short Film are exempt from the count, never
  // from the clash rules below.
  if (ev.countsTowardLimit && countedCount(existing) >= config.maxCountedEvents) {
    return reject(
      'R1',
      `You have reached ${config.maxCountedEvents} events.`,
      participant.userId,
    );
  }

  // R2 — Gadget Codes runs B1-B4, so it combines with nothing on campus,
  // Paper Verse included. Short Film is the only permitted addition.
  if (eventCode === 'GADGET_CODES' && onCampus(existing).length > 0) {
    return reject('R2', 'Gadget Codes runs all day and cannot be combined with another event.', participant.userId);
  }
  if (held(existing, 'GADGET_CODES')) {
    return reject('R2', 'Gadget Codes runs all day and cannot be combined with another event.', participant.userId);
  }

  // R3 — at most one fixed afternoon event.
  if (FIXED_AFTERNOON.includes(eventCode)) {
    const clash = fixedAfternoonHeld(existing);
    if (clash) {
      return reject(
        'R3',
        `Clashes with ${EVENTS[clash].name} (${timeSpanOf(clash)}).`,
        participant.userId,
      );
    }
  }

  // R5 — Lost in SQL needs 30 free minutes in B3-B4.
  if (eventCode === 'LOST_IN_SQL') {
    const clash = fixedAfternoonHeld(existing);
    if (clash) {
      return reject(
        'R5',
        `Clashes with ${EVENTS[clash].name} (${timeSpanOf(clash)}).`,
        participant.userId,
      );
    }
  }
  if (FIXED_AFTERNOON.includes(eventCode) && held(existing, 'LOST_IN_SQL')) {
    return reject('R5', 'Clashes with Lost in SQL (2:00-3:00).', participant.userId);
  }

  // R4 / R6 — window minute budgets, recomputed with the incoming event in
  // place so that adding Borderland correctly shrinks the morning to 60.
  for (const window of ['MORNING', 'AFTERNOON'] as WindowCode[]) {
    const avail = availableMinutes(existing, window, eventCode);
    const used = usedMinutes(existing, window) + minutesIn(eventCode, window);
    if (used > avail) {
      return reject(
        window === 'MORNING' ? 'R6' : 'R4',
        `Not enough free time in ${WINDOWS[window].label}.`,
        participant.userId,
      );
    }
  }

  // R12 — capacity.
  if (remainingCapacity !== null && remainingCapacity !== undefined && remainingCapacity <= 0) {
    return reject('R12', `${ev.name} is full — registrations closed.`, participant.userId);
  }

  // R15 — a combination that fills B1 exactly leaves no turnaround between
  // back-to-back events. Legal, but the participant has to say yes.
  if (config.warnTightB1) {
    const avail = availableMinutes(existing, 'MORNING', eventCode);
    const used = usedMinutes(existing, 'MORNING') + minutesIn(eventCode, 'MORNING');
    if (avail > 0 && used === avail) {
      if (!config.allowTightB1) {
        return reject(
          'R15',
          'Not enough turnaround time between your 11:00-12:00 events.',
          participant.userId,
        );
      }
      warnings.push({
        rule: 'R15',
        message:
          'These events fill 11:00-12:00 exactly — no gap between them. Register anyway?',
      });
    }
  }

  return { ok: true, warnings };
}

/* ==========================================================================
   canRegisterTeam — R8 / R9 / R10
   ========================================================================== */

export function canRegisterTeam(input: CanRegisterTeamInput): Decision {
  const { eventCode, members, remainingCapacity, now } = input;
  const config = cfg(input.config);
  const ev = EVENTS[eventCode];

  // R10 — size first, so an obviously wrong team fails on size rather than on
  // an incidental per-member rule.
  if (members.length < ev.minTeam || members.length > ev.maxTeam) {
    const expected =
      ev.minTeam === ev.maxTeam ? String(ev.minTeam) : `${ev.minTeam}-${ev.maxTeam}`;
    return reject(
      'R10',
      `${ev.name} needs a team of ${expected}, including you.`,
    );
  }

  // R9 — the same UserID cannot appear twice in one team.
  const seen = new Set<string>();
  for (const m of members) {
    const id = m.participant.userId;
    if (seen.has(id)) {
      return reject('R9', `${id} appears twice in this team.`, id);
    }
    seen.add(id);
  }

  // R8 — every member must independently satisfy R1-R7. The whole request is
  // rejected naming the specific member and reason.
  const warnings: Warning[] = [];
  for (const m of members) {
    const decision = canRegister({
      participant: m.participant,
      eventCode,
      existing: m.existing,
      remainingCapacity,
      now,
      config,
      confirmWarnings: input.confirmWarnings,
    });

    if (!decision.ok) {
      return {
        ok: false,
        rule: decision.rule,
        message: `${m.participant.userId}: ${decision.message}`,
        userId: m.participant.userId,
      };
    }
    warnings.push(...decision.warnings);
  }

  return { ok: true, warnings };
}

/* ==========================================================================
   canCancel — R14 plus the R7 orphan guard
   ========================================================================== */

export function canCancel(input: CanCancelInput): Decision {
  const { eventCode, existing, now } = input;
  const ev = EVENTS[eventCode];

  if (!held(existing, eventCode)) {
    return reject('R14', `You are not registered for ${ev.name}.`);
  }

  // R14 — free until this event's own close date, never after.
  if (isClosed(ev, now)) {
    return reject(
      'R14',
      `Registration for ${ev.name} has closed — cancellations are no longer self-service.`,
    );
  }

  // R7 orphan guard — block, never cascade. If dropping this on-campus event
  // would leave a Short Film registration with no on-campus event to hang off,
  // refuse with a clear reason rather than silently invalidating Short Film or
  // auto-cancelling it on the participant's behalf.
  if (ev.type !== 'ONLINE' && held(existing, 'SHORT_FILM')) {
    const remaining = onCampus(existing).filter((r) => r.eventCode !== eventCode);
    if (remaining.length === 0) {
      return reject(
        'R7',
        'Cancel Short Film first — it needs at least one on-campus event to remain valid.',
      );
    }
  }

  return { ok: true, warnings: [] };
}

/* ==========================================================================
   evaluateCatalog — the three dashboard card states (§4.3)
   ========================================================================== */

export function evaluateCatalog(args: {
  participant: CanRegisterInput['participant'];
  existing: Registration[];
  capacity?: Partial<Record<EventCode, number | null>>;
  now: Date;
  config?: Partial<RuleConfig>;
}): CatalogEntry[] {
  const { participant, existing, capacity = {}, now, config } = args;

  return (Object.values(EVENTS) as EventDef[]).map((ev) => {
    const base = {
      eventCode: ev.code,
      name: ev.name,
      minTeam: ev.minTeam,
      maxTeam: ev.maxTeam,
      isTeamEvent: ev.minTeam > 1,
      allowsTeam: ev.maxTeam > 1,
    };

    if (held(existing, ev.code)) {
      return { ...base, state: 'REGISTERED' as const };
    }

    const remaining = capacity[ev.code];
    const decision = canRegister({
      participant,
      eventCode: ev.code,
      existing,
      remainingCapacity: remaining,
      now,
      config,
    });

    if (decision.ok) {
      return {
        ...base,
        state: 'AVAILABLE' as const,
        warnings: decision.warnings.map((w) => w.message),
      };
    }

    // A full event reads as FULL rather than BLOCKED, so the copy can say
    // "Registrations closed" instead of a clash reason.
    const isFull = decision.rule === 'R12';
    return {
      ...base,
      state: isFull ? ('FULL' as const) : ('BLOCKED' as const),
      reason: decision.message,
      rule: decision.rule,
    };
  });
}
