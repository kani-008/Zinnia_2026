// What a participant needs to know BEFORE committing to an event.
//
// Distilled from the registration spec (§1-§3 and rules R1-R15). The rule
// engine already refuses an illegal combination server-side; this is the other
// half of that — telling someone what a choice costs them *before* they make
// it, rather than after the server says no. Gadget Codes is the clearest case:
// registering it silently forfeits every other on-campus event, and finding
// that out from a rejection is a bad way to learn it.
//
// Kept as copy, not as logic. The engine in backend/services/rules_engine.py is
// the authority on what is actually allowed; nothing here is enforced.

export type NoteTone = 'warn' | 'info' | 'good';

export interface EventNote {
  tone: NoteTone;
  text: string;
}

export interface EventRegistrationNotes {
  /** one line, what this event is in scheduling terms */
  summary: string;
  when: string;
  team: string;
  notes: EventNote[];
}

/** Applies to every event; shown under the event-specific points. */
export const GENERAL_NOTES: EventNote[] = [
  { tone: 'info', text: 'You can hold at most 3 counted events. Paper Presentation and Short Film do not count towards that 3.' },
  { tone: 'info', text: 'For a team event you register as the captain. Every teammate has to accept from their own dashboard before the team is confirmed.' },
  { tone: 'info', text: 'You can cancel freely until registrations close on 22 September. After that no self-service changes.' },
];

export const EVENT_NOTES: Record<string, EventRegistrationNotes> = {
  GADGET_CODES: {
    summary: 'The mega event. Runs all day across three rounds.',
    when: '11:00 AM - 3:00 PM (all four blocks)',
    team: 'Team of 2',
    notes: [
      { tone: 'warn', text: 'This is the big one: registering Gadget Codes means you CANNOT register any other on-campus event, including Paper Presentation. It occupies the whole day.' },
      { tone: 'info', text: 'Short Film is the only thing you may add alongside it, because it is online and takes no time slot.' },
      { tone: 'info', text: 'Rounds 1 and 2 run 11:00-1:00. Qualifying teams play the Final from 2:00-3:00.' },
    ],
  },

  PAPER_PRESENTATION: {
    summary: 'Shortlisted by topic before the day, then a 15-minute slot.',
    when: 'A 15-minute slot, assigned to you after shortlisting',
    team: 'Team of 2-3',
    notes: [
      { tone: 'good', text: 'This does NOT use up one of your 3 events - you can hold three other events as well.' },
      { tone: 'info', text: 'Submit your title, track and abstract when you register. Shortlisting happens before the day and is announced in the participants group.' },
      { tone: 'info', text: 'Your slot time is assigned once you are shortlisted, and is chosen to avoid your other events.' },
      { tone: 'warn', text: 'It still takes a time slot, so it cannot be combined with Gadget Codes.' },
    ],
  },

  LAST_SIGNAL: {
    summary: 'A morning event you can walk into any time in the window.',
    when: 'Any 30 minutes between 11:00 AM and 1:00 PM',
    team: 'Individual',
    notes: [
      { tone: 'good', text: 'Flexible timing - you take your 30 minutes whenever you are free in the morning window.' },
      { tone: 'good', text: 'Combines comfortably with Debugging and a morning paper slot.' },
    ],
  },

  DEBUGGING: {
    summary: 'A morning event you can walk into any time in the window.',
    when: 'Any 30 minutes between 11:00 AM and 1:00 PM',
    team: 'Individual',
    notes: [
      { tone: 'good', text: 'Flexible timing - you take your 30 minutes whenever you are free in the morning window.' },
      { tone: 'good', text: 'Combines comfortably with The Last Signal and a morning paper slot.' },
    ],
  },

  LOST_IN_SQL: {
    summary: 'An afternoon event you can walk into any time in the window.',
    when: 'Any 30 minutes between 2:00 PM and 3:00 PM',
    team: 'Individual',
    notes: [
      { tone: 'warn', text: 'Clashes with every full-hour afternoon event - Think Strike Win, Plot Twist, Borderland Round 2 and the Gadget Codes Final.' },
      { tone: 'good', text: 'An afternoon paper slot still fits alongside it.' },
    ],
  },

  BORDERLAND: {
    summary: 'Two rounds, running from midday to the end of the afternoon.',
    when: '12:00 PM - 3:00 PM (Round 1, then Round 2)',
    team: 'Team of 3',
    notes: [
      { tone: 'warn', text: 'Only the 11:00-12:00 hour stays free, so this rules out every afternoon event.' },
      { tone: 'info', text: 'In that free hour you can fit a paper slot plus one morning event, or both morning events - not all three.' },
    ],
  },

  THINK_STRIKE_WIN: {
    summary: 'A full-hour afternoon event.',
    when: '2:00 PM - 3:00 PM',
    team: 'Team of 3',
    notes: [
      { tone: 'warn', text: 'Takes the whole afternoon hour. You can hold only ONE afternoon event, and it rules out Lost in SQL.' },
      { tone: 'good', text: 'Your mornings stay free for Debugging, The Last Signal and a morning paper slot.' },
    ],
  },

  PLOT_TWIST: {
    summary: 'A full-hour afternoon event.',
    when: '2:00 PM - 3:00 PM',
    team: 'Team of 3',
    notes: [
      { tone: 'warn', text: 'Takes the whole afternoon hour. You can hold only ONE afternoon event, and it rules out Lost in SQL.' },
      { tone: 'good', text: 'Your mornings stay free for Debugging, The Last Signal and a morning paper slot.' },
    ],
  },

  SHORT_FILM: {
    summary: 'Online. Nothing to attend on the day.',
    when: 'No time slot - submit your video online',
    team: 'Team of 1-3',
    notes: [
      { tone: 'good', text: 'Does NOT use up one of your 3 events, and clashes with nothing.' },
      { tone: 'warn', text: 'You must already be registered for at least one on-campus event before you can enter this.' },
      { tone: 'warn', text: 'Registration AND submission both close on 20 September - two days earlier than every other event.' },
      { tone: 'info', text: 'Video is 8 minutes maximum. You submit a link, not a file.' },
    ],
  },
};

export const notesFor = (code: string): EventRegistrationNotes | undefined => EVENT_NOTES[code];
