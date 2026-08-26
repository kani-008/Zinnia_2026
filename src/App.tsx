import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WebsiteApp } from './zinnia_website/WebsiteApp';

/**
 * Zinnia 2026 &mdash; Public Participant Web Application
 * Admin portal has been separated to standalone repository `zinnia-admin`.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<WebsiteApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

