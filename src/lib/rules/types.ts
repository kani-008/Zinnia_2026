// Zinnia 2026 — rule engine types.
//
// Reconstructed from the live `zin26` schema (events / blocks / windows /
// event_blocks) plus §1-§3 of zinnia-2026-registration-flow.md. The shapes here
// mirror the DB columns deliberately: the server is the authority, and this
// module exists so the UI can predict the server's answer and show the specific
// reason a registration would be refused.

/** Time blocks on the day. LUNCH and PRIZE are not registrable. */
export type BlockCode = 'B1' | 'B2' | 'LUNCH' | 'B3' | 'B4' | 'PRIZE';

/** The two halves of the day that RUNNING events float inside. */
export type WindowCode = 'MORNING' | 'AFTERNOON';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type EventCode =
  | 'PAPER_PRESENTATION'
  | 'GADGET_CODES'
  | 'LAST_SIGNAL'
  | 'DEBUGGING'
  | 'LOST_IN_SQL'
  | 'BORDERLAND'
  | 'THINK_STRIKE_WIN'
  | 'PLOT_TWIST'
  | 'SHORT_FILM';

/** The rule each rejection traces back to, so the UI and tests can assert on it. */
export type RuleId =
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8'
  | 'R9' | 'R10' | 'R11' | 'R12' | 'R13' | 'R14' | 'R15';

export type EventCategory = 'TECH' | 'NON_TECH';

/**
 * SLOT    — assigned a numbered slot (Paper Verse's 24 panels)
 * FIXED   — pinned to specific blocks, same for everyone
 * RUNNING — floats anywhere inside its window, 30 min a head
 * ONLINE  — off-campus, occupies no block (Short Film)
 */
export type EventType = 'SLOT' | 'FIXED' | 'RUNNING' | 'ONLINE';

export interface BlockDef {
  code: BlockCode;
  label: string;
  startsAt: string;
  endsAt: string;
  minutes: number;
  /** null for LUNCH and PRIZE, which belong to neither window */
  window: WindowCode | null;
  sortOrder: number;
}

export interface WindowDef {
  code: WindowCode;
  label: string;
  totalMinutes: number;
}

export interface EventDef {
  code: EventCode;
  name: string;
  category: EventCategory;
  type: EventType;
  minTeam: number;
  maxTeam: number;
  /** null means uncapped */
  capacity: number | null;
  durationMin: number;
  /** set for RUNNING events; FIXED events use `blocks` instead */
  window: WindowCode | null;
  /** blocks this event occupies across all its rounds */
  blocks: BlockCode[];
  /** true for every event: nothing is exempt from the 3-event ceiling */
  countsTowardLimit: boolean;
  isActive: boolean;
  /** ISO timestamp; Short Film closes two days earlier (§7.1) */
  regClosesAt: string;
}

/** One of the participant's existing registrations. */
export interface Registration {
  eventCode: EventCode;
  /** present once a team event has been confirmed */
  teamId?: string | null;
}

export interface Participant {
  userId: string;
  paymentStatus: PaymentStatus;
}

/** A legal-but-tight combination the participant must acknowledge (R15). */
export interface Warning {
  rule: RuleId;
  message: string;
}

/**
 * The engine never returns a bare boolean. A refusal always names the rule and
 * carries a message specific enough to show verbatim on the card — "Clashes
 * with Plot Twist (2:00-3:00)", not "unavailable".
 */
export type Decision =
  | { ok: true; warnings: Warning[] }
  | { ok: false; rule: RuleId; message: string; userId?: string };

export interface RuleConfig {
  /** R1 — the counted-event ceiling */
  maxCountedEvents: number;
  /**
   * R15 (spec's WARN_TIGHT_B1) — a combination that fills B1 exactly, with no
   * turnaround between back-to-back events, raises a warning the participant
   * must acknowledge rather than being accepted silently.
   */
  warnTightB1: boolean;
  /**
   * R15 (spec's ALLOW_TIGHT_B1) — set false to refuse that combination
   * outright. Coordinators can flip this on the day without a code change.
   */
  allowTightB1: boolean;
}

/** Per-member input for a team registration check. */
export interface TeamMemberInput {
  participant: Participant;
  existing: Registration[];
}

export interface CanRegisterInput {
  participant: Participant;
  eventCode: EventCode;
  existing: Registration[];
  /** null/undefined means uncapped; 0 means full */
  remainingCapacity?: number | null;
  now: Date;
  config?: Partial<RuleConfig>;
  /** set once the participant has seen and accepted the R15 warning */
  confirmWarnings?: boolean;
}

export interface CanRegisterTeamInput {
  eventCode: EventCode;
  members: TeamMemberInput[];
  remainingCapacity?: number | null;
  now: Date;
  config?: Partial<RuleConfig>;
  confirmWarnings?: boolean;
}

export interface CanCancelInput {
  eventCode: EventCode;
  existing: Registration[];
  now: Date;
  config?: Partial<RuleConfig>;
}

/** One card in the dashboard catalog. */
export interface CatalogEntry {
  eventCode: EventCode;
  name: string;
  state: 'AVAILABLE' | 'BLOCKED' | 'FULL' | 'REGISTERED';
  /** why it is blocked — the whole point of the three-state design (§4.3) */
  reason?: string;
  rule?: RuleId;
  warnings?: string[];
  minTeam: number;
  maxTeam: number;
  /** a team is REQUIRED (minTeam > 1) */
  isTeamEvent: boolean;
  /** a team is merely permitted (Short Film is 1-3) */
  allowsTeam: boolean;
}
