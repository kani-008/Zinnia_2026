import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { store } from '../../services/store';
import { AdminRole } from '@packages/types/src';
import { 
  Users, 
  QrCode, 
  History, 
  LogOut, 
  ArrowLeft, 
  Zap, 
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
  DoorOpen,
  Utensils,
  Award,
  FileSpreadsheet
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<AdminRole>(store.getAdminRole());
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    store.setAdminRole(newRole);
  };

  const handleLogout = () => {
    store.setAdminRole('SUPER_ADMIN');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', aliases: ['/admin'], icon: LayoutDashboard },
    { name: 'Payments', path: '/admin/payments', aliases: [], icon: CreditCard },
    { name: 'Gate Entry', path: '/admin/entry', aliases: [], icon: DoorOpen },
    { name: 'Food Counter', path: '/admin/food', aliases: [], icon: Utensils },
    { name: 'Events', path: '/admin/events', aliases: [], icon: Zap },
    { name: 'Participants', path: '/admin/participants', aliases: [], icon: Users },
    { name: 'Scan QR', path: '/admin/scan', aliases: ['/admin/scanner'], icon: QrCode },
    { name: 'Certs & Prizes', path: '/admin/certificates', aliases: [], icon: Award },
    { name: 'Reports', path: '/admin/reports', aliases: [], icon: FileSpreadsheet }
  ];

  const isActive = (itemPath: string, aliases: string[]) => {
    if (location.pathname === itemPath) return true;
    if (aliases.includes(location.pathname)) return true;
    return false;
  };

  return (
    <header className="bg-[#050914] border-b border-slate-800 sticky top-0 z-50 font-mono text-xs shadow-xl">
      {/* Top Admin Header Bar */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Return Link */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded bg-[#040711] border border-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-mono flex items-center gap-1.5 font-bold transition-colors"
            title="Return to Public Symposium Site"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PUBLIC SITE</span>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 font-heading font-black text-white text-base font-sans tracking-wide">
            <div className="p-1 rounded bg-cyan-950 border border-cyan-500/50">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            </div>
            <span>ZINNIA 2026</span>
            <span className="text-cyan-400 font-mono text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 hidden md:inline">
              ADMIN CONTROL
            </span>
          </div>
        </div>

        {/* Desktop Controls: Role Selector & Navigation & Logout */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Main Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.aliases);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-2.5 py-1.5 rounded flex items-center gap-1.5 font-bold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-5 w-px bg-slate-800 shrink-0" />

          {/* Role Selector */}
          <div className="flex items-center gap-2 font-mono text-xs shrink-0">
            <span className="text-slate-400 font-bold hidden xl:inline">ROLE:</span>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
              className="bg-[#040711] border border-cyan-500/60 text-cyan-300 font-bold px-2 py-1 rounded focus:outline-none focus:border-cyan-400 text-xs cursor-pointer"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ENTRY_STAFF">ENTRY_STAFF</option>
              <option value="EVENT_ADMIN">EVENT_ADMIN</option>
              <option value="FOOD_STAFF">FOOD_STAFF</option>
              <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN</option>
            </select>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900 transition-colors flex items-center gap-1 font-bold shrink-0 cursor-pointer"
            title="Logout Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">LOGOUT</span>
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="lg:hidden p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-[#070c1b] px-4 py-4 space-y-3 font-mono text-xs">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.aliases);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`px-3 py-2 rounded flex items-center gap-2.5 font-bold transition-all ${
                    active
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-400'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
              className="bg-[#040711] border border-cyan-500/60 text-cyan-300 font-bold px-2 py-1.5 rounded text-xs"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ENTRY_STAFF">ENTRY_STAFF</option>
              <option value="EVENT_ADMIN">EVENT_ADMIN</option>
              <option value="FOOD_STAFF">FOOD_STAFF</option>
              <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN</option>
            </select>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminSidebar;
