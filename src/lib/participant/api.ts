// Zinnia 2026 — participant flow API client.
//
// Every call funnels through `request()` so that auth, JSON handling and the
// failure envelope are dealt with in exactly one place. Network errors are
// converted into the same `{ success: false, message }` shape the server sends,
// so callers never have to try/catch — a dead backend and a rejected
// registration are handled by the same branch.

import type {
  CreateTeamRequest,
  DashboardResponse,
  EventCode,
  ApiResult,
  MutationResponse,
  MyTeamsResponse,
  OtpIdentifier,
  ParticipantDetails,
  PaymentStatusResponse,
  RegisterResponse,
  RequestOtpResponse,
  Session,
  SubmitPaymentResponse,
  TeammateLookup,
  VerifyOtpResponse,
  VerifyRegistrationResponse,
} from './types';

// Origin of the Flask backend. Leave VITE_API_URL unset for local dev so the
// requests stay relative (/api/...) and Vite's proxy forwards them to :5000.
const API_BASE: string = (import.meta.env?.VITE_API_URL ?? '').replace(/\/$/, '');

const SESSION_KEY = 'zin26_participant_session';

/* ==========================================================================
   Session — 30-day token from §4.2, held in localStorage
   ========================================================================== */

/**
 * Turn whatever someone typed or pasted into a canonical UserID.
 *
 * Accepts "ZIN26-0142", "zin26 0142", "ZIN260142" and bare "0142" alike,
 * because people paste the whole code from their confirmation email as often
 * as they type the digits. Used by the login screen and the team builder so a
 * code that works in one cannot be rejected by the other.
 */
export function normalizeUserId(raw: string): string {
  const trimmed = (raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('ZIN26-')) return trimmed;
  if (trimmed.startsWith('ZIN26')) return `ZIN26-${trimmed.slice(5).replace(/^-/, '')}`;
  return `ZIN26-${trimmed}`;
}

export function saveSession(session: Session): void {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Private-mode Safari throws on write. The session just will not persist.
  }
}

