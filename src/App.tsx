import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePaymentPage } from './pages/Payment';
import { WebsitePassportPage } from './pages/Passport';
import { WebsiteContactPage } from './pages/Contact';
import { registerNav } from './services/registerNavigation';

export function App() {
  const navigate = useNavigate();

  useEffect(() => {
    registerNav.setNavigator(navigate);
  }, [navigate]);

  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">
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
