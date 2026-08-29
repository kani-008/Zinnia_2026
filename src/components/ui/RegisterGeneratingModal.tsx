import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ultronImg from '../../assets/ultron.svg';
import { audioManager } from '../../core/AudioManager';
import { registerNav } from '../../services/registerNavigation';
import { Sparkles } from 'lucide-react';

interface MiniToy {
  id: number;
  x: number;
  y: number;
  size: number;
  rot: number;
  delay: number;
}

interface GlitterParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

const GLITTER_COLORS = ['#3CE7FF', '#FF3366', '#A855F7', '#00E5FF', '#FFFFFF'];

export const RegisterGeneratingModal: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [targetPath, setTargetPath] = useState('/register');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive Grid Jitter Distribution (Prevents clumping/overlapping on mobile)
  const miniToys = useMemo<MiniToy[]>(() => {
    if (!isOpen) return [];

    const count = isMobile ? 12 : 22;
    const cols = isMobile ? 3 : 5;
    const rows = Math.ceil(count / cols);
    const minSize = isMobile ? 26 : 38;
    const sizeVariation = isMobile ? 14 : 22;

    const toys: MiniToy[] = [];

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const cellWidth = 84 / cols;
      const cellHeight = 78 / rows;

      // Calculate jittered percentage position inside each grid cell
      const x = 8 + col * cellWidth + (Math.random() * (cellWidth * 0.55));
      const y = 8 + row * cellHeight + (Math.random() * (cellHeight * 0.55));

      toys.push({
        id: i,
        x,
        y,
        size: Math.floor(Math.random() * sizeVariation) + minSize,
        rot: Math.floor(Math.random() * 60) - 30,
        delay: Math.floor(Math.random() * 280),
      });
    }

    return toys;
  }, [isOpen, isMobile]);

  // Responsive Glitter Particles
  const glitterParticles = useMemo<GlitterParticle[]>(() => {
    if (!isOpen) return [];

    const count = isMobile ? 20 : 40;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 94,
      y: Math.random() * 92,
      size: Math.floor(Math.random() * (isMobile ? 14 : 20)) + (isMobile ? 10 : 12),
      color: GLITTER_COLORS[i % GLITTER_COLORS.length],
      delay: Math.floor(Math.random() * 450),
    }));
  }, [isOpen, isMobile]);

  useEffect(() => {
    const unsubscribe = registerNav.subscribe((path) => {
      setTargetPath(path);
      setIsMobile(window.innerWidth < 640);
      setIsOpen(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    audioManager.playNodeEngage();

    // Pure Ultron Toy glitter swarm plays for 1.2s then navigates
    const timer = setTimeout(() => {
      setIsOpen(false);
      navigate(targetPath);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, targetPath, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center select-none pointer-events-none overflow-hidden animate-fadeIn">
      
      {/* Glitter Sparkle Star Field */}
      {glitterParticles.map((g) => (
        <div
          key={g.id}
          className="absolute z-20 animate-glitter-twinkle pointer-events-none drop-shadow-[0_0_10px_rgba(60,231,255,0.9)]"
          style={{
            left: `${g.x}%`,
            top: `${g.y}%`,
            color: g.color,
            animationDelay: `${g.delay}ms`,
          }}
        >
          <Sparkles style={{ width: `${g.size}px`, height: `${g.size}px` }} />
        </div>
      ))}

      {/* Swarm of Mini Ultron Toy Image Avatars (Grid Jittered without overlapping) */}
      {miniToys.map((toy) => (
        <div
          key={toy.id}
          className="absolute z-20 animate-mini-ultron-swarm pointer-events-none flex items-center justify-center"
          style={{
            left: `${toy.x}%`,
            top: `${toy.y}%`,
            animationDelay: `${toy.delay}ms`,
            '--toy-rot': `${toy.rot}deg`,
          } as React.CSSProperties}
        >
          <div
            className="relative rounded-full border-[1.5px] sm:border-[2px] border-[#3CE7FF] bg-[#141417]/95 p-0.5 sm:p-1 shadow-[0_0_12px_rgba(60,231,255,0.6)] flex items-center justify-center"
            style={{ width: `${toy.size}px`, height: `${toy.size}px` }}
          >
            <img src={ultronImg} alt="Ultron Toy" className="w-full h-full object-contain" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RegisterGeneratingModal;
