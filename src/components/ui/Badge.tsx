import React from 'react';

export interface BadgeProps {
  variant?: 'ACTIVE' | 'PENDING' | 'DISCOVERED' | 'CORRUPTED' | 'CLASSIFIED' | 'WARNING' | 'SUCCESS';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'ACTIVE',
  size = 'md',
  children,
  className = ''
}) => {
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[9px]',
    md: 'px-2.5 py-1 text-[10px]'
  };

  const variantStyles = {
    ACTIVE: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    PENDING: 'bg-slate-900 text-slate-400 border-slate-700',
    DISCOVERED: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40',
    CORRUPTED: 'bg-rose-950/80 text-rose-400 border-rose-500/40',
    CLASSIFIED: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
    WARNING: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    SUCCESS: 'bg-emerald-950/90 text-emerald-300 border-emerald-400'
  };

  return (
    <span
      className={`font-mono font-bold rounded uppercase tracking-wider border inline-flex items-center gap-1 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      &bull; {children}
    </span>
  );
};
