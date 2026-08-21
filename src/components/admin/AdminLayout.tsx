import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { store } from '../../services/store';
import { AdminRole } from '@packages/types/src';
import { 
  Shield, 
  LayoutDashboard, 
  QrCode, 
  DoorOpen, 
  Utensils, 
  Award, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  ChevronRight, 
  ArrowLeft, 
  UserCheck, 
  Zap 
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [role, setRole] = useState<AdminRole>(store.getAdminRole());

  const handleRoleChange = (newRole: AdminRole) => {
    setRole(newRole);
    store.setAdminRole(newRole);
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'ENTRY_STAFF', 'FOOD_STAFF', 'CERTIFICATE_ADMIN'] },
    { name: 'QR Scanner', path: '/admin/scanner', icon: QrCode, roles: ['SUPER_ADMIN', 'ENTRY_STAFF', 'EVENT_ADMIN', 'FOOD_STAFF'] },
    { name: 'Gate Entry', path: '/admin/entry', icon: DoorOpen, roles: ['SUPER_ADMIN', 'ENTRY_STAFF'] },
    { name: 'Food Station', path: '/admin/food', icon: Utensils, roles: ['SUPER_ADMIN', 'FOOD_STAFF'] },
    { name: 'Missions Check-in', path: '/admin/events', icon: Zap, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
    { name: 'Participants', path: '/admin/participants', icon: Users, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
    { name: 'Certificates', path: '/admin/certificates', icon: Award, roles: ['SUPER_ADMIN', 'CERTIFICATE_ADMIN'] },
    { name: 'Excel Reports', path: '/admin/reports', icon: FileSpreadsheet, roles: ['SUPER_ADMIN'] }
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#05080e] text-slate-100 font-sans flex flex-col">
      {/* Top Admin Operational Bar */}
      <header className="bg-slate-950 border-b border-cyan-500/20 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 text-xs font-mono flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>PUBLIC SITE</span>
          </Link>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex items-center gap-2 font-heading font-black text-white text-base">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>CHRONOS ADMIN // OPERATIONS</span>
          </div>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-500 hidden sm:inline">ACTIVE ROLE:</span>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
            className="bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold px-3 py-1.5 rounded focus:outline-none focus:border-cyan-400 text-xs"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
            <option value="ENTRY_STAFF">ENTRY_STAFF (Gate Scanner)</option>
            <option value="FOOD_STAFF">FOOD_STAFF (Food Token)</option>
            <option value="EVENT_ADMIN">EVENT_ADMIN (Mission Desks)</option>
            <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN (E-Certs)</option>
          </select>
        </div>
      </header>

      {/* Main Admin Sub-Navigation */}
      <nav className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-2 overflow-x-auto">
        <div className="flex gap-1.5 font-mono text-xs whitespace-nowrap">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold transition-all ${
                  active
                    ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
};
