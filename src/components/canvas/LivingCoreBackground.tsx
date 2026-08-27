import React, { useEffect, useRef } from 'react';

/**
 * LivingCoreBackground:
 * One single, unified, premium organic living Core.
 * Sits gracefully in the background with fluid ripples and mouse responsiveness.
 * Strictly disciplined color palette: Electric Cyan (#06b6d4 / #38bdf8) on deep obsidian black.
 */
export const LivingCoreBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse tracking with smooth spring damping
    let mouse = { x: width / 2, y: height * 0.38, targetX: width / 2, targetY: height * 0.38 };

    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('pointermove', handlePointerMove);

    // Ambient floating particles (Cyan only)
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 1.0 + Math.random() * 1.8,
      alpha: 0.15 + Math.random() * 0.35,
    }));

    let time = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Smooth pointer lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const coreCenterX = width / 2;
      const coreCenterY = height * 0.42;
      const baseRadius = Math.min(width * 0.22, 160);

      // Subtle mouse attraction on core center
      const dx = mouse.x - coreCenterX;
      const dy = mouse.y - coreCenterY;
      const dist = Math.hypot(dx, dy);
      const pull = Math.max(0, 1 - dist / 500) * 22;
      const cx = coreCenterX + (dist > 0 ? (dx / dist) * pull : 0);
      const cy = coreCenterY + (dist > 0 ? (dy / dist) * pull : 0);

      // 1. Outer Volumetric Cyan Glow (Generous, soft, non-intrusive)
      const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.3, cx, cy, baseRadius * 2.8);
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
      glowGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.05)');
      glowGrad.addColorStop(1, 'rgba(2, 4, 8, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. Ambient Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Living Core Organic Breathing Mesh
      ctx.save();
      ctx.beginPath();
      const segments = 60;
      const r = baseRadius * (1 + Math.sin(time * 1.5) * 0.035);

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const wave1 = Math.sin(angle * 3 + time * 1.8) * 6;
        const wave2 = Math.cos(angle * 5 - time * 2.2) * 4;

        // Subtle mouse indentation
        const angleToMouse = Math.atan2(mouse.y - cy, mouse.x - cx);
        const cosDiff = Math.cos(angle - angleToMouse);
        const mouseDeform = cosDiff > 0.4 && dist < 240 ? cosDiff * 10 : 0;

        const currentR = r + wave1 + wave2 + mouseDeform;
        const px = cx + Math.cos(angle) * currentR;
        const py = cy + Math.sin(angle) * currentR;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Internal Core Gradient
      const coreGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.2,
        cy - baseRadius * 0.2,
        baseRadius * 0.1,
        cx,
        cy,
        baseRadius * 1.1
      );
      coreGrad.addColorStop(0, '#38bdf8');
      coreGrad.addColorStop(0.4, '#0e7490');
      coreGrad.addColorStop(0.85, '#042f2e');
      coreGrad.addColorStop(1, '#020408');

      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Subtle cyan edge rim
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020408]">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
