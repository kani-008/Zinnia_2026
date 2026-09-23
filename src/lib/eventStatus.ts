// What the website may say about an event's registration, live from the server.
//
// The marketing catalog in src/config/events.ts is static, so a card cannot
// know that the organisers have closed an event or that it has filled up. This
// asks the server once per page load and hands back one line per event.
//
// It lives beside the popup rather than in each page: Home, the Events page and
// the schedule view all open the same popup, and each of them used to be a
// separate place to remember.

import { useEffect, useState } from 'react';

import { MISSION_ID_BY_EVENT_CODE } from '../config/events';
import { getEventStatus } from './participant/api';

/** Mission id -> the line to show in place of the event's own urgency note. */
export type ClosedNotes = Record<string, string>;

// One request per page load, shared by every popup that mounts.
let inFlight: Promise<ClosedNotes> | null = null;

const load = (): Promise<ClosedNotes> => {
  if (inFlight) return inFlight;
  inFlight = getEventStatus()
    .then((result) => {
      if (!result.success) return {};
      const notes: ClosedNotes = {};
      for (const e of result.events) {
        const id = MISSION_ID_BY_EVENT_CODE[e.code];
        if (!id) continue;
        // Full, or shut by the organisers on the admin panel: no seat to be
        // had, and the on-spot desk cannot make one either - it honours both.
        // A date that has simply passed is a different thing: the desk keeps
        // registering those on the fest day, so that note stays quiet about it.
        if (e.full || e.closed_by_organisers) notes[id] = 'Slots are full. No on-spot registration.';
        else if (!e.open) notes[id] = 'Registration is closed.';
      }
      return notes;
    })
    .catch(() => ({}));   // the server is the extra here: a failure claims nothing
  return inFlight;
};

export function useClosedEventNotes(): ClosedNotes {
  const [notes, setNotes] = useState<ClosedNotes>({});

  useEffect(() => {
    let live = true;
    void load().then((n) => {
      if (live) setNotes(n);
    });
    return () => {
      live = false;
    };
  }, []);

  return notes;
}
