import React from 'react';

/**
 * The hand-drawn ink frame used by the event cards, extracted so any box can
 * wear the same border. Stretches to its parent via preserveAspectRatio="none";
 * the parent supplies the colours through .comic-frame-box.
 */
export const ComicFrame: React.FC = () => (
  <svg className="card-svg-frame" viewBox="0 0 260 320" preserveAspectRatio="none" aria-hidden="true">
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

    {/* main ink */}
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

    {/* imperfect inner print line */}
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
  </svg>
);

export default ComicFrame;
