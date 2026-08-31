import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePaymentPage } from './pages/Payment';
import { WebsitePassportPage } from './pages/Passport';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteConfirmationPage } from './pages/Confirmation';
import { WebsiteContactPage } from './pages/Contact';
import { WebsiteSchedulePage } from './pages/Schedule';
import { registerNav } from './services/registerNavigation';

// Automatically scroll to the top section of the page on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export function App() {
  const navigate = useNavigate();

  useEffect(() => {
    registerNav.setNavigator(navigate);
  }, [navigate]);

  return (
    <div className="relative w-full min-h-screen bg-[#0D0D0F]">
      <ScrollToTop />
      {/* Routes */}
      <Routes>
        <Route path="/" element={<WebsiteHomePage />} />
        <Route path="/events" element={<WebsiteEventsPage />} />
        <Route path="/register" element={<WebsiteRegisterPage />} />
        <Route path="/payment" element={<WebsitePaymentPage />} />
        <Route path="/confirmation" element={<WebsiteConfirmationPage />} />
        <Route path="/payment-success" element={<Navigate to="/confirmation" replace />} />
        <Route path="/passport" element={<WebsitePassportPage />} />
        <Route path="/contact" element={<WebsiteContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
