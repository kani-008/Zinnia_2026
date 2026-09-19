import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AdminError, adminFetch, TOKEN_KEY, tokenStore, UNAUTHORISED_EVENT } from './adminFetch';
import type { AdminRole, AdminUser } from '../types';

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  /** the page-load session check failed for a network reason and is being retried */
  reconnecting: boolean;
  signIn: (username: string, password: string) => Promise<AdminUser>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export const useAdminAuth = () => useContext(Ctx);

/** Logins that may use the on-spot desk and nothing else (the server's DESK_ONLY_ROLES). */
export const DESK_ONLY_ROLES: readonly AdminRole[] = ['SPOT_DESK'];

export const isDeskOnly = (role?: AdminRole | null): boolean => !!role && DESK_ONLY_ROLES.includes(role);

/**
 * A page open to every admin - except a desk-only login, which is sent to the
 * desk. The server refuses those logins on the same pages' data anyway.
 */
export function NotForDeskOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAdminAuth();
  if (isDeskOnly(user?.role)) return <Navigate to="/admin/spot" replace />;
  return <>{children}</>;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  // Revalidate a stored token on mount. Asking the server is the only way to
  // tell a still-good token from an expired one. Only the server saying the
  // session is over (401) ends it: a dropped connection or a slow server is
  // retried, so a desk is never signed out mid-queue by a network blip.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: number | undefined;
    const attempt = (n: number) => {
      adminFetch<{ user: AdminUser }>('/api/admin/me')
        .then((d) => {
          if (cancelled) return;
          setUser(d.user);
          setReconnecting(false);
          setLoading(false);
        })
        .catch((e) => {
          if (cancelled) return;
          if (e instanceof AdminError && (e.status === 401 || e.status === 403)) {
            setUser(null);
            setReconnecting(false);
            setLoading(false);
            return;
          }
          setReconnecting(true);
          timer = window.setTimeout(() => attempt(n + 1), Math.min(8000, 1000 * 2 ** n));
        });
    };
    attempt(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // A 401 from any call anywhere signs the operator out.
  useEffect(() => {
    const onUnauthorised = () => setUser(null);
    window.addEventListener(UNAUTHORISED_EVENT, onUnauthorised);
    return () => window.removeEventListener(UNAUTHORISED_EVENT, onUnauthorised);
  }, []);

  // A desk login is shared by every tab through localStorage. Sign out in one
  // tab signs out the others straight away; a different desk login signed in
  // elsewhere in this browser replaces this tab's identity visibly, so a tab
  // can never show onspot1 while its requests go out as onspot2. A tab with a
  // tab-only sign-in of its own (treasurer, admin) is not affected.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY || e.storageArea !== localStorage || tokenStore.hasOwn()) return;
      if (e.newValue === null) {
        setUser(null);
        return;
      }
      if (e.newValue !== e.oldValue) {
        adminFetch<{ user: AdminUser }>('/api/admin/me')
          .then((d) => setUser(d.user))
          .catch(() => {
            /* a 401 already signed this tab out through UNAUTHORISED_EVENT */
          });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const d = await adminFetch<{ token: string; user: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Desk-only logins stay signed in when the tab closes; see tokenStore.
    tokenStore.set(d.token, isDeskOnly(d.user.role));
    setUser(d.user);
    return d.user;
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, reconnecting, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function FullPageSpinner() {
  const { reconnecting } = useAdminAuth();
  return (
    <div className="min-h-screen grid place-items-center bg-[#0D0D0F] text-white/50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
        {reconnecting && (
          <p className="text-[13px] text-white/45" role="status">
            Reconnecting to the server… you are still signed in.
          </p>
        )}
      </div>
    </div>
  );
}

function NotAuthorised() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div className="max-w-md text-center">
        <ShieldAlert className="w-10 h-10 mx-auto text-amber-400/80" />
        <h1 className="mt-4 text-xl font-semibold text-white">Not your desk</h1>
        <p className="mt-2 text-sm text-white/55 leading-relaxed">
          Your account does not have access to this screen. If you think it should, ask a
          super admin to check your role.
        </p>
      </div>
    </div>
  );
}

/**
 * Navigation guard only. A determined operator can edit their own bundle —
 * authorisation is whatever require_role says on the server. Never rely on
 * this to withhold data the browser was already sent.
 *
 * An empty `roles` array means SUPER_ADMIN only: no other role can satisfy it,
 * and SUPER_ADMIN passes everything by the rule below (mirroring the server).
 */
export function RequireRole({
  roles,
  children,
}: {
  roles?: AdminRole[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAdminAuth();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (roles && user.role !== 'SUPER_ADMIN' && !roles.includes(user.role)) {
    return <NotAuthorised />;
  }
  return <>{children}</>;
}
