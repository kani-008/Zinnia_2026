import React, { useEffect, useState } from 'react';
import { useAdminQuery } from '../hooks/useAdminQuery';
import { adminFetch } from '../auth/adminFetch';
import { Banner, Button, Card, SectionTitle, Spinner } from '../components';

const FIELDS: { key: string; label: string; hint: string; type: 'number' | 'datetime' | 'bool' }[] = [
  { key: 'registration_fee', label: 'Registration fee', hint: 'flat, per participant (₹)', type: 'number' },
  { key: 'default_reg_closes_at', label: 'Registration closes', hint: 'site-wide default', type: 'datetime' },
  { key: 'short_film_closes_at', label: 'Short Film closes', hint: 'earlier than the rest', type: 'datetime' },
  { key: 'team_accept_timeout_h', label: 'Teammate accept window', hint: 'hours before a captain may swap', type: 'number' },
  { key: 'allow_tight_b1', label: 'Allow the tight 11:00 combination', hint: 'Borderland + both morning runners (R15)', type: 'bool' },
  { key: 'warn_tight_b1', label: 'Warn about it on screen', hint: 'shown even when allowed', type: 'bool' },
];

const toInput = (v: any, type: string) => {
  if (type === 'datetime' && typeof v === 'string') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  return v;
};

export function Settings() {
  const { data, loading, error, reload } = useAdminQuery<{ settings: Record<string, any> }>(
    '/api/admin/settings',
    0,
  );
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (data?.settings) setDraft(data.settings);
  }, [data]);

  const dirty = data?.settings
    ? Object.keys(draft).some((k) => JSON.stringify(draft[k]) !== JSON.stringify(data.settings[k]))
    : false;

  const save = async () => {
    setBusy(true);
    setMsg(null);
    setProblem(null);
    try {
      const changed: Record<string, any> = {};
      for (const k of Object.keys(draft)) {
        if (JSON.stringify(draft[k]) !== JSON.stringify(data!.settings[k])) changed[k] = draft[k];
      }
      const res = await adminFetch<{ message: string }>('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ settings: changed }),
      });
      setMsg(res.message);
      await reload();
    } catch (e: any) {
      setProblem(e?.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Spinner />;
  if (error) return <Banner>{error}</Banner>;

  return (
    <div className="max-w-[640px] space-y-4">
      {problem && <Banner>{problem}</Banner>}
      {msg && <Banner tone="ok">{msg}</Banner>}

      <Card>
        <SectionTitle title="Global settings" hint="changed without a deploy" />
        <div className="space-y-3 px-5 pb-5">
          {FIELDS.map((f) => {
            const value = draft[f.key];
            return (
              <div key={f.key} className="grid grid-cols-[1fr_auto] items-center gap-4">
                <div>
                  <div className="text-[13.5px] text-white/85">{f.label}</div>
                  <div className="text-[11.5px] text-white/35">{f.hint}</div>
                </div>
                {f.type === 'bool' ? (
                  <input
                    type="checkbox"
                    checked={value === true || value === 'true'}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })}
                    className="h-4 w-4"
                  />
                ) : f.type === 'datetime' ? (
                  <input
                    type="datetime-local"
                    value={toInput(value, 'datetime') || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [f.key]: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                    className="rounded border border-white/12 bg-black/30 px-2 py-1.5 text-[12.5px]
                               text-white focus:border-indigo-400 focus:outline-none"
                  />
                ) : (
                  <input
                    type="number"
                    value={value ?? ''}
                    onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) })}
                    className="w-[110px] rounded border border-white/12 bg-black/30 px-2 py-1.5
                               font-mono tabular-nums text-[12.5px] text-white
                               focus:border-indigo-400 focus:outline-none"
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Button variant="primary" disabled={!dirty || busy} onClick={save}>
        {busy ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
      </Button>
    </div>
  );
}
