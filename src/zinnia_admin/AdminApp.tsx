import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboardPage } from './pages/AdminDashboard';
import { QRScannerPage } from './pages/QRScanner';
import { EntryCheckinPage } from './pages/EntryCheckin';
import { FoodCheckinPage } from './pages/FoodCheckin';
import { EventCheckinPage } from './pages/EventCheckin';
import { ParticipantsListPage } from './pages/ParticipantsList';
import { CertificateAdminPage } from './pages/CertificateAdmin';
import { ReportsExportPage } from './pages/ReportsExport';

export const AdminApp: React.FC = () => {
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
};

export default AdminApp;
