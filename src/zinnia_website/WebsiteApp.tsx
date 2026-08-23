import React from 'react';
import { WebsiteHomePage } from './pages/Home';

export const WebsiteApp: React.FC = () => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-[#FFFDF0]">
      {/* Exact 100vw x 100vh 2D Comic-Book Interface (White Theme) */}
      <WebsiteHomePage />
    </div>
  );
};

export default WebsiteApp;
