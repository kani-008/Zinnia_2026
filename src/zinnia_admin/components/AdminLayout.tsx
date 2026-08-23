import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { store } from '../../services/store';
import { AdminRole } from '@packages/types/src';
import { 
  Zap, 
  LayoutDashboard, 
  QrCode, 
  DoorOpen, 
  Utensils, 
  Award, 
  Users, 
  FileSpreadsheet
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
    { name: 'Gate Entry', path: '/admin/entry', icon: DoorOpen, roles: ['SUPER_ADMIN', 'ENTRY_STAFF'] },
    { name: 'Food Counter', path: '/admin/food', icon: Utensils, roles: ['SUPER_ADMIN', 'FOOD_STAFF'] },
    { name: 'Event Attendance', path: '/admin/events', icon: Zap, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
    { name: 'Participants', path: '/admin/participants', icon: Users, roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
    { name: 'Prizes & Certs', path: '/admin/certificates', icon: Award, roles: ['SUPER_ADMIN', 'CERTIFICATE_ADMIN'] },
    { name: 'Excel Reports', path: '/admin/reports', icon: FileSpreadsheet, roles: ['SUPER_ADMIN'] }
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-mono text-xs flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm font-sans">
            <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400" />
            <span>ZINNIA ADMIN PORTAL</span>
          </div>
        </div>

        {/* Staff Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 hidden sm:inline font-bold">STAFF ROLE:</span>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
            className="bg-slate-900 border border-slate-700 text-indigo-300 font-bold px-3 py-1.5 rounded focus:outline-none focus:border-indigo-400 text-xs"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
            <option value="ENTRY_STAFF">ENTRY_STAFF (Gate Scanner)</option>
            <option value="FOOD_STAFF">FOOD_STAFF (Food Token)</option>
            <option value="EVENT_ADMIN">EVENT_ADMIN (Event Attendance)</option>
            <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN (Prizes & Certificates)</option>
          </select>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-slate-900/80 border-b border-slate-800 px-6 py-2 overflow-x-auto">
        <div className="flex gap-2 font-mono text-xs whitespace-nowrap">
          {allowedNav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded flex items-center gap-2 font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
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

      {/* Admin Content Viewport */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
};
