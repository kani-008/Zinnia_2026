import React from 'react';

interface ComicHeroRobotProps {
  onTriggerSound?: (sound: string) => void;
}

export const ComicHeroRobot: React.FC<ComicHeroRobotProps> = ({ onTriggerSound }) => {
  return (
    <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] aspect-square mx-auto flex items-center justify-center select-none">
      {/* SVG Container for Robot, Background Burst, Speedlines, and Floating Particles */}
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Halftone Dot Pattern for Comic Screen Tone */}
          <pattern id="comicDots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="#000000" fillOpacity="0.4" />
          </pattern>
          <pattern id="comicDotsDense" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.6" fill="#000000" fillOpacity="0.6" />
          </pattern>

          {/* Core Arc Reactor Glow */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#FFE600" />
            <stop offset="85%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00A3C4" />
          </radialGradient>

          {/* Eye Visor Glow */}
          <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#55FFB8" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>

          {/* Armor Shading Gradients */}
          <linearGradient id="armorLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>
          <linearGradient id="armorDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D3748" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>
          <linearGradient id="armorHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#718096" />
            <stop offset="100%" stopColor="#4A5568" />
          </linearGradient>
          <linearGradient id="cyanPanel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#0099B8" />
          </linearGradient>
        </defs>

        {/* -------------------------------------------------------------
            1. RADIATING COMIC SPEED LINES & BURST PARTICLES
            ------------------------------------------------------------- */}
        <g stroke="#000000" strokeWidth="2.5" strokeLinecap="round">
          {/* Top-Left Speedlines */}
          <line x1="200" y1="90" x2="110" y2="30" strokeWidth="3" />
          <line x1="180" y1="120" x2="80" y2="70" strokeWidth="3.5" />
          <line x1="150" y1="160" x2="50" y2="130" strokeWidth="4" />
          <line x1="130" y1="200" x2="30" y2="190" strokeWidth="3" />

          {/* Top-Right Speedlines */}
          <line x1="300" y1="90" x2="390" y2="30" strokeWidth="3" />
          <line x1="320" y1="120" x2="420" y2="70" strokeWidth="3.5" />
          <line x1="350" y1="160" x2="450" y2="130" strokeWidth="4" />
          <line x1="370" y1="200" x2="470" y2="190" strokeWidth="3" />

          {/* Angular Speed Wedges (Solid Black Comic Shards) */}
          <polygon points="160,70 145,50 170,60" fill="#000000" />
          <polygon points="90,110 70,100 85,125" fill="#000000" />
          <polygon points="40,220 20,230 35,210" fill="#000000" />
          <polygon points="340,70 355,50 330,60" fill="#000000" />
          <polygon points="410,110 430,100 415,125" fill="#000000" />
          <polygon points="460,220 480,230 465,210" fill="#000000" />
        </g>

        {/* -------------------------------------------------------------
            2. VIBRANT YELLOW ENERGY BURST DISC WITH HALFTONE SHADING
            ------------------------------------------------------------- */}
        <g id="yellowEnergyBurst">
          {/* Main Solid Yellow Circle */}
          <circle
            cx="250"
            cy="210"
            r="142"
            fill="#FFE600"
            stroke="#000000"
            strokeWidth="4"
          />

          {/* Halftone Screen Tone Overlay on the Right Half of Circle */}
          <path
            d="M 250,68 A 142,142 0 0,1 392,210 A 142,142 0 0,1 250,352 Z"
            fill="url(#comicDots)"
          />

          {/* Comic Edge Stipple Shading Arc */}
          <path
            d="M 330,85 A 142,142 0 0,1 390,210 L 360,210 A 112,112 0 0,0 310,110 Z"
            fill="url(#comicDotsDense)"
          />

          {/* Inner Accent Yellow Sunburst Rays */}
          <path
            d="M 250,210 L 190,75 L 220,70 Z"
            fill="#FFD000"
          />
          <path
            d="M 250,210 L 280,70 L 310,75 Z"
            fill="#FFD000"
          />
          <path
            d="M 250,210 L 385,150 L 390,180 Z"
            fill="#FFD000"
          />
          <path
            d="M 250,210 L 115,150 L 110,180 Z"
            fill="#FFD000"
          />
        </g>

        {/* -------------------------------------------------------------
            3. FLYING CYAN CRYSTAL SHARDS & ENERGY FRAGMENTS
            ------------------------------------------------------------- */}
        <g id="cyanShards" stroke="#000000" strokeWidth="2.5" strokeLinejoin="miter">
          {/* Left Shards */}
          <polygon points="120,130 135,115 140,140 125,145" fill="#00E5FF" />
          <polygon points="100,180 115,175 110,195" fill="#55FFB8" />
          <polygon points="150,90 160,80 165,95" fill="#00E5FF" />
          <polygon points="80,140 92,135 88,150" fill="#00E5FF" />

          {/* Right Shards */}
          <polygon points="380,130 365,115 360,140 375,145" fill="#00E5FF" />
          <polygon points="400,180 385,175 390,195" fill="#55FFB8" />
          <polygon points="350,90 340,80 335,95" fill="#00E5FF" />
          <polygon points="420,140 408,135 412,150" fill="#00E5FF" />
        </g>

        {/* -------------------------------------------------------------
            4. ROBOT MASCOT CHARACTER (2D GEOMETRIC COMIC ILLUSTRATION)
            ------------------------------------------------------------- */}
        <g id="robotCharacter">
          {/* --- NECK & UNDER-COLLAR --- */}
          <polygon
            points="225,230 275,230 270,260 230,260"
            fill="#1A202C"
            stroke="#000000"
            strokeWidth="3.5"
          />
          {/* Neck Ribs / Hatching */}
          <line x1="230" y1="240" x2="270" y2="240" stroke="#000000" strokeWidth="2.5" />
          <line x1="232" y1="250" x2="268" y2="250" stroke="#000000" strokeWidth="2.5" />

          {/* --- LEFT SHOULDER PAULDRON --- */}
          <g id="leftShoulder">
            {/* Base Plate */}
            <polygon
              points="140,210 200,185 210,240 145,265"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="4"
            />
            {/* Top Plate Highlight */}
            <polygon
              points="143,212 197,188 190,205 145,225"
              fill="url(#armorHighlight)"
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Cyan Accent Slot */}
            <polygon
              points="155,235 185,220 183,232 153,245"
              fill="#00E5FF"
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Arm Joint Connection */}
            <polygon
              points="130,250 150,240 140,290 120,280"
              fill="#1A202C"
              stroke="#000000"
              strokeWidth="3"
            />
          </g>

          {/* --- RIGHT SHOULDER PAULDRON --- */}
          <g id="rightShoulder">
            {/* Base Plate */}
            <polygon
              points="360,210 300,185 290,240 355,265"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="4"
            />
            {/* Top Plate Highlight */}
            <polygon
              points="357,212 303,188 310,205 355,225"
              fill="url(#armorHighlight)"
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Cyan Accent Slot */}
            <polygon
              points="345,235 315,220 317,232 347,245"
              fill="#00E5FF"
              stroke="#000000"
              strokeWidth="2"
            />
            {/* Arm Joint Connection */}
            <polygon
              points="370,250 350,240 360,290 380,280"
              fill="#1A202C"
              stroke="#000000"
              strokeWidth="3"
            />
          </g>

          {/* --- MAIN CHEST / TORSO ARMOR --- */}
          <g id="torsoArmor">
            {/* Outer Heavy Armor Frame */}
            <polygon
              points="185,230 315,230 330,320 280,365 220,365 170,320"
              fill="url(#armorLight)"
              stroke="#000000"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />

            {/* Left & Right Shading Panels */}
            <polygon
              points="185,230 215,245 205,330 170,320"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="2.5"
            />
            <polygon
              points="315,230 285,245 295,330 330,320"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="2.5"
            />

            {/* Halftone Shade on Right Torso */}
            <polygon
              points="275,250 315,235 328,318 290,328"
              fill="url(#comicDots)"
            />

            {/* Inverted Trapezoid Center Chest Plate (Cyan Trim) */}
            <polygon
              points="215,245 285,245 272,330 228,330"
              fill="url(#cyanPanel)"
              stroke="#000000"
              strokeWidth="3.5"
            />

            {/* Glowing Temporal Arc Reactor Core */}
            <circle
              cx="250"
              cy="285"
              r="24"
              fill="url(#coreGlow)"
              stroke="#000000"
              strokeWidth="4"
            />
            <circle
              cx="250"
              cy="285"
              r="14"
              fill="#FFE600"
              stroke="#000000"
              strokeWidth="2"
            />
            <circle
              cx="250"
              cy="285"
              r="6"
              fill="#FFFFFF"
            />

            {/* Lower Abdominal Armor Plates */}
            <polygon
              points="228,335 272,335 265,362 235,362"
              fill="#1A202C"
              stroke="#000000"
              strokeWidth="3"
            />
            <line x1="232" y1="348" x2="268" y2="348" stroke="#00E5FF" strokeWidth="2.5" />
          </g>

          {/* --- ROBOT HELMET / HEAD --- */}
          <g id="robotHead">
            {/* Left Ear Antenna Fin */}
            <polygon
              points="198,135 178,105 186,155 198,150"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="3.5"
            />
            <line x1="184" y1="115" x2="192" y2="145" stroke="#00E5FF" strokeWidth="2" />

            {/* Right Ear Antenna Fin */}
            <polygon
              points="302,135 322,105 314,155 302,150"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="3.5"
            />
            <line x1="316" y1="115" x2="308" y2="145" stroke="#00E5FF" strokeWidth="2" />

            {/* Main Helmet Base Shell */}
            <polygon
              points="210,110 290,110 305,160 288,225 212,225 195,160"
              fill="url(#armorLight)"
              stroke="#000000"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />

            {/* Top Helmet Brow Plate (Dark Inset) */}
            <polygon
              points="218,110 282,110 275,145 225,145"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="3"
            />
            {/* Top Plate Highlight */}
            <polygon
              points="220,112 280,112 276,122 224,122"
              fill="url(#armorHighlight)"
            />

            {/* Cheek Plates (Left & Right) */}
            <polygon
              points="198,160 220,165 215,220 200,210"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="2.5"
            />
            <polygon
              points="302,160 280,165 285,220 300,210"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Right Cheek Halftone */}
            <polygon
              points="282,168 300,163 298,208 284,218"
              fill="url(#comicDots)"
            />

            {/* Glowing Eye Visor (Horizontal Slits) */}
            <g id="visorEyes">
              {/* Left Eye Slit */}
              <polygon
                points="220,168 244,168 242,178 222,178"
                fill="url(#eyeGlow)"
                stroke="#000000"
                strokeWidth="2.5"
              />
              {/* Right Eye Slit */}
              <polygon
                points="256,168 280,168 278,178 258,178"
                fill="url(#eyeGlow)"
                stroke="#000000"
                strokeWidth="2.5"
              />
            </g>

            {/* Mouth Grill / Vocoder */}
            <polygon
              points="234,195 266,195 262,205 238,205"
              fill="#00E5FF"
              stroke="#000000"
              strokeWidth="2.5"
            />
            {/* Grill Vertical Slits */}
            <line x1="244" y1="196" x2="244" y2="204" stroke="#000000" strokeWidth="2" />
            <line x1="250" y1="196" x2="250" y2="204" stroke="#000000" strokeWidth="2" />
            <line x1="256" y1="196" x2="256" y2="204" stroke="#000000" strokeWidth="2" />

            {/* Chin Armor Plate */}
            <polygon
              points="232,210 268,210 260,225 240,225"
              fill="url(#armorDark)"
              stroke="#000000"
              strokeWidth="2.5"
            />
          </g>
        </g>

        {/* -------------------------------------------------------------
            5. SHATTERED BASE RUBBLE, CONCRETE ROCKS & HATCHING LINES
            ------------------------------------------------------------- */}
        <g id="baseRubble" stroke="#000000" strokeWidth="3" strokeLinejoin="round">
          {/* Ground Crack Hatching Lines Behind Rocks */}
          <g stroke="#000000" strokeWidth="2" strokeLinecap="round">
            <line x1="140" y1="360" x2="160" y2="390" />
            <line x1="150" y1="355" x2="175" y2="385" />
            <line x1="170" y1="365" x2="190" y2="395" />
            <line x1="310" y1="365" x2="330" y2="395" />
            <line x1="325" y1="355" x2="350" y2="385" />
            <line x1="340" y1="360" x2="360" y2="390" />
          </g>

          {/* Left Debris Stones */}
          <polygon points="120,380 145,360 160,385 135,400" fill="#FFE600" />
          <polygon points="155,375 175,365 185,385 165,395" fill="#E2E8F0" />
          <polygon points="180,390 195,380 205,398 185,405" fill="#CBD5E1" />
          <polygon points="130,405 148,395 152,412 134,418" fill="#4A5568" />
          <polygon points="105,390 118,382 122,396 108,402" fill="#00E5FF" />

          {/* Center Debris Stones */}
          <polygon points="210,385 235,370 250,395 220,410" fill="#FFE600" />
          <polygon points="245,380 270,370 280,395 255,408" fill="#E2E8F0" />
          <polygon points="225,405 245,395 255,418 230,422" fill="#4A5568" />
          <polygon points="260,402 280,395 285,415 265,420" fill="#CBD5E1" />

          {/* Right Debris Stones */}
          <polygon points="330,380 355,360 370,385 345,400" fill="#FFE600" />
          <polygon points="305,375 325,365 335,385 315,395" fill="#CBD5E1" />
          <polygon points="285,390 300,380 310,398 290,405" fill="#E2E8F0" />
          <polygon points="350,405 368,395 372,412 354,418" fill="#4A5568" />
          <polygon points="375,390 388,382 392,396 378,402" fill="#00E5FF" />

          {/* Halftone Stipple Patches on Stone Bases */}
          <path d="M 130,385 L 155,385 L 145,400 Z" fill="url(#comicDots)" stroke="none" />
          <path d="M 340,385 L 365,385 L 355,400 Z" fill="url(#comicDots)" stroke="none" />
          <path d="M 230,395 L 265,395 L 245,415 Z" fill="url(#comicDots)" stroke="none" />
        </g>
      </svg>

      {/* -------------------------------------------------------------
          6. "CRACKLE!" COMIC EXPLOSION SOUND FX STARBURST BADGE
          ------------------------------------------------------------- */}
      <div
        onClick={() => onTriggerSound?.('CRACKLE!')}
        className="cursor-pointer absolute -bottom-2 -right-1 sm:-bottom-4 sm:right-2 z-40 group transition-transform duration-200 hover:scale-110 active:scale-95"
      >
        <div className="relative">
          {/* Jagged 12-point Comic Starburst SVG Background */}
          <svg
            viewBox="0 0 160 80"
            className="w-28 sm:w-36 md:w-40 h-auto overflow-visible filter drop-shadow-[3px_3px_0px_#000000]"
          >
            <polygon
              points="
                80,2 96,18 125,8 128,28 155,28 145,48 158,68 132,68 125,82 
                98,72 80,82 62,72 35,82 28,68 2,68 15,48 5,28 32,28 35,8 64,18
              "
              fill="#FFE600"
              stroke="#000000"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          </svg>

          {/* Red Bold Comic Sound FX Text */}
          <div className="absolute inset-0 flex items-center justify-center -rotate-2">
            <span
              className="font-comic text-lg sm:text-2xl md:text-3xl text-[#E52521] tracking-wider uppercase font-black"
              style={{
                textShadow: '1.5px 1.5px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
              }}
            >
              CRACKLE!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComicHeroRobot;
