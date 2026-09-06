// Zinnia 2026 — participant flow types (client side).
//
// The rule engine already owns the vocabulary that both halves of the app share
// — PaymentStatus, EventCode and Registration are the same concepts on the
// server and in the browser — so those are imported and re-exported here rather
// than redefined, which is what keeps the two from drifting.
//
// IDENTIFIERS. Before the treasurer verifies payment, the browser only ever
// holds `registration_id` (an internal UUID). The participant-facing code
// `user_id` ("ZIN26-0142") is a confirmation credential: the server returns it
// as null until `registration_status === 'REGISTRATION_CONFIRMED'`.

import type {
  EventCode,
  PaymentStatus,
  Registration,
  RuleId,
  Warning,
} from '../rules/types';

export type { EventCode, PaymentStatus, Registration, RuleId, Warning };

export type FoodPreference = 'VEG' | 'NON_VEG';

/** Stage 1 of §4.1 — the personal-details form. */
export interface ParticipantDetails {
  name: string;
  college: string;
  department: string;
  year: string;
  email: string;
  phone: string;
  food_preference: FoodPreference;
}

/* ==========================================================================
   Envelope
   ========================================================================== */

export interface ApiFailure {
  success: false;
  message: string;
  error_code?: string;
  /** the offending form field, when the server can pin it down */
  field?: string;
}

export type ApiResult<T> = (T & { success: true }) | ApiFailure;

/* ==========================================================================
   Registration lifecycle (derived server-side from existing columns)
   ========================================================================== */

export type RegistrationStatus =
  | 'DETAILS_SUBMITTED'
  | 'OTP_VERIFIED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REGISTRATION_CONFIRMED';

/** Everything the browser is allowed to know about a registration. */
export interface RegistrationView {
  registration_id: string;
  name: string;
  email: string;
  email_verified: boolean;
  payment_submitted: boolean;
  payment_verified: boolean;
  registration_status: RegistrationStatus;
  /** null until REGISTRATION_CONFIRMED — never rendered before that */
  user_id: string | null;
  /** present only once confirmed */
  whatsapp_url?: string;
}

export type RegisterResponse = ApiResult<
  RegistrationView & { expected_amount: number; message?: string }
>;

export interface PaymentRecord {
  txn_ref: string | null;
  amount: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  reject_reason: string | null;
  /** storage path of the uploaded payment proof, once one is on file */
  screenshot_url?: string | null;
  submitted_at?: string | null;
}

/** Payload of GET /payment/status — the status hub every screen reads from. */
export type PaymentStatusData = RegistrationView & {
  payment: PaymentRecord | null;
  expected_amount: number;
};

export type PaymentStatusResponse = ApiResult<PaymentStatusData>;

export type SubmitPaymentResponse = ApiResult<
  RegistrationView & { payment: PaymentRecord | null; message?: string }
>;

/* ==========================================================================
   OTP — one mechanism, three ways to say who you are
   ========================================================================== */

export interface OtpIdentifier {
  /** registration flow, before the UserID has been handed over */
  registration_id?: string;
  /** the one and only login credential */
  user_id?: string;
}

export type RequestOtpResponse = ApiResult<{
  /** masked address, e.g. "sa••••@gmail.com", so the participant can sanity-check it */
  email_hint: string;
  registration_id?: string;
}>;

export type SessionUser = RegistrationView;

export type VerifyOtpResponse = ApiResult<{
  token: string;
  user: SessionUser;
  expires_at: string;
  message?: string;
}>;

export interface Session {
  token: string;
  user: SessionUser;
  expires_at: string;
}

/* ==========================================================================
   Dashboard (§4.3)
   ========================================================================== */

export interface DashboardCatalogCard {
  event_code: EventCode;
  display_order?: number;
  name: string;
  state: 'AVAILABLE' | 'BLOCKED' | 'FULL' | 'REGISTERED';
  /** the specific reason — never collapsed to "unavailable" */
  reason?: string;
  rule?: RuleId;
  warnings?: string[];
  min_team: number;
  max_team: number;
  is_team_event: boolean;
  allows_team: boolean;
}

export interface DashboardRegistration {
  reg_id: string;
  event_code: EventCode;
  event_name: string;
  status: string;
  team_name: string | null;
}

export interface PendingInvite {
  team_id: string;
  team_name: string;
  event_name: string;
  captain_name: string;
}

export type DashboardResponse = ApiResult<{
  participant: RegistrationView;
  registrations: DashboardRegistration[];
  counted_used: number;
  counted_max: number;
  catalog: DashboardCatalogCard[];
  capacity: Partial<Record<EventCode, number | null>>;
  pending_invites: PendingInvite[];
}>;

export type MutationResponse = ApiResult<{ message?: string }>;

/* ==========================================================================
   Teams (§4.3 / Phase 5)
   ========================================================================== */

export type TeammateLookup = ApiResult<{
  user_id: string;
  name: string;
  college: string;
  /** set when the person exists but cannot be added — R9 / R11 / R1 */
  blocked_reason?: string | null;
}>;

export interface TeamMemberView {
  user_id: string;
  name: string;
  role: 'CAPTAIN' | 'MEMBER';
  accept_status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  invited_at: string;
}

export interface TeamView {
  team_id: string;
  team_name: string;
  event_code: EventCode;
  event_name: string;
  status: 'PENDING_ACCEPTANCE' | 'CONFIRMED' | 'CANCELLED';
  captain_user_id: string;
  members: TeamMemberView[];
}

export interface TeamInvite {
  team_id: string;
  team_name: string;
  event_name: string;
  captain_name: string;
  invited_at?: string;
}

export type MyTeamsResponse = ApiResult<{
  teams: TeamView[];
  invites: TeamInvite[];
}>;

export interface CreateTeamRequest {
  event_code: EventCode;
  team_name: string;
  member_user_ids: string[];
  /** set on the retry once the participant has accepted an R15 warning */
  confirm_warnings?: boolean;
}
