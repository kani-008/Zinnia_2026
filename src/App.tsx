import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePaymentPage } from './pages/Payment';
import { WebsitePassportPage } from './pages/Passport';
import { WebsiteAssistantPage } from './pages/Assistant';
import { WebsiteStoryPage } from './pages/Story';
import { AdminApp } from './pages/admin/AdminApp';
import { LiquidGlassHover } from './components/canvas/LiquidGlassHover';

export function App() {
  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">
      {/* Liquid Glass Fluid Hover Effect Background */}
      <LiquidGlassHover />

      {/* 2D Neubrutalist Comic Interface with Scrollable Story Sections */}
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/" element={<WebsiteHomePage />} />
        <Route path="/events" element={<WebsiteEventsPage />} />
        <Route path="/register" element={<WebsiteRegisterPage />} />
        <Route path="/payment" element={<WebsitePaymentPage />} />
        <Route path="/passport" element={<WebsitePassportPage />} />
        <Route path="/assistant" element={<WebsiteAssistantPage />} />
        <Route path="/story" element={<WebsiteStoryPage />} />
      </Routes>
    </div>
  );
}

export default App;
