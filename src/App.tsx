import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePaymentPage } from './pages/Payment';
import { WebsitePassportPage } from './pages/Passport';
import { WebsiteContactPage } from './pages/Contact';
import { WebsiteSchedulePage } from './pages/Schedule';
import { registerNav } from './services/registerNavigation';

// Automatically scroll to the top section of the page on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

export function App() {
  const navigate = useNavigate();

  useEffect(() => {
    registerNav.setNavigator(navigate);
  }, [navigate]);

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">
      <ScrollToTop />
      {/* Routes */}
      <Routes>
        <Route path="/" element={<WebsiteHomePage />} />
        <Route path="/events" element={<WebsiteEventsPage />} />
        <Route path="/register" element={<WebsiteRegisterPage />} />
        <Route path="/payment" element={<WebsitePaymentPage />} />
        <Route path="/passport" element={<WebsitePassportPage />} />
        <Route path="/contact" element={<WebsiteContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
