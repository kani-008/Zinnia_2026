import React, { useMemo } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarClock,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings as SettingsIcon,
  Wallet,
} from 'lucide-react';
import { useAdminAuth } from './auth/AdminAuthProvider';
import { useAdminQuery } from './hooks/useAdminQuery';
import { cx } from './components';
import type { AdminRole } from './types';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: AdminRole[]; // omitted = everyone; empty array = SUPER_ADMIN only
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/payments', label: 'Payments', icon: Wallet, roles: ['TREASURER'] },
  { to: '/admin/events', label: 'Events', icon: CalendarClock },
  { to: '/admin/exports', label: 'Exports', icon: FileSpreadsheet },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon, roles: [] },
  { to: '/admin/audit', label: 'Audit log', icon: ScrollText, roles: [] },
];

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.ceil(ms / 86_400_000) : null;
}

export function AdminLayout() {
  const { user, signOut } = useAdminAuth();
  // Only super admins can read settings, so nobody else gets the countdown.
  const canReadSettings = user?.role === 'SUPER_ADMIN';
  const { data: settings } = useAdminQuery<{ settings: Record<string, any> }>(
    canReadSettings ? '/api/admin/settings' : null,
    0,
  );

  const closesIn = useMemo(
    () => daysUntil(settings?.settings?.default_reg_closes_at),
    [settings],
  );

  const visible = NAV.filter((item) => {
    if (!item.roles) return true;
    if (user?.role === 'SUPER_ADMIN') return true;
    return item.roles.includes(user!.role);
  });

  return (
    <div className="min-h-screen bg-[#0D0D0F] text-white">
      <div className="mx-auto flex max-w-[1500px] gap-0">
        {/* nav rail */}
        <aside className="hidden md:flex w-[208px] shrink-0 flex-col border-r border-white/8 min-h-screen px-3 py-5">
          <div className="px-2 pb-5">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/35">
              Zinnia 2026
            </div>
            <div className="mt-0.5 text-[15px] font-semibold tracking-tight">Admin</div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {visible.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-colors',
                    isActive
                      ? 'bg-white/8 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/4',
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {closesIn !== null && (
            <div className="mt-auto rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                Registration closes
              </div>
              <div
                className={cx(
                  'mt-1 text-sm font-semibold tabular-nums',
                  closesIn <= 2 ? 'text-amber-300' : 'text-white/80',
                )}
              >
                {closesIn > 0 ? `in ${closesIn} day${closesIn === 1 ? '' : 's'}` : 'closed'}
              </div>
            </div>
          )}
        </aside>

        {/* main column */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/8 bg-[#0D0D0F]/90 px-5 py-3 backdrop-blur">
            {/* mobile nav */}
            <nav className="md:hidden flex gap-1 overflow-x-auto">
              {visible.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-1.5 rounded px-2 py-1.5 text-[12.5px] whitespace-nowrap',
                      isActive ? 'bg-white/10 text-white' : 'text-white/45',
                    )
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-[13px] font-medium">{user?.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/35">
                  {user?.role.replace(/_/g, ' ')}
                </div>
              </div>
              <button
                onClick={signOut}
                title="Sign out"
                className="rounded-md border border-white/12 bg-white/5 p-2 text-white/50
                           hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          <main className="px-5 py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
