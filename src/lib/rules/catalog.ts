// Zinnia 2026 — event catalog, mirrored from the live `zin26` schema.
//
// Every value here was read back out of the database (zin26.events,
// zin26.blocks, zin26.windows, zin26.event_blocks) rather than transcribed from
// the spec, so this file and the server agree by construction.
//
// TEAM SIZES (spec rule, matches the seed exactly):
//   TECH team events are 2 students - except Paper Verse, which is 2-3.
//   NON_TECH team events are 3 students, maximum 3.
//   Short Film is online and is exactly 1 (ruling of 4 September 2026).

import type {
  BlockCode,
  BlockDef,
  EventCode,
  EventDef,
  RuleConfig,
  WindowCode,
  WindowDef,
} from './types';

/** Registration closes end-of-day 22 September IST for everything... */
const CLOSES_DEFAULT = '2026-09-22T18:29:59+00:00';
/** ...except Short Film, which closes two days earlier (§7.1, §4.8). */
const CLOSES_SHORT_FILM = '2026-09-20T18:29:59+00:00';

export const BLOCKS: Record<BlockCode, BlockDef> = {
  B1: { code: 'B1', label: 'Morning slot 1', startsAt: '11:00:00', endsAt: '12:00:00', minutes: 60, window: 'MORNING', sortOrder: 1 },
  B2: { code: 'B2', label: 'Morning slot 2', startsAt: '12:00:00', endsAt: '13:00:00', minutes: 60, window: 'MORNING', sortOrder: 2 },
  LUNCH: { code: 'LUNCH', label: 'Lunch', startsAt: '13:00:00', endsAt: '14:00:00', minutes: 60, window: null, sortOrder: 3 },
  B3: { code: 'B3', label: 'Afternoon slot 1', startsAt: '14:00:00', endsAt: '14:30:00', minutes: 30, window: 'AFTERNOON', sortOrder: 4 },
  B4: { code: 'B4', label: 'Afternoon slot 2', startsAt: '14:30:00', endsAt: '15:00:00', minutes: 30, window: 'AFTERNOON', sortOrder: 5 },
  PRIZE: { code: 'PRIZE', label: 'Prize distribution', startsAt: '15:00:00', endsAt: '16:00:00', minutes: 60, window: null, sortOrder: 6 },
};

export const WINDOWS: Record<WindowCode, WindowDef> = {
  MORNING: { code: 'MORNING', label: '11:00 - 1:00', totalMinutes: 120 },
  AFTERNOON: { code: 'AFTERNOON', label: '2:00 - 3:00', totalMinutes: 60 },
};

