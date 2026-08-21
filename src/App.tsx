import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Public Pages
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

// Admin Pages
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboard';
import { QRScannerPage } from './pages/admin/QRScanner';
import { EntryCheckinPage } from './pages/admin/EntryCheckin';
import { FoodCheckinPage } from './pages/admin/FoodCheckin';
import { EventCheckinPage } from './pages/admin/EventCheckin';
import { ParticipantsListPage } from './pages/admin/ParticipantsList';
import { CertificateAdminPage } from './pages/admin/CertificateAdmin';
import { ReportsExportPage } from './pages/admin/ReportsExport';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Portal Routes (Self-contained with AdminLayout) */}
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboardPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/scanner"
          element={
            <AdminLayout>
              <QRScannerPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/entry"
          element={
            <AdminLayout>
              <EntryCheckinPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/food"
          element={
            <AdminLayout>
              <FoodCheckinPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminLayout>
              <EventCheckinPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/participants"
          element={
            <AdminLayout>
              <ParticipantsListPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/certificates"
          element={
            <AdminLayout>
              <CertificateAdminPage />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminLayout>
              <ReportsExportPage />
            </AdminLayout>
          }
        />

        {/* Public Website Experience */}
        <Route
          path="/*"
          element={
            <div className="flex flex-col min-h-screen">
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
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
