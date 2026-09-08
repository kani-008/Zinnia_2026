import React, { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { adminFetch } from '../auth/adminFetch';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import {
  Banner,
  Button,
  CapacityBar,
  Card,
  Chip,
  EventStateChip,
  ReasonDialog,
  SectionTitle,
  Spinner,
  cx,
} from '../components';
import type { AdminEvent } from '../types';

/**
 * Why an event's capacity might not be editable. The flag itself comes from
 * zin26.events.capacity_is_locked — the reason is copy, so it lives here.
 * Paper Verse runs on two panels of twelve 15-minute slots, which is
 * exactly what the timeline holds; setting it to 30 would mean discovering on
 * the day that six teams have nowhere to present.
 */
const LOCK_REASON: Record<string, string> = {
  PAPER_PRESENTATION: '2 panels × 12 slots — fixed by the timetable',
};
const lockReason = (e: AdminEvent) =>
  e.capacity_is_locked ? LOCK_REASON[e.event_code] || 'fixed — not coordinator-editable' : null;

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function Events() {
  const { user } = useAdminAuth();
  const { data, error, loading, reload } = useAdminQuery<{ events: AdminEvent[] }>(
    '/api/admin/events',
    45000,
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [closing, setClosing] = useState<AdminEvent | null>(null);

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'TREASURER';

  const call = async (path: string, body: any, ok: string) => {
    setBusy(path);
    setProblem(null);
    setNotice(null);
    try {
      const res = await adminFetch<{ message?: string }>(path, {
        method: body?.__method || 'POST',
        body: JSON.stringify(body),
      });
      setNotice(res.message || ok);
      await reload();
      return true;
    } catch (e: any) {
      setProblem(e?.message || 'That did not work.');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveField = async (e: AdminEvent, patch: Record<string, unknown>) => {
    setBusy(e.event_code);
    setProblem(null);
    setNotice(null);
    try {
      const res = await adminFetch<{ message?: string }>(`/api/admin/events/${e.event_code}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setNotice(res.message || 'Saved.');
      await reload();
    } catch (err: any) {
      setProblem(err?.message || 'That did not work.');
      await reload(); // put the input back to the stored value
    } finally {
      setBusy(null);
    }
  };

  const reopen = async (e: AdminEvent) => {
    const ok = await call(`/api/admin/events/${e.event_code}/open`, {}, 'Reopened.');
    if (!ok) {
      // The server refuses a reopen that would exceed capacity unless the
      // operator says so explicitly. Ask, then repeat with the acknowledgement.
      const confirmed = window.confirm(
        `${e.used} of ${e.capacity} places are taken.\n\n` +
          `Reopening will allow registrations beyond capacity. Continue?`,
      );
      if (confirmed) {
        await call(
          `/api/admin/events/${e.event_code}/open`,
          { acknowledge_overfill: true },
          'Reopened beyond capacity.',
        );
      }
    }
  };

  if (loading && !data) return <Spinner label="Loading events…" />;
  if (error) return <Banner>{error}</Banner>;

  const events = data?.events || [];

  return (
    <div className="space-y-4">
      {problem && <Banner>{problem}</Banner>}
      {notice && <Banner tone="ok">{notice}</Banner>}

      <Card>
        <SectionTitle
          title="Event capacity"
          hint={canEdit ? 'capacity and close date are editable inline' : 'read only for your role'}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[13px]">
            <thead>
              <tr className="border-y border-white/8 bg-white/[0.02]">
                {['Event', 'Registered', 'Unit', 'Held', 'Capacity', 'Closes', 'Status', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold
                                 uppercase tracking-[0.1em] text-white/40 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const fixed = lockReason(e);
                const isBusy = busy === e.event_code;
                return (
                  <tr key={e.event_code} className="border-b border-white/6 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white/85">{e.name}</div>
                      <div className="mt-0.5 font-mono text-[10.5px] text-white/30">
                        {e.event_code} · team {e.min_team === e.max_team ? e.min_team : `${e.min_team}–${e.max_team}`}
                      </div>
                    </td>

                    <td className="px-4 py-3 w-[170px]">
                      <div className="font-mono tabular-nums text-white/75">
                        {e.used}
                        <span className="text-white/25"> / {e.capacity ?? '∞'}</span>
                        {e.pct != null && (
                          <span className="ml-1.5 text-[11px] text-white/30">{e.pct}%</span>
                        )}
                      </div>
                      <div className="mt-1.5">
                        <CapacityBar used={e.used} capacity={e.capacity} />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Chip>{e.capacity_unit === 'TEAMS' ? 'teams' : 'heads'}</Chip>
                    </td>

                    <td className="px-4 py-3">
                      {e.participants_held > 0 ? (
                        <span
                          className="font-mono tabular-nums text-amber-300"
                          title="Seats held by a rejected payment. They stay occupied until the close date (D1)."
                        >
                          {e.participants_held}
                        </span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {fixed ? (
                        <div>
                          <span className="font-mono tabular-nums text-white/60">{e.capacity}</span>
                          <div className="mt-0.5 text-[10.5px] leading-snug text-white/30 max-w-[150px]">
                            {fixed}
                          </div>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          defaultValue={e.capacity ?? ''}
                          disabled={!canEdit || isBusy}
                          placeholder="∞"
                          onBlur={(ev) => {
                            const raw = ev.target.value.trim();
                            const next = raw === '' ? null : Number(raw);
                            if (next === (e.capacity ?? null)) return;
                            saveField(e, { capacity: next });
                          }}
                          className="w-[86px] rounded border border-white/12 bg-black/30 px-2 py-1
                                     font-mono tabular-nums text-[12.5px] text-white
                                     focus:border-indigo-400 focus:outline-none disabled:opacity-40"
                        />
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="datetime-local"
                        defaultValue={toLocalInput(e.reg_closes_at)}
                        disabled={!canEdit || isBusy}
                        onBlur={(ev) => {
                          const v = ev.target.value;
                          const next = v ? new Date(v).toISOString() : null;
                          if (next === e.reg_closes_at) return;
                          saveField(e, { reg_closes_at: next });
                        }}
                        className="rounded border border-white/12 bg-black/30 px-2 py-1
                                   text-[12px] text-white/80 focus:border-indigo-400
                                   focus:outline-none disabled:opacity-40"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <EventStateChip state={e.state} />
                      {e.closed_reason === 'MANUAL' && e.closed_by && (
                        <div className="mt-1 text-[10.5px] text-white/30">by {e.closed_by}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {canEdit &&
                        (e.registration_open ? (
                          <Button variant="danger" disabled={isBusy} onClick={() => setClosing(e)}>
                            <Lock className="w-3.5 h-3.5" />
                            Close
                          </Button>
                        ) : (
                          <Button disabled={isBusy} onClick={() => reopen(e)}>
                            <Unlock className="w-3.5 h-3.5" />
                            Reopen
                          </Button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!events.length && (
          <div className="px-5 py-10 text-center text-sm text-white/35">
            No events are visible to your account.
          </div>
        )}
      </Card>

      <p className="text-[12px] leading-relaxed text-white/30 max-w-[70ch]">
        Registration closes automatically the moment the last seat is taken — that happens in the
        database, so it works whether or not this page is open. Held seats belong to participants
        whose payment was rejected; they stay occupied until the close date.
      </p>

      <ReasonDialog
        open={!!closing}
        title={`Close registration for ${closing?.name ?? ''}?`}
        description="Participants will see “Registrations closed” on the event card. The reason is recorded in the audit log."
        presets={[
          'Capacity reached',
          'Coordinator request',
          'Venue no longer available',
          'Closed early by organisers',
        ]}
        confirmLabel="Close registration"
        onClose={() => setClosing(null)}
        onConfirm={async (reason) => {
          const e = closing!;
          setClosing(null);
          await call(`/api/admin/events/${e.event_code}/close`, { reason }, 'Closed.');
        }}
      />
    </div>
  );
}
