// Zinnia 2026 — Phase 5: create a team (§4.3)
//
// Teammates are named by their UserID code. Each field does a live lookup and
// shows the person's name + college for confirmation, plus the SPECIFIC reason
// they cannot be added — "already registered for this event", "would exceed 3
// events" — rather than failing at submit with a generic error.
//
// Styling note: this page wears the homepage comic system (see
// components/ui/comic.tsx). Lookup and submit logic below is unchanged.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, UserPlus, Users, X } from 'lucide-react';

import { WebsiteNavbar } from '../components/layout/Navbar';
import { createTeam, loadSession, lookupTeammate } from '../lib/participant/api';
import { EVENTS } from '../lib/rules/catalog';
import type { EventCode, TeammateLookup } from '../lib/participant/types';
import {
  ComicAlert,
  ComicCTA,
  ComicChip,
  ComicField,
  ComicGhostButton,
  ComicHeading,
  ComicInput,
  ComicPageShell,
  ComicPanel,
} from '../components/ui/comic';
import { useToastOn } from '../components/ui/toast';

type TeamSpec = { min: number; max: number; name: string };

/**
 * DERIVED from the shared catalogue, never hand-listed. This used to be a
 * literal map of six events, which is how "Lost in SQL" — once an individual
 * event, now a team of 2 — reached this page and was told it was not a team
 * event at all, even though the dashboard was already offering "Create team"
 * for it. Reading the catalogue means a team size only ever has to change in
 * one place per layer.
 *
 * Any event that permits more than one member gets the team flow; the server
 * re-checks R10 on submit regardless of what this page allows.
 */
const TEAM_SIZES: Partial<Record<EventCode, TeamSpec>> = Object.fromEntries(
  Object.values(EVENTS)
    .filter((event) => event.maxTeam > 1)
    .map((event) => [event.code, { min: event.minTeam, max: event.maxTeam, name: event.name }]),
) as Partial<Record<EventCode, TeamSpec>>;

type SlotState =
  | { status: 'empty' }
  | { status: 'checking' }
  | { status: 'ok'; person: TeammateLookup }
  | { status: 'blocked'; person: TeammateLookup }
  | { status: 'error'; message: string };

