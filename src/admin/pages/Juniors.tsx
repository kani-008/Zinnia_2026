import React, { useEffect, useRef, useState } from 'react';
import { confirmDialog } from '../../components/ui/dialog';
import { Check, Loader2, Mail, Send, Square, Trash2, Upload, X } from 'lucide-react';
import { AdminError, adminFetch } from '../auth/adminFetch';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { Banner, Button, Card, Chip, SectionTitle, Spinner, StatTile, cx } from '../components';
import type { Junior, JuniorCounts, JuniorPreviewRow } from '../types';

/**
 * First-year junior invites (super admin only).
 *
 * Upload a sheet of Name / Email / Food, check the preview, add the juniors -
 * each gets a shuffled code (ZIN26-J417) - then send the invites. Sending runs here in
 * the browser, one junior per request, each starting as soon as the one before
 * has finished, so no request runs long and there is no waiting between mails.
 * Lunch shows once the food counter's scanner has recorded the pass.
 */

const foodLabel = (f: string) => (f === 'NON_VEG' ? 'Non-veg' : f === 'VEG' ? 'Veg' : '—');

const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function errorText(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

type Sending = { done: number; total: number; current: string };

/**
 * Invites in flight at once. Each one spends most of its time waiting on Gmail,
 * so a few side by side cut a list of 60 from minutes to about a minute - well
 * inside Gmail's limit on connections per account. Every junior is still sent
 * exactly once: the server claims the row before mailing.
 */
const PARALLEL = 3;

export function Juniors() {
  const { data, error, loading, reload } = useAdminQuery<{ juniors: Junior[]; counts: JuniorCounts }>(
    '/api/admin/juniors',
  );
  const juniors = data?.juniors ?? [];
  const counts = data?.counts;

  const [notice, setNotice] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  // --- upload and preview ---------------------------------------------------------
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<JuniorPreviewRow[] | null>(null);
  const [busy, setBusy] = useState<'preview' | 'add' | null>(null);
  const ready = (preview ?? []).filter((r) => !r.problem);

  const clearUpload = () => {
    setPreview(null);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    setNotice(null);
    setPreview(null);
    setFileName(file.name);
    setBusy('preview');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await adminFetch<{ rows: JuniorPreviewRow[] }>('/api/admin/juniors/preview', {
        method: 'POST',
        body: form,
      });
      setPreview(res.rows);
    } catch (e) {
      setProblem(errorText(e, 'The sheet could not be read.'));
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setBusy(null);
    }
  };

  const addReady = async () => {
    if (!ready.length) return;
    setBusy('add');
    setProblem(null);
    try {
      const res = await adminFetch<{ message: string }>('/api/admin/juniors', {
        method: 'POST',
        body: JSON.stringify({
          rows: ready.map(({ name, email, food_preference }) => ({ name, email, food_preference })),
        }),
      });
      setNotice({ tone: 'ok', text: res.message });
      clearUpload();
      await reload();
    } catch (e) {
      setProblem(errorText(e, 'The juniors could not be added.'));
    } finally {
      setBusy(null);
    }
  };

  // --- sending -----------------------------------------------------------------------
  const [sending, setSending] = useState<Sending | null>(null);
  const [oneBusy, setOneBusy] = useState<string | null>(null);
  const stopRef = useRef(false);

  // The list as last loaded, for the run to check each junior against just
  // before mailing them: removed meanwhile, or sent from another tab.
  const latest = useRef<Junior[]>(juniors);
  latest.current = juniors;

  // Closing or reloading the tab mid-run asks first.
  useEffect(() => {
    if (!sending) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [sending]);

  // Moving to another admin page ends the run: its Stop button would be gone,
  // and a second run started on coming back would race it. Send again carries
  // on with whoever is left.
  useEffect(
    () => () => {
      stopRef.current = true;
    },
    [],
  );

  const unsent = juniors.filter((j) => j.invite_status !== 'SENT');

  const sendAll = async () => {
    const ids = unsent.map((j) => j.junior_id);
    if (!ids.length || sending) return;
    stopRef.current = false;
    setProblem(null);
    setNotice(null);
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let next = 0; // the next junior to start
    let done = 0;
    setSending({ done: 0, total: ids.length, current: ids[0] });

    // A few workers take juniors from the list in order, each starting its next
    // one the moment its last one is finished - no waiting between mails.
    const worker = async () => {
      while (!stopRef.current && next < ids.length) {
        const id = ids[next++];
        const now = latest.current.find((j) => j.junior_id === id);
        if (!now || now.invite_status === 'SENT') {
          skipped += 1; // removed, or sent from somewhere else, since the run began
        } else {
          try {
            await adminFetch(`/api/admin/juniors/${encodeURIComponent(id)}/send`, { method: 'POST' });
            sent += 1;
          } catch (e) {
            // ALREADY_SENT / BUSY / NOT_FOUND: someone else dealt with this junior.
            // Anything else is recorded as FAILED on the server, with the reason.
            const code = e instanceof AdminError ? e.code : '';
            if (code === 'ALREADY_SENT' || code === 'BUSY' || code === 'NOT_FOUND') skipped += 1;
            else failed += 1;
          }
          // The list refreshes in the background; the server's own "already
          // sent" check means a stale list never mails twice.
          void reload();
        }
        done += 1;
        setSending({ done, total: ids.length, current: id });
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, ids.length) }, worker));
    const stoppedEarly = next < ids.length;
    setSending(null);
    await reload();
    const parts = [`${sent} sent`];
    if (failed) parts.push(`${failed} could not be sent - use Send on those rows`);
    if (skipped) parts.push(`${skipped} skipped (already sent or removed)`);
    setNotice({
      tone: failed ? 'warn' : 'ok',
      text: stoppedEarly
        ? `Stopped - ${parts.join(', ')}. Press Send again to carry on with the rest.`
        : `Done - ${parts.join(', ')}.`,
    });
  };

  const sendOne = async (j: Junior) => {
    if (sending || oneBusy) return;
    setOneBusy(j.junior_id);
    setProblem(null);
    setNotice(null);
    try {
      const res = await adminFetch<{ message: string }>(`/api/admin/juniors/${encodeURIComponent(j.junior_id)}/send`, {
        method: 'POST',
        // Only a deliberate Resend may mail someone who already has their invite.
        body: JSON.stringify({ resend: j.invite_status === 'SENT' }),
      });
      setNotice({ tone: 'ok', text: res.message });
    } catch (e) {
      setProblem(errorText(e, 'The invite could not be sent.'));
    } finally {
      setOneBusy(null);
      await reload();
    }
  };

  const removeOne = async (j: Junior) => {
    if (sending || oneBusy) return;
    if (
      !(await confirmDialog({
        title: 'Remove this junior?',
        message: `Remove ${j.junior_id} (${j.name}, ${j.email}) from the list?`,
        confirmLabel: 'Remove',
        cancelLabel: 'Keep',
        danger: true,
      }))
    )
      return;
    setOneBusy(j.junior_id);
    setProblem(null);
    try {
      const res = await adminFetch<{ message: string }>(`/api/admin/juniors/${encodeURIComponent(j.junior_id)}`, {
        method: 'DELETE',
      });
      setNotice({ tone: 'ok', text: res.message });
    } catch (e) {
      setProblem(errorText(e, 'The junior could not be removed.'));
    } finally {
      setOneBusy(null);
      await reload();
    }
  };

  // --- render ------------------------------------------------------------------------
  if (loading && !data) return <Spinner label="Loading juniors…" />;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-white">Junior invites</h1>
        <span className="text-[12.5px] text-white/40">first-years · invite and lunch pass by email</span>
      </header>

      {error && !data && <Banner>{error}</Banner>}
      {notice && <Banner tone={notice.tone}>{notice.text}</Banner>}
      {problem && <Banner>{problem}</Banner>}

      {counts && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Juniors" value={counts.total} sub={`${counts.veg} veg · ${counts.non_veg} non-veg`} />
          <StatTile
            label="Invites sent"
            value={counts.sent}
            tone="ok"
            sub={`${counts.pending} not sent${counts.failed ? ` · ${counts.failed} failed` : ''}`}
          />
          <StatTile label="Lunch collected" value={counts.lunch} tone="accent" sub={`of ${counts.total}`} />
          <StatTile label="Still to eat" value={counts.total - counts.lunch} />
        </div>
      )}

      {/* 1. add juniors from a sheet */}
      <Card>
        <SectionTitle title="Add juniors" hint="a sheet with the headings Name, Email and Food (.xlsx or .csv)" />
        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={cx(
                'inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/12 bg-white/5 px-3 py-2',
                'text-[13px] font-medium text-white/80 hover:bg-white/10',
                (busy || sending) && 'pointer-events-none opacity-40',
              )}
            >
              {busy === 'preview' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Choose sheet
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={(e) => {
                  // Cleared at once, so choosing the same file again after fixing it
                  // still reads it - the browser fires no change for an unchanged value.
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  void onFile(file);
                }}
              />
            </label>
            {fileName && <span className="font-mono text-[12px] text-white/50">{fileName}</span>}
          </div>

          {preview && (
            <>
              <div className="overflow-x-auto rounded-md border border-white/10">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="text-white/40">
                    <tr className="border-b border-white/8">
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">Food</th>
                      <th className="px-3 py-2 font-medium">Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r) => (
                      <tr key={r.row} className="border-b border-white/6 last:border-0">
                        <td className="px-3 py-1.5 font-mono text-white/40">{r.row}</td>
                        <td className="px-3 py-1.5 text-white/85">{r.name || '—'}</td>
                        <td className="px-3 py-1.5 font-mono text-white/70">{r.email || '—'}</td>
                        <td className="px-3 py-1.5 text-white/70">{foodLabel(r.food_preference)}</td>
                        <td className="px-3 py-1.5">
                          {r.problem ? (
                            <span className="text-rose-300">{r.problem}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <Check className="h-3.5 w-3.5" /> ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={() => void addReady()} disabled={!ready.length || !!busy}>
                  {busy === 'add' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Add {ready.length} junior{ready.length === 1 ? '' : 's'}
                </Button>
                <Button onClick={clearUpload} disabled={!!busy}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                {preview.length > ready.length && (
                  <span className="text-[12px] text-white/40">
                    {preview.length - ready.length} row{preview.length - ready.length === 1 ? '' : 's'} left out - fix
                    the sheet and upload again to add them.
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 2. the list, sending and lunch */}
      <Card>
        <SectionTitle
          title="Juniors"
          hint={`invites go ${PARALLEL} at a time, no waiting between them`}
          right={
            // Stop is NOT put where Send was: the second click of a double-click
            // would land on it and end the run after one invite.
            sending ? (
              <Button variant="primary" disabled>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…
              </Button>
            ) : (
              <Button variant="primary" onClick={() => void sendAll()} disabled={!unsent.length || !!oneBusy || !!busy}>
                <Send className="h-3.5 w-3.5" />
                Send to {unsent.length} not yet sent
              </Button>
            )
          }
        />
        <div className="space-y-3 px-5 pb-5">
          {sending && (
            <div className="rounded-md border border-indigo-500/30 bg-indigo-500/[0.07] px-3 py-2.5 text-[13px] text-white/80">
              <div className="flex flex-wrap items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                Sending {Math.min(sending.done + 1, sending.total)} of {sending.total}
                <span className="font-mono text-indigo-200">{sending.current}</span>
                <span className="ml-auto">
                  <Button variant="danger" onClick={() => (stopRef.current = true)}>
                    <Square className="h-3.5 w-3.5" /> Stop
                  </Button>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
                <div
                  className="h-full bg-indigo-400 transition-all"
                  style={{ width: `${(sending.done / Math.max(sending.total, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {juniors.length === 0 ? (
            <p className="text-sm text-white/40">No juniors yet - add them from a sheet above.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-white/10">
              <table className="w-full text-left text-[12.5px]">
                <thead className="text-white/40">
                  <tr className="border-b border-white/8">
                    <th className="px-3 py-2 font-medium">Pass code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Food</th>
                    <th className="px-3 py-2 font-medium">Invite</th>
                    <th className="px-3 py-2 font-medium">Lunch</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {juniors.map((j) => {
                    const busyRow = oneBusy === j.junior_id || sending?.current === j.junior_id;
                    return (
                      <tr key={j.junior_id} className="border-b border-white/6 last:border-0 align-top">
                        <td className="px-3 py-2 font-mono text-white/85">{j.junior_id}</td>
                        <td className="px-3 py-2 text-white/85">{j.name}</td>
                        <td className="px-3 py-2 font-mono text-white/60">{j.email}</td>
                        <td className="px-3 py-2 text-white/70">{foodLabel(j.food_preference)}</td>
                        <td className="px-3 py-2">
                          {j.invite_status === 'SENT' ? (
                            <Chip tone="ok">Sent {time(j.invited_at)}</Chip>
                          ) : j.invite_status === 'FAILED' ? (
                            <span title={j.invite_error ?? ''}>
                              <Chip tone="crit">Failed</Chip>
                            </span>
                          ) : (
                            <Chip tone="neutral">Not sent</Chip>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {j.lunch_at ? (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <Check className="h-3.5 w-3.5" /> {time(j.lunch_at)}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            <Button onClick={() => void sendOne(j)} disabled={!!sending || !!oneBusy}>
                              {busyRow ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                              {j.invite_status === 'SENT' ? 'Resend' : 'Send'}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => void removeOne(j)}
                              disabled={!!sending || !!oneBusy || !!j.lunch_at}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
