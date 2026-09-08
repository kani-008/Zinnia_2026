import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import { ComicToaster } from './components/ui/toast';
import { MaintenancePage } from './pages/MaintenancePage';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePaymentPage } from './pages/Payment';
import { WebsitePassportPage } from './pages/Passport';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteConfirmationPage } from './pages/Confirmation';
import { WebsiteContactPage } from './pages/Contact';
import { WebsiteSchedulePage } from './pages/Schedule';
import { WebsitePrivacyPage } from './pages/Privacy';
import { ParticipantRegisterPage } from './pages/ParticipantRegister';
import { ParticipantVerifyEmailPage } from './pages/ParticipantVerifyEmail';
import { ParticipantPaymentPage } from './pages/ParticipantPayment';
import { ParticipantLoginPage } from './pages/ParticipantLogin';
import { ParticipantDashboardPage } from './pages/ParticipantDashboard';
import { ParticipantTeamsPage } from './pages/ParticipantTeams';
import { ParticipantTeamCreatePage } from './pages/ParticipantTeamCreate';
import { registerNav } from './services/registerNavigation';

const AdminApp = React.lazy(() => import('./admin/AdminApp'));

// Automatically scroll to the top section of the page on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    registerNav.setNavigator(navigate);
  }, [navigate]);

  // When maintenance is active, all public routes show MaintenancePage (except /admin)
  if (isMaintenanceMode && !location.pathname.startsWith('/admin')) {
    return <MaintenancePage />;
  }

  return (
    <div className="relative w-full max-w-full min-h-screen bg-[#0D0D0F] overflow-x-hidden">
      <ScrollToTop />
      {/* Mounted once for the whole app; renders nothing until something is raised. */}
      <ComicToaster />
      {/* Routes */}
      <Routes>
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/" element={<WebsiteHomePage />} />
        <Route path="/events" element={<WebsiteEventsPage />} />
        {/* Every "Register" CTA lands in the participant flow. The old
            one-shot form is kept reachable at /register-legacy rather than
            deleted, so nothing is lost before the Phase 6 cutover. */}
        <Route path="/register" element={<Navigate to="/participant/register" replace />} />
        <Route path="/register-legacy" element={<WebsiteRegisterPage />} />
        <Route path="/payment" element={<WebsitePaymentPage />} />
        <Route path="/confirmation" element={<WebsiteConfirmationPage />} />
        <Route path="/payment-success" element={<Navigate to="/confirmation" replace />} />
        <Route path="/passport" element={<WebsitePassportPage />} />
        <Route path="/schedule" element={<WebsiteSchedulePage />} />
        <Route path="/contact" element={<WebsiteContactPage />} />
        <Route path="/privacy" element={<WebsitePrivacyPage />} />

        {/* Participant flow — registration, payment, login, dashboard, teams */}
        <Route path="/participant/register" element={<ParticipantRegisterPage />} />
        {/* Email check sits between details and payment so a wrong address is
            caught before any money is attached to it. */}
        <Route path="/participant/verify" element={<ParticipantVerifyEmailPage />} />
        <Route path="/participant/payment" element={<ParticipantPaymentPage />} />
        <Route path="/participant/login" element={<ParticipantLoginPage />} />
        <Route path="/participant/dashboard" element={<ParticipantDashboardPage />} />
        <Route path="/participant/teams" element={<ParticipantTeamsPage />} />
        <Route path="/participant/teams/new" element={<ParticipantTeamCreatePage />} />
        {/* Short alias for the nav LOGIN button and anyone typing /login. */}
        <Route path="/login" element={<Navigate to="/participant/login" replace />} />

        {/* Organiser panel. Lazy so none of it lands in the participant
            entry chunk — a visitor registering for an event never downloads
            the treasurer's queue. */}
        <Route
          path="/admin/*"
          element={
            <React.Suspense
              fallback={
                <div className="min-h-screen grid place-items-center text-white/40 text-sm">
                  Loading…
                </div>
              }
            >
              <AdminApp />
            </React.Suspense>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
