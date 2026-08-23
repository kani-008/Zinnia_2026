import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  baseAlpha: number;
  hue: number;
}

export const HeroEnergyCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight || 500;
    };

    window.addEventListener('resize', handleResize);

    // Create energetic cybernetic particles
    const particleCount = Math.min(65, Math.floor(width / 20));
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: 1.2 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.5,
      baseAlpha: 0.2 + Math.random() * 0.4,
      hue: Math.random() > 0.4 ? 188 : 265 // Cyan & Violet
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let tick = 0;

    const render = () => {
      tick += 0.012;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle energy grid waves
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      const waveCount = 4;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        for (let x = 0; x < width; x += 15) {
          const y =
            height * (0.35 + w * 0.15) +
            Math.sin(x * 0.006 + tick + w) * 25 +
            Math.cos(x * 0.003 - tick * 0.5) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Mouse gravity / repulsion
        if (isHovering) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140) {
            const force = (140 - dist) / 140;
            p.x -= (dx / dist) * force * 2;
            p.y -= (dy / dist) * force * 2;
            p.alpha = Math.min(1, p.baseAlpha + force * 0.5);
          } else {
            p.alpha = p.baseAlpha;
          }
        }

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            const linkAlpha = (1 - dist / 110) * 0.18;
            ctx.strokeStyle = `rgba(6, 182, 212, ${linkAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw particle glow
        ctx.fillStyle =
          p.hue === 188
            ? `rgba(6, 182, 212, ${p.alpha})`
            : `rgba(168, 85, 247, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-auto overflow-hidden opacity-60">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
};

export default HeroEnergyCanvas;
