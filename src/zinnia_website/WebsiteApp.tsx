import React from 'react';
import { WebsiteHomePage } from './pages/Home';

export const WebsiteApp: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0D0D0F]">
      {/* Exact 100vw x 100vh 2D Neubrutalist Comic Interface (Dark Mode CHRONOS Theme) */}
      <WebsiteHomePage />
    </div>
  );
};

export default WebsiteApp;
