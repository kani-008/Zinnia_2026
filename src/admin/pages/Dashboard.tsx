import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { isDeskOnly, useAdminAuth } from '../auth/AdminAuthProvider';
import { useAdminQuery } from '../hooks/useAdminQuery';
import {
  Banner,
  CapacityBar,
  Card,
  EventStateChip,
  SectionTitle,
  Spinner,
  StatTile,
  cx,
} from '../components';
import type { AdminEvent, DashboardData, SpotSummary, SpotTill } from '../types';

const inr = (n: number) => '₹' + (n || 0).toLocaleString('en-IN');

/** Each entry links to the screen that resolves it — a count you cannot act on is noise. */
const ATTENTION: { key: string; label: string; to: string; tone: 'crit' | 'warn' }[] = [
  { key: 'payments_over_24h', label: 'waiting over 24 hours', to: '/admin/payments?status=PENDING', tone: 'crit' },
  { key: 'payments_pending', label: 'payments to verify', to: '/admin/payments?status=PENDING', tone: 'warn' },
  { key: 'payments_rejected', label: 'rejected, awaiting resubmission', to: '/admin/payments?status=REJECTED', tone: 'warn' },
  { key: 'held_registrations', label: 'registrations held by a rejected payment', to: '/admin/payments?status=REJECTED', tone: 'warn' },
  { key: 'teams_timed_out', label: 'teams past the 24-hour accept window', to: '/admin/events', tone: 'warn' },
  { key: 'events_full', label: 'events full', to: '/admin/events', tone: 'warn' },
  { key: 'events_near_full', label: 'events over 90% full', to: '/admin/events', tone: 'warn' },
  { key: 'events_closing_48h', label: 'events closing within 48 hours', to: '/admin/events', tone: 'warn' },
];