export const ParticipantTeamCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const eventCode = (searchParams.get('event') ?? '').toUpperCase() as EventCode;
  const spec = TEAM_SIZES[eventCode];

  const [teamName, setTeamName] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Failures surface as a slide-in toast rather than a box above the form,
  // which on a phone appeared off-screen above the button just pressed.
  useToastOn(error);

  const debounces = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!loadSession()) navigate('/participant/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!spec) return;
    // Captain occupies one slot, so the form asks for min-1 teammates up front.
    const initial = Math.max(spec.min - 1, 0);
    setCodes(Array.from({ length: initial }, () => ''));
    setSlots(Array.from({ length: initial }, () => ({ status: 'empty' as const })));
  }, [spec]);

  const check = useCallback(
    (index: number, value: string) => {
      window.clearTimeout(debounces.current[index]);

      if (!value.trim()) {
        setSlots((prev) => prev.map((s, i) => (i === index ? { status: 'empty' } : s)));
        return;
      }

      setSlots((prev) => prev.map((s, i) => (i === index ? { status: 'checking' } : s)));

      debounces.current[index] = window.setTimeout(async () => {
        const result = await lookupTeammate(value.trim().toUpperCase(), eventCode);

        setSlots((prev) =>
          prev.map((s, i) => {
            if (i !== index) return s;
            if (!result.success) return { status: 'error', message: result.message };
            return result.blocked_reason
              ? { status: 'blocked', person: result }
              : { status: 'ok', person: result };
          }),
        );
      }, 400);
    },
    [eventCode],
  );

  const setCode = (index: number, value: string) => {
    // Strip accidental ZIN26- prefix if pasted or typed by user so only the rest is stored
    const cleanSuffix = value.toUpperCase().replace(/^ZIN26-?/i, '').trim();
    setCodes((prev) => prev.map((c, i) => (i === index ? cleanSuffix : c)));
    check(index, cleanSuffix ? `ZIN26-${cleanSuffix}` : '');
  };

  const addSlot = () => {
    // Cap on the number of ROWS. The button is hidden at the limit, but guard
    // here too so the cap holds however the function is reached.
    setCodes((prev) => (prev.length + 1 >= spec.max ? prev : [...prev, '']));
    setSlots((prev) => (prev.length + 1 >= spec.max ? prev : [...prev, { status: 'empty' }]));
  };

  const removeSlot = (index: number) => {
    setCodes((prev) => prev.filter((_, i) => i !== index));
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !spec) return;

    setSubmitting(true);
    setError(null);

    const memberIds = codes
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
      .map((c) => (c.startsWith('ZIN26-') ? c : `ZIN26-${c}`));

    let result = await createTeam({
      event_code: eventCode,
      team_name: teamName.trim(),
      member_user_ids: memberIds,
    });

    if (!result.success && result.error_code === 'CONFIRMATION_REQUIRED') {
      if (window.confirm(result.message)) {
        result = await createTeam({
          event_code: eventCode,
          team_name: teamName.trim(),
          member_user_ids: memberIds,
          confirm_warnings: true,
        });
      } else {
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate('/participant/teams');
  };

  if (!spec) {
    return (
      <ComicPageShell>
        <WebsiteNavbar />
        <main className="mx-auto max-w-xl px-5 pt-10 text-center">
          <ComicAlert tone="pink" className="text-left">
            That is not a team event.
          </ComicAlert>
          <div className="mt-6 flex justify-center">
            <ComicGhostButton tone="cyan" onClick={() => navigate('/participant/dashboard')}>
              Back to dashboard
            </ComicGhostButton>
          </div>
        </main>
      </ComicPageShell>
    );
  }

  // +1 for the captain, who is not one of these fields.
  // Two different counts, and using one for both was the bug: `total` counts
  // people actually named (captain + filled codes) and drives validation, while
  // `rows` counts the fields on screen and decides whether another can be added.
  // Gating the add button on `total` meant four empty fields still read as a
  // team of one, so "Add another teammate" never went away.
  const total = codes.filter((c) => c.trim()).length + 1;
  const rows = codes.length + 1;
  const sizeOk = total >= spec.min && total <= spec.max;
  const anyBlocked = slots.some((s) => s.status === 'blocked' || s.status === 'error');
  const canSubmit = Boolean(teamName.trim()) && sizeOk && !anyBlocked && !submitting;

  return (
    <ComicPageShell>
      <WebsiteNavbar />

      <main className="mx-auto max-w-2xl px-5 sm:px-8 pb-24 pt-6 sm:pt-10">
        {/* This page is reached from one place and has one way out. */}
        <button
          type="button"
          onClick={() => navigate('/participant/dashboard')}
          className="mb-6 inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-wider text-[#8E939D] transition-colors hover:text-[#EEEEEA]"
        >
          <ArrowLeft size={14} />
          Back to events
        </button>

        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <ComicChip tone="cyan" rotate={-2}>
              <Users size={12} /> You are the team leader
            </ComicChip>
          </div>

          <ComicHeading>{spec.name}</ComicHeading>

          <p className="mt-4 font-mono text-xs leading-relaxed text-[#B8B8B2] sm:text-sm">
            Team of {spec.min === spec.max ? spec.min : `${spec.min}-${spec.max}`}, including you.
            Your teammates each have to accept before the team is registered — nobody&apos;s event
            quota is used without their say-so.
          </p>
        </header>


        <form onSubmit={onSubmit}>
          <ComicPanel tone="cyan" bodyClassName="space-y-6">
            <ComicField label="Team name" htmlFor="team_name">
              <ComicInput
                id="team_name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Pick something your coordinators can read out"
                required
              />
            </ComicField>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#B8B8B2]">
                  Teammates
                </span>
                <ComicChip tone={sizeOk ? 'cyan' : 'yellow'} rotate={1.5}>
                  {total} of {spec.min === spec.max ? spec.min : `${spec.min}-${spec.max}`}
                </ComicChip>
              </div>

              <div className="space-y-3">
                {codes.map((code, index) => {
                  const slot = slots[index] ?? { status: 'empty' as const };
                  return (
                    <div key={index}>
                      <div className="flex gap-2">
                        <ComicInput
                          className="flex-1"
                          prefix="ZIN26-"
                          invalid={slot.status === 'blocked' || slot.status === 'error'}
                          value={code}
                          onChange={(e) => setCode(index, e.target.value)}
                          placeholder="0142"
                        />
                        {codes.length > Math.max(spec.min - 1, 0) && (
                          <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            // Matches the input it sits beside: same hairline
                            // border, no offset shadow, so the row reads as one
                            // control rather than two stacked boxes.
                            className="shrink-0 grid place-items-center w-12 rounded-full border border-[#0FA9C6]/20 bg-[#111214] text-[#71767B] transition-colors hover:border-[#D51F55] hover:text-[#D51F55]"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                      {slot.status === 'checking' && (
                        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] text-[#71767B]">
                          <Loader2 size={11} className="animate-spin" /> Looking up…
                        </p>
                      )}
                      {slot.status === 'ok' && slot.person.success && (
                        <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#0FA9C6]">
                          <Check size={11} /> {slot.person.name} · {slot.person.college}
                        </p>
                      )}
                      {slot.status === 'blocked' && slot.person.success && (
                        <p className="mt-1.5 font-mono text-[11px] font-bold text-[#E5BD00]">
                          {slot.person.name} · {slot.person.college}
                          <span className="mt-0.5 block font-normal text-[#B8B8B2]">
                            {slot.person.blocked_reason}
                          </span>
                        </p>
                      )}
                      {slot.status === 'error' && (
                        <p className="mt-1.5 font-mono text-[11px] font-bold text-[#D51F55]">
                          {slot.message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {rows < spec.max && (
                <button
                  type="button"
                  onClick={addSlot}
                  className="mt-3 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-[#0FA9C6] underline underline-offset-2 hover:text-[#E5BD00]"
                >
                  <UserPlus size={12} /> Add another teammate
                </button>
              )}
            </div>
          </ComicPanel>

          <div className="mt-7">
            <ComicCTA type="submit" tone="cyan" disabled={!canSubmit} arrow={!submitting}>
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Creating team…
                </span>
              ) : (
                'Send invitations'
              )}
            </ComicCTA>
          </div>
        </form>
      </main>
    </ComicPageShell>
  );
};

export default ParticipantTeamCreatePage;
