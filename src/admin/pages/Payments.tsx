import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, ExternalLink, ImageOff, KeyRound, Loader2, Search, Send, X } from 'lucide-react';
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

// A bypass is only as good as its reason: it is the sole record that this
// money was never checked against a statement. The presets are the shapes that
// actually happen at a desk, so the box is rarely left to freehand.
const BYPASS_PRESETS = [
  'Paid in cash to the treasurer at the registration desk.',
  'Paid in cash to a coordinator, handed over to the treasurer.',
  'Paid by direct bank transfer outside UPI.',
  'Fee waived by the organising committee.',
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
  const [shotDrive, setShotDrive] = useState<string | null>(null);
  const [shotError, setShotError] = useState<string | null>(null);
  // Three-state, not two: "still loading" is not "nothing was uploaded". While
  // the proof was in flight the box fell through to the empty placeholder and
  // told the treasurer no screenshot had been submitted — for a file that was
  // about to appear.
  const [shotLoading, setShotLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [bypassing, setBypassing] = useState(false);

  const p = data?.payment;

  const shotMinted = useRef({ at: 0, ttl: 0 });
  const shotRetried = useRef(false);

  /**
   * Exchange the stored reference for something an <img> can load.
   *
   * Keyed on userId alone rather than on the loaded record: the endpoint
   * answers NO_SCREENSHOT perfectly well on its own, and waiting for the
   * detail query first put a multi-second serial delay in front of an image
   * that already takes a Drive round trip to arrive.
   */
  const loadShot = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!opts?.quiet) setShotLoading(true);
      setShotError(null);
      try {
        const d = await adminFetch<{ url: string; expires_in?: number; external_url?: string }>(
          `/api/admin/payments/${userId}/screenshot`,
        );
        shotMinted.current = { at: Date.now(), ttl: d.expires_in || 0 };
        setShot(d.url);
        setShotDrive(d.external_url || null);
        return d.url;
      } catch (e: any) {
        setShot(null);
        setShotDrive(null);
        // NO_SCREENSHOT is not a failure — it is the empty state, and showing
        // it as an error would put a "Try again" button on a record where
        // nothing was ever uploaded.
        setShotError(
          e?.code === 'NO_SCREENSHOT' ? null : e?.message || 'Could not open the screenshot.',
        );
        return null;
      } finally {
        if (!opts?.quiet) setShotLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    // Reset first: without this a failure on one record stayed on screen over
    // the next one, which reads as that participant's proof being broken too.
    setShot(null);
    setShotDrive(null);
    setShotError(null);
    shotRetried.current = false;
    void loadShot();
  }, [loadShot]);

  /** The <img> itself failed — usually a token that expired while the drawer sat open. */
  const onShotError = useCallback(() => {
    if (shotRetried.current) {
      setShot(null);
      setShotError('The screenshot could not be loaded from the proof store.');
      return;
    }
    shotRetried.current = true;
    void loadShot({ quiet: true });
  }, [loadShot]);

  /**
   * Open full size. The token is good for ten minutes; a treasurer comparing a
   * reference against a bank statement can easily outlast that, and a stale
   * link opens a new tab on an error page instead of the proof. Re-mint only
   * when it is actually near expiry, so the ordinary click stays instant.
   */
  const openFullSize = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      const { at, ttl } = shotMinted.current;
      if (!ttl || Date.now() - at < (ttl - 30) * 1000) return;
      e.preventDefault();
      const url = await loadShot({ quiet: true });
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    },
    [loadShot],
  );

  const act = async (kind: 'approve' | 'reject' | 'bypass', reason?: string) => {
    setBusy(true);
    setProblem(null);
    try {
      const res = await adminFetch<{ email_failed?: boolean; message?: string }>(
        `/api/admin/payments/${userId}/${kind}`,
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
      if (rejecting || bypassing) return;
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'a' && p?.txn_ref) act('approve');
      if (e.key.toLowerCase() === 'r' && p?.txn_ref) setRejecting(true);
      // No shortcut for bypass on purpose. It confirms a registration without
      // any check, so it should cost a deliberate click, not a stray keypress.
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p, rejecting, bypassing]); // eslint-disable-line react-hooks/exhaustive-deps

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
                  <>
                    <a href={shot} target="_blank" rel="noreferrer" onClick={openFullSize}>
                      <img
                        src={shot}
                        alt="Payment screenshot"
                        className="max-h-[420px] w-full rounded object-contain bg-black/40"
                        // The image is fetched from Drive through the proxy, so
                        // it can fail on its own long after the URL was minted
                        // — an expired token, a Drive hiccup. Without this the
                        // box just goes blank and nothing says why.
                        onError={onShotError}
                      />
                    </a>
                    {shotDrive && (
                      <a
                        href={shotDrive}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-white/40 hover:text-white/70"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Drive
                      </a>
                    )}
                  </>
                ) : shotLoading ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-white/25">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <p className="text-[12px]">Loading the screenshot…</p>
                  </div>
                ) : shotError ? (
                  <div className="flex flex-col items-center gap-2.5 py-8">
                    <p className="max-w-[40ch] text-center text-[13px] text-white/45">{shotError}</p>
                    <button
                      onClick={() => void loadShot()}
                      className="rounded border border-white/15 px-2.5 py-1 font-mono text-[11px] text-white/60 hover:border-white/30 hover:text-white"
                    >
                      Try again
                    </button>
                    {shotDrive && (
                      <a
                        href={shotDrive}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/40 hover:text-white/70"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Drive
                      </a>
                    )}
                  </div>
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

              {p.approval_note && (
                <p className="rounded border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-200">
                  <span className="font-semibold">Approved without a bank check.</span>{' '}
                  {p.approval_note}
                </p>
              )}

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
                  onClick={() => act('approve')}
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
                {p.payment_status !== 'APPROVED' && (
                  <Button
                    className="w-full"
                    disabled={busy}
                    onClick={() => setBypassing(true)}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Bypass — paid outside UPI
                  </Button>
                )}
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
            act('reject', reason);
          }}
        />

        <ReasonDialog
          open={bypassing}
          title="Approve without a bank check?"
          description="For money taken in cash or outside UPI. This confirms the registration and emails the pass, exactly like Approve, but there will be no matching entry in any bank statement. What you write here is stored on the payment and is the only record of why."
          presets={BYPASS_PRESETS}
          confirmLabel="Bypass and confirm"
          onClose={() => setBypassing(false)}
          onConfirm={(reason) => {
            setBypassing(false);
            act('bypass', reason);
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

  // Deliberately WITHOUT the status. Every round trip to Supabase costs about a
  // second whatever it returns, so asking again for each tab meant a second of
  // blank screen per click - and, while it loaded, the previous tab's rows sat
  // under the new tab's heading. The whole queue comes down once and the status
  // is applied below, in the browser, where it is instant and cannot be stale.
  const path = useMemo(() => {
    const sp = new URLSearchParams({ status: 'ALL', page_size: '500' });
    if (term.trim()) sp.set('q', term.trim());
    return `/api/admin/payments?${sp}`;
  }, [term]);

  // keepPrevious: switching status swaps the whole path, and blanking the table
  // for the round trip is what the treasurer felt as lag.
  const { data, error, loading, refreshing, reload } = useAdminQuery<{
    payments: PaymentRow[];
    total: number;
    counts: Record<string, number>;
  }>(path, 45000, true);

  // Mirrors payments_queue's own bucket(): a row with no reference has not paid,
  // whatever its participant status says. The two must agree or the tab badges,
  // which the server computes, would not match the rows the browser shows.
  const bucketOf = (r: PaymentRow) =>
    !r.txn_ref ? 'UNPAID' : String(r.payment_status || 'PENDING').toUpperCase();

  const allRows = data?.payments || [];
  const rows = useMemo(
    () => (status === 'ALL' ? allRows : allRows.filter((r) => bucketOf(r) === status)),
    [allRows, status],
  );

  // The server caps what it will build. If the fest ever outgrows that, say so
  // rather than quietly showing a slice and calling it the queue.
  const truncated = (data?.total ?? 0) > allRows.length;
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

        {/* The rows below stay on screen while a new status loads, so the hint
            is what says they are not the answer yet. Blanking the table for a
            round trip is what made switching tabs feel slow. */}
        <SectionTitle
          title={`${rows.length} registrations`}
          hint={
            refreshing
              ? 'updating…'
              : truncated
                ? `showing ${allRows.length} of ${data?.total} — narrow with search`
                : status === 'PENDING'
                  ? 'oldest first'
                  : undefined
          }
        />

        {(loading && !data) || (refreshing && !rows.length) ? (
          <Spinner />
        ) : !rows.length ? (
          <div className="px-5 py-12 text-center text-sm text-white/35">
            Nothing here. {status === 'PENDING' && 'The queue is clear.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-[13px]">
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
                  {['UserID', 'Name', 'College', 'Amount', 'Reference', 'Bank', 'Waiting', 'Events', 'Flags', 'Status'].map(
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
                      <td className="px-3 py-2.5 whitespace-nowrap text-white/70">
                        {/* Which bank statement this reference should appear
                            in. Sits beside Reference for that reason. */}
                        {r.payee_bank || <span className="text-white/20">—</span>}
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
