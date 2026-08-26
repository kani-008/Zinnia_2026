import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsiteAssistantPage } from './pages/AssistantPage';
import { WebsiteStoryPage } from './pages/Story';
import { WebsitePassportPage } from './pages/Passport';
import { WebsitePaymentPage } from './pages/Payment';
import { LiquidGlassHover } from './components/LiquidGlassHover';

export const WebsiteApp: React.FC = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">
      {/* Liquid Glass Fluid Hover Effect Background */}
      <LiquidGlassHover />

      {/* 2D Neubrutalist Comic Interface with Scrollable Story Sections (Dark Mode CHRONOS Theme) */}
      <Routes>
        <Route path="/" element={<WebsiteHomePage />} />
        <Route path="/events" element={<WebsiteEventsPage />} />
        <Route path="/register" element={<WebsiteRegisterPage />} />
        <Route path="/payment" element={<WebsitePaymentPage />} />
        <Route path="/assistant" element={<WebsiteAssistantPage />} />
        <Route path="/story" element={<WebsiteStoryPage />} />
        <Route path="/passport" element={<WebsitePassportPage />} />
      </Routes>
    </div>
  );
};

export default WebsiteApp;

