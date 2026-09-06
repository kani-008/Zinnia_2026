import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { adminFetch, tokenStore, UNAUTHORISED_EVENT } from './adminFetch';
import type { AdminRole, AdminUser } from '../types';

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export const useAdminAuth = () => useContext(Ctx);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Revalidate a stored token on mount. Asking the server is the only way to
  // tell a still-good token from an expired one.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    adminFetch<{ user: AdminUser }>('/api/admin/me')
      .then((d) => !cancelled && setUser(d.user))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // A 401 from any call anywhere signs the operator out.
  useEffect(() => {
    const onUnauthorised = () => setUser(null);
    window.addEventListener(UNAUTHORISED_EVENT, onUnauthorised);
    return () => window.removeEventListener(UNAUTHORISED_EVENT, onUnauthorised);
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const d = await adminFetch<{ token: string; user: AdminUser }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    tokenStore.set(d.token);
    setUser(d.user);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen grid place-items-center bg-[#0D0D0F] text-white/50">
      <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
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
