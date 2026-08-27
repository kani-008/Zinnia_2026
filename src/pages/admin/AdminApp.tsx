import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminDashboardPage } from './AdminDashboard';
import { ParticipantsListPage } from './ParticipantsList';
import { QRScannerPage } from './QRScanner';
import { CheckInHistoryPage } from './CheckInHistory';
import { store } from '../../services/store';
import { Shield, Zap, Lock } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState(store.getAdminRole());
  const [error, setError] = React.useState('');
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    store.setAdminRole(role as any);
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 font-mono text-xs flex items-center justify-center p-4">
      <div className="bg-[#070c1b] border border-cyan-500/40 rounded-xl p-8 max-w-md w-full space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-heading font-black text-white font-sans tracking-wide">
            ZINNIA 2026 ADMIN LOGIN
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Authorized Coordinator & Admin Access Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold">
              SELECT STAFF / COORDINATOR ROLE:
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-[#040711] border border-slate-700 focus:border-cyan-400 text-cyan-300 font-bold p-3 rounded text-xs focus:outline-none"
            >
              <option value="SUPER_ADMIN">SUPER_ADMIN (Full Management)</option>
              <option value="ENTRY_STAFF">ENTRY_STAFF (Gate Coordinator)</option>
              <option value="EVENT_ADMIN">EVENT_ADMIN (Event Track Desk)</option>
              <option value="FOOD_STAFF">FOOD_STAFF (Dining Counter)</option>
              <option value="CERTIFICATE_ADMIN">CERTIFICATE_ADMIN (Certificates & Prizes)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-mono text-[11px] mb-1.5 font-bold">
              ACCESS PASSCODE (OPTIONAL FOR DEMO):
            </label>
            <input
              type="password"
              placeholder="Enter admin passcode..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#040711] border border-slate-700 text-white p-3 rounded text-xs focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {error && <div className="text-rose-400 text-xs font-mono">{error}</div>}

          <button
            type="submit"
            className="w-full py-3.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-black text-xs uppercase tracking-wider transition-all font-sans"
          >
            ENTER ADMIN PORTAL
          </button>
        </form>

        <div className="text-center pt-2">
          <Link to="/" className="text-slate-500 hover:text-slate-300 text-[11px] font-mono">
            ← Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export const AdminApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-mono">
      {/* Top Sticky Admin Navigation Bar */}
      <AdminSidebar />

      {/* Admin Content View */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        <Routes>
          <Route path="/" element={<AdminDashboardPage />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/participants" element={<ParticipantsListPage />} />
          <Route path="/scan" element={<QRScannerPage />} />
          <Route path="/scanner" element={<QRScannerPage />} />
          <Route path="/check-ins" element={<CheckInHistoryPage />} />
          <Route path="/history" element={<CheckInHistoryPage />} />
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminApp;
