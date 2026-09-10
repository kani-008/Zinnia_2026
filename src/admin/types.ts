export type AdminRole =
  | 'SUPER_ADMIN'
  | 'TREASURER'
  | 'GATE_ADMIN'
  | 'FOOD_ADMIN'
  | 'EVENT_COORDINATOR';

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
  | 'EMAIL_UNVERIFIED';

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
