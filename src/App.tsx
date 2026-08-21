import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

// Public Layout & Pages
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/Home';
import { StoryPage } from './pages/Story';
import { TimelinePage } from './pages/Timeline';
import { EventsPage } from './pages/Events';
import { SchedulePage } from './pages/Schedule';
import { RegisterPage } from './pages/Register';
import { ParticipantLoginPage } from './pages/participant/Login';
import { PassportPage } from './pages/participant/Passport';
import { FAQPage } from './pages/FAQ';
import { ContactPage } from './pages/Contact';

// Dedicated Admin Portal
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboard';
import { QRScannerPage } from './pages/admin/QRScanner';
import { EntryCheckinPage } from './pages/admin/EntryCheckin';
import { FoodCheckinPage } from './pages/admin/FoodCheckin';
import { EventCheckinPage } from './pages/admin/EventCheckin';
import { ParticipantsListPage } from './pages/admin/ParticipantsList';
import { CertificateAdminPage } from './pages/admin/CertificateAdmin';
import { ReportsExportPage } from './pages/admin/ReportsExport';

/**
 * Public Zinnia Website Sub-Application
 * Completely isolated from Admin layouts, styling, and navigation.
 */
function PublicWebsiteApp() {
  return (
    <div className="flex flex-col min-h-screen bg-[#08090d] text-slate-100 font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<ParticipantLoginPage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Dedicated Admin Command Portal Sub-Application
 * Completely isolated with its own staff navigation, role switcher, and command tools.
 */
function AdminPortalApp() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboardPage />} />
        <Route path="/scanner" element={<QRScannerPage />} />
        <Route path="/entry" element={<EntryCheckinPage />} />
        <Route path="/food" element={<FoodCheckinPage />} />
        <Route path="/events" element={<EventCheckinPage />} />
        <Route path="/participants" element={<ParticipantsListPage />} />
        <Route path="/certificates" element={<CertificateAdminPage />} />
        <Route path="/reports" element={<ReportsExportPage />} />
      </Routes>
    </AdminLayout>
  );
}

/**
 * Root Application Router
 * Connects Public Website and Admin Portal through clean route boundaries.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Isolated Admin Command Portal */}
        <Route path="/admin/*" element={<AdminPortalApp />} />

        {/* Isolated Public Website */}
        <Route path="/*" element={<PublicWebsiteApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
