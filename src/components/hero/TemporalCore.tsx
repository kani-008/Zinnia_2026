import React, { useEffect, useRef } from 'react';

export const TemporalCoreCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 420);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.min(canvas.parentElement.clientWidth * 0.85, 420);
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes representing fractured timeline fragments
    const particleCount = 45;
    const particles: { x: number; y: number; radius: number; angle: number; speed: number; dist: number; color: string }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        dist: Math.random() * (Math.min(width, height) * 0.42) + 30,
        color: Math.random() > 0.3 ? '#00f0ff' : '#8b5cf6'
      });
    }

    let coreRotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw outer glowing rings
      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring 1 - Outer Pulsing Dashed
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.38, 0, Math.PI * 2);
      ctx.setLineDash([8, 12]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.rotate(coreRotation * 0.5);
      ctx.stroke();

      // Ring 2 - Middle Reverse Dashed
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.28, 0, Math.PI * 2);
      ctx.setLineDash([14, 8]);
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 2;
      ctx.rotate(-coreRotation * 1.2);
      ctx.stroke();

      // Ring 3 - Inner Core Boundary
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.16, 0, Math.PI * 2);
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // Central glowing core gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, Math.min(width, height) * 0.14);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      gradient.addColorStop(0.3, 'rgba(0, 240, 255, 0.8)');
      gradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.3)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(width, height) * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Animate and draw temporal particles
      particles.forEach((p) => {
        p.angle += p.speed;
        const px = centerX + Math.cos(p.angle) * p.dist;
        const py = centerY + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Connect nearby particles to form timeline neural mesh
        particles.forEach((p2) => {
          const p2x = centerX + Math.cos(p2.angle) * p2.dist;
          const p2y = centerY + Math.sin(p2.angle) * p2.dist;
          const dx = px - p2x;
          const dy = py - p2y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 45) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.18 * (1 - dist / 45)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      });

      coreRotation += 0.008;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center w-full max-w-[500px] mx-auto">
      <canvas ref={canvasRef} className="w-full h-auto block" />
      <div className="absolute font-mono text-[10px] text-cyan-400 opacity-70 tracking-widest pointer-events-none bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">
        CORE: OVERLOAD // 10:00:13 AM
      </div>
    </div>
  );
};
