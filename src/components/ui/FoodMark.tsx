import React from 'react';

interface FoodMarkProps {
  type: 'VEG' | 'NON_VEG';
  className?: string;
}

/**
 * The standard Indian food marks: a bordered square holding a filled circle for
 * vegetarian, and a filled triangle for non-vegetarian.
 */
export const FoodMark: React.FC<FoodMarkProps> = ({ type, className = 'w-3.5 h-3.5' }) => {
  const isVeg = type === 'VEG';
  const color = isVeg ? '#10B981' : '#D51F55';

  return (
    <svg
      viewBox="0 0 16 16"
      className={`${className} shrink-0`}
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
      />
      {isVeg ? (
        <circle cx="8" cy="8" r="3.4" fill={color} />
      ) : (
        <polygon points="8,4.2 11.8,11 4.2,11" fill={color} />
      )}
    </svg>
  );
};

export default FoodMark;
