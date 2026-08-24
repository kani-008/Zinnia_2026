import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LiquidSimulation } from './liquid/LiquidSimulation';
import { LiquidPass } from './liquid/LiquidPass';

/**
 * LiquidGlassHover Component
 * Brings the GPU fluid simulation & liquid glass optical refraction hover effect
 * to the Zinnia 2026 website.
 * Tracks mouse & touch movements to create physical fluid ripples, Snell's law refraction,
 * chromatic aberration, iridescent Fresnel rims, and dynamic specular gleam.
 */
export const LiquidGlassHover: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // WebGL Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scene Render Target (Backdrop to be optically refracted by liquid)
    const sceneRenderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType || THREE.UnsignedByteType,
    });

    // Modules Initialization
    const liquidSim = new LiquidSimulation(renderer, width, height);
    const liquidPass = new LiquidPass(width, height);

    // Initial position offscreen until first mouse/touch event
    liquidSim.mouse.set(-1.0, -1.0);
    liquidSim.prevMouse.set(-1.0, -1.0);

    // Pure crystal transparent liquid hover lens (seamlessly blended into background)
    liquidSim.params.radius = 0.08;
    liquidSim.params.force = 1.5;
    liquidSim.params.viscosity = 0.40;
    liquidSim.params.decay = 0.95;
    liquidSim.params.velocityStretch = 0.6;

    liquidPass.params.refractionStrength = 0.35;
    liquidPass.params.ior = 1.45;
    liquidPass.params.magnification = 1.0;
    liquidPass.params.chromaticAberration = 0.35;
    liquidPass.params.fresnelPower = 3.5;
    liquidPass.params.fresnelStrength = 0.0;
    liquidPass.params.specularStrength = 0.0;
    liquidPass.params.darkGlossy = 0.0;

    // Backdrop Scene for Refraction (Cyberpunk Obsidian + Cyan/Gold/Magenta Grid & Ambient Orbs)
    const backdropScene = new THREE.Scene();
    backdropScene.background = new THREE.Color(0x0a0a0d);

    const backdropCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    backdropCamera.position.set(0, 0, 10);
    backdropCamera.lookAt(0, 0, 0);

    // Create high-contrast subtle cyber grid backdrop for refraction visibility
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const ctx = gridCanvas.getContext('2d')!;

    // Dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
    bgGrad.addColorStop(0, '#09090c');
    bgGrad.addColorStop(0.5, '#0e0e13');
    bgGrad.addColorStop(1, '#07070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle grid lines with cyber cyan / gold tint
    ctx.strokeStyle = 'rgba(60, 231, 255, 0.15)';
    ctx.lineWidth = 1.5;
    const step = 32;

    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // High-contrast geometric intersection points
    ctx.fillStyle = 'rgba(245, 217, 10, 0.35)';
    for (let x = step; x < 512; x += step * 2) {
      for (let y = step; y < 512; y += step * 2) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const gridTexture = new THREE.CanvasTexture(gridCanvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(6, 4);

    const backdropGeo = new THREE.PlaneGeometry(28, 18);
    const backdropMat = new THREE.MeshBasicMaterial({
      map: gridTexture,
      side: THREE.DoubleSide,
    });
    const backdropMesh = new THREE.Mesh(backdropGeo, backdropMat);
    backdropMesh.position.set(0, 0, -5);
    backdropScene.add(backdropMesh);

    // Ambient floating colored lights / glowing geometry to give rich refractions
    const orbsGroup = new THREE.Group();
    backdropScene.add(orbsGroup);

    const cyanMat = new THREE.MeshBasicMaterial({ color: 0x3ce7ff });
    const goldMat = new THREE.MeshBasicMaterial({ color: 0xf5d90a });
    const pinkMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });

    const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 24), cyanMat);
    orb1.position.set(-3.5, 1.8, -1.5);
    orbsGroup.add(orb1);

    const orb2 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 24), goldMat);
    orb2.position.set(3.2, -1.5, -1.0);
    orbsGroup.add(orb2);

    const orb3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), pinkMat);
    orb3.position.set(2.8, 2.2, -2.0);
    orbsGroup.add(orb3);

    // Pointer Event Handlers
    const handlePointer = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      // Convert to UV space (0 to 1)
      const uvX = clientX / window.innerWidth;
      const uvY = 1.0 - clientY / window.innerHeight;

      liquidSim.updatePointer(uvX, uvY);
    };

    window.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('touchmove', handlePointer, { passive: true });

    // Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      sceneRenderTarget.setSize(width, height);

      backdropCamera.aspect = width / height;
      backdropCamera.updateProjectionMatrix();

      liquidSim.resize(width, height);
      liquidPass.resize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.01;

      // Slowly float ambient orbs in backdrop
      orb1.position.y = 1.8 + Math.sin(clock * 1.2) * 0.4;
      orb2.position.y = -1.5 + Math.cos(clock * 1.5) * 0.3;
      orb3.position.x = 2.8 + Math.sin(clock * 0.8) * 0.5;

      // 1. Render Backdrop into Render Target
      renderer.setRenderTarget(sceneRenderTarget);
      renderer.clear();
      renderer.render(backdropScene, backdropCamera);
      renderer.setRenderTarget(null);

      // 2. Step GPU Liquid Fluid Simulation
      const liquidTexture = liquidSim.step();

      // 3. Render Optical Refraction Composite Pass to Screen Canvas
      liquidPass.render(renderer, sceneRenderTarget.texture, liquidTexture, liquidSim.mouse);
    };

    animId = requestAnimationFrame(animate);

    // Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('touchmove', handlePointer);
      window.removeEventListener('resize', handleResize);

      liquidSim.dispose();
      liquidPass.dispose();
      sceneRenderTarget.dispose();
      gridTexture.dispose();
      backdropGeo.dispose();
      backdropMat.dispose();
      cyanMat.dispose();
      goldMat.dispose();
      pinkMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default LiquidGlassHover;
