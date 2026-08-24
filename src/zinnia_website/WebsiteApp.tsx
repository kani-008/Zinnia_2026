import React from 'react';
import { WebsiteHomePage } from './pages/Home';
import { LiquidGlassHover } from './components/LiquidGlassHover';

export const WebsiteApp: React.FC = () => {
  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-[#0D0D0F] scroll-smooth">
      {/* Liquid Glass Fluid Hover Effect Background */}
      <LiquidGlassHover />

      {/* 2D Neubrutalist Comic Interface with Scrollable Story Sections (Dark Mode CHRONOS Theme) */}
      <WebsiteHomePage />
    </div>
  );
};

export default WebsiteApp;

