import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from '../pages/Home';
import { StoryPage } from '../pages/Story';
import { TimelinePage } from '../pages/Timeline';
import { EventsPage } from '../pages/Events';
import { SchedulePage } from '../pages/Schedule';
import { RegisterPage } from '../pages/Register';
import { SponsorsPage } from '../pages/Sponsors';
import { FAQPage } from '../pages/FAQ';
import { ContactPage } from '../pages/Contact';
import { Login } from '../pages/participant/Login';
import { Dashboard } from '../pages/participant/Dashboard';
import { Passport } from '../pages/participant/Passport';
import { MyEvents } from '../pages/participant/MyEvents';
import { Certificate } from '../pages/participant/Certificate';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/schedule" element={<SchedulePage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/sponsors" element={<SponsorsPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} />
      
      {/* Participant Sub-routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/passport" element={<Passport />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/certificate" element={<Certificate />} />
    </Routes>
  );
};
