import React from 'react';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { Banner, Card, Chip, SectionTitle, Spinner } from '../components';

interface Entry {
  id: number;
  admin_name: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

const TONE: Record<string, 'ok' | 'crit' | 'warn' | 'accent' | 'neutral'> = {
  PAYMENT_APPROVE: 'ok',
  PAYMENT_REJECT: 'crit',
  EVENT_CLOSE: 'warn',
  EVENT_OPEN: 'ok',
  EVENT_CAPACITY_SET: 'accent',
  SETTINGS_UPDATE: 'accent',
  EXPORT: 'neutral',
};

export function AuditLog() {
  const { data, loading, error } = useAdminQuery<{ entries: Entry[] }>(
    '/api/admin/audit?limit=200',
    60000,
  );

  if (loading && !data) return <Spinner />;
  if (error) return <Banner>{error}</Banner>;

  const entries = data?.entries || [];

  return (
    <Card>
      <SectionTitle title="Audit log" hint="every admin action, newest first" />
      {!entries.length ? (
        <div className="px-5 py-12 text-center text-sm text-white/35">Nothing recorded yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-y border-white/8 bg-white/[0.02]">
                {['When', 'Who', 'Action', 'Target', 'Reason'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-mono text-[10px] font-semibold
                               uppercase tracking-[0.1em] text-white/40"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-white/6 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11.5px] text-white/45">
                    {new Date(e.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-white/75">{e.admin_name}</td>
                  <td className="px-4 py-2.5">
                    <Chip tone={TONE[e.action] || 'neutral'}>
                      {e.action.toLowerCase().replace(/_/g, ' ')}
                    </Chip>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-white/55">
                    {e.target_id || <span className="text-white/20">—</span>}
                    {e.target_type && (
                      <span className="ml-1.5 text-[10.5px] text-white/25">{e.target_type}</span>
                    )}
                  </td>
                  <td className="max-w-[320px] px-4 py-2.5 text-white/45">
                    {e.reason || (
                      e.detail ? (
                        <span className="font-mono text-[11px] text-white/30">
                          {JSON.stringify(e.detail).slice(0, 90)}
                        </span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
