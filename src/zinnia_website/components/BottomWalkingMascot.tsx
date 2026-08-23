import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export const BottomWalkingMascot: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  // Character State
  const [charState, setCharState] = useState({
    x: 120,
    facing: 1, // 1 = right, -1 = left
    isWalking: false,
    isCurious: false,
    isWaving: false,
    pupilX: 0,
    pupilY: 0,
    leftLegRot: 0,
    rightLegRot: 0,
    bodyBounce: 0,
    armWaveRot: 0,
    headTilt: -4,
  });

  const mousePosRef = useRef({ x: 200, y: 300 });
  const charPosRef = useRef({
    currentX: 120,
    targetX: 120,
    vx: 0,
    facing: 1,
    walkCycle: 0,
    pupilCurrent: { x: 0, y: 0 },
    pupilTarget: { x: 0, y: 0 },
  });

  const waveTimerRef = useRef<{ isWaving: boolean; startTime: number }>({
    isWaving: false,
    startTime: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initial position near bottom-left
    charPosRef.current.currentX = Math.min(180, window.innerWidth * 0.2);
    charPosRef.current.targetX = charPosRef.current.currentX;

    // Pointer move listener
    const handlePointerMove = (e: PointerEvent) => {
      mousePosRef.current.x = e.clientX;
      mousePosRef.current.y = e.clientY;

      if (!prefersReducedMotion && e.pointerType !== 'touch') {
        // Target is clamped so character never walks off-screen
        const padding = 60;
        charPosRef.current.targetX = Math.max(padding, Math.min(window.innerWidth - padding, e.clientX));
      }
    };

    // Global Click / Tap listener for Wave animation
    const handleGlobalClick = () => {
      waveTimerRef.current.isWaving = true;
      waveTimerRef.current.startTime = performance.now();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handleGlobalClick, { passive: true });

    let animationFrameId: number;
    let lastTime = performance.now();

    // 60fps Smooth Interpolation Loop (No jitter, pure fluid physics)
    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) * 0.001, 0.1);
      lastTime = now;

      const char = charPosRef.current;
      const mouse = mousePosRef.current;

      // 1. Mouse following with smooth spring/lerp easing
      if (!prefersReducedMotion) {
        const dx = char.targetX - char.currentX;
        const lerpFactor = 0.042; // Smooth trailing delay
        char.currentX += dx * lerpFactor;
        char.vx = dx * lerpFactor;

        // Turn orientation smoothly
        if (Math.abs(dx) > 6) {
          char.facing = dx > 0 ? 1 : -1;
        }
      } else {
        char.vx = 0;
      }

      const isMoving = Math.abs(char.vx) > 0.25;

      // 2. Walking Cycle & Body Bounce
      let leftLegAngle = 0;
      let rightLegAngle = 0;
      let bounceY = 0;

      if (isMoving && !prefersReducedMotion) {
        char.walkCycle += dt * 11.5;
        const legSwing = Math.sin(char.walkCycle) * 26; // Smooth angular leg sweep
        leftLegAngle = legSwing;
        rightLegAngle = -legSwing;
        bounceY = Math.abs(Math.sin(char.walkCycle * 2)) * 3.5;
      } else {
        // Subtle idle breathing
        const idleCycle = now * 0.0025;
        bounceY = Math.sin(idleCycle) * 1.5;
        leftLegAngle = 0;
        rightLegAngle = 0;
      }

      // 3. Eye Gaze Tracking (atan2 relative to character eye)
      const eyeScreenX = char.currentX + (char.facing === 1 ? 12 : -12);
      const eyeScreenY = window.innerHeight - 55; // Character eye height from bottom

      const eyeDx = mouse.x - eyeScreenX;
      const eyeDy = mouse.y - eyeScreenY;
      const eyeDist = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);

      const maxPupilRadius = 4.2;
      const gazeAngle = Math.atan2(eyeDy, eyeDx);
      const pupilIntensity = Math.min(eyeDist / 220, 1.0);

      char.pupilTarget.x = Math.cos(gazeAngle) * maxPupilRadius * pupilIntensity;
      char.pupilTarget.y = Math.sin(gazeAngle) * maxPupilRadius * pupilIntensity;

      // Smooth pupil interpolation (no snapping)
      char.pupilCurrent.x += (char.pupilTarget.x - char.pupilCurrent.x) * 0.12;
      char.pupilCurrent.y += (char.pupilTarget.y - char.pupilCurrent.y) * 0.12;

      // 4. Proximity Curiosity State
      const isCurious = eyeDist < 160;
      const targetHeadTilt = isCurious ? (char.facing === 1 ? -12 : 12) : -4 * char.facing;

      // 5. Click Wave Animation (3 quick friendly waves over ~0.8s)
      let armWaveAngle = 0;
      let isWavingNow = false;

      if (waveTimerRef.current.isWaving) {
        const elapsed = (now - waveTimerRef.current.startTime) * 0.001;
        const totalDuration = 0.85;

        if (elapsed < totalDuration) {
          isWavingNow = true;
          // Smooth sine oscillation between 0 and -55deg
          const waveFreq = 22.0;
          const envelope = Math.sin((elapsed / totalDuration) * Math.PI); // Smooth attack and release
          armWaveAngle = -Math.abs(Math.sin(elapsed * waveFreq)) * 52 * envelope;
        } else {
          waveTimerRef.current.isWaving = false;
        }
      }

      // Update React State
      setCharState({
        x: char.currentX,
        facing: char.facing,
        isWalking: isMoving,
        isCurious,
        isWaving: isWavingNow,
        pupilX: char.pupilCurrent.x,
        pupilY: char.pupilCurrent.y,
        leftLegRot: leftLegAngle,
        rightLegRot: rightLegAngle,
        bodyBounce: bounceY,
        armWaveRot: armWaveAngle,
        headTilt: targetHeadTilt,
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handleGlobalClick);
    };
  }, [mounted]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed bottom-0 left-0 w-full h-0 pointer-events-none z-[99999] select-none overflow-visible"
      aria-hidden="true"
    >
      {/* Dynamic Walking Character Container */}
      <div
        className="absolute bottom-0 will-change-transform"
        style={{
          transform: `translate3d(${charState.x}px, ${-charState.bodyBounce}px, 0) scaleX(${charState.facing})`,
          transition: 'transform 0.05s linear',
          transformOrigin: 'bottom center',
        }}
      >
        {/* Soft Ambient Ground Glow */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full blur-sm transition-all duration-300 ${
            charState.isCurious || charState.isWaving
              ? 'bg-[#3CE7FF]/40 w-24 h-5'
              : 'bg-[#F5D90A]/25'
          }`}
        />

        {/* Small Comic Speech Pop on Wave/Curious */}
        {charState.isWaving && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#F5D90A] text-[#0D0D0F] border-[2px] border-[#0D0D0F] shadow-[2.5px_2.5px_0px_#8A7400] px-2.5 py-0.5 font-comic text-[11px] font-black tracking-wider animate-bounce"
            style={{ transform: `scaleX(${charState.facing})` }}
          >
            <span>BEEP! ⚡</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#F5D90A] border-r-[2px] border-b-[2px] border-[#0D0D0F] rotate-45" />
          </div>
        )}

        {/* =========================================================================
            CHRONO-01: THE TWISTED / GLITCHED CYBERNETIC MASCOT
            (Static visual geometry is asymmetrical and glitched; motion is 100% fluid)
            ========================================================================= */}
        <svg
          viewBox="0 0 90 95"
          className="w-18 h-19 sm:w-20 sm:h-21 md:w-22 md:h-23 overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.7)]"
        >
          <defs>
            {/* Dark Metallic Armor Gradient */}
            <linearGradient id="chassisPlate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2A2A32" />
              <stop offset="50%" stopColor="#1A1A20" />
              <stop offset="100%" stopColor="#0E0E12" />
            </linearGradient>

            {/* Cyan Core Glow */}
            <radialGradient id="opticGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3CE7FF" stopOpacity="1" />
              <stop offset="70%" stopColor="#1E8FA3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B3942" stopOpacity="0.2" />
            </radialGradient>
          </defs>

          {/* ==================== LEGS & FEET ==================== */}
          {/* Left Mechanical Leg (Back Leg) */}
          <g
            style={{
              transform: `rotate(${charState.leftLegRot}deg)`,
              transformOrigin: '38px 68px',
            }}
            className="will-change-transform"
          >
            {/* Upper Strut */}
            <line x1="38" y1="68" x2="33" y2="82" stroke="#0D0D0F" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="38" y1="68" x2="33" y2="82" stroke="#3CE7FF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Lower Strut */}
            <line x1="33" y1="82" x2="30" y2="92" stroke="#0D0D0F" strokeWidth="4" strokeLinecap="round" />
            {/* Angular Asymmetric Foot */}
            <polygon
              points="20,94 36,94 38,90 28,88 20,91"
              fill="#F5D90A"
              stroke="#0D0D0F"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>

          {/* Right Mechanical Leg (Front Leg) */}
          <g
            style={{
              transform: `rotate(${charState.rightLegRot}deg)`,
              transformOrigin: '52px 68px',
            }}
            className="will-change-transform"
          >
            {/* Upper Strut */}
            <line x1="52" y1="68" x2="55" y2="82" stroke="#0D0D0F" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="52" y1="68" x2="55" y2="82" stroke="#FF3366" strokeWidth="1.5" strokeLinecap="round" />
            {/* Lower Strut */}
            <line x1="55" y1="82" x2="57" y2="92" stroke="#0D0D0F" strokeWidth="4" strokeLinecap="round" />
            {/* Angular Asymmetric Foot */}
            <polygon
              points="48,94 66,94 68,90 56,88 48,91"
              fill="#3CE7FF"
              stroke="#0D0D0F"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>

          {/* ==================== ASYMMETRIC TWISTED BODY ==================== */}
          <g>
            {/* Rear Twisted Antenna / Chrono Fin */}
            <polygon
              points="32,26 24,8 36,16"
              fill="#FF3366"
              stroke="#0D0D0F"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <line x1="28" y1="12" x2="31" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Front Cyber Horn Spike */}
            <polygon
              points="58,22 68,4 63,22"
              fill="#F5D90A"
              stroke="#0D0D0F"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Main Irregular Chassis Body (Twisted angular silhouette) */}
            <polygon
              points="28,38 64,32 68,66 48,74 24,68"
              fill="url(#chassisPlate)"
              stroke="#0D0D0F"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Cyber Armor Inset Ribs */}
            <polygon
              points="32,42 58,37 60,54 30,56"
              fill="#141418"
              stroke="#3CE7FF"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />

            {/* Glitched Power Core Conduit */}
            <line x1="32" y1="62" x2="62" y2="60" stroke="#FF3366" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="46" cy="61" r="2.5" fill="#F5D90A" stroke="#0D0D0F" strokeWidth="1" />
          </g>

          {/* ==================== TILTED EXPRESSIVE HEAD ==================== */}
          <g
            style={{
              transform: `rotate(${charState.headTilt}deg)`,
              transformOrigin: '46px 36px',
            }}
            className="transition-transform duration-200 ease-out will-change-transform"
          >
            {/* Angular Cyber Head Box (Twisted Asymmetry) */}
            <polygon
              points="26,18 64,14 68,42 22,46"
              fill="url(#chassisPlate)"
              stroke="#0D0D0F"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Warning Hazard Stripe on Cheek */}
            <path d="M 27 38 L 34 37" stroke="#F5D90A" strokeWidth="2" />
            <path d="M 28 42 L 35 41" stroke="#F5D90A" strokeWidth="2" />

            {/* ==================== EXPRESSIVE OPTIC EYES ==================== */}
            {/* Main Large Optic Eye Socket (Left/Center) */}
            <polygon
              points="36,22 56,20 54,38 34,39"
              fill="#061217"
              stroke="#3CE7FF"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Glowing Optic Core */}
            <circle cx="45" cy="30" r="8" fill="url(#opticGlow)" />

            {/* Pupil Tracking Cursor with Glint */}
            <g transform={`translate(${charState.pupilX}, ${charState.pupilY})`}>
              <circle
                cx="45"
                cy="30"
                r={charState.isCurious ? 4.5 : 3.8}
                fill="#0D0D0F"
                stroke="#F5D90A"
                strokeWidth="1.5"
              />
              {/* Eye Catchlight Dot */}
              <circle cx="43.5" cy="28.5" r="1.4" fill="#FFFFFF" />
            </g>

            {/* Secondary Glitched Scanner Eye (Right) */}
            <polygon
              points="58,24 64,23 63,32 57,33"
              fill="#FF3366"
              stroke="#0D0D0F"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="60.5" cy="28" r="1.5" fill="#FFFFFF" />
          </g>

          {/* ==================== ARMS & WAVING MECHANISM ==================== */}
          {/* Left Static Passive Arm */}
          <g>
            <path
              d="M 28 48 Q 20 58 26 66"
              fill="none"
              stroke="#0D0D0F"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 28 48 Q 20 58 26 66"
              fill="none"
              stroke="#F5D90A"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <polygon points="24,65 28,68 24,70" fill="#3CE7FF" stroke="#0D0D0F" strokeWidth="1.5" />
          </g>

          {/* Right Articulated Waving Arm (Notices user clicks & waves) */}
          <g
            style={{
              transform: `rotate(${charState.armWaveRot}deg)`,
              transformOrigin: '64px 46px',
            }}
            className="will-change-transform"
          >
            {/* Arm Strut */}
            <path
              d="M 64 46 Q 74 54 72 64"
              fill="none"
              stroke="#0D0D0F"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 64 46 Q 74 54 72 64"
              fill="none"
              stroke="#FF3366"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Cybernetic Claw Hand */}
            <polygon
              points="69,63 76,64 77,69 70,68"
              fill="#F5D90A"
              stroke="#0D0D0F"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    </div>,
    document.body
  );
};

export default BottomWalkingMascot;
