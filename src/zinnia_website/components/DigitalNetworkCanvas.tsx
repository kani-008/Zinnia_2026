import React, { useEffect, useRef } from 'react';

interface NetworkNode {
  id: number;
  label: string;
  tier: number; // 0: Core, 1: Major Node, 2: Terminal Edge
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  pulseIntensity: number;
  parent: number | null;
  children: number[];
  crossLinks: number[];
}

interface DataParticle {
  fromId: number;
  toId: number;
  progress: number;
  speed: number;
  size: number;
}

interface TransmissionBurst {
  fromId: number;
  toId: number;
  startTime: number;
  duration: number;
}

interface Props {
  isEnteringNetwork: boolean;
  onEnterComplete?: () => void;
}

export const DigitalNetworkCanvas: React.FC<Props> = ({ isEnteringNetwork, onEnterComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  const parallaxOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let nodes: NetworkNode[] = [];
    let particles: DataParticle[] = [];
    let transmissionBurst: TransmissionBurst | null = null;

    const initNetwork = () => {
      nodes = [];
      particles = [];
      transmissionBurst = null;

      const isMobile = width < 768;

      // Central Computational Core position
      const coreX = isMobile ? width * 0.5 : width * 0.70;
      const coreY = isMobile ? height * 0.62 : height * 0.48;

      // 0. The Central Core: CORE // 2045
      const coreNode: NetworkNode = {
        id: 0,
        label: 'CORE // 2045',
        tier: 0,
        x: coreX,
        y: coreY,
        baseX: coreX,
        baseY: coreY,
        radius: isMobile ? 8 : 10,
        pulsePhase: 0,
        pulseSpeed: 1.6,
        pulseIntensity: 1.0,
        parent: null,
        children: [],
        crossLinks: [],
      };
      nodes.push(coreNode);

      // Major Nodes connected to Core: VISION, REASONING, MEMORY, PREDICTION, LEARNING, NETWORK
      const majorSpecs = isMobile
        ? [
            { angle: -Math.PI * 0.75, dist: 95, label: 'VISION', subAngle: -Math.PI * 0.85, subDist: 65, subLabel: 'EDGE 01' },
            { angle: -Math.PI * 0.20, dist: 100, label: 'REASONING', subAngle: -Math.PI * 0.10, subDist: 70, subLabel: 'EDGE 02' },
            { angle: Math.PI * 0.35, dist: 105, label: 'PREDICTION', subAngle: Math.PI * 0.45, subDist: 65, subLabel: 'EDGE 03' },
            { angle: Math.PI * 0.85, dist: 95, label: 'LEARNING', subAngle: Math.PI * 0.95, subDist: 60, subLabel: 'EDGE 04' },
          ]
        : [
            // 1. VISION (Reaching Westward toward hero safely)
            { angle: -Math.PI * 0.94, dist: 210, label: 'VISION', subAngle: -Math.PI * 0.98, subDist: 140, subLabel: 'STREAM // 01' },
            // 2. REASONING (North-West)
            { angle: -Math.PI * 0.66, dist: 190, label: 'REASONING', subAngle: -Math.PI * 0.72, subDist: 120, subLabel: 'LOGIC // CORE' },
            // 3. MEMORY (North)
            { angle: -Math.PI * 0.35, dist: 200, label: 'MEMORY', subAngle: -Math.PI * 0.28, subDist: 110, subLabel: 'STORAGE // 03' },
            // 4. PREDICTION (North-East)
            { angle: -Math.PI * 0.06, dist: 220, label: 'PREDICTION', subAngle: 0.05, subDist: 125, subLabel: 'TENSOR // 04' },
            // 5. LEARNING (South-East)
            { angle: Math.PI * 0.25, dist: 220, label: 'LEARNING', subAngle: Math.PI * 0.32, subDist: 115, subLabel: 'WEIGHTS // 05' },
            // 6. NETWORK (South)
            { angle: Math.PI * 0.55, dist: 185, label: 'NETWORK', subAngle: Math.PI * 0.62, subDist: 110, subLabel: 'FABRIC // 06' },
            // 7. INFERENCE (South-West)
            { angle: Math.PI * 0.80, dist: 195, label: 'INFERENCE', subAngle: Math.PI * 0.86, subDist: 120, subLabel: 'GATEWAY // 07' },
          ];

      const majorIds: number[] = [];

      majorSpecs.forEach((spec, idx) => {
        const nx = coreX + Math.cos(spec.angle) * spec.dist;
        const ny = coreY + Math.sin(spec.angle) * spec.dist;
        const majorId = nodes.length;

        // Major Node (Tier 1)
        const majorNode: NetworkNode = {
          id: majorId,
          label: spec.label,
          tier: 1,
          x: nx,
          y: ny,
          baseX: nx,
          baseY: ny,
          radius: isMobile ? 3.5 : 4.5,
          pulsePhase: idx * 1.1 + 0.5,
          pulseSpeed: 1.0 + (idx % 3) * 0.35,
          pulseIntensity: 0.85,
          parent: 0,
          children: [],
          crossLinks: [],
        };
        nodes.push(majorNode);
        coreNode.children.push(majorId);
        majorIds.push(majorId);

        // Terminal Edge Node (Tier 2)
        if (spec.subDist && spec.subDist > 0) {
          const ex = nx + Math.cos(spec.subAngle) * spec.subDist;
          const ey = ny + Math.sin(spec.subAngle) * spec.subDist;
          const edgeId = nodes.length;

          const edgeNode: NetworkNode = {
            id: edgeId,
            label: spec.subLabel,
            tier: 2,
            x: ex,
            y: ey,
            baseX: ex,
            baseY: ey,
            radius: 2.0,
            pulsePhase: idx * 0.8 + 2.0,
            pulseSpeed: 0.75 + (idx % 4) * 0.2,
            pulseIntensity: 0.5,
            parent: majorId,
            children: [],
            crossLinks: [],
          };
          nodes.push(edgeNode);
          majorNode.children.push(edgeId);
        }
      });

      // Polygon links between adjacent Major Nodes
      for (let i = 0; i < majorIds.length; i++) {
        const nextIdx = (i + 1) % majorIds.length;
        nodes[majorIds[i]].crossLinks.push(majorIds[nextIdx]);
      }
    };

    initNetwork();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNetwork();
    };
    window.addEventListener('resize', handleResize);

    let time = 0;
    let lastParticleSpawn = 0;
    let lastTransmissionTime = 0;

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Micro-Parallax: Maximum +/- 10px smooth damping
      const targetParallaxX = mouseRef.current.active ? (mouseRef.current.x - width / 2) * 0.015 : 0;
      const targetParallaxY = mouseRef.current.active ? (mouseRef.current.y - height / 2) * 0.015 : 0;
      // Clamp strictly to +/- 10px
      const clampedTargetX = Math.max(-10, Math.min(10, targetParallaxX));
      const clampedTargetY = Math.max(-10, Math.min(10, targetParallaxY));

      parallaxOffset.current.x += (clampedTargetX - parallaxOffset.current.x) * 0.04;
      parallaxOffset.current.y += (clampedTargetY - parallaxOffset.current.y) * 0.04;

      const pX = parallaxOffset.current.x;
      const pY = parallaxOffset.current.y;

      const coreNode = nodes[0];
      const coreX = (coreNode ? coreNode.x : width * 0.70) + pX;
      const coreY = (coreNode ? coreNode.y : height * 0.48) + pY;

      // 1. Deep Graphite / Near-Black Canvas
      const bgGrad = ctx.createRadialGradient(
        coreX,
        coreY,
        25,
        coreX,
        coreY,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, '#070d0a');
      bgGrad.addColorStop(0.35, '#040605');
      bgGrad.addColorStop(0.8, '#020302');
      bgGrad.addColorStop(1, '#000000');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Microscopic Coordinate Grid Texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.010)';
      ctx.lineWidth = 1;
      const gridSize = 72;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Periodic Data Transmission Burst (Every ~3.8 seconds)
      if (time - lastTransmissionTime > 3.8) {
        if (coreNode && coreNode.children.length > 0) {
          const randomChildId = coreNode.children[Math.floor(Math.random() * coreNode.children.length)];
          transmissionBurst = {
            fromId: 0,
            toId: randomChildId,
            startTime: time,
            duration: 0.85,
          };
          lastTransmissionTime = time;
        }
      }

      // 4. Update Node Positions with Soft Breathing
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulsePhase += 0.018 * n.pulseSpeed;
      }

      // 5. Spawn Continuous Electric-Green Data Particles from Core Outward
      if (time - lastParticleSpawn > 0.18) {
        if (coreNode && coreNode.children.length > 0) {
          const randomChildId = coreNode.children[Math.floor(Math.random() * coreNode.children.length)];
          particles.push({
            fromId: 0,
            toId: randomChildId,
            progress: 0,
            speed: 0.007 + Math.random() * 0.004,
            size: 1.6 + Math.random() * 0.7,
          });
        }
        lastParticleSpawn = time;
      }

      // 6. Draw Connection Lines
      ctx.save();
      for (let i = 0; i < nodes.length; i++) {
        const parentNode = nodes[i];
        const px1 = parentNode.baseX + pX;
        const py1 = parentNode.baseY + pY;

        for (const childId of parentNode.children) {
          const childNode = nodes[childId];
          if (!childNode) continue;
          const px2 = childNode.baseX + pX;
          const py2 = childNode.baseY + pY;

          // Check if this connection is in a transmission burst
          let burstGlow = 0;
          if (
            transmissionBurst &&
            transmissionBurst.fromId === parentNode.id &&
            transmissionBurst.toId === childId
          ) {
            const elapsed = time - transmissionBurst.startTime;
            if (elapsed <= transmissionBurst.duration) {
              burstGlow = Math.sin((elapsed / transmissionBurst.duration) * Math.PI);
            } else {
              transmissionBurst = null;
            }
          }

          const isCoreArtery = parentNode.tier === 0;
          const baseAlpha = isCoreArtery ? 0.32 : 0.12;
          const finalAlpha = Math.min(1, baseAlpha + burstGlow * 0.65);

          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);

          if (burstGlow > 0.05) {
            // Bright illuminated electric green line
            ctx.strokeStyle = `rgba(0, 255, 102, ${finalAlpha})`;
            ctx.lineWidth = 1.6;
          } else {
            ctx.strokeStyle = isCoreArtery
              ? `rgba(255, 255, 255, ${finalAlpha})`
              : `rgba(255, 255, 255, ${finalAlpha * 0.75})`;
            ctx.lineWidth = isCoreArtery ? 1.1 : 0.65;
          }
          ctx.stroke();
        }

        // Faint polygon cross-links between major nodes
        for (const crossId of parentNode.crossLinks) {
          const crossNode = nodes[crossId];
          if (!crossNode) continue;
          const px2 = crossNode.baseX + pX;
          const py2 = crossNode.baseY + pY;

          ctx.beginPath();
          ctx.moveTo(px1, py1);
          ctx.lineTo(px2, py2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 7. Draw & Advance Continuous Outward Data Particles
      for (let p = particles.length - 1; p >= 0; p--) {
        const pt = particles[p];
        pt.progress += pt.speed;

        const nodeFrom = nodes[pt.fromId];
        const nodeTo = nodes[pt.toId];

        if (nodeFrom && nodeTo) {
          const px = nodeFrom.baseX + (nodeTo.baseX - nodeFrom.baseX) * pt.progress + pX;
          const py = nodeFrom.baseY + (nodeTo.baseY - nodeFrom.baseY) * pt.progress + pY;

          // Electric Green Data Particle
          ctx.beginPath();
          ctx.arc(px, py, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = '#00FF66';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#00FF66';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Hot White Micro Spark
          ctx.beginPath();
          ctx.arc(px, py, pt.size * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        }

        // Cascade outward to next tier when pulse reaches node
        if (pt.progress >= 1) {
          const reachedNode = nodes[pt.toId];
          if (reachedNode && reachedNode.children.length > 0 && Math.random() > 0.3) {
            const nextChildId = reachedNode.children[Math.floor(Math.random() * reachedNode.children.length)];
            particles.push({
              fromId: pt.toId,
              toId: nextChildId,
              progress: 0,
              speed: pt.speed * 1.05,
              size: Math.max(1.1, pt.size * 0.85),
            });
          }
          particles.splice(p, 1);
        }
      }

      // 8. Draw Nodes with Asynchronous Independent Breathing
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const nodePosX = n.baseX + pX;
        const nodePosY = n.baseY + pY;

        // Individual independent breathing rhythm
        const nodeBreathe = Math.sin(n.pulsePhase) * 0.5 + 0.5;

        // =========================================================================
        // A. CENTRAL COMPUTATIONAL CORE (CORE // 2045)
        // =========================================================================
        if (n.tier === 0) {
          const coreRadius = n.radius + nodeBreathe * 1.2;

          // Multi-layer Ambient Electric Green Aura
          const haloGrad = ctx.createRadialGradient(nodePosX, nodePosY, 0, nodePosX, nodePosY, 56);
          haloGrad.addColorStop(0, `rgba(0, 255, 102, ${0.35 + nodeBreathe * 0.15})`);
          haloGrad.addColorStop(0.35, `rgba(0, 255, 102, ${0.12 + nodeBreathe * 0.08})`);
          haloGrad.addColorStop(1, 'rgba(0, 255, 102, 0)');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, 56, 0, Math.PI * 2);
          ctx.fill();

          // Concentric Inner Radar Ring (Rotating slowly)
          const radarRadius = 30 + nodeBreathe * 3;
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, radarRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 255, 102, ${0.36 + nodeBreathe * 0.15})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Concentric Outer Dashed Geometric Ring (Rotating at different speed)
          ctx.save();
          ctx.translate(nodePosX, nodePosY);
          ctx.rotate(time * 0.15);
          ctx.beginPath();
          ctx.arc(0, 0, 42, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 255, 102, 0.20)';
          ctx.setLineDash([4, 8]);
          ctx.lineWidth = 1;
          ctx.stroke();

          // Small orbiting elements around core
          const orbX = Math.cos(time * 0.6) * 42;
          const orbY = Math.sin(time * 0.6) * 42;
          ctx.beginPath();
          ctx.arc(orbX, orbY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#00FF66';
          ctx.fill();
          ctx.restore();

          // Precision Crosshair Reticles
          ctx.strokeStyle = 'rgba(0, 255, 102, 0.65)';
          ctx.lineWidth = 1;
          const bDist = radarRadius + 4;
          ctx.beginPath();
          ctx.moveTo(nodePosX - bDist - 6, nodePosY);
          ctx.lineTo(nodePosX - bDist + 2, nodePosY);
          ctx.moveTo(nodePosX + bDist - 2, nodePosY);
          ctx.lineTo(nodePosX + bDist + 6, nodePosY);
          ctx.moveTo(nodePosX, nodePosY - bDist - 6);
          ctx.lineTo(nodePosX, nodePosY - bDist + 2);
          ctx.moveTo(nodePosX, nodePosY + bDist - 2);
          ctx.lineTo(nodePosX, nodePosY + bDist + 6);
          ctx.stroke();

          // Solid High-Intensity Electric Green Core
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, coreRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#00FF66';
          ctx.shadowBlur = 26;
          ctx.shadowColor = '#00FF66';
          ctx.fill();
          ctx.shadowBlur = 0;

          // Pure White Hot Center Spark
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, coreRadius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          // Core Identifier Label
          if (width > 768) {
            ctx.fillStyle = '#00FF66';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('CORE // 2045', nodePosX + radarRadius + 8, nodePosY + 3);
          }
        }
        // =========================================================================
        // B. MAJOR NODES: VISION, REASONING, MEMORY, PREDICTION, LEARNING, NETWORK
        // =========================================================================
        else if (n.tier === 1) {
          const currentR = n.radius + nodeBreathe * 0.6;
          const outerR = currentR + 4;

          // Thin outer ring
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, outerR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + nodeBreathe * 0.08})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Subtle green aura
          const nodeHalo = ctx.createRadialGradient(nodePosX, nodePosY, 0, nodePosX, nodePosY, outerR + 6);
          nodeHalo.addColorStop(0, `rgba(0, 255, 102, ${0.20 * nodeBreathe})`);
          nodeHalo.addColorStop(1, 'rgba(0, 255, 102, 0)');
          ctx.fillStyle = nodeHalo;
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, outerR + 6, 0, Math.PI * 2);
          ctx.fill();

          // Circular Core
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, currentR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fill();

          // Understated Technical Label
          if (n.label && width > 1024) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.font = '8px monospace';
            ctx.fillText(n.label, nodePosX + outerR + 5, nodePosY + 3);
          }
        }
        // =========================================================================
        // C. TERMINAL ENDPOINTS
        // =========================================================================
        else {
          const alpha = 0.20 + nodeBreathe * 0.08;
          ctx.beginPath();
          ctx.arc(nodePosX, nodePosY, n.radius + nodeBreathe * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isEnteringNetwork, onEnterComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default DigitalNetworkCanvas;
