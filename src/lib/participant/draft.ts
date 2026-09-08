// Zinnia 2026 — the personal-details form, parked between steps 1 and 2.
//
// The verify screen's "change email address" link sends people back to the
// details form to fix one wrong address. Without this they would land on an
// empty form and have to retype all six fields, which is where people give up.
//
// sessionStorage, not localStorage: the draft belongs to this tab and this
// sitting. It is cleared once the email is verified, so the next registration
// on a shared laptop does not inherit the previous person's details.

import type { ParticipantDetails } from './types';

const DRAFT_KEY = 'zin26.register.draft';

/** Storage throws outright in some privacy modes, so every access is guarded. */
export const saveRegistrationDraft = (details: ParticipantDetails): void => {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
  } catch {
    /* no draft is recoverable, but the flow still works */
  }
};

export const readRegistrationDraft = (): Partial<ParticipantDetails> | null => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // Anything but an object here means the key was written by something else.
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Partial<ParticipantDetails>)
      : null;
  } catch {
    return null;
  }
};

export const clearRegistrationDraft = (): void => {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clean up if storage is unavailable */
  }
};
