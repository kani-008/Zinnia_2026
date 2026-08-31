import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { WebsiteNavbar } from '../components/layout/Navbar';
import { WebsiteFooter } from '../components/layout/Footer';
import { EventScheduleView } from '../components/ui/EventScheduleView';

export const WebsiteSchedulePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0F] text-[#F2F2F0] select-none flex flex-col justify-between">
      {/* Top Navbar */}
      <WebsiteNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Back Link to Timeline */}
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A1A1D] border border-[#3A3A3E] text-xs font-mono text-[#A8A8AC] hover:text-white hover:border-[#F5D90A] transition-all shadow-[2px_2px_0px_#000000] rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 text-[#F5D90A]" />
            <span>RETURN TO TIMELINE</span>
          </Link>
        </div>

        {/* Event Schedule Component */}
        <EventScheduleView />
      </div>

      {/* Footer */}
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteSchedulePage;
