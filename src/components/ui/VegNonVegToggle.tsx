import React from 'react';

export type FoodType = 'VEG' | 'NON_VEG';

interface VegNonVegToggleProps {
  value: FoodType;
  onChange: (value: FoodType) => void;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

/**
 * Official Indian FSSAI Packaged Food Mark:
 * - Vegetarian: Green square containing filled green circle
 * - Non-Vegetarian: Red/Brown square containing filled red equilateral triangle
 * - Rendered on a crisp white container for authentic visual recognition
 */
export const OfficialFoodBadge: React.FC<{
  type: FoodType;
  className?: string;
  active?: boolean;
}> = ({ type, className = 'w-3.5 h-3.5', active = true }) => {
  const isVeg = type === 'VEG';
  const strokeAndFillColor = isVeg ? '#00843D' : '#9B111E';

  return (
    <span
      className={`${className} inline-grid place-items-center bg-white rounded-[2.5px] p-[1.5px] border border-[#090A0B]/25 shadow-[0_1px_2px_rgba(0,0,0,0.18)] shrink-0 transition-opacity duration-150 ${
        active ? 'opacity-100' : 'opacity-60'
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" className="w-full h-full block" fill="none">
        <rect
          x="1"
          y="1"
          width="14"
          height="14"
          rx="1.5"
          stroke={strokeAndFillColor}
          strokeWidth="1.8"
          fill="none"
        />
        {isVeg ? (
          <circle cx="8" cy="8" r="3.6" fill={strokeAndFillColor} />
        ) : (
          <polygon points="8,3.6 12.4,11.8 3.6,11.8" fill={strokeAndFillColor} />
        )}
      </svg>
    </span>
  );
};

/**
 * Professional Comic-Ink Veg / Non-Veg Toggle:
 * - Dual-segment interactive radio group
 * - Mathematical translateX-full sliding pill
 * - High-contrast text & official FSSAI badges
 * - Accessible with full keyboard navigation (Arrows / Space)
 */
export const VegNonVegToggle: React.FC<VegNonVegToggleProps> = ({
  value,
  onChange,
  size = 'md',
  className = '',
  id,
}) => {
  const isVeg = value === 'VEG';
  const isSmall = size === 'sm';

  const select = (choice: FoodType) => {
    if (choice !== value) {
      try {
        const audio = new Audio('/pop.mp3');
        audio.volume = 0.2;
        audio.play().catch(() => {});
      } catch {}
      onChange(choice);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      select('VEG');
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      select('NON_VEG');
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      select(isVeg ? 'NON_VEG' : 'VEG');
    }
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="Food Preference"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative inline-grid grid-cols-2 p-1 rounded-xl bg-[#0B0C0E] border-2 border-[#1E2229] shadow-[2.5px_2.5px_0px_#090A0B] select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0FA9C6] transition-all shrink-0 ${
        isSmall ? 'h-9 min-w-[170px]' : 'h-11 min-w-[205px]'
      } ${className}`}
    >
      {/* Sliding Active Pill */}
      <div
        aria-hidden="true"
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg border-2 border-[#090A0B] transition-transform duration-200 ease-out pointer-events-none ${
          isVeg
            ? 'translate-x-0 bg-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.35),1.5px_1.5px_0px_#090A0B]'
            : 'translate-x-full bg-[#D51F55] shadow-[0_0_12px_rgba(213,31,85,0.4),1.5px_1.5px_0px_#090A0B]'
        }`}
      />

      {/* VEG Option Button */}
      <button
        type="button"
        role="radio"
        tabIndex={-1}
        aria-checked={isVeg}
        onClick={() => select('VEG')}
        className={`relative z-10 flex items-center justify-center gap-1.5 xs:gap-2 px-2.5 rounded-lg font-mono font-black uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
          isSmall ? 'text-[11px]' : 'text-xs'
        } ${
          isVeg
            ? 'text-[#090A0B]'
            : 'text-[#858990] hover:text-[#EEEEEA]'
        }`}
      >
        <OfficialFoodBadge
          type="VEG"
          active={isVeg}
          className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}
        />
        <span>VEG</span>
      </button>

      {/* NON-VEG Option Button */}
      <button
        type="button"
        role="radio"
        tabIndex={-1}
        aria-checked={!isVeg}
        onClick={() => select('NON_VEG')}
        className={`relative z-10 flex items-center justify-center gap-1.5 xs:gap-2 px-2.5 rounded-lg font-mono font-black uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
          isSmall ? 'text-[11px]' : 'text-xs'
        } ${
          !isVeg
            ? 'text-[#FFFFFF]'
            : 'text-[#858990] hover:text-[#EEEEEA]'
        }`}
      >
        <OfficialFoodBadge
          type="NON_VEG"
          active={!isVeg}
          className={isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'}
        />
        <span>NON-VEG</span>
      </button>
    </div>
  );
};

export default VegNonVegToggle;
