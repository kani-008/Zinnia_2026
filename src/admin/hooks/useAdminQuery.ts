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
export function useAdminQuery<T>(
  path: string | null,
  pollMs = 30000,
  keepPrevious = false,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Refresh must not blank the screen, or every poll flashes a spinner.
  const firstLoad = useRef(true);
  // Set while a NEW path is loading over data we already have. The payments
  // queue changes its path every time the treasurer switches Pending/Approved,
  // and blanking the table for a whole round trip is what made that feel slow -
  // the rows were never the problem, the empty screen was.
  const [refreshing, setRefreshing] = useState(false);
  const hasData = useRef(false);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const d = await adminFetch<T>(path);
      setData(d);
      hasData.current = true;
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Could not load this.');
    } finally {
      firstLoad.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [path]);

  useEffect(() => {
    // With keepPrevious the old rows stay on screen, dimmed by the caller, while
    // the new ones arrive. Without it, behaviour is exactly as before.
    if (keepPrevious && hasData.current) {
      setRefreshing(true);
    } else {
      firstLoad.current = true;
      setLoading(true);
    }
    load();
  }, [load, keepPrevious]);

  useEffect(() => {
    if (!pollMs || !path) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [load, pollMs, path]);

  return { data, error, loading, refreshing, reload: load };
}
