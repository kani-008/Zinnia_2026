import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminRoutes } from './routes/AdminRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <AdminRoutes />
      </AdminLayout>
    </BrowserRouter>
  );
}

export default App;
