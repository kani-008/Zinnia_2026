import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WebsiteApp } from './zinnia_website/WebsiteApp';
import { AdminApp } from './pages/admin/AdminApp';

/**
 * Zinnia 2026 — Web Application with Admin Panel
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<WebsiteApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

