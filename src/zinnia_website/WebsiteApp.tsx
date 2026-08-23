import React from 'react';
import { WebsiteHomePage } from './pages/Home';

export const WebsiteApp: React.FC = () => {
  return (
    <div className="w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">
      {/* 2D Neubrutalist Comic Interface with Scrollable Story Sections (Dark Mode CHRONOS Theme) */}
      <WebsiteHomePage />
    </div>
  );
};

export default WebsiteApp;
