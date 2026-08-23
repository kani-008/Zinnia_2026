import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface LiquidGlassOptions {
  colorBg?: string; // Near-black background (default: #0D0D0F)
  colorYellow?: string; // Cyberpunk Yellow (default: #F5D90A)
  colorPink?: string; // Neon Pink (default: #FF3366)
  colorCyan?: string; // Electric Cyan (default: #3CE7FF)
  intensity?: number; // Overall distortion intensity (default: 1.0)
  className?: string;
}

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseVelocity;
uniform vec3 uColorBg;
uniform vec3 uColorYellow;
uniform vec3 uColorPink;
uniform vec3 uColorCyan;
uniform float uIntensity;

varying vec2 vUv;

// 2D Simplex Noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Layered Fractal Brownian Motion (fBm)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.05;
    amplitude *= 0.48;
  }
  return value;
}

// Procedural Liquid Neon Gradient Field
vec3 getBaseColorField(vec2 uv) {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  
  float n1 = fbm(uv * 1.5 + vec2(uTime * 0.03, uTime * 0.02));
  float n2 = fbm(uv * 2.2 - vec2(uTime * 0.025, -uTime * 0.015));
  
  // Drifting fluid color vortexes
  vec2 yellowCenter = vec2(0.2, 0.8) + vec2(sin(uTime * 0.18) * 0.12, cos(uTime * 0.22) * 0.08);
  vec2 pinkCenter = vec2(0.85, 0.2) + vec2(cos(uTime * 0.15) * 0.12, sin(uTime * 0.2) * 0.09);
  vec2 cyanCenter = vec2(0.5, 0.45) + vec2(sin(uTime * 0.12) * 0.15, -cos(uTime * 0.16) * 0.1);
  
  float dYellow = smoothstep(0.75, 0.0, length((uv - yellowCenter) * aspect));
  float dPink = smoothstep(0.7, 0.0, length((uv - pinkCenter) * aspect));
  float dCyan = smoothstep(0.85, 0.0, length((uv - cyanCenter) * aspect));
  
  vec3 col = uColorBg;
  col = mix(col, uColorYellow, dYellow * 0.24 * (0.8 + 0.25 * n1));
  col = mix(col, uColorPink, dPink * 0.22 * (0.8 + 0.25 * n2));
  col = mix(col, uColorCyan, dCyan * 0.20 * (0.8 + 0.25 * n1));
  
  return col;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  
  // Radial distance from smooth cursor position
  vec2 mouseUv = uMouse;
  vec2 mouseDelta = (uv - mouseUv) * aspect;
  float mouseDist = length(mouseDelta);
  
  // Soft smoothstep falloff (~0.18 - 0.28 screen space)
  float mouseInfluence = smoothstep(0.32, 0.0, mouseDist);
  
  // Ambient idle ripple noise (gentle breathing wave)
  vec2 idleNoise = vec2(
    fbm(uv * 2.8 + vec2(uTime * 0.04, 0.0)),
    fbm(uv * 2.8 + vec2(0.0, uTime * 0.05))
  ) * 0.012;
  
  // Cursor-following fluid turbulence
  vec2 cursorNoise = vec2(
    snoise(uv * 5.5 + vec2(uTime * 0.15, 0.0)),
    snoise(uv * 5.5 - vec2(0.0, uTime * 0.15))
  ) * mouseInfluence * (0.04 + uMouseVelocity * 0.1);
  
  vec2 distortion = (idleNoise + cursorNoise) * uIntensity;
  vec2 distortedUv = uv + distortion;
  
  // Glass surface normal & Fresnel rim highlight
  vec3 normal = normalize(vec3(-distortion.x * 15.0, -distortion.y * 15.0, 1.0));
  vec3 lightDir = normalize(vec3(0.4, 0.6, 0.7));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  
  // Specular gleam (Glass highlight)
  vec3 halfVector = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfVector), 0.0), 28.0) * (0.08 + mouseInfluence * 0.45);
  
  // Fresnel edge sheen
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0) * 0.3;
  
  // Chromatic Aberration with proportional color separation
  float aberrationStrength = (0.005 + length(distortion) * 0.6) * (0.35 + mouseInfluence * 1.1);
  vec2 dir = normalize(distortion + vec2(0.0001));
  
  float r = getBaseColorField(distortedUv + dir * aberrationStrength).r;
  float g = getBaseColorField(distortedUv).g;
  float b = getBaseColorField(distortedUv - dir * aberrationStrength).b;
  
  vec3 finalColor = vec3(r, g, b);
  
  // Layer glass highlights & fresnel rim glow
  finalColor += vec3(spec);
  finalColor += vec3(fresnel * 0.45) * uColorCyan;
  
  // Filmic Vignette to maintain deep contrast along borders
  float vignette = smoothstep(1.45, 0.45, length((uv - 0.5) * aspect));
  finalColor = mix(uColorBg, finalColor, vignette);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const LiquidGlassBackground: React.FC<LiquidGlassOptions> = ({
  colorBg = '#0D0D0F',
  colorYellow = '#F5D90A',
  colorPink = '#FF3366',
  colorCyan = '#3CE7FF',
  intensity = 1.0,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    if (isMobile || !containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;
    let isVisible = true;

    // 1. Scene, Camera, and Downscaled Performance Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Cap pixel ratio to 1.25 for buttery 60fps
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      alpha: false,
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 2. Uniforms & Materials
    const hexToVec3 = (hex: string) => {
      const c = new THREE.Color(hex);
      return new THREE.Vector3(c.r, c.g, c.b);
    };

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVelocity: { value: 0 },
      uColorBg: { value: hexToVec3(colorBg) },
      uColorYellow: { value: hexToVec3(colorYellow) },
      uColorPink: { value: hexToVec3(colorPink) },
      uColorCyan: { value: hexToVec3(colorCyan) },
      uIntensity: { value: intensity },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const plane = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(plane, material);
    scene.add(mesh);

    // 3. Fluid Mouse Tracking with Smooth Lerp & Decaying Velocity
    const targetMouse = { x: 0.5, y: 0.5 };
    const currentMouse = { x: 0.5, y: 0.5 };
    let lastRawMouse = { x: 0.5, y: 0.5 };
    let smoothedVelocity = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1.0 - e.clientY / window.innerHeight; // Invert Y for GLSL coordinate system
      targetMouse.x = x;
      targetMouse.y = y;

      const dx = x - lastRawMouse.x;
      const dy = y - lastRawMouse.y;
      const rawVel = Math.min(Math.sqrt(dx * dx + dy * dy) * 20.0, 1.0);
      smoothedVelocity = Math.max(smoothedVelocity, rawVel);
      lastRawMouse = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 4. Resize Handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 5. Visibility Change (Pause render loop when tab inactive to save power)
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 6. 60fps Render Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const delta = clock.getDelta();
      uniforms.uTime.value = clock.getElapsedTime();

      // Fluid trailing lerp (0.08 factor gives that viscous liquid drag)
      currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08;
      currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08;
      uniforms.uMouse.value.set(currentMouse.x, currentMouse.y);

      // Decay velocity gradually over ~1-1.5s
      smoothedVelocity *= Math.pow(0.92, delta * 60);
      uniforms.uMouseVelocity.value = smoothedVelocity;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      material.dispose();
      plane.dispose();
    };
  }, [colorBg, colorYellow, colorPink, colorCyan, intensity, isMobile]);

  if (isMobile) {
    // Lightweight fallback for mobile / touch devices
    return (
      <div
        className={`pointer-events-none fixed inset-0 z-0 bg-[#0D0D0F] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(60,231,255,0.15),rgba(255,255,255,0))] ${className}`}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default LiquidGlassBackground;
