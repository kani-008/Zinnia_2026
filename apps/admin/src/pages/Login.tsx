import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, ArrowRight } from 'lucide-react';
import { store } from '../../../../src/services/store';
import { AdminRole } from '@packages/types/src';

export const Login: React.FC = () => {
  const [role, setRole] = useState<AdminRole>('SUPER_ADMIN');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    store.setAdminRole(role);
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#05080e] flex items-center justify-center p-4">
      <div className="glass-panel p-8 tech-bracket border-cyan-400 max-w-md w-full space-y-6 shadow-2xl font-mono text-xs">
        <div className="text-center space-y-2">
          <Shield className="w-10 h-10 text-cyan-400 mx-auto" />
          <h2 className="text-2xl font-heading font-black text-white">CHRONOS COMMAND</h2>
          <p className="text-slate-400">Symposium Operations & Verification Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1">SELECT STATION / ROLE</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className="w-full px-3 py-2.5 rounded bg-slate-950 border border-slate-700 text-white"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full Clearance)</option>
              <option value="ENTRY_STAFF">ENTRY_STAFF (Gate Scanner)</option>
              <option value="FOOD_STAFF">FOOD_STAFF (Food Token)</option>
              <option value="EVENT_ADMIN">EVENT_ADMIN (Mission Desks)</option>
              <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN (E-Certs)</option>
            </select>
          </div>

          <button type="submit" className="btn-temporal w-full py-3">
            <span>ENTER COMMAND PORTAL</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
