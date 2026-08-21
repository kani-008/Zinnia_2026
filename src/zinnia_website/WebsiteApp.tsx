import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { WebsiteNavbar } from './components/Navbar';
import { WebsiteFooter } from './components/Footer';
import { WebsiteHomePage } from './pages/Home';
import { WebsiteEventsPage } from './pages/Events';
import { WebsiteStoryPage } from './pages/Story';
import { WebsiteRegisterPage } from './pages/Register';
import { WebsitePassportPage } from './pages/Passport';

export const WebsiteApp: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-slate-100 font-sans">
      <WebsiteNavbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<WebsiteHomePage />} />
          <Route path="/events" element={<WebsiteEventsPage />} />
          <Route path="/story" element={<WebsiteStoryPage />} />
          <Route path="/register" element={<WebsiteRegisterPage />} />
          <Route path="/passport" element={<WebsitePassportPage />} />
        </Routes>
      </main>
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteApp;
