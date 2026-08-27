import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../../services/sound';
import { GitBranch, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface TimelineMeta {
  id: string;
  probability: string;
  stability: string;
  deviation: string;
  threatLevel: string;
}

export const TimelinesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTimeline, setActiveTimeline] = useState<TimelineMeta>({
    id: '#A8F41C',
    probability: '72.81%',
    stability: 'UNSTABLE',
    deviation: '+00:00:13',
    threatLevel: 'OMEGA-3'
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = 360);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 360;
    };

    window.addEventListener('resize', handleResize);

    // Timeline branch nodes
    const branches = Array.from({ length: 42 }, (_, i) => ({
      x: 40 + Math.random() * (width - 80),
      y: 40 + Math.random() * (height - 80),
      targetY: 40 + Math.random() * (height - 80),
      speed: 0.2 + Math.random() * 0.4,
      radius: 1.5 + Math.random() * 2.5,
      code: `TL-${(1000 + i * 37).toString(16).toUpperCase()}`,
      probability: (45 + Math.random() * 50).toFixed(2) + '%',
      stability: i % 4 === 0 ? 'CRITICAL' : i % 3 === 0 ? 'UNSTABLE' : 'EQUILIBRIUM',
      deviation: `+00:0${Math.floor(Math.random() * 9)}:${Math.floor(10 + Math.random() * 50)}`
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovering = true;

      // Find closest node
      let closest = branches[0];
      let minDistance = 9999;
      branches.forEach(b => {
        const d = Math.hypot(b.x - mouseX, b.y - mouseY);
        if (d < minDistance) {
          minDistance = d;
          closest = b;
        }
      });

      if (minDistance < 60) {
        setActiveTimeline({
          id: closest.code,
          probability: closest.probability,
          stability: closest.stability,
          deviation: closest.deviation,
          threatLevel: closest.stability === 'CRITICAL' ? 'OMEGA-4' : 'GAMMA-2'
        });
      }
    };

    const handleMouseLeave = () => {
      isHovering = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let tick = 0;

    const render = () => {
      tick += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Draw faint quantum baseline
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw interconnected branches
      for (let i = 0; i < branches.length; i++) {
        const b = branches[i];
        b.y += Math.sin(tick + i) * b.speed * 0.3;

        // Origin connection to center timeline
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.12)' : 'rgba(139, 92, 246, 0.12)';
        ctx.beginPath();
        ctx.moveTo(40, height / 2);
        ctx.bezierCurveTo(
          width * 0.25, height / 2 + Math.sin(tick + i) * 20,
          b.x - 40, b.y,
          b.x, b.y
        );
        ctx.stroke();

        // Node glow
        const isNear = isHovering && Math.hypot(b.x - mouseX, b.y - mouseY) < 45;

        ctx.fillStyle = isNear ? '#00f0ff' : i % 3 === 0 ? '#8b5cf6' : '#64748b';
        ctx.beginPath();
        ctx.arc(b.x, b.y, isNear ? b.radius * 2.2 : b.radius, 0, Math.PI * 2);
        ctx.fill();

        if (isNear) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.stroke();
        }
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
    <div className="glass-panel p-6 tech-bracket border-slate-800 space-y-4">
      {/* Header telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-heading font-bold text-sm tracking-wider">
            7,842,193 DETECTED TIMELINES // QUANTUM SIMULATION
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SAMPLING ACTIVE
          </span>
          <span className="text-slate-600">|</span>
          <span>RESOLUTION: 10⁻⁴³ s</span>
        </div>
      </div>

      {/* Canvas Area with Interactive Overlay */}
      <div className="relative rounded bg-slate-950/80 border border-slate-900 overflow-hidden">
        <canvas ref={canvasRef} className="w-full block cursor-crosshair" />

        {/* Live Hovered Timeline HUD Overlay */}
        <div className="absolute top-3 right-3 glass-panel p-3.5 border-cyan-500/30 text-xs font-mono space-y-1.5 backdrop-blur-md max-w-[220px]">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>BRANCH METRICS</span>
            <span className="text-cyan-400 font-bold">{activeTimeline.id}</span>
          </div>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">PROBABILITY:</span>
              <span className="text-white font-bold">{activeTimeline.probability}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">STABILITY:</span>
              <span className={activeTimeline.stability === 'CRITICAL' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                {activeTimeline.stability}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DEVIATION:</span>
              <span className="text-cyan-300">{activeTimeline.deviation}</span>
            </div>
          </div>
        </div>

        {/* Bottom instructions */}
        <div className="absolute bottom-2 left-3 font-mono text-[10px] text-slate-600">
          [ TRACK CURSOR OVER QUANTUM NODES TO INTERCEPT PROBABILITY STREAM ]
        </div>
      </div>
    </div>
  );
};
