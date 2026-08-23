import React, { useEffect, useRef } from 'react';

interface LiquidGlassProps {
  className?: string;
  intensity?: number;
  speed?: number;
}

export const LiquidGlassBackground: React.FC<LiquidGlassProps> = ({
  className = '',
  intensity = 1.0,
  speed = 0.8,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.warn('WebGL not supported for LiquidGlassBackground');
      return;
    }

    // Vertex Shader (Full-screen quad)
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: Lusion.io inspired Liquid Glass Refraction & Chromatic Aberration
    const fsSource = `
      precision highp float;
      varying vec2 v_uv;

      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec2 u_mouse_velocity;
      uniform float u_time;
      uniform float u_intensity;
      uniform float u_speed;

      // --- GLSL Simplex Noise / Hash Functions ---
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      }

      // Domain Warped Fractal Brownian Motion (Simulates liquid flows)
      float fbm(vec2 p, float t) {
        float total = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 4; i++) {
          total += amp * snoise(vec3(p * freq, t * 0.3));
          freq *= 2.05;
          amp *= 0.48;
        }
        return total;
      }

      // Normal map generation from height gradient
      vec3 getNormal(vec2 p, float t) {
        float eps = 0.006;
        float h = fbm(p, t);
        float hx = fbm(p + vec2(eps, 0.0), t);
        float hy = fbm(p + vec2(0.0, eps), t);
        vec3 dx = vec3(eps, 0.0, (hx - h) * 1.8);
        vec3 dy = vec3(0.0, eps, (hy - h) * 1.8);
        return normalize(cross(dx, dy));
      }

      void main() {
        vec2 st = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
        vec2 mouse = (u_mouse * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

        float t = u_time * u_speed * 0.28;

        // Interactive mouse disturbance / fluid wake
        float mouseDist = length(st - mouse);
        float mouseInteraction = exp(-mouseDist * 2.2) * (0.35 + length(u_mouse_velocity) * 1.2);
        vec2 mouseOffset = normalize(st - mouse + 0.0001) * mouseInteraction * 0.4;

        // Warped coordinates (Lusion liquid domain warp)
        vec2 p = st * 1.25 + mouseOffset;
        vec2 q = vec2(fbm(p + vec2(0.0, 0.0), t), fbm(p + vec2(5.2, 1.3), t));
        vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2), t * 1.1), fbm(p + 3.2 * q + vec2(8.3, 2.8), t * 0.9));
        float f = fbm(p + 3.8 * r, t * 1.2);

        // Compute 3D normal for glass refraction and specular highlights
        vec3 N = getNormal(p + 3.2 * r, t);
        vec3 V = vec3(0.0, 0.0, 1.0); // View vector (towards viewer)
        vec3 L = normalize(vec3(mouse.x * 0.8, mouse.y * 0.8, 1.2)); // Virtual cursor-tracking point light

        // Chromatic Aberration / Dispersion (Refracting R, G, B at slightly different wavelengths)
        float disp = 0.042 * u_intensity;
        vec2 refractR = v_uv + N.xy * (disp * 0.85);
        vec2 refractG = v_uv + N.xy * (disp * 1.0);
        vec2 refractB = v_uv + N.xy * (disp * 1.18);

        // Rich Dark-Theme Color Gradient Sampling
        // Base Void -> Deep Glass Obsidian -> Cyber Gold (#F5D90A) -> Neon Pink (#FF3366) -> Electric Cyan (#3CE7FF)
        vec3 colBase     = vec3(0.051, 0.051, 0.059);  // #0D0D0F Deep background void
        vec3 colObsidian = vec3(0.094, 0.094, 0.114);  // #18181D Rich dark charcoal glass
        vec3 colYellow   = vec3(0.961, 0.851, 0.039);  // #F5D90A Cyberpunk Yellow accent
        vec3 colPink     = vec3(1.000, 0.200, 0.400);  // #FF3366 Neon Pink / Magenta
        vec3 colCyan     = vec3(0.235, 0.906, 1.000);  // #3CE7FF Electric Cyan / Azure

        // Multi-layer fluid tone blending
        float mixR = fbm(refractR * 1.4, t);
        float mixG = fbm(refractG * 1.4, t);
        float mixB = fbm(refractB * 1.4, t);

        vec3 fluidCol = colBase;
        fluidCol = mix(fluidCol, colObsidian, smoothstep(-0.4, 0.6, mixG));
        fluidCol = mix(fluidCol, colYellow * 0.65, pow(smoothstep(0.35, 0.85, mixR), 2.2) * 0.45);
        fluidCol = mix(fluidCol, colPink * 0.55,   pow(smoothstep(0.45, 0.95, mixB), 2.5) * 0.35);
        fluidCol = mix(fluidCol, colCyan * 0.60,   pow(smoothstep(0.55, 1.00, mixG), 2.0) * 0.40);

        // Glass Specular highlights & Fresnel rim light
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 36.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

        // Add caustics and metallic rim illumination
        vec3 finalColor = fluidCol;
        finalColor += colCyan * fresnel * 0.28;
        finalColor += colYellow * spec * 0.45;
        finalColor += colPink * (mouseInteraction * 0.25);

        // Vignette around edges to frame content smoothly
        float vignette = 1.0 - smoothstep(0.45, 1.45, length(st));
        finalColor *= mix(0.75, 1.0, vignette);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Compile helper
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking failed:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Full-screen quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const uMouseLoc = gl.getUniformLocation(program, 'u_mouse');
    const uMouseVelLoc = gl.getUniformLocation(program, 'u_mouse_velocity');
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uIntensityLoc = gl.getUniformLocation(program, 'u_intensity');
    const uSpeedLoc = gl.getUniformLocation(program, 'u_speed');

    let animationFrameId: number;
    let startTime = performance.now();

    // Mouse tracking with smooth lerp and velocity estimation
    const mouse = {
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.5,
      currentX: window.innerWidth * 0.5,
      currentY: window.innerHeight * 0.5,
      prevX: window.innerWidth * 0.5,
      prevY: window.innerHeight * 0.5,
      vx: 0,
      vy: 0,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = window.innerHeight - e.clientY; // Invert for GL coordinates
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Responsive Canvas Resize
    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap DPR at 1.5 for buttery 60fps
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    // Render loop
    const render = (now: number) => {
      const elapsedTime = (now - startTime) * 0.001;

      // Smooth mouse interpolation (spring/lerp feel)
      mouse.prevX = mouse.currentX;
      mouse.prevY = mouse.currentY;
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.08;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.08;

      mouse.vx = (mouse.currentX - mouse.prevX) * 0.05;
      mouse.vy = (mouse.currentY - mouse.prevY) * 0.05;

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform2f(uMouseLoc, mouse.currentX * (canvas.width / window.innerWidth), mouse.currentY * (canvas.height / window.innerHeight));
      gl.uniform2f(uMouseVelLoc, mouse.vx, mouse.vy);
      gl.uniform1f(uTimeLoc, elapsedTime);
      gl.uniform1f(uIntensityLoc, intensity);
      gl.uniform1f(uSpeedLoc, speed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
    };
  }, [intensity, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};

export default LiquidGlassBackground;
