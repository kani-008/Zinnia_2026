import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminRole } from '@packages/types/src';

export interface HeaderProps {
  role: AdminRole;
  onRoleChange: (role: AdminRole) => void;
}

export const Header: React.FC<HeaderProps> = ({ role, onRoleChange }) => {
  return (
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
          <span>CHRONOS ADMIN // COMMAND</span>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-slate-500 hidden sm:inline">ACTIVE ROLE:</span>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as AdminRole)}
          className="bg-slate-900 border border-cyan-500/40 text-cyan-300 font-bold px-3 py-1.5 rounded text-xs"
        >
          <option value="SUPER_ADMIN">SUPER_ADMIN (Full Control)</option>
          <option value="ENTRY_STAFF">ENTRY_STAFF (Gate Scanner)</option>
          <option value="FOOD_STAFF">FOOD_STAFF (Food Token)</option>
          <option value="EVENT_ADMIN">EVENT_ADMIN (Mission Desks)</option>
          <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN (E-Certs)</option>
        </select>
      </div>
    </header>
  );
};
