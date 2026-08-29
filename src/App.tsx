import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePaymentPage } from './pages/Payment';
import { WebsitePassportPage } from './pages/Passport';
import { WebsiteAssistantPage } from './pages/Assistant';
import { WebsiteContactPage } from './pages/Contact';
import { AdminApp } from './pages/admin/AdminApp';
import { RegisterGeneratingModal } from './components/ui/RegisterGeneratingModal';

export function App() {
  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">

      {/* Register Generating Modal Overlay */}
      <RegisterGeneratingModal />

      {/* Routes */}
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/" element={<WebsiteHomePage />} />
        <Route path="/events" element={<WebsiteEventsPage />} />
        <Route path="/register" element={<WebsiteRegisterPage />} />
        <Route path="/payment" element={<WebsitePaymentPage />} />
        <Route path="/passport" element={<WebsitePassportPage />} />
        <Route path="/assistant" element={<WebsiteAssistantPage />} />
        <Route path="/contact" element={<WebsiteContactPage />} />
        <Route path="/story" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
