import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, LockKeyhole } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthProvider';
import { FullPageSpinner } from '../auth/AdminAuthProvider';

export function Login() {
  const { user, loading, signIn } = useAdminAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <FullPageSpinner />;
  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      // The server's message is written for a person; show it verbatim.
      setError(err?.message || 'Could not sign you in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#0D0D0F] px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 text-center">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/35">
            Zinnia 2026
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Admin sign in</h1>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3.5"
        >
          <label className="block">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/45">
              Username
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="mt-1.5 w-full rounded-md border border-white/12 bg-black/30 px-3 py-2
                         text-sm text-white placeholder-white/25 focus:border-indigo-400 focus:outline-none"
              placeholder="treasurer"
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/45">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-md border border-white/12 bg-black/30 px-3 py-2
                         text-sm text-white placeholder-white/25 focus:border-indigo-400 focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !username || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-500
                       px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-400
                       disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockKeyhole className="w-4 h-4" />}
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-white/25">
          Sessions end when you close the tab.
        </p>
      </div>
    </div>
  );
}
