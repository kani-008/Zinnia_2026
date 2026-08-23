import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioManager } from './AudioManager';

interface TimelineCinematicProps {
  onComplete: () => void;
}

interface TimelineBranch {
  curve: THREE.CatmullRomCurve3;
  points: THREE.Vector3[];
  progress: number;
  speed: number;
  depth: number;
  color: THREE.Color;
  is2045Target: boolean;
  spawnedChildren: boolean;
  spawnT: number;
  mesh?: THREE.Line;
  glowMesh?: THREE.Line;
  destabilized?: boolean;
}

export const TimelineCinematic: React.FC<TimelineCinematicProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Timeline Group
    const timelineGroup = new THREE.Group();
    scene.add(timelineGroup);

    // Particle Burst System (For Collapse Stage)
    let particleSystem: THREE.Points | null = null;
    let particlePositions: Float32Array | null = null;
    let particleVelocities: Float32Array | null = null;
    let particleColors: Float32Array | null = null;
    let particleCount = 0;
    let isCollapsing = false;
    let collapseProgress = 0;

    // Base Line Materials (Ultra-thin neon green with subtle additive glow)
    const baseGreen = new THREE.Color('#00ff88');
    const targetCyan = new THREE.Color('#38bdf8');
    const amberAlert = new THREE.Color('#f59e0b');

    // 2. Timeline Branch Generation Engine
    const branches: TimelineBranch[] = [];

    // Helper to create smooth 3D Catmull-Rom spline branches
    const createBranch = (
      startPt: THREE.Vector3,
      dir: THREE.Vector3,
      length: number,
      depth: number,
      isTarget: boolean = false
    ): TimelineBranch => {
      const pts: THREE.Vector3[] = [startPt.clone()];
      const segments = 24;
      const step = length / segments;

      let currentPt = startPt.clone();
      let currentDir = dir.clone().normalize();

      for (let i = 1; i <= segments; i++) {
        // Organic gentle curvature in 3D
        const curveFactor = (Math.random() - 0.5) * (0.35 + depth * 0.1);
        const zCurvature = (Math.random() - 0.5) * (0.4 + depth * 0.15);
        currentDir.y += curveFactor;
        currentDir.z += zCurvature;
        currentDir.normalize();

        currentPt = currentPt.clone().add(currentDir.clone().multiplyScalar(step));
        pts.push(currentPt);
      }

      const curve = new THREE.CatmullRomCurve3(pts);
      const color = isTarget ? targetCyan : baseGreen;

      return {
        curve,
        points: pts,
        progress: 0,
        speed: 0.22 + Math.random() * 0.12,
        depth,
        color,
        is2045Target: isTarget,
        spawnedChildren: false,
        spawnT: 0.35 + Math.random() * 0.45,
      };
    };

    // Root Timeline (Single, isolated, pristine horizontal line)
    const rootStart = new THREE.Vector3(-18, 0, 0);
    const rootDir = new THREE.Vector3(1, 0, 0);
    const rootBranch = createBranch(rootStart, rootDir, 16, 0, false);
    branches.push(rootBranch);

    // Line dynamic geometries holder
    const lineObjects: {
      geo: THREE.BufferGeometry;
      line: THREE.Line;
      glowLine: THREE.Line;
      branch: TimelineBranch;
    }[] = [];

    const addLineObject = (branch: TimelineBranch) => {
      const geo = new THREE.BufferGeometry();
      const posArray = new Float32Array(branch.points.length * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      geo.setDrawRange(0, 0);

      // Core Line
      const mat = new THREE.LineBasicMaterial({
        color: branch.color,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);

      // Soft Optical Glow Line
      const glowMat = new THREE.LineBasicMaterial({
        color: branch.color,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const glowLine = new THREE.Line(geo, glowMat);

      timelineGroup.add(line);
      timelineGroup.add(glowLine);
      branch.mesh = line;
      branch.glowMesh = glowLine;

      lineObjects.push({ geo, line, glowLine, branch });
    };

    addLineObject(rootBranch);

    // Resize Handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 3. Animation State & Timers
    const clock = new THREE.Clock();
    let animId: number;
    let stage: 'initial' | 'branching' | 'massive_network' | 'instability' | 'fracture' | 'collapse' = 'initial';
    let targetBranch: TimelineBranch | null = null;
    let fractureStartTime = 0;
    let hasCompleted = false;

    // 4. Main Render Loop
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // =========================================================
      // PROGRESSIVE STAGE EVOLUTION (Continuous Organic Flow)
      // =========================================================

      // STAGE 1: Single Line (0s - 2.0s)
      if (elapsed < 2.0) {
        stage = 'initial';
      }
      // STAGE 2: Multiple Timelines (2.0s - 4.5s)
      else if (elapsed >= 2.0 && elapsed < 4.5) {
        stage = 'branching';
      }
      // STAGE 3: Massive Temporal Network & Camera Fly-Through (4.5s - 7.5s)
      else if (elapsed >= 4.5 && elapsed < 7.5) {
        stage = 'massive_network';
      }
      // STAGE 4: 2045 Instability & Network Destabilization (7.5s - 9.0s)
      else if (elapsed >= 7.5 && elapsed < 9.0) {
        stage = 'instability';
      }
      // STAGE 5: Fracture & Rupture (9.0s - 10.5s)
      else if (elapsed >= 9.0 && elapsed < 10.5) {
        stage = 'fracture';
      }
      // STAGE 6: Magnetic Inward Collapse (10.5s+)
      else {
        stage = 'collapse';
      }

      // ---------------------------------------------------------
      // CAMERA MOTION (Smooth, Cinematic Forward Glide)
      // ---------------------------------------------------------
      if (stage !== 'collapse') {
        // Camera glides gently forward through 3D space
        const camZProgress = Math.min(1, elapsed / 9.0);
        camera.position.z = THREE.MathUtils.lerp(18, 9.5, camZProgress);
        camera.position.x = Math.sin(elapsed * 0.45) * 1.8;
        camera.position.y = Math.cos(elapsed * 0.35) * 0.9;
        camera.lookAt(camera.position.x * 0.4, 0, -4);
      }

      // ---------------------------------------------------------
      // BRANCH GROWTH & RECURSIVE MULTIPLICATION
      // ---------------------------------------------------------
      if (stage === 'initial' || stage === 'branching' || stage === 'massive_network' || stage === 'instability') {
        for (let i = 0; i < branches.length; i++) {
          const b = branches[i];
          if (b.progress < 1.0) {
            b.progress = Math.min(1.0, b.progress + delta * b.speed);
          }

          // Spawn child branches when reaching spawn threshold
          if (
            !b.spawnedChildren &&
            b.progress >= b.spawnT &&
            branches.length < 95 &&
            b.depth < 5
          ) {
            b.spawnedChildren = true;
            audioManager.playTimelineTick();

            const currentPoint = b.curve.getPoint(b.spawnT);
            const currentTangent = b.curve.getTangent(b.spawnT);

            // Child 1 (Upward/Outward angle)
            const is2045 = b.depth === 2 && !targetBranch;
            const dir1 = currentTangent.clone().applyAxisAngle(
              new THREE.Vector3(0, 0, 1),
              (Math.random() * 0.6 + 0.3) * (Math.random() > 0.5 ? 1 : -1)
            );
            const branch1 = createBranch(currentPoint, dir1, 8 + Math.random() * 8, b.depth + 1, is2045);
            branches.push(branch1);
            addLineObject(branch1);

            if (is2045) {
              targetBranch = branch1;
            }

            // Child 2 (Opposite spatial curvature)
            const dir2 = currentTangent.clone().applyAxisAngle(
              new THREE.Vector3(0, 1, 0),
              (Math.random() * 0.5 + 0.25) * (Math.random() > 0.5 ? 1 : -1)
            );
            const branch2 = createBranch(currentPoint, dir2, 7 + Math.random() * 6, b.depth + 1, false);
            branches.push(branch2);
            addLineObject(branch2);
          }
        }
      }

      // ---------------------------------------------------------
      // INSTABILITY & JITTER ON 2045 TIMELINE
      // ---------------------------------------------------------
      if (stage === 'instability' && targetBranch && targetBranch.mesh) {
        // High frequency temporal distortion
        targetBranch.destabilized = true;
        const mat = targetBranch.mesh.material as THREE.LineBasicMaterial;
        mat.color = Math.sin(elapsed * 45) > 0 ? targetCyan : amberAlert;
        mat.opacity = 0.8 + Math.random() * 0.4;
      }

      // ---------------------------------------------------------
      // UPDATE LINE VERTICES ON GPU
      // ---------------------------------------------------------
      lineObjects.forEach(({ geo, branch }) => {
        if (stage === 'fracture' || stage === 'collapse') return;

        const totalPts = branch.points.length;
        const activeCount = Math.floor(totalPts * branch.progress);

        if (activeCount > 1) {
          const positions = geo.attributes.position.array as Float32Array;
          for (let i = 0; i < activeCount; i++) {
            const pt = branch.curve.getPoint(i / (totalPts - 1));

            // Add subtle fluid wave oscillation
            const waveY = Math.sin(elapsed * 2.5 + i * 0.35 + branch.depth) * 0.035;
            const waveZ = Math.cos(elapsed * 2.0 + i * 0.25) * 0.025;

            // Destabilization jitter if target
            const jitterX = branch.destabilized ? (Math.random() - 0.5) * 0.12 : 0;
            const jitterY = branch.destabilized ? (Math.random() - 0.5) * 0.15 : 0;

            positions[i * 3] = pt.x + jitterX;
            positions[i * 3 + 1] = pt.y + waveY + jitterY;
            positions[i * 3 + 2] = pt.z + waveZ;
          }
          geo.attributes.position.needsUpdate = true;
          geo.setDrawRange(0, activeCount);
        }
      });

      // ---------------------------------------------------------
      // STAGE 5: THE BREAKDOWN & PARTICLE RUPTURE
      // ---------------------------------------------------------
      if (stage === 'fracture' && !particleSystem) {
        fractureStartTime = elapsed;
        audioManager.playGlitchShatter();

        // Convert all line vertices into 3D quantum particles
        const pts: THREE.Vector3[] = [];
        const cols: THREE.Color[] = [];
        const vels: THREE.Vector3[] = [];

        lineObjects.forEach(({ branch }) => {
          branch.mesh!.visible = false;
          branch.glowMesh!.visible = false;

          const totalPts = branch.points.length;
          const activeCount = Math.floor(totalPts * branch.progress);

          for (let i = 0; i < activeCount; i++) {
            const p = branch.curve.getPoint(i / Math.max(1, totalPts - 1));
            pts.push(p);

            // Velocity outward
            const v = new THREE.Vector3(
              (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 14,
              (Math.random() - 0.5) * 12
            );
            vels.push(v);
            cols.push(branch.is2045Target ? targetCyan : baseGreen);
          }
        });

        particleCount = pts.length;
        particlePositions = new Float32Array(particleCount * 3);
        particleVelocities = new Float32Array(particleCount * 3);
        particleColors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
          particlePositions[i * 3] = pts[i].x;
          particlePositions[i * 3 + 1] = pts[i].y;
          particlePositions[i * 3 + 2] = pts[i].z;

          particleVelocities[i * 3] = vels[i].x;
          particleVelocities[i * 3 + 1] = vels[i].y;
          particleVelocities[i * 3 + 2] = vels[i].z;

          particleColors[i * 3] = cols[i].r;
          particleColors[i * 3 + 1] = cols[i].g;
          particleColors[i * 3 + 2] = cols[i].b;
        }

        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

        const pMat = new THREE.PointsMaterial({
          size: 0.075,
          vertexColors: true,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
        });

        particleSystem = new THREE.Points(pGeo, pMat);
        scene.add(particleSystem);
      }

      // ---------------------------------------------------------
      // STAGE 6: MAGNETIC INWARD IMPLOSION / TRANSITION
      // ---------------------------------------------------------
      if (particleSystem && particlePositions && particleVelocities) {
        const timeSinceFracture = elapsed - fractureStartTime;

        if (timeSinceFracture > 1.2 && !isCollapsing) {
          isCollapsing = true;
          audioManager.playMachineUnlock();
        }

        for (let i = 0; i < particleCount; i++) {
          if (!isCollapsing) {
            // Explosive dispersal
            particlePositions[i * 3] += particleVelocities[i * 3] * delta;
            particlePositions[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta;
            particlePositions[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta;
            particleVelocities[i * 3] *= 0.94;
            particleVelocities[i * 3 + 1] *= 0.94;
            particleVelocities[i * 3 + 2] *= 0.94;
          } else {
            // Magnetic implosion toward origin (0, 0, 0)
            const px = particlePositions[i * 3];
            const py = particlePositions[i * 3 + 1];
            const pz = particlePositions[i * 3 + 2];
            const dist = Math.hypot(px, py, pz);

            const force = Math.min(26, 45 / (dist + 0.1));
            particlePositions[i * 3] -= (px / (dist + 0.01)) * force * delta * 4;
            particlePositions[i * 3 + 1] -= (py / (dist + 0.01)) * force * delta * 4;
            particlePositions[i * 3 + 2] -= (pz / (dist + 0.01)) * force * delta * 4;
          }
        }

        particleSystem.geometry.attributes.position.needsUpdate = true;

        if (isCollapsing) {
          collapseProgress += delta;
          if (collapseProgress > 1.4 && !hasCompleted) {
            hasCompleted = true;
            onCompleteRef.current();
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black select-none pointer-events-auto">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full block" />

      {/* Ultra-Minimal Aesthetic Skip Control */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
        <button
          onClick={() => onCompleteRef.current()}
          className="px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/90 border border-emerald-500/30 hover:border-emerald-400 text-[10px] font-mono text-emerald-400 tracking-widest uppercase backdrop-blur-md transition-all shadow-lg shadow-emerald-950/40"
        >
          SKIP SEQUENCE [ESC]
        </button>
      </div>
    </div>
  );
};
