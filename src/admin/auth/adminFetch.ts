/**
 * Every admin call goes through here.
 *
 * It attaches the bearer token, unwraps the {success, message, error_code}
 * envelope the backend uses uniformly, and throws an AdminError carrying the
 * server's own `message` — which is already written for a human, so screens
 * show it directly instead of inventing their own copy.
 */

export const TOKEN_KEY = 'zin26_admin_token';

/**
 * Where the admin token lives.
 *
 * sessionStorage by default: a treasurer verifying payments on a shared
 * department machine should not still be signed in after the tab closes.
 *
 * localStorage for the desk-only logins (onspot1 / onspot2), passed as
 * `persist`: the desk operator keeps leaving the desk tab to check that a UPI
 * payment has arrived, may close it on the way, and opens the desk again in a
 * new tab. Signing them out each time would stall the queue at the worst
 * moment. Their token still expires server-side after seven days, and Sign out
 * clears it from every tab.
 *
 * The seven-day token expiry is the server-side ceiling in both cases.
 */
export const tokenStore = {
  /** This tab's own (tab-only) sign-in first, then the desk sign-in shared by every tab. */
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  /** True when this tab has a tab-only sign-in of its own, so the shared desk one does not apply here. */
  hasOwn(): boolean {
    try {
      return sessionStorage.getItem(TOKEN_KEY) !== null;
    } catch {
      return false;
    }
  },
  set(t: string, persist = false) {
    try {
      if (persist) {
        localStorage.setItem(TOKEN_KEY, t);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        // A treasurer signing in on the desk's machine must not sign the desk
        // out in its other tabs: this tab's own sign-in wins here anyway.
        sessionStorage.setItem(TOKEN_KEY, t);
      }
    } catch {
      /* private window, storage disabled — the session just won't survive a reload */
    }
  },
  /**
   * Sign THIS tab out: remove the token it is using - its own tab-only one if
   * it has one, otherwise the shared desk one. Given `only`, remove it only if
   * the stored token is still that one, so a 401 for an old token can never
   * sign out a newer sign-in made meanwhile in another tab.
   */
  clear(only?: string | null) {
    const drop = (store: Storage): boolean => {
      const current = store.getItem(TOKEN_KEY);
      if (current === null) return false;
      if (!only || current === only) store.removeItem(TOKEN_KEY);
      return true;
    };
    try {
      if (drop(sessionStorage)) return;
    } catch {
      /* fall through to the shared store */
    }
    try {
      drop(localStorage);
    } catch {
      /* nothing to do */
    }
  },
};

export const UNAUTHORISED_EVENT = 'zin26:admin-unauthorised';

export class AdminError extends Error {
  code: string;
  status: number;
  /** The parsed error body, for screens that act on its extra fields (field, user_id, …). */
  data: any;
  constructor(message: string, code: string, status: number, data: any = null) {
    super(message);
    this.name = 'AdminError';
    this.code = code;
    this.status = status;
    this.data = data;
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
      // A FormData body (a file upload) sets its own multipart boundary header.
      ...(opts.body && !(opts.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  // Session gone. Clear it and let the provider redirect, wherever we are.
  if (res.status === 401 && !isSignIn) {
    tokenStore.clear(token);
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
      data,
    );
  }
  return data as T;
}
