/**
 * Every admin call goes through here.
 *
 * It attaches the bearer token, unwraps the {success, message, error_code}
 * envelope the backend uses uniformly, and throws an AdminError carrying the
 * server's own `message` — which is already written for a human, so screens
 * show it directly instead of inventing their own copy.
 */

const TOKEN_KEY = 'zin26_admin_token';

/**
 * sessionStorage, not localStorage: a treasurer verifying payments on a shared
 * department machine should not still be signed in after the tab closes. The
 * seven-day token expiry is the server-side ceiling; this is the client floor.
 */
export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(t: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* private window, storage disabled — the session just won't survive a reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to do */
    }
  },
};

export const UNAUTHORISED_EVENT = 'zin26:admin-unauthorised';

export class AdminError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
    this.status = status;
  }
}

type Opts = RequestInit & { raw?: boolean };

/**
 * Signing in is the one place a 401 does NOT mean the session died — it means
 * the credentials were wrong. Treating it as an expiry replaces the server's
 * "Invalid username or password" with "Your session has ended", which sends
 * people looking for a problem that isn't there.
 */
const AUTH_ENDPOINTS = ['/api/admin/login', '/api/admin/auth/login'];

export async function adminFetch<T = any>(path: string, opts: Opts = {}): Promise<T> {
  const token = tokenStore.get();
  const isSignIn = AUTH_ENDPOINTS.some((p) => path.startsWith(p));

  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  // Session gone. Clear it and let the provider redirect, wherever we are.
  if (res.status === 401 && !isSignIn) {
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent(UNAUTHORISED_EVENT));
    throw new AdminError('Your session has ended. Please sign in again.', 'UNAUTHORIZED', 401);
  }

  // File downloads: the caller handles the blob and the filename header.
  if (opts.raw) {
    if (!res.ok) {
      throw new AdminError('The download failed. Please try again.', 'DOWNLOAD_FAILED', res.status);
    }
    return res as unknown as T;
  }

  const data = await res.json().catch(() => ({} as any));
  if (!res.ok || data?.success === false) {
    throw new AdminError(
      data?.message || 'Something went wrong. Please try again.',
      data?.error_code || 'UNKNOWN',
      res.status,
    );
  }
  return data as T;
}
