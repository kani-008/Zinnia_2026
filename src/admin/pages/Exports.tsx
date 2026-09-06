import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { adminFetch } from '../auth/adminFetch';
import { useDownload } from '../hooks/useDownload';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import { Banner, Button, Card, SectionTitle, cx } from '../components';

const SHEETS = [
  { key: 'participants', label: 'All participants', hint: 'the master list' },
  { key: 'events', label: 'One sheet per event', hint: 'team composition and payment state' },
  { key: 'food', label: 'Food — veg and non-veg', hint: 'two sheets, two counters' },
  { key: 'payments', label: 'Payment — verified and not', hint: 'the second one is the chase list' },
  { key: 'teams', label: 'Teams', hint: 'captains, members, who has not accepted' },
] as const;

const PRESETS: { label: string; sheets: string[]; hint: string }[] = [
  { label: 'Full workbook', sheets: ['participants', 'events', 'food', 'payments', 'teams'], hint: 'everything' },
  { label: 'Catering', sheets: ['food'], hint: 'veg and non-veg counts' },
  { label: 'Treasury', sheets: ['payments'], hint: 'verified and outstanding' },
  { label: 'Coordinators', sheets: ['events'], hint: 'per-event rosters' },
];

export function Exports() {
  const { user } = useAdminAuth();
  const { download, busy, error } = useDownload();
  const [sheets, setSheets] = useState<string[]>(['participants', 'events', 'food', 'payments']);
  const [college, setCollege] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [counting, setCounting] = useState(false);

  const filters = {
    college: college.trim() || undefined,
    payment_status: paymentStatus === 'ALL' ? undefined : paymentStatus,
  };

  // A row-count estimate before the download, so nobody generates an empty
  // file and concludes the system is broken.
  useEffect(() => {
    if (!sheets.length) {
      setCounts(null);
      return;
    }
    let cancelled = false;
    setCounting(true);
    const id = window.setTimeout(() => {
      adminFetch<{ counts: Record<string, number> }>('/api/admin/export/preview', {
        method: 'POST',
        body: JSON.stringify({ sheets, filters }),
      })
        .then((d) => !cancelled && setCounts(d.counts))
        .catch(() => !cancelled && setCounts(null))
        .finally(() => !cancelled && setCounting(false));
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [sheets, college, paymentStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key: string) =>
    setSheets((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const total = counts ? Object.values(counts).reduce((s, n) => s + n, 0) : null;

  return (
    <div className="max-w-[880px] space-y-4">
      {error && <Banner>{error}</Banner>}

      <Card>
        <SectionTitle title="Presets" hint="a starting point, then adjust below" />
        <div className="flex flex-wrap gap-2 px-5 pb-4">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setSheets(p.sheets)}
              className="rounded-md border border-white/12 bg-white/5 px-3 py-2 text-left
                         hover:border-white/25 hover:bg-white/10 transition-colors"
            >
              <div className="text-[13px] text-white/85">{p.label}</div>
              <div className="text-[11px] text-white/35">{p.hint}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Sheets" />
        <div className="space-y-1 px-5 pb-4">
          {SHEETS.map((s) => {
            const on = sheets.includes(s.key);
            return (
              <label
                key={s.key}
                className={cx(
                  'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors',
                  on ? 'bg-white/6' : 'hover:bg-white/3',
                )}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(s.key)} />
                <span className="text-[13.5px] text-white/85">{s.label}</span>
                <span className="text-[11.5px] text-white/35">{s.hint}</span>
                {counts && on && (
                  <span className="ml-auto font-mono tabular-nums text-[12px] text-white/45">
                    {s.key === 'food' || s.key === 'payments'
                      ? Object.entries(counts)
                          .filter(([k]) =>
                            s.key === 'food' ? k.startsWith('Food') : k.startsWith('Payment'),
                          )
                          .map(([, v]) => v)
                          .join(' + ')
                      : counts[
                          s.key === 'participants' ? 'All Participants' : s.key === 'teams' ? 'Teams' : ''
                        ] ?? ''}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Filters" hint="applied to every sheet" />
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
              College contains
            </span>
            <input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="all colleges"
              className="mt-1.5 w-full rounded-md border border-white/12 bg-black/30 px-3 py-2
                         text-[13px] text-white placeholder-white/25 focus:border-indigo-400 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/40">
              Payment status
            </span>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-white/12 bg-black/30 px-3 py-2
                         text-[13px] text-white focus:border-indigo-400 focus:outline-none"
            >
              <option value="ALL">Everyone</option>
              <option value="APPROVED">Approved only</option>
              <option value="PENDING">Pending only</option>
              <option value="REJECTED">Rejected only</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={busy || !sheets.length}
          onClick={() => download('/api/admin/export/workbook', { sheets, filters })}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download workbook
        </Button>

        <span className="text-[12.5px] text-white/40">
          {!sheets.length ? (
            'select at least one sheet'
          ) : counting ? (
            'counting rows…'
          ) : total != null ? (
            <>
              <span className="font-mono tabular-nums text-white/60">{total}</span> rows across{' '}
              {Object.keys(counts || {}).length} sheets
            </>
          ) : (
            // The count is a convenience, not a gate - the download still works.
            'row count unavailable'
          )}
        </span>
      </div>

      <p className="max-w-[70ch] text-[12px] leading-relaxed text-white/30">
        Every download is recorded in the audit log with your name, the sheets and the filters —
        an export is a bulk extraction of personal data.
        {user?.role === 'EVENT_COORDINATOR' &&
          ' Your workbook contains only the events you coordinate.'}
      </p>
    </div>
  );
}
