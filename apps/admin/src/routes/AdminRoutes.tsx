import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Participants } from '../pages/Participants';
import { Scanner } from '../pages/Scanner';
import { Entry } from '../pages/Entry';
import { Events } from '../pages/Events';
import { Food } from '../pages/Food';
import { Certificates } from '../pages/Certificates';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';
import { Login } from '../pages/Login';

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/entry" element={<Entry />} />
      <Route path="/events" element={<Events />} />
      <Route path="/food" element={<Food />} />
      <Route path="/participants" element={<Participants />} />
      <Route path="/certificates" element={<Certificates />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};
