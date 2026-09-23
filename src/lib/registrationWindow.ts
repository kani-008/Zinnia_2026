// When the website stops taking registrations, in one place.
//
// The instant is the same constant the rule engine closes events on, so the
// buttons cannot invite someone in after the server has stopped accepting
// them. The on-spot desk is NOT governed by this: it keeps registering
// walk-ins on the fest day, through the admin panel.

import { useEffect, useState } from 'react';

import { CLOSES_DEFAULT } from './rules/catalog';

/** 9:00 PM IST on 23 September 2026. */
export const REGISTRATION_CLOSES_AT = CLOSES_DEFAULT;

/** What every Register button says once that moment has passed. */
export const REGISTRATION_CLOSED_LABEL = 'REGISTRATION CLOSED';

export const registrationHasClosed = (now: number = Date.now()): boolean => {
  const closes = Date.parse(REGISTRATION_CLOSES_AT);
  return !Number.isNaN(closes) && now >= closes;
};

/**
 * Has registration closed?
 *
 * Re-renders at the moment itself, so a page that was left open from before
 * 9 PM stops offering a form the server would refuse. Nothing is polled: one
 * timer per mount, and none at all once the time has passed.
 */
export function useRegistrationClosed(): boolean {
  const [closed, setClosed] = useState(() => registrationHasClosed());

  useEffect(() => {
    if (closed) return;
    const ms = Date.parse(REGISTRATION_CLOSES_AT) - Date.now();
    if (Number.isNaN(ms)) return;
    if (ms <= 0) {
      setClosed(true);
      return;
    }
    // setTimeout counts in a signed 32-bit int; a longer wait would fire at once.
    const id = window.setTimeout(() => setClosed(true), Math.min(ms + 500, 2 ** 31 - 1));
    return () => window.clearTimeout(id);
  }, [closed]);

  return closed;
}
