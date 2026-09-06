import { useCallback, useEffect, useRef, useState } from 'react';
import { adminFetch } from '../auth/adminFetch';

/**
 * Fetch + poll, pausing while the tab is hidden.
 *
 * Polling rather than Supabase realtime is deliberate: the participant site
 * subscribes with the anon key, and the admin panel has no anon database
 * access by design (migration 004). Polling an authenticated endpoint is the
 * right shape here.
 */
export function useAdminQuery<T>(path: string | null, pollMs = 30000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Refresh must not blank the screen, or every poll flashes a spinner.
  const firstLoad = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const d = await adminFetch<T>(path);
      setData(d);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load this.');
    } finally {
      firstLoad.current = false;
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    firstLoad.current = true;
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!pollMs || !path) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [load, pollMs, path]);

  return { data, error, loading, reload: load };
}