export const EVENTS: Record<EventCode, EventDef> = {
  // Capacity is FIXED at 24 by the timeline (2 panels x 12), not an admin-set
  // number like the other events (§4.4). Counts toward the 3-event ceiling.
  PAPER_PRESENTATION: {
    code: 'PAPER_PRESENTATION',
    name: 'Paper Verse',
    category: 'TECH',
    type: 'SLOT',
    minTeam: 2,
    maxTeam: 3,
    capacity: 30,
    durationMin: 15,
    window: null,
    blocks: [],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  // Runs all day: rounds 1-2 in the morning, the final in the afternoon. This
  // is why it combines with nothing else on campus (R2).
  GADGET_CODES: {
    code: 'GADGET_CODES',
    name: 'Gadget Codes',
    category: 'TECH',
    type: 'FIXED',
    minTeam: 2,
    maxTeam: 2,
    capacity: null,
    durationMin: 180,
    window: null,
    blocks: ['B1', 'B2', 'B3', 'B4'],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  LAST_SIGNAL: {
    code: 'LAST_SIGNAL',
    name: 'The Last Signal',
    category: 'TECH',
    type: 'RUNNING',
    minTeam: 1,
    maxTeam: 1,
    capacity: null,
    durationMin: 30,
    window: 'MORNING',
    blocks: [],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  DEBUGGING: {
    code: 'DEBUGGING',
    name: 'Debugging Protocol',
    category: 'TECH',
    type: 'RUNNING',
    minTeam: 1,
    maxTeam: 1,
    capacity: null,
    durationMin: 30,
    window: 'MORNING',
    blocks: [],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  LOST_IN_SQL: {
    code: 'LOST_IN_SQL',
    name: 'Lost in SQL',
    category: 'TECH',
    type: 'RUNNING',
    // Solo — per the coordinators' team-size list of 6 September 2026, which
    // superseded migration 005_lost_in_sql_team_of_two.sql. Mirrors the
    // server engine, zin26.events and src/config/events.ts.
    minTeam: 1,
    maxTeam: 1,
    capacity: null,
    durationMin: 30,
    window: 'AFTERNOON',
    blocks: [],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  // R1 in the morning (B2), R2 after lunch (B3+B4) — so it eats the whole
  // afternoon window, which is what makes it incompatible with Lost in SQL (R5).
  BORDERLAND: {
    code: 'BORDERLAND',
    name: 'Borderland @ GCEE',
    category: 'NON_TECH',
    type: 'FIXED',
    minTeam: 3,
    maxTeam: 3,
    capacity: null,
    durationMin: 120,
    window: null,
    blocks: ['B2', 'B3', 'B4'],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  THINK_STRIKE_WIN: {
    code: 'THINK_STRIKE_WIN',
    name: 'Think, Strike, Win',
    category: 'NON_TECH',
    type: 'FIXED',
    minTeam: 3,
    maxTeam: 3,
    capacity: null,
    durationMin: 60,
    window: null,
    blocks: ['B3', 'B4'],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  PLOT_TWIST: {
    code: 'PLOT_TWIST',
    name: 'Plot Twist',
    category: 'NON_TECH',
    type: 'FIXED',
    minTeam: 3,
    maxTeam: 3,
    capacity: null,
    durationMin: 60,
    window: null,
    blocks: ['B3', 'B4'],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_DEFAULT,
  },

  // Off-campus and asynchronous: occupies no block, but it still counts
  // toward the ceiling, and closes early. Requires an on-campus event (R7).
  SHORT_FILM: {
    code: 'SHORT_FILM',
    name: 'Short Film',
    category: 'NON_TECH',
    type: 'ONLINE',
    // Exactly 1 (ruling of 4 September 2026): online, no block, no count, so
    // team size affects no rule. Mirrors rules_engine.EVENTS["SHORT_FILM"].
    minTeam: 1,
    maxTeam: 1,
    capacity: null,
    durationMin: 0,
    window: null,
    blocks: [],
    countsTowardLimit: true,
    isActive: true,
    regClosesAt: CLOSES_SHORT_FILM,
  },
};

export const DEFAULT_CONFIG: RuleConfig = {
  maxCountedEvents: 3,
  warnTightB1: true,
  allowTightB1: true,
};

const AFTERNOON_BLOCKS: BlockCode[] = ['B3', 'B4'];

/** FIXED events that occupy afternoon blocks — at most one is allowed (R3). */
export const FIXED_AFTERNOON: EventCode[] = (Object.values(EVENTS) as EventDef[])
  .filter((e) => e.type === 'FIXED' && e.blocks.some((b) => AFTERNOON_BLOCKS.includes(b)))
  .map((e) => e.code);

/** Everything that physically happens on campus — i.e. everything but Short Film. */
export const ON_CAMPUS: EventCode[] = (Object.values(EVENTS) as EventDef[])
  .filter((e) => e.type !== 'ONLINE')
  .map((e) => e.code);

/** Blocks an event occupies, resolved through BLOCKS for label/time lookups. */
export const blocksOf = (code: EventCode): BlockDef[] =>
  EVENTS[code].blocks.map((b) => BLOCKS[b]);

/** Human-readable time span for a message like "Clashes with Plot Twist (2:00-3:00)". */
export const timeSpanOf = (code: EventCode): string => {
  const ev = EVENTS[code];
  if (ev.window) return WINDOWS[ev.window].label;
  const bs = blocksOf(code);
  if (bs.length === 0) return 'online';
  const sorted = [...bs].sort((a, b) => a.sortOrder - b.sortOrder);
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${hour12}:00` : `${hour12}:${String(m).padStart(2, '0')}`;
  };
  return `${fmt(sorted[0].startsAt)}-${fmt(sorted[sorted.length - 1].endsAt)}`;
};
