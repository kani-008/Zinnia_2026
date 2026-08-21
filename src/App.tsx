import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WebsiteApp } from './zinnia_website/WebsiteApp';
import { AdminApp } from './zinnia_admin/AdminApp';

/**
 * Root Application Router
 * Completely decoupled:
 * - /admin/* -> Dedicated isolated Zinnia Admin Application
 * - /*       -> Dedicated isolated Zinnia Website Application
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Isolated Zinnia Admin Application */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Isolated Zinnia Website Application */}
        <Route path="/*" element={<WebsiteApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
