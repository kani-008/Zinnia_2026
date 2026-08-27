import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { audioManager } from './AudioManager';
import {
  Sparkles,
  Activity,
  Terminal,
  Layers,
  Cpu,
  Eye,
  Brain,
  Database,
  Radio,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  MapPin,
  Trophy,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { store } from '../services/store';
import { QRCodeSVG } from 'qrcode.react';

interface DataMarker {
  id: string;
  name: string;
  sub: string;
  detail: string;
  position: THREE.Vector3;
  color: string;
}

export const SyntheticAIExperience: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Scroll Progression: 0 to 1
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentChamber, setCurrentChamber] = useState(1);

  // Active Marker Modal
  const [activeMarker, setActiveMarker] = useState<DataMarker | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(true);

  // Events & Registration State
  const allEvents = store.getEvents();
  const [selectedEventType, setSelectedEventType] = useState<'TECH' | 'NON_TECH'>('TECH');
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    department: 'Computer Science and Engineering',
    year: 'III',
    registered_events: [] as string[],
  });
  const [regSuccessId, setRegSuccessId] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Marker DOM Elements Ref for zero-overhead 60FPS Three.js tracking
  const markerElementsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const machineGroupRef = useRef<THREE.Group | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const ring1Ref = useRef<THREE.Group | null>(null);
  const ring2Ref = useRef<THREE.Group | null>(null);
  const ring3Ref = useRef<THREE.Group | null>(null);
  const particlesMeshRef = useRef<THREE.Points | null>(null);
  const markersRef = useRef<DataMarker[]>([
    {
      id: 'neural_core',
      name: 'NEURAL CORE',
      sub: 'SYNTHETIC CONSCIOUSNESS',
      detail: '100 PetaFLOPS quantum crystalline processor processing timeline probability matrices in real time.',
      position: new THREE.Vector3(0, 0.4, 0),
      color: '#06b6d4',
    },
    {
      id: 'prediction_engine',
      name: 'PREDICTION ENGINE',
      sub: 'TEMPORAL COMPUTATION',
      detail: 'Computes future divergence vectors. "The future is no longer predicted. It is computed."',
      position: new THREE.Vector3(1.8, 0.8, -0.6),
      color: '#6366f1',
    },
    {
      id: 'memory_matrix',
      name: 'MEMORY MATRIX',
      sub: 'CHRONOS DATA REPOSITORY',
      detail: 'Immutable multidimensional lattice archiving 60+ years of GCE Erode computer science heritage.',
      position: new THREE.Vector3(-1.9, -0.7, 0.5),
      color: '#a855f7',
    },
    {
      id: 'vision_system',
      name: 'VISION SYSTEM',
      sub: 'MULTIDIMENSIONAL SENSOR',
      detail: 'Refractive optical crystal lenses sensing observer disturbance and user mouse interactions.',
      position: new THREE.Vector3(0, 1.9, 0.3),
      color: '#38bdf8',
    },
    {
      id: 'reasoning_core',
      name: 'REASONING CORE',
      sub: 'AUTONOMOUS LOGIC',
      detail: 'Self-adapting neuro-symbolic engine driving the 9 symposium competition battlegrounds.',
      position: new THREE.Vector3(1.4, -1.6, 0.8),
      color: '#10b981',
    },
  ]);

  // Pointer & Physics State
  const mouseRef = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothX: 0,
    smoothY: 0,
  });

  // Droplet pointer cursor
  const dropletRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, vx: 0, vy: 0 });

  // -------------------------------------------------------------
  // THREE.JS INITIALIZATION & IMPOSSIBLE AI ENTITY SCENE
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020408, 0.045);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.8);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 4.5, 20);
    cyanLight.position.set(3, 4, 3);
    scene.add(cyanLight);

    const indigoLight = new THREE.PointLight(0x6366f1, 4.0, 20);
    indigoLight.position.set(-3, -3, 2);
    scene.add(indigoLight);

    const violetLight = new THREE.PointLight(0xa855f7, 3.0, 15);
    violetLight.position.set(0, 2, -3);
    scene.add(violetLight);

    // =========================================================
    // BUILD THE IMPOSSIBLE AI ENTITY (Complex Procedural Machine)
    // =========================================================
    const machineGroup = new THREE.Group();
    machineGroupRef.current = machineGroup;
    scene.add(machineGroup);

    // 1. Central Neural Core (Geodesic Pulsing Anomaly)
    const coreGeo = new THREE.IcosahedronGeometry(1.0, 4);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x083344,
      roughness: 0.15,
      metalness: 0.95,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMeshRef.current = coreMesh;
    machineGroup.add(coreMesh);

    // Inner Glowing Plasma Sphere
    const plasmaGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const plasmaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
    machineGroup.add(plasmaMesh);

    // 2. Gimbal Mechanical Torus Rings
    // Ring 1 (Horizontal Cybernetic Rail)
    const ring1Group = new THREE.Group();
    ring1Ref.current = ring1Group;
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.035, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0369a1,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Group.add(ring1Mesh);

    // Add precision nodes on Ring 1
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const nodeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.16);
      const nodeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9 });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * 1.85, Math.sin(angle) * 1.85, 0);
      ring1Group.add(node);
    }
    machineGroup.add(ring1Group);

    // Ring 2 (Vertical Gyroscope Rail)
    const ring2Group = new THREE.Group();
    ring2Ref.current = ring2Group;
    const ring2Geo = new THREE.TorusGeometry(2.35, 0.04, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      emissive: 0x3730a3,
      metalness: 0.85,
      roughness: 0.25,
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.x = Math.PI / 2;
    ring2Group.add(ring2Mesh);
    machineGroup.add(ring2Group);

    // Ring 3 (Outer Diagonal Stator Ring)
    const ring3Group = new THREE.Group();
    ring3Ref.current = ring3Group;
    const ring3Geo = new THREE.TorusGeometry(2.9, 0.045, 16, 120);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x581c87,
      metalness: 0.95,
      roughness: 0.15,
    });
    const ring3Mesh = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3Mesh.rotation.y = Math.PI / 4;
    ring3Group.add(ring3Mesh);
    machineGroup.add(ring3Group);

    // 3. Floating Quantum Circuit Panels & Prisms
    const panelGeo = new THREE.BoxGeometry(0.35, 0.5, 0.02);
    const panelMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    for (let i = 0; i < 14; i++) {
      const pAngle = (i / 14) * Math.PI * 2;
      const pRadius = 1.35 + (i % 3) * 0.4;
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(
        Math.cos(pAngle) * pRadius,
        (Math.sin(pAngle * 2) * 0.8),
        Math.sin(pAngle) * pRadius
      );
      panel.lookAt(0, 0, 0);
      machineGroup.add(panel);
    }

    // 4. Volumetric Quantum Cybernetic Dust / Particle Cloud
    const particleCount = 2800;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r = 1.2 + Math.random() * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const isCyan = Math.random() > 0.45;
      colors[i * 3] = isCyan ? 0.02 : 0.4;
      colors[i * 3 + 1] = isCyan ? 0.71 : 0.35;
      colors[i * 3 + 2] = isCyan ? 0.83 : 0.95;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    particlesMeshRef.current = particlesMesh;
    scene.add(particlesMesh);

    // Resize Handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pointer Interaction Handler
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = nx;
      mouseRef.current.targetY = ny;
    };
    window.addEventListener('pointermove', handlePointerMove);

    // Scroll Handler for Physical Chamber Navigation
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      const p = maxScroll > 0 ? Math.min(1, Math.max(0, current / maxScroll)) : 0;
      setScrollProgress(p);

      if (p < 0.18) setCurrentChamber(1);
      else if (p < 0.38) setCurrentChamber(2);
      else if (p < 0.58) setCurrentChamber(3);
      else if (p < 0.78) setCurrentChamber(4);
      else setCurrentChamber(5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ---------------------------------------------------------
    // RENDER LOOP (Continuous Smooth Interpolation & Projections)
    // ---------------------------------------------------------
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth pointer damping
      mouseRef.current.smoothX += (mouseRef.current.targetX - mouseRef.current.smoothX) * 0.06;
      mouseRef.current.smoothY += (mouseRef.current.targetY - mouseRef.current.smoothY) * 0.06;

      const mx = mouseRef.current.smoothX;
      const my = mouseRef.current.smoothY;

      // Rotate and animate machine components
      if (machineGroupRef.current) {
        // Head / Core subtley follows mouse
        machineGroupRef.current.rotation.y = mx * 0.45 + elapsedTime * 0.04;
        machineGroupRef.current.rotation.x = -my * 0.35 + Math.sin(elapsedTime * 0.5) * 0.05;
      }

      if (ring1Ref.current) ring1Ref.current.rotation.z = elapsedTime * 0.4;
      if (ring2Ref.current) ring2Ref.current.rotation.x = Math.PI / 2 + elapsedTime * -0.3;
      if (ring3Ref.current) ring3Ref.current.rotation.y = Math.PI / 4 + elapsedTime * 0.2;

      // Pulse neural core scale & light
      if (coreMeshRef.current) {
        const pulse = 1 + Math.sin(elapsedTime * 2.5) * 0.04;
        coreMeshRef.current.scale.set(pulse, pulse, pulse);
      }

      // Slowly rotate particle dust
      if (particlesMeshRef.current) {
        particlesMeshRef.current.rotation.y = elapsedTime * 0.02 + mx * 0.1;
        particlesMeshRef.current.rotation.x = my * 0.08;
      }

      // =========================================================
      // CAMERA FLIGHT PATH THROUGH THE 5 CHAMBERS
      // =========================================================
      const scroll = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      // Camera position interpolation based on scroll depth
      // Chamber 01: Z=7.5 (Front majestic view)
      // Chamber 02: Z=4.2, Y=0.4 (Entering Neural Core)
      // Chamber 03: Z=2.2, X=-1.0, Y=-0.2 (Deep inside computation matrix)
      // Chamber 04: Z=3.6, X=0.8, Y=0.5 (Symposium Shard Matrix)
      // Chamber 05: Z=5.8, Y=1.2 (Machine blossoms open, revealing registration)
      let targetCamZ = 7.5;
      let targetCamY = 0;
      let targetCamX = 0;

      if (scroll < 0.25) {
        const t = scroll / 0.25;
        targetCamZ = THREE.MathUtils.lerp(7.5, 4.2, t);
        targetCamY = THREE.MathUtils.lerp(0, 0.4, t);
        targetCamX = THREE.MathUtils.lerp(0, 0.2, t);
      } else if (scroll < 0.5) {
        const t = (scroll - 0.25) / 0.25;
        targetCamZ = THREE.MathUtils.lerp(4.2, 2.2, t);
        targetCamY = THREE.MathUtils.lerp(0.4, -0.3, t);
        targetCamX = THREE.MathUtils.lerp(0.2, -0.9, t);
      } else if (scroll < 0.75) {
        const t = (scroll - 0.5) / 0.25;
        targetCamZ = THREE.MathUtils.lerp(2.2, 3.8, t);
        targetCamY = THREE.MathUtils.lerp(-0.3, 0.6, t);
        targetCamX = THREE.MathUtils.lerp(-0.9, 0.8, t);
      } else {
        const t = (scroll - 0.75) / 0.25;
        targetCamZ = THREE.MathUtils.lerp(3.8, 5.5, t);
        targetCamY = THREE.MathUtils.lerp(0.6, 0.8, t);
        targetCamX = THREE.MathUtils.lerp(0.8, 0, t);
      }

      camera.position.x += (targetCamX + mx * 0.6 - camera.position.x) * 0.06;
      camera.position.y += (targetCamY + my * 0.5 - camera.position.y) * 0.06;
      camera.position.z += (targetCamZ - camera.position.z) * 0.06;
      camera.lookAt(0, 0, 0);

      // Project 3D Holographic Data Marker Coordinates to 2D Screen Space directly
      if (machineGroupRef.current) {
        markersRef.current.forEach((marker) => {
          const el = markerElementsRef.current[marker.id];
          if (!el) return;

          const worldPos = marker.position.clone();
          worldPos.applyMatrix4(machineGroupRef.current!.matrixWorld);
          worldPos.project(camera);

          const sx = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-(worldPos.y * 0.5) + 0.5) * window.innerHeight;
          const isVisible = worldPos.z < 1.0;

          el.style.transform = `translate3d(${sx}px, ${sy}px, 0px)`;
          el.style.display = isVisible ? 'block' : 'none';
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
      renderer.dispose();
    };
  }, []);

  // Droplet pointer cursor effect
  useEffect(() => {
    const handlePointer = (e: PointerEvent) => {
      dropletRef.current.x += (e.clientX - dropletRef.current.x) * 0.22;
      dropletRef.current.y += (e.clientY - dropletRef.current.y) * 0.22;
    };
    window.addEventListener('pointermove', handlePointer);
    return () => window.removeEventListener('pointermove', handlePointer);
  }, []);

  const handleMarkerClick = (marker: DataMarker) => {
    audioManager.playMarkerHover();
    setActiveMarker(marker);
  };

  const handleToggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioManager.setMuted(nextMuted);
  };

  const handleToggleEvent = (id: string) => {
    audioManager.playTimelineTick();
    if (regForm.registered_events.includes(id)) {
      setRegForm({ ...regForm, registered_events: regForm.registered_events.filter((e) => e !== id) });
    } else {
      setRegForm({ ...regForm, registered_events: [...regForm.registered_events, id] });
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!regForm.name || !regForm.email || !regForm.phone || !regForm.college) {
      setRegError('Please provide all mandatory participant credentials.');
      return;
    }
    if (regForm.registered_events.length === 0) {
      setRegError('Select at least one event shard to lock containment.');
      return;
    }

    setIsSubmitting(true);
    audioManager.playMachineUnlock();

    setTimeout(() => {
      try {
        const participant = store.registerParticipant(regForm);
        setRegSuccessId(participant.agent_id);
        setIsSubmitting(false);
      } catch (err: any) {
        setRegError(err.message || 'Registration failed.');
        setIsSubmitting(false);
      }
    }, 700);
  };

  const scrollToChamber = (chamberIdx: number) => {
    audioManager.playChamberTransition();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = (maxScroll / 4) * (chamberIdx - 1);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  const techEvents = allEvents.filter((e) => e.event_type === 'TECH');
  const nonTechEvents = allEvents.filter((e) => e.event_type === 'NON_TECH');
  const activeEventsList = selectedEventType === 'TECH' ? techEvents : nonTechEvents;

  return (
    <div className="relative min-h-[500vh] bg-[#020408] text-slate-100 font-sans selection:bg-cyan-500/40 selection:text-white">
      {/* =========================================================================
          1. THREE.JS 3D CANVAS VIEWPORT (FIXED FULLSCREEN)
          ========================================================================= */}
      <div ref={mountRef} className="fixed inset-0 z-0 pointer-events-auto" />

      {/* =========================================================================
          2. 3D HOLOGRAPHIC DATA MARKERS (Interactive Hover Pins)
          ========================================================================= */}
      {markersRef.current.map((marker) => {
        return (
          <div
            key={marker.id}
            ref={(el) => {
              markerElementsRef.current[marker.id] = el;
            }}
            onClick={() => handleMarkerClick(marker)}
            className="fixed top-0 left-0 z-20 pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer group select-none transition-all duration-150 hover:scale-110"
            style={{ display: 'none' }}
          >
            {/* Ping Ring */}
            <div className="relative flex items-center justify-center">
              <span
                className="absolute w-6 h-6 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: marker.color }}
              />
              <span
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: marker.color }}
              />

              {/* Floating Tag Label */}
              <div className="absolute left-5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700/80 text-[10px] font-mono tracking-wider text-white whitespace-nowrap backdrop-blur-md opacity-85 group-hover:opacity-100 shadow-xl group-hover:border-cyan-400 transition-all flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: marker.color }} />
                <span>{marker.name}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Active Marker Detail Modal */}
      {activeMarker && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-950/90 border border-cyan-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  // DECLASSIFIED COMPONENT
                </div>
                <h3 className="text-xl font-black text-white font-mono">{activeMarker.name}</h3>
                <div className="text-xs font-mono text-indigo-300">{activeMarker.sub}</div>
              </div>
              <button
                onClick={() => setActiveMarker(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white"
              >
                CLOSE [ESC]
              </button>
            </div>
            <p className="text-xs text-slate-300 font-light leading-relaxed">{activeMarker.detail}</p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => scrollToChamber(4)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs font-mono font-bold flex items-center gap-1.5"
              >
                <span>ENGAGE SYMPOSIUM SHARDS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MINIMAL LUSION-STYLE HUD HEADER & TELEMETRY
          ========================================================================= */}
      <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none px-6 py-4 select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md flex items-center gap-2.5 shadow-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono font-black text-sm text-cyan-300 tracking-wider">
                AI SYMPOSIUM 2045
              </span>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">// ZINNIA '26</span>
            </div>
          </div>

          {/* Chamber Jump Navigator */}
          <div className="pointer-events-auto hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-xs font-mono">
            {[
              { id: 1, name: '01 THE INTELLIGENCE' },
              { id: 2, name: '02 BREAKTHROUGH' },
              { id: 3, name: '03 HUMAN QUESTION' },
              { id: 4, name: '04 SYMPOSIUM MATRIX' },
              { id: 5, name: '05 ENTER 2045' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToChamber(c.id)}
                className={`px-3 py-1 rounded-xl transition-all ${currentChamber === c.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Right Controls: Sound Toggle & Quick Register */}
          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2 text-xs font-mono transition-all ${!isMuted
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-md'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
                }`}
            >
              {!isMuted ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px]">SOUND: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] text-slate-500">MUTE</span>
                </>
              )}
            </button>

            <button
              onClick={() => scrollToChamber(5)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-cyan-500/30 flex items-center gap-1.5"
            >
              <span>REGISTER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          5. CONTINUOUS SCROLL CONTENT: PHYSICAL JOURNEY THROUGH THE MACHINE
          ========================================================================= */}

      {/* -------------------------------------------------------------
          CHAMBER 01: THE INTELLIGENCE (Exterior to Core Approach)
          ------------------------------------------------------------- */}
      <section className="relative h-screen flex flex-col items-center justify-between pt-28 pb-12 px-6 max-w-7xl mx-auto text-center pointer-events-none select-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-1 rounded-full bg-slate-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>GCE ERODE &bull; CSE DEPARTMENT SYMPOSIUM</span>
          <span className="text-cyan-600">|</span>
          <span className="text-white font-semibold">17 SEP 2026</span>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_40px_rgba(6,182,212,0.35)]">
            AI SYMPOSIUM <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              2045
            </span>
          </h1>
          <p className="text-sm sm:text-base font-mono font-bold text-cyan-300 tracking-wider">
            "THE FUTURE IS NO LONGER PREDICTED. IT IS COMPUTED."
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-light leading-relaxed">
            Move your cursor to inspect the impossible synthetic intelligence. Scroll physically into the neural core.
          </p>
        </div>

        <div className="pointer-events-auto space-y-2">
          <div className="text-[11px] font-mono text-cyan-400 animate-bounce">
            ↓ SCROLL TO ENTER 01 // THE NEURAL CORE
          </div>
          <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-400">
            <span className="bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
              ₹25,000+ PRIZE POOL
            </span>
            <span className="bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800">
              9 ACTIVE BATTLEGROUNDS
            </span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          CHAMBER 02: THE BREAKTHROUGH (Inside Computation Matrix)
          ------------------------------------------------------------- */}
      <section className="relative h-screen flex flex-col justify-center px-6 max-w-7xl mx-auto select-none pointer-events-none">
        <div className="pointer-events-auto max-w-xl p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl space-y-4 shadow-2xl">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            // CHAMBER 02 &bull; THE BREAKTHROUGH
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
            SYNTHETIC INTELLIGENCE ARCHITECTURE
          </h2>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            As you traverse the internal optical conduits, the machine reveals the computational principles behind ZINNIA 2026: self-adapting neural architectures, quantum cryptography, and decentralized reasoning models.
          </p>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-cyan-400 font-bold">100 PFLOPS</div>
              <div className="text-[10px] text-slate-400">Quantum Inference</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-indigo-400 font-bold">0.02ms</div>
              <div className="text-[10px] text-slate-400">Timeline Divergence</div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          CHAMBER 03: THE HUMAN QUESTION (Heritage & Philosophy)
          ------------------------------------------------------------- */}
      <section className="relative h-screen flex flex-col justify-center items-end px-6 max-w-7xl mx-auto select-none pointer-events-none">
        <div className="pointer-events-auto max-w-xl p-8 rounded-3xl bg-slate-950/80 border border-indigo-500/30 backdrop-blur-xl space-y-4 shadow-2xl text-right">
          <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
            // CHAMBER 03 &bull; THE HUMAN QUESTION
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
            GOVERNMENT COLLEGE OF ENGINEERING, ERODE
          </h2>
          <p className="text-xs text-slate-300 font-light leading-relaxed">
            Formerly IRTT, Government College of Engineering, Erode has fostered technical supremacy and visionary engineering for over three decades. The Department of Computer Science & Engineering unites human creativity with impossible computation.
          </p>
          <div className="flex justify-end gap-2 text-xs font-mono text-cyan-400 pt-2">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> GCE Erode 638 316
            </span>
            <span>&bull;</span>
            <span>cse.gcee2026@gmail.com</span>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------
          CHAMBER 04: THE SYMPOSIUM MATRIX (Floating Battlegrounds)
          ------------------------------------------------------------- */}
      <section className="relative min-h-screen py-24 px-6 max-w-7xl mx-auto flex flex-col justify-center space-y-8 select-none">
        <div className="p-8 rounded-3xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              // CHAMBER 04 &bull; THE SYMPOSIUM MATRIX
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              9 ANOMALY BATTLEGROUNDS
            </h2>
            <p className="text-xs text-slate-400 font-light">
              Compete across algorithmic mastery, web/UI sprints, cybersecurity, and strategic problem solving.
            </p>
          </div>

          <div className="flex gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedEventType('TECH')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedEventType === 'TECH'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              TECHNICAL ({techEvents.length})
            </button>
            <button
              onClick={() => setSelectedEventType('NON_TECH')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${selectedEventType === 'NON_TECH'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              NON-TECHNICAL ({nonTechEvents.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeEventsList.map((event) => (
            <div
              key={event.id}
              className="p-6 rounded-2xl bg-slate-950/75 border border-slate-800/90 backdrop-blur-xl hover:border-cyan-500/50 transition-all space-y-4 flex flex-col justify-between group shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${selectedEventType === 'TECH'
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                        : 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-500/40'
                      }`}
                  >
                    {event.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Team: {event.team_size_min}-{event.team_size_max}
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-mono group-hover:text-cyan-300 transition-colors">
                  {event.mission_name}
                </h3>
                <p className="text-xs text-slate-300 font-light leading-relaxed">{event.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Venue: {event.venue}</span>
                  <span>Time: {event.schedule_time}</span>
                </div>
                <button
                  onClick={() => {
                    handleToggleEvent(event.id);
                    scrollToChamber(5);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-cyan-950 border border-slate-800 hover:border-cyan-500 text-cyan-300 font-bold transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  <span>ENGAGE {event.code} IN CHAMBER 05</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------
          CHAMBER 05: ENTER 2045 (The Machine Opens: Registration)
          ------------------------------------------------------------- */}
      <section className="relative min-h-screen py-24 px-6 max-w-4xl mx-auto flex flex-col justify-center space-y-8 select-none">
        <div className="p-8 rounded-3xl bg-slate-950/85 border border-cyan-500/40 backdrop-blur-2xl space-y-3 shadow-2xl">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
            // CHAMBER 05 &bull; THE CORE OPENS
          </div>
          <h2 className="text-3xl font-black text-white font-mono">ENTER 2045 &bull; CHRONO-PASS</h2>
          <p className="text-xs text-slate-300 font-light">
            Feed your credentials directly into the synthetic matrix to generate your verified digital pass.
          </p>
        </div>

        {regSuccessId ? (
          <div className="p-8 rounded-3xl bg-slate-950/90 border border-emerald-500/50 backdrop-blur-xl space-y-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white font-mono">CONTAINMENT LOCKED & VERIFIED</h3>
              <p className="text-xs font-mono text-emerald-400">AGENT ID: {regSuccessId}</p>
            </div>

            <div className="flex flex-col items-center p-6 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-xs mx-auto">
              <div className="bg-white p-3 rounded-xl shadow-xl">
                <QRCodeSVG value={`ZIN26-${regSuccessId}`} size={140} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-2">PRESENT QR AT GCE ERODE VENUE</span>
            </div>

            <button
              onClick={() => setRegSuccessId(null)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white"
            >
              REGISTER ANOTHER PARTICIPANT
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleRegisterSubmit}
            className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-2xl space-y-6 text-xs font-mono shadow-2xl"
          >
            {regError && (
              <div className="p-3 bg-rose-950/90 border border-rose-500 text-rose-300 rounded-xl text-xs">
                {regError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">FULL PARTICIPANT NAME *</label>
              <input
                type="text"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">COMM EMAIL *</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="agent@institution.edu"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">PHONE NUMBER *</label>
                <input
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="+91 98401 23456"
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold">COLLEGE / INSTITUTION NAME *</label>
              <input
                type="text"
                value={regForm.college}
                onChange={(e) => setRegForm({ ...regForm, college: e.target.value })}
                placeholder="e.g. Government College of Engineering, Erode"
                className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Event Checkboxes */}
            <div className="space-y-2 pt-2">
              <label className="block text-slate-300 font-bold">SELECT EVENT BATTLEGROUNDS *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {allEvents.map((ev) => {
                  const isChecked = regForm.registered_events.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${isChecked
                          ? 'bg-cyan-950/80 border-cyan-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleEvent(ev.id)}
                        className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                      />
                      <div className="truncate text-xs">
                        <span className="font-bold text-white">[{ev.code}]</span> {ev.mission_name}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black font-mono text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>COMPUTING CHRONO-PASS...</span>
              ) : (
                <>
                  <span>FEED INTO 2045 CONTAINMENT MATRIX</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </section>

      {/* Global Minimal Footer */}
      <footer className="relative z-10 py-8 text-center text-slate-500 font-mono text-[11px] border-t border-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; 2026 GCE ERODE &bull; CSE DEPARTMENT SYMPOSIUM</span>
          <span className="text-cyan-500/80">AI SYMPOSIUM 2045 &bull; BLACK CIPHER PROTOCOL</span>
        </div>
      </footer>
    </div>
  );
};

export default SyntheticAIExperience;
