import React, { useState, useEffect } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);
  const [glitching, setGlitching] = useState(false);
  const glyphs = '01#$<>[]/\\+*~%&!?010101';

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.65) {
        setGlitching(true);
        let iterations = 0;
        const glitchInterval = setInterval(() => {
          setDisplayText(
            text
              .split('')
              .map((char, index) => {
                if (char === ' ') return ' ';
                if (index < iterations) return text[index];
                return glyphs[Math.floor(Math.random() * glyphs.length)];
              })
              .join('')
          );

          if (iterations >= text.length) {
            clearInterval(glitchInterval);
            setDisplayText(text);
            setGlitching(false);
          }
          iterations += 1 / 2;
        }, 30);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span
      className={`relative inline-block transition-colors ${
        glitching ? 'text-cyan-300 drop-shadow-[0_0_12px_rgba(0,240,255,0.8)]' : ''
      } ${className}`}
    >
      {displayText}
    </span>
  );
};
