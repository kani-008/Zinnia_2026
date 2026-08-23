import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { audioManager } from '../core/AudioManager';

export const MissMinutesCompanion: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Animation Engine State Ref (Maintains 60fps single rAF loop without React render churn)
  const animState = useRef({
    charX: typeof window !== 'undefined' ? window.innerWidth - 140 : 800,
    charY: 0,
    targetX: typeof window !== 'undefined' ? window.innerWidth - 140 : 800,
    pointerX: typeof window !== 'undefined' ? window.innerWidth * 0.5 : 500,
    pointerY: typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400,
    hasPointer: false,
    facing: 1, // 1 = right, -1 = left
    facingDisplay: 1,
    isWalking: false,
    walkPhase: 0,
    pupilX: 0,
    pupilY: 0,
    bodyTilt: 0,
    bodyBob: 0,
    leftLegAngle: 0,
    rightLegAngle: 0,
    isWaving: false,
    waveStartTime: 0,
    waveArmAngle: 0,
    isBlinking: false,
    blinkStartTime: 0,
    proximity: 'idle' as 'idle' | 'watching' | 'curious',
    speechText: "Hey y'all!",
    showSpeech: false,
    speechTimer: 0,
  });

  // DOM direct mutation refs for ultra-smooth 60fps GPU rendering
  const charWrapperRef = useRef<HTMLDivElement | null>(null);
  const bodyGroupRef = useRef<SVGGElement | null>(null);
  const pupilLeftRef = useRef<SVGEllipseElement | null>(null);
  const pupilRightRef = useRef<SVGEllipseElement | null>(null);
  const leftEyeRef = useRef<SVGEllipseElement | null>(null);
  const rightEyeRef = useRef<SVGEllipseElement | null>(null);
  const leftLegRef = useRef<SVGGElement | null>(null);
  const rightLegRef = useRef<SVGGElement | null>(null);
  const leftArmRef = useRef<SVGGElement | null>(null);
  const rightArmRef = useRef<SVGGElement | null>(null);
  const mouthRef = useRef<SVGPathElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const speechBubbleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const state = animState.current;
    state.charX = window.innerWidth - 140;
    state.targetX = window.innerWidth - 140;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Check touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // -------------------------------------------------------------
    // POINTER TRACKING (pointermove & pointerdown)
    // -------------------------------------------------------------
    const handlePointerMove = (e: PointerEvent) => {
      if (prefersReducedMotion || isTouchDevice) return;
      state.pointerX = e.clientX;
      state.pointerY = e.clientY;
      state.hasPointer = true;

      // Follow mouse X with subtle trailing target
      state.targetX = Math.max(50, Math.min(window.innerWidth - 110, e.clientX));
    };

    const handleWindowClick = (e: MouseEvent) => {
      // Trigger Cheerful Wave Animation anywhere on click
      state.isWaving = true;
      state.waveStartTime = performance.now();
      audioManager.playTimelineTick();

      // Show speech
      const phrases = ["Hey y'all!", "Tick-tock!", "Hold on to your timeline!", "Well, hello there!"];
      state.speechText = phrases[Math.floor(Math.random() * phrases.length)];
      state.showSpeech = true;
      state.speechTimer = performance.now() + 2200;
    };

    const handleResize = () => {
      state.targetX = Math.min(state.targetX, window.innerWidth - 110);
      state.charX = Math.min(state.charX, window.innerWidth - 110);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handleWindowClick, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Blink timer generator
    let nextBlinkTime = performance.now() + 3500 + Math.random() * 2000;

    // -------------------------------------------------------------
    // 60FPS SINGLE REQUESTANIMATIONFRAME LOOP
    // -------------------------------------------------------------
    let rAFId: number;

    const renderLoop = (time: number) => {
      if (!prefersReducedMotion) {
        // 1. HORIZONTAL LERP MOVEMENT
        const dx = state.targetX - state.charX;
        const distToTarget = Math.abs(dx);

        // Deadzone: stop walking when close to cursor
        if (distToTarget > 14 && !isTouchDevice) {
          state.isWalking = true;
          // Smooth spring/lerp (mouse moves -> notices -> walks toward it)
          state.charX += dx * 0.045;

          // Direction facing
          if (dx > 4) state.facing = 1;
          else if (dx < -4) state.facing = -1;

          // Walking cycle oscillation
          state.walkPhase += 0.22;
          state.leftLegAngle = Math.sin(state.walkPhase) * 28;
          state.rightLegAngle = -Math.sin(state.walkPhase) * 28;
          state.bodyBob = -Math.abs(Math.sin(state.walkPhase * 2)) * 3.5;
        } else {
          // Idle stance
          state.isWalking = false;
          state.leftLegAngle *= 0.85;
          state.rightLegAngle *= 0.85;
          // Subtle breathing bob
          state.bodyBob = Math.sin(time * 0.003) * 1.6;
        }

        // Smooth direction flip interpolation
        state.facingDisplay += (state.facing - state.facingDisplay) * 0.15;

        // 2. EYE TRACKING & PROXIMITY
        const charCenterX = state.charX + 45;
        const charCenterY = window.innerHeight - 55;
        const toPointerX = state.pointerX - charCenterX;
        const toPointerY = state.pointerY - charCenterY;
        const distToPointer = Math.hypot(toPointerX, toPointerY);

        const eyeAngle = Math.atan2(toPointerY, toPointerX);
        const maxPupilRadius = 3.5;
        const targetRadius = Math.min(maxPupilRadius, distToPointer / 90);

        const targetPupilX = Math.cos(eyeAngle) * targetRadius;
        const targetPupilY = Math.sin(eyeAngle) * targetRadius;

        state.pupilX += (targetPupilX - state.pupilX) * 0.12;
        state.pupilY += (targetPupilY - state.pupilY) * 0.12;

        // Proximity state
        if (distToPointer < 150) {
          state.proximity = 'curious';
          state.bodyTilt = Math.max(-6, Math.min(6, (toPointerX / 150) * 6));
        } else if (distToPointer < 280) {
          state.proximity = 'watching';
          state.bodyTilt = Math.max(-3, Math.min(3, (toPointerX / 280) * 3));
        } else {
          state.proximity = 'idle';
          state.bodyTilt *= 0.9;
        }

        // 3. BLINKING
        if (time > nextBlinkTime) {
          state.isBlinking = true;
          state.blinkStartTime = time;
          nextBlinkTime = time + 3800 + Math.random() * 2500;
        }
        if (state.isBlinking && time - state.blinkStartTime > 160) {
          state.isBlinking = false;
        }

        // 4. CLICK WAVE ANIMATION (3 wave cycles over ~0.85s)
        if (state.isWaving) {
          const waveElapsed = (time - state.waveStartTime) / 1000;
          if (waveElapsed < 0.85) {
            // 3 cycles of 0deg -> -45deg -> 0deg
            const waveProgress = (waveElapsed / 0.85) * (Math.PI * 6);
            state.waveArmAngle = -Math.abs(Math.sin(waveProgress)) * 48;
          } else {
            state.isWaving = false;
            state.waveArmAngle = 0;
          }
        }

        // Speech bubble duration
        if (state.showSpeech && time > state.speechTimer) {
          state.showSpeech = false;
        }
      }

      // -------------------------------------------------------------
      // DOM UPDATES (Zero layout recalculations - GPU transforms only)
      // -------------------------------------------------------------
      if (charWrapperRef.current) {
        charWrapperRef.current.style.transform = `translate3d(${state.charX}px, ${state.bodyBob}px, 0)`;
      }

      if (bodyGroupRef.current) {
        // Face orientation and head tilt
        const flip = state.facingDisplay < 0 ? -1 : 1;
        bodyGroupRef.current.style.transform = `scaleX(${state.facingDisplay}) rotate(${state.bodyTilt}deg)`;
      }

      // Legs
      if (leftLegRef.current) {
        leftLegRef.current.style.transform = `rotate(${state.leftLegAngle}deg)`;
      }
      if (rightLegRef.current) {
        rightLegRef.current.style.transform = `rotate(${state.rightLegAngle}deg)`;
      }

      // Eyes / Pupils
      if (pupilLeftRef.current) {
        pupilLeftRef.current.setAttribute('cx', `${64 + state.pupilX}`);
        pupilLeftRef.current.setAttribute('cy', `${52 + state.pupilY}`);
      }
      if (pupilRightRef.current) {
        pupilRightRef.current.setAttribute('cx', `${96 + state.pupilX}`);
        pupilRightRef.current.setAttribute('cy', `${52 + state.pupilY}`);
      }

      // Eyelids (Blink & Alert)
      const eyeRy = state.isBlinking ? 1.5 : state.proximity === 'curious' ? 13.5 : 11.5;
      if (leftEyeRef.current) leftEyeRef.current.setAttribute('ry', `${eyeRy}`);
      if (rightEyeRef.current) rightEyeRef.current.setAttribute('ry', `${eyeRy}`);

      // Arm / Wave
      if (leftArmRef.current) {
        if (state.isWaving) {
          leftArmRef.current.style.transform = `rotate(${state.waveArmAngle}deg)`;
        } else if (state.isWalking) {
          const armSwing = Math.sin(state.walkPhase) * 12;
          leftArmRef.current.style.transform = `rotate(${armSwing}deg)`;
        } else {
          leftArmRef.current.style.transform = 'rotate(0deg)';
        }
      }

      // Mouth expression
      if (mouthRef.current) {
        if (state.isWaving || state.proximity === 'curious') {
          // Cheerful open smile
          mouthRef.current.setAttribute('d', 'M 64 72 Q 80 94 96 72 Z');
          mouthRef.current.setAttribute('fill', '#D50000');
        } else {
          // Normal pleasant smile
          mouthRef.current.setAttribute('d', 'M 66 74 Q 80 87 94 74');
          mouthRef.current.setAttribute('fill', '#FFFEEF');
        }
      }

      // Glow Intensity
      if (glowRef.current) {
        glowRef.current.style.opacity = state.proximity === 'curious' ? '0.75' : state.isWaving ? '0.9' : '0.4';
      }

      // Speech bubble visibility
      if (speechBubbleRef.current) {
        speechBubbleRef.current.style.opacity = state.showSpeech ? '1' : '0';
        speechBubbleRef.current.style.transform = state.showSpeech
          ? 'scale(1) translate(-50%, -100%)'
          : 'scale(0.8) translate(-50%, -80%)';
      }

      rAFId = requestAnimationFrame(renderLoop);
    };

    rAFId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rAFId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handleWindowClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-x-0 bottom-0 pointer-events-none z-[99999] overflow-visible select-none h-0"
    >
      {/* =========================================================================
          MISS MINUTES LIVING WALKING MASCOT CONTAINER
          ========================================================================= */}
      <div
        ref={charWrapperRef}
        className="absolute bottom-0 left-0 will-change-transform pointer-events-auto cursor-pointer"
        style={{
          transform: 'translate3d(800px, 0, 0)',
        }}
        onClick={() => {
          const state = animState.current;
          state.isWaving = true;
          state.waveStartTime = performance.now();
          audioManager.playTimelineTick();
          state.speechText = "Hey y'all! I'm Miss Minutes!";
          state.showSpeech = true;
          state.speechTimer = performance.now() + 2500;
        }}
      >
        {/* Floating Comic Speech Bubble */}
        <div
          ref={speechBubbleRef}
          className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-[#FF8C00] text-[#0D0D0F] border-[2.5px] border-[#0D0D0F] shadow-[3px_3px_0px_#8A5500] px-3 py-1 font-comic text-xs tracking-wide font-black -rotate-2 pointer-events-none transition-all duration-200"
          style={{ opacity: 0 }}
        >
          <span>{animState.current.speechText}</span>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#FF8C00] border-r-[2.5px] border-b-[2.5px] border-[#0D0D0F] rotate-45" />
        </div>

        {/* Ambient Warm Golden Aura Glow */}
        <div
          ref={glowRef}
          className="absolute -inset-4 bg-[radial-gradient(circle,_rgba(255,140,0,0.45)_0%,_transparent_70%)] rounded-full blur-xl pointer-events-none transition-opacity duration-300"
          style={{ opacity: 0.4 }}
        />

        {/* =========================================================================
            ARTICULATED SVG CHARACTER (Twisted/Unstable Comic Silhouette + Smooth Motion)
            ========================================================================= */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 select-none">
          <svg
            viewBox="0 0 160 170"
            className="w-full h-full overflow-visible drop-shadow-[0_6px_12px_rgba(0,0,0,0.85)]"
          >
            <defs>
              {/* 3D Clock Bevel Gradient */}
              <radialGradient id="mmClockBevel" cx="38%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#FFA726" />
                <stop offset="68%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#E65100" />
              </radialGradient>
              {/* Rim Shade */}
              <linearGradient id="mmRimShade" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D84315" />
                <stop offset="100%" stopColor="#7E1D00" />
              </linearGradient>
            </defs>

            {/* Subtree Container for Flip and Tilt */}
            <g
              ref={bodyGroupRef}
              className="origin-[80px_90px] transition-transform duration-100 ease-out will-change-transform"
            >
              {/* ==================== 1. LEGS & SHOES ==================== */}
              {/* Left Leg */}
              <g
                ref={leftLegRef}
                className="origin-[68px_110px] will-change-transform"
              >
                <line
                  x1="68"
                  y1="110"
                  x2="66"
                  y2="142"
                  stroke="#0D0D0F"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Left White Shoe */}
                <path
                  d="M 50 144 C 50 137, 62 135, 70 138 C 76 140, 78 148, 76 153 C 74 156, 50 156, 50 144 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* Right Leg */}
              <g
                ref={rightLegRef}
                className="origin-[92px_110px] will-change-transform"
              >
                <line
                  x1="92"
                  y1="110"
                  x2="94"
                  y2="142"
                  stroke="#0D0D0F"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                {/* Right White Shoe */}
                <path
                  d="M 86 144 C 86 137, 98 135, 106 138 C 112 140, 114 148, 112 153 C 110 156, 86 156, 86 144 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </g>

              {/* ==================== 2. 3D CLOCK BODY ==================== */}
              {/* Bevel Rim */}
              <ellipse
                cx="84"
                cy="68"
                rx="49"
                ry="49"
                fill="url(#mmRimShade)"
                stroke="#0D0D0F"
                strokeWidth="4.2"
              />

              {/* Clock Face (Twisted Comic Imperfect Circle) */}
              <path
                d="M 80 19
                   C 107 19, 128 39, 127 67
                   C 126 94, 106 114, 79 113
                   C 52 112, 33 93, 33 66
                   C 33 39, 53 19, 80 19 Z"
                fill="url(#mmClockBevel)"
                stroke="#0D0D0F"
                strokeWidth="4.5"
              />

              {/* Clock Tick Marks */}
              {/* 12 o'clock */}
              <line x1="80" y1="23" x2="80" y2="33" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              {/* 3 o'clock */}
              <line x1="123" y1="66" x2="113" y2="66" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              {/* 6 o'clock */}
              <line x1="80" y1="109" x2="80" y2="99" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              {/* 9 o'clock */}
              <line x1="37" y1="66" x2="47" y2="66" stroke="#0D0D0F" strokeWidth="4.2" strokeLinecap="round" />
              {/* Hour Dashes */}
              <line x1="101" y1="28" x2="96" y2="35" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="118" y1="45" x2="111" y2="49" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="118" y1="87" x2="111" y2="83" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="101" y1="104" x2="96" y2="97" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="104" x2="64" y2="97" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="87" x2="49" y2="83" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="42" y1="45" x2="49" y2="49" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="59" y1="28" x2="64" y2="35" stroke="#0D0D0F" strokeWidth="2.5" strokeLinecap="round" />

              {/* Nose Center Pin */}
              <circle cx="80" cy="62" r="4.2" fill="#0D0D0F" />

              {/* ==================== 3. EYES & EYELASHES ==================== */}
              {/* Left Eye Sclera */}
              <ellipse
                ref={leftEyeRef}
                cx="64"
                cy="52"
                rx="9.5"
                ry="11.5"
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
              />
              {/* Left Pupil (Tracks Cursor) */}
              <ellipse
                ref={pupilLeftRef}
                cx="64"
                cy="52"
                rx="5"
                ry="7.5"
                fill="#0D0D0F"
              />
              {/* Left 3 Eyelashes */}
              <path d="M 57 39 L 52 33 M 64 38 L 64 31 M 71 40 L 76 34" stroke="#0D0D0F" strokeWidth="3" strokeLinecap="round" />

              {/* Right Eye Sclera */}
              <ellipse
                ref={rightEyeRef}
                cx="96"
                cy="52"
                rx="9.5"
                ry="11.5"
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
              />
              {/* Right Pupil (Tracks Cursor) */}
              <ellipse
                ref={pupilRightRef}
                cx="96"
                cy="52"
                rx="5"
                ry="7.5"
                fill="#0D0D0F"
              />
              {/* Right 3 Eyelashes */}
              <path d="M 89 40 L 84 34 M 96 38 L 96 31 M 103 39 L 108 33" stroke="#0D0D0F" strokeWidth="3" strokeLinecap="round" />

              {/* ==================== 4. MOUTH & CHEEKS ==================== */}
              <path
                ref={mouthRef}
                d="M 66 74 Q 80 87 94 74"
                fill="#FFFEEF"
                stroke="#0D0D0F"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Rosy Cheeks */}
              <circle cx="51" cy="66" r="5" fill="#E64A19" opacity="0.45" />
              <circle cx="109" cy="66" r="5" fill="#E64A19" opacity="0.45" />

              {/* ==================== 5. ARMS & WHITE GLOVES ==================== */}
              {/* Left Arm (Supports Waving and Resting on Hip) */}
              <g
                ref={leftArmRef}
                className="origin-[36px_65px] will-change-transform"
              >
                {/* Arm Stroke */}
                <path
                  d="M 36 64 C 18 68, 16 85, 34 94"
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth="8.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 36 64 C 18 68, 16 85, 34 94"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="12"
                  strokeLinecap="round"
                  style={{ zIndex: -1 }}
                />
                {/* White Gloved Hand on Hip */}
                <path
                  d="M 32 90 C 28 86, 36 82, 40 88 C 42 92, 38 98, 32 96 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3"
                />
              </g>

              {/* Right Arm (Resting on Hip) */}
              <g
                ref={rightArmRef}
                className="origin-[124px_65px] will-change-transform"
              >
                {/* Arm Stroke */}
                <path
                  d="M 124 64 C 142 68, 144 85, 126 94"
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth="8.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 124 64 C 142 68, 144 85, 126 94"
                  fill="none"
                  stroke="#0D0D0F"
                  strokeWidth="12"
                  strokeLinecap="round"
                  style={{ zIndex: -1 }}
                />
                {/* White Gloved Hand on Hip */}
                <path
                  d="M 128 90 C 132 86, 124 82, 120 88 C 118 92, 122 98, 128 96 Z"
                  fill="#FFFEEF"
                  stroke="#0D0D0F"
                  strokeWidth="3"
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MissMinutesCompanion;
