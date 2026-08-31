import React from 'react';

interface ComicHandDrawnCardProps {
  code: string;
  variant: 'tech' | 'non-tech';
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ComicHandDrawnCard: React.FC<ComicHandDrawnCardProps> = ({
  code,
  variant,
  onClick,
  children,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`comic-card-wrapper group ${variant === 'tech' ? 'tech' : 'non-tech'} ${className}`}
    >
      {/* =====================================================
           HAND-DRAWN CARD BORDER
      ====================================================== */}
      <svg
        className="card-svg-frame"
        viewBox="0 0 260 320"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* dark offset registration */}
        <path
          className="card-shadow"
          d="
            M 18 12
            C 52 10, 86 12, 121 10
            C 158 9, 201 11, 243 10

            C 246 48, 244 81, 246 116
            C 245 153, 247 191, 245 226
            C 247 258, 244 289, 243 307

            C 206 308, 169 305, 131 307
            C 94 306, 54 309, 17 306

            C 15 270, 17 234, 15 201
            C 16 164, 14 129, 16 93
            C 15 59, 16 31, 18 12
          "
        />

        {/* MAIN INK */}
        <path
          className="card-main"
          d="
            M 16 10
            C 49 8, 88 11, 124 9
            C 160 8, 201 10, 244 9

            C 247 47, 245 82, 247 117
            C 245 154, 248 192, 246 229
            C 248 262, 245 290, 244 307

            C 208 308, 171 305, 132 307
            C 92 306, 55 309, 16 306

            C 14 271, 16 235, 14 201
            C 15 165, 13 128, 15 92
            C 14 57, 15 32, 16 10
          "
        />

        {/* IMPERFECT INNER PRINT LINE */}
        <path
          className="card-inner"
          d="
            M 21 15
            C 56 13, 93 16, 129 14
            C 166 13, 204 16, 240 14

            C 242 51, 240 85, 242 119
            C 241 157, 243 194, 241 231
            C 242 264, 240 288, 239 301

            C 204 303, 168 300, 131 302
            C 92 301, 55 303, 21 300

            C 19 262, 21 229, 19 194
            C 20 157, 18 120, 20 87
            C 19 57, 20 32, 21 15
          "
        />

        {/* LOOSE BROKEN INK MARKS */}
        <path
          d="M 7 84 L 12 79"
          stroke="var(--card-main)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M 8 90 L 13 87"
          stroke="var(--card-main)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M 248 139 L 255 135"
          stroke="var(--card-main)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d="M 248 147 L 254 145"
          stroke="var(--card-main)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {/* ROUGH BOTTOM PRINT STREAKS */}
        <path
          d="M 31 311 C 42 309, 54 312, 66 310"
          stroke="var(--card-main)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        <path
          d="M 197 311 C 208 309, 219 312, 231 310"
          stroke="var(--card-main)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      </svg>

      {/* =====================================================
           NUMBER HOLDER TAG
      ====================================================== */}
      <div className="comic-number-holder">
        <span className="number-text">{code}</span>
      </div>
      <div className="comic-number-tail" />

      {/* =====================================================
           SMALL COMIC MARKS
      ====================================================== */}
      <span className="comic-mark one" />
      <span className="comic-mark two" />

      {/* =====================================================
           CARD CONTENT
      ====================================================== */}
      <div className="relative z-10 w-full h-full flex-1 flex flex-col items-center justify-between px-4 sm:px-5 pt-12 sm:pt-14 pb-7 sm:pb-8 text-center select-none">
        {children}
      </div>
    </div>
  );
};
