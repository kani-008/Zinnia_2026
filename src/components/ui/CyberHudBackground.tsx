import React, { useEffect, useState } from 'react';

export const CyberHudBackground: React.FC = () => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized position between -1 and 1
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;

      // Smooth translation offsets
      const targetX = normalizedX * 28; // Shift up to 28px horizontally
      const targetY = normalizedY * 20; // Shift up to 20px vertically

      animationFrameId = requestAnimationFrame(() => {
        setMouseOffset({ x: targetX, y: targetY });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#020712]">
      {/* Moving Cyber HUD Background Image Layer with Parallax & Continuous Float */}
      <div
        className="absolute -inset-[5%] w-[110%] h-[110%] bg-cover bg-center bg-no-repeat opacity-80 mix-blend-screen animate-hud-bg-float transition-transform duration-700 ease-out will-change-transform"
        style={{
          backgroundImage: "url('/tech_hud_bg.png')",
          transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0) scale(1.08)`,
        }}
      />

      {/* Secondary Counter-Movement Layer for Floating Parallax Depth */}
      <div
        className="absolute -inset-[5%] w-[110%] h-[110%] bg-cover bg-center bg-no-repeat opacity-25 mix-blend-color-dodge transition-transform duration-1000 ease-out pointer-events-none"
        style={{
          backgroundImage: "url('/tech_hud_bg.png')",
          transform: `translate3d(${-mouseOffset.x * 0.5}px, ${-mouseOffset.y * 0.5}px, 0) scale(1.12) rotate(180deg)`,
        }}
      />

      {/* Cyber Vertical HUD Scanline Beam Moving Top to Bottom */}
      <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_15px_#00e5ff] animate-hud-scanline pointer-events-none z-0" />

      {/* Subtle Glowing Cyan/Blue Particles Floating on Circuit Junctions */}
      <div className="absolute top-[18%] left-[22%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#00e5ff] animate-node-pulse" />
      <div className="absolute top-[35%] right-[15%] w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_15px_#3b82f6] animate-node-pulse [animation-delay:1.2s]" />
      <div className="absolute bottom-[25%] left-[12%] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-node-pulse [animation-delay:0.7s]" />
      <div className="absolute top-[65%] right-[30%] w-3 h-3 rounded-full bg-cyan-400/90 shadow-[0_0_18px_#00e5ff] animate-node-pulse [animation-delay:1.8s]" />

      {/* Ambient Gradient Overlay to retain perfect text readability */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_#020712_90%)] opacity-85 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020712]/40 via-transparent to-[#020712]/80 pointer-events-none" />
    </div>
  );
};