export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Session;
    // A pending registration has no participant code yet, so registration_id
    // is the identity that has to be present; user_id is optional until then.
    if (!parsed?.token || !parsed?.user?.registration_id) return null;

    // Expired sessions are dropped here rather than waiting for a 401, so the
    // UI redirects to login immediately instead of flashing an empty dashboard.
    if (parsed.expires_at && new Date(parsed.expires_at).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/* ==========================================================================
   Transport
   ========================================================================== */

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** attach the session bearer token */
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  // FormData sets its own multipart boundary; only JSON gets a Content-Type.
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers: Record<string, string> = {};
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  if (auth) {
    const session = loadSession();
    if (!session) {
      return {
        success: false,
        error_code: 'UNAUTHENTICATED',
        message: 'Your session has expired. Please log in again.',
      } as T;
    }
    headers.Authorization = `Bearer ${session.token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });

    // 204 and empty bodies would blow up .json()
    const text = await res.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!res.ok && data.success === undefined) {
      return {
        success: false,
        error_code: res.status === 401 ? 'UNAUTHENTICATED' : `HTTP_${res.status}`,
        message:
          typeof data.message === 'string'
            ? data.message
            : `Request failed (${res.status}). Please try again.`,
      } as T;
    }

    return data as T;
  } catch {
    return {
      success: false,
      error_code: 'NETWORK',
      message: 'Could not reach the server. Check your connection and try again.',
    } as T;
  }
}

/* ==========================================================================
   Step 1-2 — details -> registration record (returns registration_id only)
   ========================================================================== */

/* --------------------------------------------------------------------------
   Account tickets. Verification hands back a small signed note of which UPI
   account this address was given; it is kept here and sent back whenever the
   details form is filled again, so a change in the accounts on offer can never
   move someone who may already have paid. The note holds no personal details
   (the address is an HMAC tag) and the server ignores any it did not sign or
   that belongs to another address. A few are kept, for shared computers.
   -------------------------------------------------------------------------- */

const PAYEE_TICKETS_KEY = 'zin26_payee_tickets';
/** As many as the server reads (MAX_TICKETS_READ), one per person. */
const MAX_PAYEE_TICKETS = 10;

/** The ticket's opaque person tag - never an email - so a newer ticket replaces that person's older one. */
function ticketTag(ticket: string): string {
  try {
    const body = ticket.split('.')[1] ?? '';
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    return String(JSON.parse(json).e ?? ticket);
  } catch {
    return ticket;
  }
}

function readPayeeTickets(): string[] {
  try {
    const list = JSON.parse(window.localStorage.getItem(PAYEE_TICKETS_KEY) || '[]');
    return Array.isArray(list) ? list.filter((t) => typeof t === 'string').slice(0, MAX_PAYEE_TICKETS) : [];
  } catch {
    return [];
  }
}

function keepPayeeTicket(ticket?: string): void {
  if (!ticket) return;
  try {
    const tag = ticketTag(ticket);
    const list = [ticket, ...readPayeeTickets().filter((t) => ticketTag(t) !== tag)].slice(0, MAX_PAYEE_TICKETS);
    window.localStorage.setItem(PAYEE_TICKETS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the account is then chosen afresh, as before tickets existed */
  }
}

export const registerParticipant = (details: ParticipantDetails): Promise<RegisterResponse> =>
  request<RegisterResponse>('/api/participant/register', {
    method: 'POST',
    body: { ...details, payee_tickets: readPayeeTickets() },
  });

/* ==========================================================================
   Steps 3-5 and login — one OTP mechanism, three identifiers
   ========================================================================== */

export const requestOtp = (who: OtpIdentifier): Promise<RequestOtpResponse> =>
  request<RequestOtpResponse>('/api/participant/auth/request-otp', {
    method: 'POST',
    // A registration resend re-mints the token; the tickets keep its account.
    body: who.registration_id ? { ...who, payee_tickets: readPayeeTickets() } : who,
  });

/** Login (§4.2). Returns a session; the code is inside only if confirmed. */
export const verifyOtp = (who: OtpIdentifier, otp: string): Promise<VerifyOtpResponse> =>
  request<VerifyOtpResponse>('/api/participant/auth/verify-otp', {
    method: 'POST',
    body: { ...who, otp },
  });

/**
 * Registration-time email check (step 5). Same OTP, but the server treats a
 * success as "email verified" and returns a session so the participant stays
 * signed in through payment. Sends no confirmation email and returns no code.
 */
export const verifyRegistrationEmail = async (
  registrationId: string,
  otp: string,
): Promise<VerifyRegistrationResponse> => {
  const result = await request<VerifyRegistrationResponse>('/api/participant/register/verify-email', {
    method: 'POST',
    body: { registration_id: registrationId, otp, payee_tickets: readPayeeTickets() },
  });
  if (result.success) keepPayeeTicket(result.payee_ticket);
  return result;
};

/* ==========================================================================
   Steps 6-9 — payment and the status hub
   ========================================================================== */

/** The participant's own proof image, as a short-lived viewable URL. */
export const getPaymentProof = (registrationId: string): Promise<ApiResult<{ url: string; expires_in: number }>> =>
  request<ApiResult<{ url: string; expires_in: number }>>(
    `/api/participant/payment/proof?registration_id=${encodeURIComponent(registrationId)}`,
  );

/** Deletes the stored proof so a replacement can be uploaded. */
export const removePaymentProof = (registrationId: string): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/payment/proof/remove', {
    method: 'POST',
    body: { registration_id: registrationId },
  });

export const getPaymentStatus = (who: {
  registration_id?: string;
  user_id?: string;
}): Promise<PaymentStatusResponse> => {
  const q = new URLSearchParams();
  if (who.registration_id) q.set('registration_id', who.registration_id);
  if (who.user_id) q.set('user_id', who.user_id);
  return request<PaymentStatusResponse>(`/api/participant/payment/status?${q.toString()}`);
};

/**
 * Payment submission carries the proof screenshot, so it goes up as
 * multipart/form-data. `screenshot` may be omitted on a resubmission when a
 * proof is already on file; the server enforces that. Submitting never
 * confirms anything — the treasurer verifies, and only then does the
 * registration (and the code) unlock.
 */
export const submitPayment = (payload: {
  registration_id: string;
  utr_number: string;
  submitted_amount: number;
  screenshot?: File | null;
}): Promise<SubmitPaymentResponse> => {
  const form = new FormData();
  form.append('registration_id', payload.registration_id);
  form.append('utr_number', payload.utr_number);
  form.append('submitted_amount', String(payload.submitted_amount));
  if (payload.screenshot) form.append('screenshot', payload.screenshot, payload.screenshot.name);
  return request<SubmitPaymentResponse>('/api/participant/payment/submit', {
    method: 'POST',
    body: form,
  });
};

/* ==========================================================================
   Dashboard + event registration (§4.3) — only meaningful once confirmed
   ========================================================================== */

export const getDashboard = (): Promise<DashboardResponse> =>
  request<DashboardResponse>('/api/participant/dashboard', { auth: true });

export const registerForEvent = (
  eventCode: EventCode,
  confirmWarnings = false,
): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/events/register', {
    method: 'POST',
    auth: true,
    body: { event_code: eventCode, confirm_warnings: confirmWarnings },
  });

/**
 * "I am done picking." The only call that emails the event list — registrations
 * are already live before this, so it changes nothing except sending the mail.
 */
export const confirmLineup = (): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/events/confirm', { method: 'POST', auth: true });

export const cancelRegistration = (eventCode: EventCode): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/events/cancel', {
    method: 'POST',
    auth: true,
    body: { event_code: eventCode },
  });

/* ==========================================================================
   Teams (Phase 5)
   ========================================================================== */

export const lookupTeammate = (userId: string, eventCode: EventCode): Promise<TeammateLookup> =>
  request<TeammateLookup>(
    `/api/participant/teams/lookup?user_id=${encodeURIComponent(userId)}&event_code=${encodeURIComponent(eventCode)}`,
    { auth: true },
  );

export const createTeam = (payload: CreateTeamRequest): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/teams/create', {
    method: 'POST',
    auth: true,
    body: payload,
  });

export const getMyTeams = (): Promise<MyTeamsResponse> =>
  request<MyTeamsResponse>('/api/participant/teams/mine', { auth: true });

export const respondToInvite = (teamId: string, accept: boolean): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/teams/respond', {
    method: 'POST',
    auth: true,
    body: { team_id: teamId, accept },
  });

export const cancelTeam = (teamId: string): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/teams/cancel', {
    method: 'POST',
    auth: true,
    body: { team_id: teamId },
  });

export const swapTeamMember = (
  teamId: string,
  outUserId: string,
  inUserId: string,
): Promise<MutationResponse> =>
  request<MutationResponse>('/api/participant/teams/swap', {
    method: 'POST',
    auth: true,
    body: { team_id: teamId, out_user_id: outUserId, in_user_id: inUserId },
  });