/** Inline SVG: a line and two bars do not justify a charting library. */
function TrendChart({ points }: { points: { d: string; n: number }[] }) {
  const W = 640;
  const H = 130;
  const P = { t: 10, r: 10, b: 22, l: 32 };

  const { path, max, ticks } = useMemo(() => {
    if (!points.length) return { path: '', max: 0, ticks: [] as { x: number; label: string }[] };
    const maxN = Math.max(...points.map((p) => p.n), 1);
    const innerW = W - P.l - P.r;
    const innerH = H - P.t - P.b;
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;

    const d = points
      .map((p, i) => {
        const x = P.l + i * step;
        const y = P.t + innerH - (p.n / maxN) * innerH;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    // At most five date labels, or they collide on a narrow card.
    const every = Math.max(1, Math.ceil(points.length / 5));
    const t = points
      .map((p, i) => ({ i, p }))
      .filter(({ i }) => i % every === 0 || i === points.length - 1)
      .map(({ i, p }) => ({
        x: P.l + i * step,
        label: new Date(p.d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      }));

    return { path: d, max: maxN, ticks: t };
  }, [points]);

  if (!points.length) {
    return <div className="px-5 pb-5 text-sm text-white/30">No registrations yet.</div>;
  }

  return (
    <div className="px-5 pb-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[420px]" role="img"
           aria-label={`Registrations per day, peak ${max}`}>
        {/* Only labelled gridlines, and every label names a value the line reaches. */}
        {[0, max].map((v, i) => {
          const y = P.t + (H - P.t - P.b) * (1 - (max ? v / max : 0));
          return (
            <g key={i}>
              <line x1={P.l} x2={W - P.r} y1={y} y2={y} stroke="rgba(255,255,255,.09)" />
              <text x={P.l - 6} y={y + 3.5} textAnchor="end"
                    fill="rgba(255,255,255,.35)" fontSize="9" fontFamily="monospace">
                {v}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke="#818cf8" strokeWidth="1.8"
              strokeLinejoin="round" strokeLinecap="round" />
        {ticks.map((t, i) => (
          <text key={i} x={t.x} y={H - 6} textAnchor="middle"
                fill="rgba(255,255,255,.35)" fontSize="9" fontFamily="monospace">
            {t.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function SplitBar({ parts }: { parts: { label: string; n: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.n, 0);
  return (
    <div className="px-5 pb-5">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/8">
        {total > 0 &&
          parts.map((p) => (
            <div key={p.label} className={p.color} style={{ width: `${(p.n / total) * 100}%` }} />
          ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5 text-[12.5px]">
            <span className={cx('h-2 w-2 rounded-full', p.color)} />
            <span className="text-white/55">{p.label}</span>
            <span className="font-mono tabular-nums text-white/80">{p.n}</span>
          </div>
        ))}
        <div className="ml-auto font-mono text-[12px] tabular-nums text-white/40">
          {total} total
        </div>
      </div>
    </div>
  );
}

/**
 * A desk-only login (onspot1 ... onspot4) sees its own till and the capacity
 * board, nothing else. Admins and treasurers see their dashboard with every
 * desk's till as one of its sections.
 */
export function Dashboard() {
  const { user } = useAdminAuth();
  if (isDeskOnly(user?.role)) return <DeskDashboard />;
  return <AdminDashboard withDesk={user?.role === 'SUPER_ADMIN' || user?.role === 'TREASURER'} />;
}

/** Two desks work side by side; both see the running figures within 15 seconds. */
const SUMMARY_POLL_MS = 15000;

const updatedAt = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const deskUsedMap = (s?: SpotSummary | null) =>
  s ? Object.fromEntries(s.capacity.map((e) => [e.event_code, e.desk_used])) : undefined;

/**
 * The capacity board: one design for the admin and both desks, sorted by
 * fullness. `deskUsed`, when given, adds how many of each event's seats were
 * taken at the on-spot desk.
 */
function CapacityBoard({
  rows,
  manage = false,
  deskUsed,
}: {
  rows: AdminEvent[];
  manage?: boolean;
  deskUsed?: Record<string, number>;
}) {
  return (
    <Card>
      <SectionTitle
        title="Capacity"
        hint="sorted by fullness"
        right={
          manage ? (
            <Link to="/admin/events" className="text-[12.5px] text-indigo-300 hover:underline">
              Manage
            </Link>
          ) : undefined
        }
      />
      <div className="px-5 pb-5 space-y-2.5">
        {rows
          .slice()
          .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1))
          .map((e) => (
            <div key={e.event_code} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 items-center">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-[13.5px] text-white/80">{e.name}</span>
                <EventStateChip state={e.state} />
              </div>
              <div className="font-mono text-[12.5px] tabular-nums text-white/55 whitespace-nowrap">
                {e.used}
                <span className="text-white/25"> / {e.capacity ?? '∞'}</span>
              </div>
              <div className="col-span-2">
                <CapacityBar used={e.used} capacity={e.capacity} />
                {deskUsed && (deskUsed[e.event_code] ?? 0) > 0 && (
                  <div className="mt-1 font-mono text-[11px] text-white/35">
                    {deskUsed[e.event_code]} at the on-spot desk
                  </div>
                )}
              </div>
            </div>
          ))}
        {!rows.length && <div className="text-sm text-white/30">No events configured.</div>}
      </div>
    </Card>
  );
}

/** One till's figures: walk-ins, cash, UPI, total. */
function TillTiles({ till, fee, wide = false }: { till: SpotTill; fee: number; wide?: boolean }) {
  return (
    <div className={cx('grid gap-3 sm:grid-cols-2', wide && 'xl:grid-cols-4')}>
      <StatTile label="Walk-ins registered" value={till.participants} />
      <StatTile label="Cash collected" value={inr(till.cash.amount)} tone="ok" sub={`${till.cash.count} paid in cash`} />
      <StatTile
        label="UPI collected"
        value={inr(till.upi.amount)}
        tone="ok"
        sub={
          till.upi_account
            ? `${till.upi.count} into ${till.upi_account.label} · ${till.upi_account.upi_id}`
            : `${till.upi.count} paid by UPI`
        }
      />
      <StatTile label="Total" value={inr(till.total.amount)} tone="accent" sub={`${till.total.count} × ₹${fee}`} />
    </div>
  );
}

/**
 * A desk login (onspot1 ... onspot4): its own till - what THIS login registered and took, in
 * cash and into its own UPI account - and the capacity board every login sees.
 */
function DeskDashboard() {
  const { data, error, loading } = useAdminQuery<{ summary: SpotSummary }>(
    '/api/admin/spot/summary',
    SUMMARY_POLL_MS,
  );
  const s = data?.summary;

  if (loading && !s) return <Spinner label="Loading your desk…" />;
  if (error && !s) return <Banner>{error}</Banner>;
  if (!s?.me) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-white">{s.me.name}</h1>
        {s.me.username && <span className="font-mono text-[12px] text-white/40">{s.me.username}</span>}
        <span className="font-mono text-[11.5px] text-white/35">updated {updatedAt(s.generated_at)} · every 15 s</span>
        {error && <span className="text-[12px] text-amber-300/80">refresh failed - showing the last figures</span>}
      </div>
      <TillTiles till={s.me} fee={s.fee} wide />
      <CapacityBoard rows={s.capacity} deskUsed={deskUsedMap(s)} />
    </div>
  );
}

/** For the admin and the treasurer: every desk's till side by side, and the day's total. */
function DeskTills({ s, error }: { s: SpotSummary; error: string | null }) {
  return (
    <section className="space-y-3" aria-label="On-spot desk">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[15px] font-semibold tracking-tight text-white">On-spot desk</h2>
        {s.total && (
          <span className="font-mono text-[12px] text-white/55">
            {s.total.participants} walk-ins · cash {inr(s.total.cash.amount)} · UPI {inr(s.total.upi.amount)} ·
            total <span className="text-emerald-300">{inr(s.total.total.amount)}</span>
          </span>
        )}
        <span className="font-mono text-[11.5px] text-white/35">updated {updatedAt(s.generated_at)}</span>
        {error && <span className="text-[12px] text-amber-300/80">refresh failed - showing the last figures</span>}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {(s.tills || []).map((till) => (
          <Card key={till.username ?? till.name}>
            <SectionTitle
              title={till.name}
              hint={
                till.username
                  ? `${till.username} · ${till.upi_account ? `UPI ${till.upi_account.label} · ${till.upi_account.upi_id}` : 'cash only'}`
                  : 'collected at the desk'
              }
            />
            <div className="px-5 pb-5">
              <TillTiles till={till} fee={s.fee} />
            </div>
          </Card>
        ))}
        {!s.tills?.length && <div className="text-sm text-white/35">No desk login has been set up yet.</div>}
      </div>
    </section>
  );
}

function AdminDashboard({ withDesk }: { withDesk: boolean }) {
  const { data, error, loading } = useAdminQuery<{ dashboard: DashboardData }>(
    '/api/admin/dashboard',
  );
  const desk = useAdminQuery<{ summary: SpotSummary }>(
    withDesk ? '/api/admin/spot/summary' : null,
    SUMMARY_POLL_MS,
  );
  const deskSummary = desk.data?.summary ?? null;

  if (loading && !data) return <Spinner label="Loading dashboard…" />;
  if (error) return <Banner>{error}</Banner>;

  const d = data?.dashboard;
  const t = d?.totals || {};
  const att = d?.attention || {};
  const alerts = ATTENTION.filter((a) => (att[a.key] || 0) > 0);
  const role = d?.role;
  const isDesk = role === 'GATE_ADMIN' || role === 'FOOD_ADMIN';

  // A desk operator standing with a phone needs a counter, not a funnel.
  if (isDesk) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        <StatTile label="Participants" value={t.participants ?? 0} />
        <StatTile label="Payments approved" value={t.payment_approved ?? 0} tone="ok" />
        <StatTile label="Veg" value={t.veg ?? 0} />
        <StatTile label="Non-veg" value={t.non_veg ?? 0} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. What needs a human, above everything else. */}
      {alerts.length > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/[0.04]">
          <SectionTitle title="Needs attention" />
          <ul className="px-5 pb-4 grid gap-1.5 sm:grid-cols-2">
            {alerts.map((a) => (
              <li key={a.key}>
                <Link
                  to={a.to}
                  className="group flex items-baseline gap-2 text-[13.5px] text-white/65 hover:text-white"
                >
                  <span
                    className={cx(
                      'font-mono tabular-nums font-semibold',
                      a.tone === 'crit' ? 'text-rose-300' : 'text-amber-300',
                    )}
                  >
                    {att[a.key]}
                  </span>
                  <span className="group-hover:underline underline-offset-2">{a.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-[13px] text-white/35">
          <CheckCircle2 className="w-4 h-4 text-emerald-400/70" />
          Nothing needs attention right now.
        </div>
      )}

      {/* 2. Tiles. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Participants" value={t.participants ?? 0} />
        <StatTile label="Approved" value={t.payment_approved ?? 0} tone="ok"
                  sub={`${t.awaiting_review ?? 0} awaiting review`} />
        <StatTile label="Pending" value={t.payment_pending ?? 0} tone="warn" />
        {d?.revenue && (
          <StatTile label="Collected" value={inr(d.revenue.collected)} tone="ok"
                    sub={`${inr(d.revenue.pending)} pending`} />
        )}
        <StatTile label="Event registrations" value={t.event_registrations ?? 0} />
        <StatTile label="Teams awaiting" value={t.teams_awaiting ?? 0}
                  tone={(t.teams_awaiting ?? 0) > 0 ? 'warn' : 'neutral'}
                  sub="teammates yet to accept" />
      </div>

      {/* 2b. The on-spot desk, one till per desk login, for the admin and the treasurer. */}
      {withDesk && deskSummary && <DeskTills s={deskSummary} error={desk.error} />}

      {/* 3. Capacity board — the object worth projecting during registration week. */}
      <CapacityBoard rows={d?.capacity || []} manage deskUsed={deskUsedMap(deskSummary)} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle title="Registrations per day" />
          <TrendChart points={d?.trend || []} />
        </Card>

        <div className="space-y-5">
          <Card>
            <SectionTitle title="Food" hint="catering count" />
            <SplitBar
              parts={[
                { label: 'Veg', n: t.veg ?? 0, color: 'bg-emerald-400' },
                { label: 'Non-veg', n: t.non_veg ?? 0, color: 'bg-amber-400' },
              ]}
            />
          </Card>
          <Card>
            <SectionTitle title="Payments" />
            <SplitBar
              parts={[
                { label: 'Approved', n: t.payment_approved ?? 0, color: 'bg-emerald-400' },
                { label: 'Pending', n: t.payment_pending ?? 0, color: 'bg-amber-400' },
                { label: 'Rejected', n: t.payment_rejected ?? 0, color: 'bg-rose-400' },
              ]}
            />
          </Card>
        </div>
      </div>

      {(d?.colleges?.length || d?.recent?.length) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {d?.colleges?.length ? (
            <Card>
              <SectionTitle title="Top colleges" />
              <ul className="px-5 pb-5 space-y-1.5">
                {d.colleges.map((c) => (
                  <li key={c.college} className="flex items-baseline gap-3 text-[13px]">
                    <span className="truncate text-white/65">{c.college}</span>
                    <span className="ml-auto font-mono tabular-nums text-white/45">{c.n}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {d?.recent?.length ? (
            <Card>
              <SectionTitle title="Recent activity" />
              <ul className="px-5 pb-5 space-y-1.5">
                {d.recent.map((r, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-[12.5px]">
                    <span className="text-white/70">{r.admin_name}</span>
                    <span className="font-mono text-[11px] text-indigo-300/80">
                      {r.action.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    {r.target_id && <span className="text-white/35 truncate">{r.target_id}</span>}
                    <span className="ml-auto shrink-0 text-white/25">
                      {new Date(r.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
