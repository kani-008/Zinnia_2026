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

    // High-voltage cyber particles
    const particleCount = 55;
    const particles: { x: number; y: number; radius: number; angle: number; speed: number; dist: number; color: string }[] = [];

    const colors = ['#00f0ff', '#f000ff', '#ffe600', '#00ff66'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2,
        y: height / 2,
        radius: Math.random() * 2.2 + 1,
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        dist: Math.random() * (Math.min(width, height) * 0.44) + 25,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let coreRotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Draw outer glowing cyber rings
      ctx.save();
      ctx.translate(centerX, centerY);

      // Ring 1 - Outer Pulsing Dashed (Neon Cyan)
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.4, 0, Math.PI * 2);
      ctx.setLineDash([10, 14]);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.rotate(coreRotation * 0.6);
      ctx.stroke();

      // Ring 2 - Middle Reverse Dashed (Electric Magenta)
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.3, 0, Math.PI * 2);
      ctx.setLineDash([16, 10]);
      ctx.strokeStyle = 'rgba(240, 0, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.rotate(-coreRotation * 1.4);
      ctx.stroke();

      // Ring 3 - Inner Core Boundary (Cyber Gold)
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.18, 0, Math.PI * 2);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ffe600';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // Central glowing cyber core gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, Math.min(width, height) * 0.16);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, 'rgba(0, 240, 255, 0.9)');
      gradient.addColorStop(0.7, 'rgba(240, 0, 255, 0.4)');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(width, height) * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Animate and draw cyber particles & matrix neural connections
      particles.forEach((p) => {
        p.angle += p.speed;
        const px = centerX + Math.cos(p.angle) * p.dist;
        const py = centerY + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();

        // Connect nearby particles with glowing cyber traces
        particles.forEach((p2) => {
          const p2x = centerX + Math.cos(p2.angle) * p2.dist;
          const p2y = centerY + Math.sin(p2.angle) * p2.dist;
          const dx = px - p2x;
          const dy = py - p2y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 48) {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 * (1 - dist / 48)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      coreRotation += 0.01;
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
      <div className="absolute font-mono text-[10px] text-cyan-300 font-bold tracking-widest pointer-events-none bg-black/80 px-2.5 py-1 rounded border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.4)]">
        REACTOR // 100% OPERATIONAL
      </div>
    </div>
  );
};
