import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, NotForDeskOnly, RequireRole } from './auth/AdminAuthProvider';
import { AdminLayout } from './AdminLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Payments } from './pages/Payments';
import { SpotDesk } from './pages/SpotDesk';
import { Events } from './pages/Events';
import { Exports } from './pages/Exports';
import { Settings } from './pages/Settings';
import { AuditLog } from './pages/AuditLog';

/**
 * `roles={[]}` means SUPER_ADMIN only: the guard lets SUPER_ADMIN through
 * everything and no other role can satisfy an empty list. It mirrors
 * require_role() on the server, which behaves the same way.
 */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />

        <Route
          element={
            <RequireRole>
              <AdminLayout />
            </RequireRole>
          }
        >
          {/* Dashboard picks the desk summary for a desk-only login. */}
          <Route index element={<Dashboard />} />
          <Route
            path="payments"
            element={
              <RequireRole roles={['TREASURER']}>
                <Payments />
              </RequireRole>
            }
          />
          <Route
            path="spot"
            element={
              <RequireRole roles={['TREASURER', 'SPOT_DESK']}>
                <SpotDesk />
              </RequireRole>
            }
          />
          <Route
            path="events"
            element={
              <NotForDeskOnly>
                <Events />
              </NotForDeskOnly>
            }
          />
          <Route
            path="exports"
            element={
              <NotForDeskOnly>
                <Exports />
              </NotForDeskOnly>
            }
          />
          <Route
            path="settings"
            element={
              <RequireRole roles={[]}>
                <Settings />
              </RequireRole>
            }
          />
          <Route
            path="audit"
            element={
              <RequireRole roles={[]}>
                <AuditLog />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
