export type AdminRole =
  | 'SUPER_ADMIN'
  | 'TREASURER'
  | 'GATE_ADMIN'
  | 'FOOD_ADMIN'
  | 'EVENT_COORDINATOR'
  /** onspot1 / onspot2: the on-spot desk and nothing else */
  | 'SPOT_DESK';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  allowed_events: string[];
}

/** Derived server-side in admin_panel_service._derive_state. */
export type EventState = 'OPEN' | 'NEARLY_FULL' | 'FULL' | 'CLOSED';

export interface AdminEvent {
  event_code: string;
  name: string;
  capacity: number | null;
  capacity_unit: 'TEAMS' | 'PARTICIPANTS';
  /** zin26.events.capacity_is_locked — capacity fixed by the timetable, not a preference. */
  capacity_is_locked: boolean;
  is_active: boolean;
  registration_open: boolean;
  reg_closes_at: string | null;
  closed_reason: string | null;
  closed_at: string | null;
  closed_by: string | null;
  min_team: number;
  max_team: number;
  participants_confirmed: number;
  participants_held: number;
  participants_used: number;
  teams_confirmed: number;
  teams_pending: number;
  teams_used: number;
  paid_confirmed: number;
  used: number;
  remaining: number | null;
  state: EventState;
  pct: number | null;
}

export type PaymentFlag =
  | 'AMOUNT_MISMATCH'
  | 'DUPLICATE_REF'
  | 'RESUBMISSION'
  | 'NO_SCREENSHOT'
  | 'EMAIL_UNVERIFIED'
  | 'BYPASSED'
  | 'ON_SPOT';

export interface PaymentRow {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department: string;
  year: string;
  food_preference: 'VEG' | 'NON_VEG';
  payment_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  registration_id: string;
  registered_at: string;
  payment_id: string | null;
  amount: number | null;
  txn_ref: string | null;
  reject_reason: string | null;
  screenshot_url: string | null;
  /** bank that received this payment, e.g. "SBI"; empty on pre-split rows */
  payee_bank: string;
  /** treasurer's reason if approved without a bank check; null on a normal approval */
  approval_note: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  attempt_no: number;
  email_verified: boolean;
  events_count: number;
  event_list: string | null;
  flags: PaymentFlag[];
}

export interface PaymentAttempt {
  id: string;
  amount: number | null;
  txn_ref: string | null;
  status: string;
  reject_reason: string | null;
  screenshot_url: string | null;
  approval_note?: string | null;
  created_at: string;
  approved_at: string | null;
}

/* ---------------------------------------------------- on-spot desk (/admin/spot) */

export type SpotPaymentMethod = 'CASH' | 'UPI';

export interface SpotPerson {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  department?: string;
  year?: string;
  food_preference?: 'VEG' | 'NON_VEG';
  payment_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
}

export interface SpotSearchResult {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  payment_status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/** One card of rules_engine.evaluate_catalog, as the desk sees it. */
export interface SpotCatalogCard {
  event_code: string;
  name: string;
  category: 'TECH' | 'NON_TECH';
  min_team: number;
  max_team: number;
  is_team_event: boolean;
  allows_team: boolean;
  asks_topic: boolean;
  state: 'AVAILABLE' | 'REGISTERED' | 'FULL' | 'BLOCKED';
  reason?: string;
  /** rule id behind a FULL/BLOCKED state, e.g. R14 for a passed close date */
  rule?: string;
  warnings?: string[];
}

export interface SpotRegistration {
  reg_id: number;
  event_code: string;
  event_name: string;
  status: string;
  source: 'ONLINE' | 'SPOT';
  team_id: string | null;
  team_name: string | null;
  team_status: string | null;
  is_captain: boolean;
  captain_user_id: string | null;
}

export interface SpotDetail {
  participant: SpotPerson;
  payment: {
    amount: number | null;
    status: string;
    txn_ref: string | null;
    approval_note: string | null;
    is_spot: boolean;
  } | null;
  registrations: SpotRegistration[];
  catalog: SpotCatalogCard[];
  counted_used: number;
  counted_max: number;
}

/** One on-spot desk UPI account - never one of the website's accounts. */
export interface SpotUpiAccount {
  /** sent back with the registration; the server checks this login may use it */
  key: string;
  /** "Desk 1" / "Desk 2" */
  label: string;
  upi_id: string;
  payee_name: string;
}

/** GET /api/admin/spot/payee - the desk UPI account(s) this login may show a QR for. */
export interface SpotPayee {
  /** true for onspot1 / onspot2: the login is tied to its own account */
  fixed: boolean;
  accounts: SpotUpiAccount[];
  amount: number;
}

export interface SpotMoney {
  count: number;
  amount: number;
}

/** One desk login's till: what it registered and took. */
export interface SpotTill {
  /** null for someone who is not a desk login (a treasurer covering the desk) */
  username: string | null;
  name: string;
  /** the UPI account this login takes payments into; null = cash only */
  upi_account: { label: string; upi_id: string } | null;
  participants: number;
  cash: SpotMoney;
  upi: SpotMoney;
  total: SpotMoney;
}

/** GET /api/admin/spot/summary - the on-spot desk's dashboard. */
export interface SpotSummary {
  generated_at: string;
  fee: number;
  /** the admin's capacity rows, the same for every viewer, plus the desk's share */
  capacity: (AdminEvent & { desk_used: number })[];
  /** MINE: a desk login's own till. ALL: every till, for admins and treasurers. */
  scope: 'MINE' | 'ALL';
  me?: SpotTill;
  tills?: SpotTill[];
  total?: { participants: number; cash: SpotMoney; upi: SpotMoney; total: SpotMoney };
}

/** GET /api/admin/spot/check-email */
export interface SpotEmailCheck {
  email: string;
  registered: boolean;
  user_id: string | null;
  name: string | null;
}

export interface SpotMemberCheck {
  user_id: string;
  name: string;
  college: string;
  payment_status: string;
  blocked_reason: string | null;
}

export interface DashboardData {
  generated_at: string;
  mode: string;
  role: AdminRole;
  totals?: Record<string, number>;
  revenue?: { collected: number; pending: number };
  capacity?: AdminEvent[];
  trend?: { d: string; n: number }[];
  colleges?: { college: string; n: number }[];
  attention?: Record<string, number>;
  recent?: {
    admin_name: string;
    action: string;
    target_type: string | null;
    target_id: string | null;
    created_at: string;
  }[];
}

/* ------------------------------------------------------------ junior invites */

/** A first-year junior invited to the inauguration and lunch (zin26.juniors). */
export interface Junior {
  /** ZIN26-J001 ... - also the content of their QR lunch pass */
  junior_id: string;
  name: string;
  email: string;
  food_preference: 'VEG' | 'NON_VEG';
  invite_status: 'PENDING' | 'SENT' | 'FAILED';
  invite_error: string | null;
  invited_at: string | null;
  created_at: string;
  /** when the food counter scanned their pass; null until then */
  lunch_at: string | null;
}

export interface JuniorCounts {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  veg: number;
  non_veg: number;
  lunch: number;
}

/** One row of an uploaded sheet, as the server read it. `problem` is empty when it can be added. */
export interface JuniorPreviewRow {
  row: number;
  name: string;
  email: string;
  food_preference: 'VEG' | 'NON_VEG' | '';
  problem: string;
}
