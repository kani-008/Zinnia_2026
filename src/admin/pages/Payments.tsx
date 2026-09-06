import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ImageOff, Search, Send, X } from 'lucide-react';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { adminFetch } from '../auth/adminFetch';
import {
  Banner,
  Button,
  Card,
  Chip,
  CopyButton,
  FlagChips,
  PaymentStatusChip,
  ReasonDialog,
  SectionTitle,
  Spinner,
  cx,
} from '../components';
import type { PaymentAttempt, PaymentRow } from '../types';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'UNPAID', label: 'Not paid' },
  { key: 'ALL', label: 'All' },
] as const;

const REJECT_PRESETS = [
  'The transaction reference could not be found in our bank statement.',
  'The amount received is less than the registration fee.',
  'The payment screenshot is unreadable — please send a clearer image.',
  'This transaction reference has already been used for another registration.',
];

const ago = (iso: string | null) => {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

/* -------------------------------------------------------------- the drawer */

function Drawer({
  userId,
  onClose,
  onActioned,
}: {
  userId: string;
  onClose: () => void;
  onActioned: () => void;
}) {
  const { data, loading, error } = useAdminQuery<{
    payment: PaymentRow;
    attempts: PaymentAttempt[];
    registrations: { reg_id: string; event_code: string; status: string }[];
  }>(`/api/admin/payments/${userId}`, 0);

  const [shot, setShot] = useState<string | null>(null);
  const [shotError, setShotError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const p = data?.payment;

  // Signed URL, minted per view and short-lived. The column stores an object
  // path, never a URL — see the screenshot contract in the build book.
  useEffect(() => {
    if (!p?.screenshot_url) return;
    let cancelled = false;
    adminFetch<{ url: string }>(`/api/admin/payments/${userId}/screenshot`)
      .then((d) => !cancelled && setShot(d.url))
      .catch((e) => !cancelled && setShotError(e?.message || 'Could not open the screenshot.'));
    return () => {
      cancelled = true;
    };
  }, [p?.screenshot_url, userId]);

  const act = async (approve: boolean, reason?: string) => {
    setBusy(true);
    setProblem(null);
    try {
      const res = await adminFetch<{ email_failed?: boolean; message?: string }>(
        `/api/admin/payments/${userId}/${approve ? 'approve' : 'reject'}`,
        { method: 'POST', body: JSON.stringify(reason ? { reason } : {}) },
      );
      onActioned();
      // The approval committed, but the pass never reached them — so stay on
      // the record rather than closing, and say what to do about it.
      if (res?.email_failed) {
        setProblem(res.message || 'Approved, but the confirmation email could not be sent.');
        return;
      }
      onClose();
    } catch (e: any) {
      setProblem(e?.message || 'That did not work.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setProblem(null);
    setNotice(null);
    try {
      const res = await adminFetch<{ message: string }>(
        `/api/admin/payments/${userId}/resend-pass`, { method: 'POST' },
      );
      setNotice(res.message);
    } catch (e: any) {
      setProblem(e?.message || 'The email could not be sent.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (rejecting) return;
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'a' && p?.txn_ref) act(true);
      if (e.key.toLowerCase() === 'r' && p?.txn_ref) setRejecting(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p, rejecting]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={onClose}>
      <aside
        className="h-full w-full max-w-[720px] overflow-y-auto border-l border-white/12 bg-[#12141A]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center gap-3 border-b border-white/8 bg-[#12141A]/95 px-5 py-3 backdrop-blur">
          <div>
            <div className="font-mono text-[13px] text-white">{p?.user_id || userId}</div>
            <div className="text-[12px] text-white/45">{p?.name}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-white/40 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <div className="p-5">
            <Banner>{error}</Banner>
          </div>
        ) : !p ? null : (
          <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_260px]">
            {/* proof */}
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                  Payment proof
                </div>
                {shot ? (
                  <a href={shot} target="_blank" rel="noreferrer">
                    <img
                      src={shot}
                      alt="Payment screenshot"
                      className="max-h-[420px] w-full rounded object-contain bg-black/40"
                    />
                  </a>
                ) : shotError ? (
                  <p className="py-6 text-center text-[13px] text-white/40">{shotError}</p>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                    <ImageOff className="w-6 h-6" />
                    <p className="text-[13px]">No screenshot submitted</p>
                    <p className="max-w-[34ch] text-center text-[11.5px] leading-relaxed text-white/20">
                      Verify against the bank statement using the reference.
                    </p>
                  </div>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                    Reference
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-mono tabular-nums text-white/85">
                    {p.txn_ref || <span className="text-white/25">not submitted</span>}
                    {p.txn_ref && <CopyButton value={p.txn_ref} label="reference" />}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                    Amount
                  </dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-white/85">
                    {p.amount != null ? `₹${p.amount}` : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                    Submitted
                  </dt>
                  <dd className="mt-0.5 text-white/70">
                    {p.submitted_at ? new Date(p.submitted_at).toLocaleString('en-IN') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                    Attempt
                  </dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-white/70">{p.attempt_no || 0}</dd>
                </div>
              </dl>

              {data!.attempts.length > 1 && (
                <div className="rounded-lg border border-white/10 p-3">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
                    Earlier attempts
                  </div>
                  <ul className="space-y-1.5 text-[12.5px]">
                    {data!.attempts.slice(1).map((a) => (
                      <li key={a.id} className="flex items-baseline gap-2">
                        <span className="font-mono text-white/60">{a.txn_ref || '—'}</span>
                        <PaymentStatusChip status={a.status} />
                        {a.reject_reason && (
                          <span className="truncate text-white/35">{a.reject_reason}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* identity + actions */}
            <div className="space-y-4">
              <div className="space-y-1.5 text-[13px]">
                <div className="text-white/85">{p.email}</div>
                <div className="text-white/55">{p.phone}</div>
                <div className="text-white/55">{p.college}</div>
                <div className="text-white/40">
                  {p.department} · {p.year}
                </div>
                <div className="pt-1">
                  <Chip tone={p.food_preference === 'VEG' ? 'ok' : 'warn'}>
                    {p.food_preference === 'VEG' ? 'Veg' : 'Non-veg'}
                  </Chip>{' '}
                  {!p.email_verified && <Chip tone="warn">Email unverified</Chip>}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                  Events ({p.events_count})
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/60">
                  {p.event_list || <span className="text-white/25">none yet</span>}
                </p>
              </div>

              <FlagChips flags={p.flags} />

              {p.reject_reason && p.payment_status === 'REJECTED' && (
                <p className="rounded border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12.5px] text-rose-200">
                  {p.reject_reason}
                </p>
              )}

              {problem && <Banner>{problem}</Banner>}
              {notice && <Banner tone="ok">{notice}</Banner>}

              <div className="space-y-2 pt-1">
                <Button
                  variant="primary"
                  className="w-full"
                  disabled={busy || !p.txn_ref || p.payment_status === 'APPROVED'}
                  onClick={() => act(true)}
                >
                  <Check className="w-3.5 h-3.5" />
                  {p.payment_status === 'APPROVED' ? 'Already approved' : 'Approve'}
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  disabled={busy || !p.txn_ref}
                  onClick={() => setRejecting(true)}
                >
                  <X className="w-3.5 h-3.5" />
                  Reject
                </Button>
                {p.payment_status === 'APPROVED' && (
                  <Button className="w-full" disabled={busy} onClick={resend}>
                    <Send className="w-3.5 h-3.5" />
                    Resend pass
                  </Button>
                )}
                <p className="pt-1 text-center font-mono text-[10.5px] leading-relaxed text-white/25">
                  A approve · R reject · Esc close
                  {p.payment_status === 'APPROVED' && (
                    <><br />Resend emails the UserID, master QR and WhatsApp link again.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <ReasonDialog
          open={rejecting}
          title="Reject this payment?"
          description="The reason is emailed to the participant word for word, so write it as you would say it. Their registrations are held, not cancelled."
          presets={REJECT_PRESETS}
          confirmLabel="Reject and email"
          onClose={() => setRejecting(false)}
          onConfirm={(reason) => {
            setRejecting(false);
            act(false, reason);
          }}
        />
      </aside>
    </div>
  );
}

/* --------------------------------------------------------------- the queue */

export function Payments() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'PENDING';
  const [q, setQ] = useState(params.get('q') || '');
  const [term, setTerm] = useState(q);
  const [open, setOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Debounce so a partial reference does not fire a request per keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setTerm(q), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const path = useMemo(() => {
    const sp = new URLSearchParams({ status });
    if (term.trim()) sp.set('q', term.trim());
    return `/api/admin/payments?${sp}`;
  }, [status, term]);

  const { data, error, loading, reload } = useAdminQuery<{
    payments: PaymentRow[];
    total: number;
    counts: Record<string, number>;
  }>(path, 45000);

  const rows = data?.payments || [];
  const cleanIds = rows.filter((r) => !r.flags?.length && r.txn_ref).map((r) => r.user_id);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const bulkApprove = async () => {
    setBulkBusy(true);
    setBulkMsg(null);
    try {
      const res = await adminFetch<{ message: string }>('/api/admin/payments/bulk-approve', {
        method: 'POST',
        body: JSON.stringify({ user_ids: [...selected] }),
      });
      setBulkMsg(res.message);
      setSelected(new Set());
      await reload();
    } catch (e: any) {
      setBulkMsg(e?.message || 'Bulk approve failed.');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Banner>{error}</Banner>}
      {bulkMsg && <Banner tone="ok">{bulkMsg}</Banner>}

      <Card>
        <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                params.set('status', t.key);
                setParams(params, { replace: true });
                setSelected(new Set());
              }}
              className={cx(
                'rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
                status === t.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/45 hover:text-white hover:bg-white/5',
              )}
            >
              {t.label}
              {data?.counts?.[t.key] != null && (
                <span className="ml-1.5 font-mono tabular-nums text-[11px] text-white/35">
                  {data.counts[t.key]}
                </span>
              )}
            </button>
          ))}

          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="UserID, name, email, reference…"
              className="w-[280px] rounded-md border border-white/12 bg-black/30 py-1.5 pl-8 pr-3
                         text-[12.5px] text-white placeholder-white/25
                         focus:border-indigo-400 focus:outline-none"
            />
          </div>
        </div>

        {selected.size > 0 && (
          <div className="mx-5 mt-3 flex items-center gap-3 rounded-md border border-indigo-500/25 bg-indigo-500/10 px-3 py-2">
            <span className="text-[12.5px] text-white/75">
              {selected.size} selected
            </span>
            <span className="text-[11.5px] text-white/40">
              only unflagged rows can be approved in bulk
            </span>
            <div className="ml-auto flex gap-2">
              <Button onClick={() => setSelected(new Set())}>Clear</Button>
              <Button variant="primary" disabled={bulkBusy} onClick={bulkApprove}>
                Approve {selected.size}
              </Button>
            </div>
          </div>
        )}

        <SectionTitle
          title={`${data?.total ?? 0} registrations`}
          hint={status === 'PENDING' ? 'oldest first' : undefined}
        />

        {loading && !data ? (
          <Spinner />
        ) : !rows.length ? (
          <div className="px-5 py-12 text-center text-sm text-white/35">
            Nothing here. {status === 'PENDING' && 'The queue is clear.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-[13px]">
              <thead>
                <tr className="border-y border-white/8 bg-white/[0.02]">
                  <th className="w-9 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all approvable"
                      checked={cleanIds.length > 0 && cleanIds.every((id) => selected.has(id))}
                      onChange={(e) =>
                        setSelected(e.target.checked ? new Set(cleanIds) : new Set())
                      }
                      disabled={!cleanIds.length}
                    />
                  </th>
                  {['UserID', 'Name', 'College', 'Amount', 'Reference', 'Waiting', 'Events', 'Flags', 'Status'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold
                                   uppercase tracking-[0.1em] text-white/40 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const approvable = !r.flags?.length && !!r.txn_ref;
                  return (
                    <tr
                      key={r.user_id}
                      onClick={() => setOpen(r.user_id)}
                      className="cursor-pointer border-b border-white/6 last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(r.user_id)}
                          onChange={() => toggle(r.user_id)}
                          disabled={!approvable}
                          title={approvable ? undefined : 'Flagged rows must be opened and reviewed'}
                          aria-label={`Select ${r.user_id}`}
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-white/80">{r.user_id}</td>
                      <td className="px-3 py-2.5 text-white/80">{r.name}</td>
                      <td className="max-w-[180px] truncate px-3 py-2.5 text-white/50">{r.college}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-white/70">
                        {r.amount != null ? `₹${r.amount}` : '—'}
                      </td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        {/* The working surface until screenshots land: monospaced,
                            tabular so transposed digits show, and copyable. */}
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-mono tabular-nums text-white/70">
                            {r.txn_ref || <span className="text-white/20">—</span>}
                          </span>
                          {r.txn_ref && <CopyButton value={r.txn_ref} label="reference" />}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-white/45">
                        {ago(r.submitted_at)}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-white/45">
                        {r.events_count}
                      </td>
                      <td className="px-3 py-2.5">
                        <FlagChips flags={r.flags} />
                      </td>
                      <td className="px-3 py-2.5">
                        <PaymentStatusChip status={r.payment_status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open && (
        <Drawer userId={open} onClose={() => setOpen(null)} onActioned={reload} />
      )}
    </div>
  );
}
