import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  QrCode, 
  DoorOpen, 
  Utensils, 
  Zap, 
  Users, 
  Award, 
  FileSpreadsheet 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'QR Scanner', path: '/admin/scanner', icon: QrCode },
    { name: 'Gate Entry', path: '/admin/entry', icon: DoorOpen },
    { name: 'Food Station', path: '/admin/food', icon: Utensils },
    { name: 'Missions', path: '/admin/events', icon: Zap },
    { name: 'Participants', path: '/admin/participants', icon: Users },
    { name: 'Certificates', path: '/admin/certificates', icon: Award },
    { name: 'Reports', path: '/admin/reports', icon: FileSpreadsheet }
  ];

  return (
    <nav className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 py-2 overflow-x-auto">
      <div className="flex gap-1.5 font-mono text-xs whitespace-nowrap">
        {links.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold transition-all ${
                active
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-400'
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
  );
};
